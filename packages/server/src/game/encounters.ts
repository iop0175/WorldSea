import { and, asc, eq, lte } from 'drizzle-orm';
import {
  gameDay, SPECIAL_MAP_ATTEMPTS, vulnerableDailyLimit,
  type EncounterAttemptBody, type EncounterAttemptResponse, type EncountersResponse,
} from '@worldsea/shared';
import { players, specialEncounters, species, speciesDailyCatches, speciesDiscoveries, wildPopulations } from '@worldsea/shared/db/main';
import type { Db } from '../db';
import { HttpError } from '../errors';
import { biteChance, biteChanceTable, random } from './hunt';
import { insertCaughtFish, saveWildPopulation, settleExpeditions } from './expeditionProgress';
import { loadGear, loadStock, spendGear, usableGear } from './bites';

/** 24시간이 지난 특별 맵을 만료로 표시한다. 시도 트랜잭션 안에서 하면 거절 시 되돌려지므로 요청 앞에서 따로 부른다. */
export async function expireEncounters(db: Db, playerId: string, now: Date): Promise<void> {
  await db.update(specialEncounters).set({ status: 'expired' })
    .where(and(eq(specialEncounters.playerId, playerId), eq(specialEncounters.status, 'active'), lte(specialEncounters.expiresAt, now)));
}

export async function listEncounters(db: Db, playerId: string, now: Date): Promise<EncountersResponse> {
  const rows = await db.select({ e: specialEncounters, rarity: species.rarity, discovered: speciesDiscoveries.speciesId }).from(specialEncounters)
    .innerJoin(species, eq(species.id, specialEncounters.speciesId))
    .leftJoin(speciesDiscoveries, eq(speciesDiscoveries.speciesId, specialEncounters.speciesId))
    .where(and(eq(specialEncounters.playerId, playerId), eq(specialEncounters.status, 'active')))
    .orderBy(asc(specialEncounters.expiresAt), asc(specialEncounters.id));
  const stock = rows.length ? await loadStock(db, playerId) : [];
  return {
    serverTime: now.toISOString(),
    encounters: rows.map(({ e, rarity, discovered }) => ({
      id: e.id, regionId: e.regionId, speciesId: discovered ? e.speciesId : null, rarity,
      expiresAt: e.expiresAt.toISOString(), chancesLeft: e.chancesLeft, chancesMax: SPECIAL_MAP_ATTEMPTS,
      chances: biteChanceTable(rarity, SPECIAL_MAP_ATTEMPTS - e.chancesLeft + 1),
      gear: usableGear(stock, e.speciesId),
    })),
  };
}

/**
 * 특별 맵 기회 한 번 사용(기획 82번). 개체는 시도하는 순간에만 다룬다: 성공하면 같은 트랜잭션에서
 * 야생 개체수를 줄이고 바로 소유로 만든다. 실패하면 야생 쪽은 아무것도 바뀌지 않는다.
 * ponytail: 시도 기록 표가 없어서 재전송 결과를 되돌려주지 못한다. 순번이 지났으면 409로 알리고 클라이언트가 다시 조회한다.
 *           응답 유실이 잦으면 encounter_attempts 표(마이그레이션)를 추가한다.
 */
export async function attemptEncounter(db: Db, playerId: string, encounterId: string, body: EncounterAttemptBody, now: Date): Promise<EncounterAttemptResponse> {
  return db.transaction(async (tx) => {
    const [player] = await tx.select().from(players).where(eq(players.id, playerId)).for('update');
    if (!player) throw new HttpError(404, 'needs_signup', '닉네임을 정하고 시작해 주세요');
    const at = new Date(Math.max(now.getTime(), player.staminaUpdatedAt.getTime()));
    await settleExpeditions(tx, player, at);

    const [enc] = await tx.select().from(specialEncounters).where(and(eq(specialEncounters.id, encounterId), eq(specialEncounters.playerId, playerId)));
    if (!enc) throw new HttpError(404, 'not_found', '특별 맵을 찾을 수 없습니다');
    if (enc.status !== 'active' || enc.expiresAt <= at) throw new HttpError(409, 'encounter_closed', '이미 끝났거나 사라진 특별 맵입니다');
    const attemptNo = SPECIAL_MAP_ATTEMPTS - enc.chancesLeft + 1;
    if (body.attemptNo < attemptNo) throw new HttpError(409, 'idempotency_conflict', '이미 처리된 시도입니다. 상태를 다시 조회해 주세요');
    if (body.attemptNo > attemptNo) throw new HttpError(400, 'invalid_request', `다음 시도 순번은 ${attemptNo}입니다`);

    const [s] = await tx.select().from(species).where(eq(species.id, enc.speciesId));
    const gear = await loadGear(tx, body.floatId, body.baitId);
    const chance = biteChance(s!.rarity, body.position, attemptNo, gear.reduce((sum, item) => sum + item.chanceBonus, 0));

    // 야생 행은 한 어종만 잠그므로 settleExpeditions의 정렬된 전체 잠금과 교착하지 않는다.
    const [p] = await tx.select().from(wildPopulations).where(eq(wildPopulations.speciesId, s!.id)).for('update');
    if (!p) throw new HttpError(500, 'internal', '어종의 야생 개체수 정보를 찾을 수 없습니다');
    const [dailyCatch] = await tx.select().from(speciesDailyCatches).where(and(
      eq(speciesDailyCatches.playerId, playerId), eq(speciesDailyCatches.day, gameDay(at)), eq(speciesDailyCatches.speciesId, s!.id),
    ));
    const limit = vulnerableDailyLimit((p!.count + p!.reserved) / s!.initialPopulation * 100);
    // 잡을 수 없게 된 어종(보호종·한도·0마리)은 남은 기회와 무관하게 끝낸다.
    const allowed = p!.count >= 1 && p!.status !== 'extinct_wild' && p!.status !== 'protected' && (limit === null || (dailyCatch?.count ?? 0) < limit);
    // 어차피 잡을 수 없는 시도에는 장비를 쓰지 않는다.
    if (allowed) await spendGear(tx, playerId, s!.id, gear, body.floatId, body.baitId);
    const success = allowed && random() < chance;
    const chancesLeft = allowed ? enc.chancesLeft - 1 : 0;
    const finished = success || chancesLeft === 0;

    let fishId: string | null = null;
    if (success) {
      p!.count--;
      await saveWildPopulation(tx, p!, s!);
      fishId = await insertCaughtFish(tx, playerId, s!, at, { regionId: enc.regionId, expeditionId: null, pendingClaim: false });
      // 서버에서 처음 잡힌 순간 모두에게 공개된다(66번).
      await tx.insert(speciesDiscoveries).values({ speciesId: s!.id, discovererId: playerId, discoveredAt: at }).onConflictDoNothing();
    }
    await tx.update(specialEncounters).set({ chancesLeft, status: finished ? 'finished' : 'active' }).where(eq(specialEncounters.id, enc.id));
    return {
      serverTime: at.toISOString(),
      attempt: { attemptNo, success, chance },
      encounter: {
        id: enc.id, status: finished ? 'finished' : 'active', chancesLeft, fishId,
        speciesId: success ? s!.id : null,
        chances: finished ? null : biteChanceTable(s!.rarity, attemptNo + 1),
      },
    };
  });
}
