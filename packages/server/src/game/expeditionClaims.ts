import { and, asc, eq, inArray, notExists, or, sql } from 'drizzle-orm';
import { hasExpeditionRewards, type ClaimExpeditionsResponse } from '@worldsea/shared';
import type { ExpeditionClaimResult, ExpeditionResult } from '@worldsea/shared/db/types';
import { expeditionClaims, expeditions, fish, playerItems, players, rareBites } from '@worldsea/shared/db/main';
import type { Db } from '../db';
import { HttpError } from '../errors';
import { settleExpeditions } from './expeditionProgress';

export const CLAIM_BATCH_MAX = 50;

/** 플레이어 잠금 안에서 개체 수령·보상 지급·응답 저장을 모두 확정한다. */
export async function claimExpeditions(db: Db, playerId: string, target: string, key: string): Promise<ClaimExpeditionsResponse> {
  return db.transaction(async (tx) => {
    const [player] = await tx.select().from(players).where(eq(players.id, playerId)).for('update');
    if (!player) throw new HttpError(404, 'needs_signup', '닉네임을 정하고 시작해 주세요');
    const [previous] = await tx.select().from(expeditionClaims).where(and(eq(expeditionClaims.playerId, playerId), eq(expeditionClaims.requestKey, key)));
    if (previous) {
      if (previous.target !== target) throw new HttpError(409, 'idempotency_conflict', '같은 요청 키를 다른 수령 대상에 사용할 수 없습니다');
      return previous.response;
    }
    if (target !== 'all') {
      const [owned] = await tx.select({ id: expeditions.id }).from(expeditions).where(and(eq(expeditions.id, target), eq(expeditions.playerId, playerId)));
      if (!owned) throw new HttpError(404, 'not_found', '원정을 찾을 수 없습니다');
    }
    const now = new Date();
    await settleExpeditions(tx, player, now);
    const noPendingBite = notExists(tx.select({ id: rareBites.id }).from(rareBites).where(and(eq(rareBites.expeditionId, expeditions.id), eq(rareBites.status, 'pending'))));
    const rewards = sql`(
      coalesce((${expeditions.result}->>'gold')::bigint, 0) > 0 or
      coalesce((${expeditions.result}->>'premium')::bigint, 0) > 0 or
      coalesce((${expeditions.result}->>'exp')::integer, 0) > 0 or
      coalesce(jsonb_array_length(${expeditions.result}->'catches'), 0) > 0 or
      coalesce(jsonb_array_length(${expeditions.result}->'items'), 0) > 0
    )`;
    const scope = and(eq(expeditions.playerId, playerId), target === 'all' ? undefined : eq(expeditions.id, target),
      inArray(expeditions.status, ['active', 'completed']), or(rewards, and(eq(expeditions.status, 'completed'), noPendingBite)));
    const rows = await tx.select().from(expeditions).where(scope).orderBy(asc(expeditions.startedAt), asc(expeditions.id)).limit(CLAIM_BATCH_MAX);
    const claimed: ExpeditionClaimResult = { fishIds: [], catches: [], gold: 0, premium: 0, exp: 0, items: [] };
    let budget = CLAIM_BATCH_MAX;
    for (const e of rows) {
      if (budget === 0) break;
      const result: ExpeditionResult = e.result ?? { catches: [], gold: 0, exp: 0 };
      const caught = await tx.select({ id: fish.id, speciesId: fish.speciesId }).from(fish)
        .where(and(eq(fish.ownerId, playerId), eq(fish.expeditionId, e.id), eq(fish.pendingClaim, true)))
        .orderBy(asc(fish.bornAt), asc(fish.id)).limit(budget).for('update');
      if (caught.length) {
        await tx.update(fish).set({ pendingClaim: false }).where(inArray(fish.id, caught.map((f) => f.id)));
        for (const f of caught) {
          claimed.fishIds.push(f.id);
          const summary = claimed.catches.find((c) => c.speciesId === f.speciesId);
          if (summary) summary.count++; else claimed.catches.push({ speciesId: f.speciesId, count: 1 });
        }
        budget -= caught.length;
      }
      for (const item of result.items ?? []) {
        const count = Math.min(item.count, budget);
        if (count < 1) continue;
        await tx.insert(playerItems).values({ playerId, itemId: item.id, count }).onConflictDoUpdate({
          target: [playerItems.playerId, playerItems.itemId], set: { count: sql`${playerItems.count} + ${count}` },
        });
        item.count -= count; budget -= count;
        const summary = claimed.items.find((i) => i.id === item.id);
        if (summary) summary.count += count; else claimed.items.push({ id: item.id, count });
      }
      claimed.gold += result.gold; claimed.premium += result.premium ?? 0; claimed.exp += result.exp;
      // 실제 포획 개체를 이동하며 수령한다. 수령 API에서는 물고기를 새로 만들지 않는다.
      const remainingFish = await tx.select({ speciesId: fish.speciesId, count: sql<number>`count(*)::integer` }).from(fish)
        .where(and(eq(fish.ownerId, playerId), eq(fish.expeditionId, e.id), eq(fish.pendingClaim, true))).groupBy(fish.speciesId);
      const remaining: ExpeditionResult = { ...result, catches: remainingFish, gold: 0, premium: 0, exp: 0, items: (result.items ?? []).filter((i) => i.count > 0) };
      const [bite] = await tx.select({ id: rareBites.id }).from(rareBites).where(and(eq(rareBites.expeditionId, e.id), eq(rareBites.status, 'pending'))).limit(1);
      const finished = e.status === 'completed' && !bite && !hasExpeditionRewards(remaining);
      await tx.update(expeditions).set({ result: remaining, ...(finished ? { status: 'claimed', claimedAt: now } : {}) }).where(eq(expeditions.id, e.id));
    }
    await tx.update(players).set({ gold: player.gold + claimed.gold, premium: player.premium + claimed.premium, exp: player.exp + claimed.exp }).where(eq(players.id, playerId));
    const [remaining] = await tx.select({ id: expeditions.id }).from(expeditions).where(scope).limit(1);
    const response: ClaimExpeditionsResponse = { serverTime: now.toISOString(), claimed, hasMore: !!remaining };
    await tx.insert(expeditionClaims).values({ playerId, requestKey: key, target, response, createdAt: now });
    return response;
  });
}
