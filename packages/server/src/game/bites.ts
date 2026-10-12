import { and, asc, eq, gt, inArray } from 'drizzle-orm';
import {
  BITE_MAX_ATTEMPTS, gameDay, vulnerableDailyLimit,
  type BiteAttemptBody, type BiteAttemptResponse, type BitesResponse, type BiteView, type ReleaseReason,
} from '@worldsea/shared';
import { biteAttempts, expeditions, items, playerItems, players, rareBites, species, speciesDailyCatches, wildPopulations } from '@worldsea/shared/db/main';
import type { Db } from '../db';
import { HttpError } from '../errors';
import { biteChance, biteChanceTable, seededRoll } from './hunt';
import { captureFish, saveWildPopulation, settleExpeditions } from './expeditionProgress';

type Item = typeof items.$inferSelect;

/**
 * 지금 이 플레이어가 이 어종을 잡을 수 없으면 사유를 돌려준다(94번), 잡을 수 있으면 null.
 * needStock: 시도 순간에 야생 개체가 남아 있어야 하는 경우(특별 맵). 입질은 이미 한 마리를 예약해 둔 상태라 검사하지 않는다.
 */
export function releaseReasonFor(
  p: { count: number; reserved: number; status: string }, s: { initialPopulation: number }, dailyCount: number, needStock: boolean,
): ReleaseReason | null {
  const limit = vulnerableDailyLimit((p.count + p.reserved) / s.initialPopulation * 100);
  if (p.status === 'extinct_wild' || p.status === 'protected' || limit === 0) return 'protected';
  if (needStock && p.count < 1) return 'depleted';
  if (limit !== null && dailyCount >= limit) return 'daily_limit';
  return null;
}

export async function loadGear(tx: Db, ...ids: (string | undefined)[]): Promise<Item[]> {
  const wanted = ids.filter((id): id is string => !!id);
  return wanted.length ? tx.select().from(items).where(inArray(items.id, wanted)) : [];
}

/** 선택한 찌·미끼를 하나씩 차감한다. 없거나 종류가 다르거나 다른 어종 전용이면 아무것도 바꾸지 않고 거절한다(호출자 트랜잭션이 되돌림). */
export async function spendGear(tx: Db, playerId: string, speciesId: string, gear: Item[], floatId?: string, baitId?: string): Promise<void> {
  for (const [kind, id] of [['float', floatId], ['bait', baitId]] as const) {
    if (!id) continue;
    const item = gear.find((i) => i.id === id);
    const [stock] = await tx.select().from(playerItems).where(and(eq(playerItems.playerId, playerId), eq(playerItems.itemId, id)));
    if (!item || item.kind !== kind || (item.targetSpeciesId && item.targetSpeciesId !== speciesId) || !stock?.count) {
      throw new HttpError(409, 'insufficient_items', '선택한 찌·미끼를 쓸 수 없습니다');
    }
    await tx.update(playerItems).set({ count: stock.count - 1 }).where(and(eq(playerItems.playerId, playerId), eq(playerItems.itemId, id)));
  }
}

type Stock = { item: Item; count: number }[];

/** 보유한 찌·미끼 */
export async function loadStock(db: Db, playerId: string): Promise<Stock> {
  return db.select({ item: items, count: playerItems.count }).from(playerItems)
    .innerJoin(items, eq(items.id, playerItems.itemId))
    .where(and(eq(playerItems.playerId, playerId), gt(playerItems.count, 0), inArray(items.kind, ['float', 'bait'])));
}

/** 이 어종에 쓸 수 있는 장비(다른 어종 전용 미끼는 제외) */
export const usableGear = (stock: Stock, speciesId: string): BiteView['gear'] =>
  stock.filter(({ item }) => !item.targetSpeciesId || item.targetSpeciesId === speciesId)
    .map(({ item, count }) => ({ id: item.id, kind: item.kind as 'float' | 'bait', count, chanceBonus: item.chanceBonus }));

/** 대기 중인 입질과 이번 시도의 확률 표. 호출 전에 advanceExpeditions로 만료분을 정리한다. */
export async function listBites(db: Db, playerId: string, now: Date): Promise<BitesResponse> {
  const bites = await db.select({ bite: rareBites, rarity: species.rarity }).from(rareBites)
    .innerJoin(species, eq(species.id, rareBites.speciesId))
    .where(and(eq(rareBites.playerId, playerId), eq(rareBites.status, 'pending')))
    .orderBy(asc(rareBites.expiresAt), asc(rareBites.id));
  const stock = bites.length ? await loadStock(db, playerId) : [];
  return {
    serverTime: now.toISOString(),
    bites: bites.map(({ bite, rarity }) => ({
      id: bite.id, expeditionId: bite.expeditionId, speciesId: bite.speciesId, rarity,
      expiresAt: bite.expiresAt.toISOString(), attemptsUsed: bite.attemptsUsed, attemptsMax: BITE_MAX_ATTEMPTS,
      paused: bite.pausedRepeat,
      chances: biteChanceTable(rarity, bite.attemptsUsed + 1),
      autoChance: biteChance(rarity, null, bite.attemptsUsed + 1),
      gear: usableGear(stock, bite.speciesId),
    })),
  };
}

/**
 * 입질 한 번 시도. 플레이어 행을 잠그고 시도 기록·장비 차감·포획 확정을 한 트랜잭션으로 처리한다.
 * attemptNo가 이미 기록된 시도면 같은 요청의 재전송으로 보고 저장된 결과를 돌려준다(장비를 다시 차감하지 않음).
 */
export async function attemptBite(db: Db, playerId: string, biteId: string, body: BiteAttemptBody, now: Date): Promise<BiteAttemptResponse> {
  return db.transaction(async (tx) => {
    const [player] = await tx.select().from(players).where(eq(players.id, playerId)).for('update');
    if (!player) throw new HttpError(404, 'needs_signup', '닉네임을 정하고 시작해 주세요');
    const at = new Date(Math.max(now.getTime(), player.staminaUpdatedAt.getTime()));
    await settleExpeditions(tx, player, at);

    const [bite] = await tx.select().from(rareBites).where(and(eq(rareBites.id, biteId), eq(rareBites.playerId, playerId)));
    if (!bite) throw new HttpError(404, 'not_found', '입질을 찾을 수 없습니다');
    const [s] = await tx.select().from(species).where(eq(species.id, bite.speciesId));
    const position = body.auto ? null : body.position!;
    const gear = await loadGear(tx, body.floatId, body.baitId);
    const bonus = gear.reduce((sum, item) => sum + item.chanceBonus, 0);
    const view = (
      status: 'pending' | 'caught' | 'escaped', attemptsUsed: number, fishId: string | null, success: boolean, chance: number,
      gearConsumed: boolean, releaseReason: ReleaseReason | null,
    ): BiteAttemptResponse => ({
      serverTime: at.toISOString(),
      attempt: { attemptNo: body.attemptNo, success, chance, gearConsumed, releaseReason },
      bite: {
        id: bite.id, status, attemptsUsed, attemptsMax: BITE_MAX_ATTEMPTS, fishId,
        chances: status === 'pending' ? biteChanceTable(s!.rarity, attemptsUsed + 1) : null,
      },
    });

    const [prior] = await tx.select().from(biteAttempts).where(and(eq(biteAttempts.biteId, bite.id), eq(biteAttempts.attemptNo, body.attemptNo)));
    if (prior) {
      // position은 DB에서 float4로 저장되므로 양쪽을 같은 정밀도로 비교한다.
      const f = (n: number | null) => n === null ? null : Math.fround(n);
      if (prior.isAuto !== !!body.auto || f(prior.position) !== f(position) ||
          prior.floatId !== (body.floatId ?? null) || prior.baitId !== (body.baitId ?? null)) {
        if (bite.status !== 'pending') throw new HttpError(409, 'bite_closed', '이미 끝났거나 놓친 입질입니다');
        throw new HttpError(409, 'idempotency_conflict', '같은 시도 순번을 다른 내용으로 보낼 수 없습니다');
      }
      return view(bite.status === 'pending' || bite.status === 'caught' ? bite.status : 'escaped', bite.attemptsUsed, bite.fishId, prior.success,
        biteChance(s!.rarity, position, body.attemptNo, bonus), prior.gearConsumed, prior.releaseReason);
    }
    if (bite.status !== 'pending') throw new HttpError(409, 'bite_closed', '이미 끝났거나 놓친 입질입니다');
    if (body.attemptNo !== bite.attemptsUsed + 1) throw new HttpError(400, 'invalid_request', `다음 시도 순번은 ${bite.attemptsUsed + 1}입니다`);

    // 야생 행은 고정된 순서(어종 id)로만 잠그므로 settleExpeditions의 전체 잠금과 교착하지 않는다.
    const [p] = await tx.select().from(wildPopulations).where(eq(wildPopulations.speciesId, s!.id)).for('update');
    if (!p) throw new HttpError(500, 'internal', '어종의 야생 개체수 정보를 찾을 수 없습니다');
    const [e] = await tx.select().from(expeditions).where(eq(expeditions.id, bite.expeditionId));

    const day = gameDay(at);
    const [dailyCatch] = await tx.select().from(speciesDailyCatches).where(and(eq(speciesDailyCatches.playerId, playerId), eq(speciesDailyCatches.day, day), eq(speciesDailyCatches.speciesId, s!.id)));
    const releaseReason = releaseReasonFor(p, s!, dailyCatch?.count ?? 0, false);
    const allowed = releaseReason === null;
    // 어차피 잡을 수 없는 시도에는 장비를 쓰지 않는다(94번: 기록에는 고른 장비를 남기고 차감 여부만 구분).
    if (allowed) await spendGear(tx, playerId, s!.id, gear, body.floatId, body.baitId);
    const chance = biteChance(s!.rarity, position, body.attemptNo, bonus);
    const success = allowed && seededRoll(bite.minigameSeed, body.attemptNo) < chance;
    // 잡을 수 없게 된 어종은 남은 시도가 있어도 바다로 돌려보낸다.
    const final = success || !allowed || body.attemptNo >= BITE_MAX_ATTEMPTS;

    await tx.insert(biteAttempts).values({
      biteId: bite.id, attemptNo: body.attemptNo, floatId: body.floatId, baitId: body.baitId,
      position, isAuto: !!body.auto, success, gearConsumed: allowed, releaseReason, createdAt: at,
    });
    let fishId: string | null = null;
    if (final) {
      p!.reserved--;
      if (!success) p!.count++;
      if (success) {
        fishId = await captureFish(tx, playerId, e!, s!, at);
        await tx.update(expeditions).set({ result: e!.result }).where(eq(expeditions.id, e!.id));
      }
      await saveWildPopulation(tx, p!, s!);
    }
    const status = !final ? 'pending' : success ? 'caught' : 'escaped';
    await tx.update(rareBites).set({
      status, attemptsUsed: body.attemptNo, isAuto: bite.isAuto || !!body.auto, fishId, ...(final ? { resolvedAt: at } : {}),
    }).where(eq(rareBites.id, bite.id));
    return view(status, body.attemptNo, fishId, success, chance, allowed, releaseReason);
  });
}
