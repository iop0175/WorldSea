import { Hono } from 'hono';
import { and, asc, eq, gt, inArray } from 'drizzle-orm';
import {
  computeStamina, hasExpeditionRewards, HUNTER_SLOT_TEMP, hunterSlots, huntOptionsBody, idempotencyKey,
  REPEAT_MAX_BASE, REPEAT_MAX_PREMIUM, startExpeditionBody, type ExpeditionsResponse, type StartExpeditionResponse,
} from '@worldsea/shared';
import { expeditions, hunters, items, players, rareBites, regions, subscriptions } from '@worldsea/shared/db/main';
import type { AppEnv } from '../app';
import { HttpError } from '../errors';
import { advanceExpeditions, settleExpeditions } from '../game/expeditionProgress';
import { claimExpeditions } from '../game/expeditionClaims';
import { z } from 'zod';

export const expeditionRoutes = new Hono<AppEnv>();

expeditionRoutes.get('/expeditions', async (c) => {
  const now = new Date();
  const [player] = await c.var.db.select({ id: players.id }).from(players).where(eq(players.id, c.var.user.id));
  if (!player) throw new HttpError(404, 'needs_signup', '닉네임을 정하고 시작해 주세요');
  await advanceExpeditions(c.var.db, player.id, now);
  const rows = await c.var.db.select().from(expeditions).where(and(eq(expeditions.playerId, player.id), inArray(expeditions.status, ['active', 'completed']))).orderBy(asc(expeditions.startedAt), asc(expeditions.id));
  const bites = await c.var.db.select({ expeditionId: rareBites.expeditionId }).from(rareBites).where(and(eq(rareBites.playerId, player.id), eq(rareBites.status, 'pending')));
  return c.json<ExpeditionsResponse>({ serverTime: now.toISOString(), expeditions: rows.map((e) => ({
    id: e.id, hunterId: e.hunterId, regionId: e.regionId, status: e.status as 'active' | 'completed',
    repeatDone: e.repeatDone, repeatTotal: e.repeatTotal, endsAt: e.endsAt.toISOString(),
    waitingForStamina: e.waitingForStamina, stopReason: e.stopReason, premiumSpent: e.premiumSpent, result: e.result,
    claimable: hasExpeditionRewards(e.result), pendingBites: bites.filter((b) => b.expeditionId === e.id).length,
  })) });
});

expeditionRoutes.post('/expeditions/claim-all', async (c) => {
  const key = idempotencyKey.safeParse(c.req.header('Idempotency-Key'));
  if (!key.success) throw new HttpError(400, 'invalid_request', '올바른 Idempotency-Key 헤더가 필요합니다');
  await advanceExpeditions(c.var.db, c.var.user.id, new Date());
  return c.json(await claimExpeditions(c.var.db, c.var.user.id, 'all', key.data));
});

expeditionRoutes.post('/expeditions/:id/claim', async (c) => {
  const key = idempotencyKey.safeParse(c.req.header('Idempotency-Key'));
  const id = z.uuid().safeParse(c.req.param('id'));
  if (!key.success || !id.success) throw new HttpError(400, 'invalid_request', '올바른 원정 id와 Idempotency-Key 헤더가 필요합니다');
  await advanceExpeditions(c.var.db, c.var.user.id, new Date());
  return c.json(await claimExpeditions(c.var.db, c.var.user.id, id.data, key.data));
});

expeditionRoutes.post('/expeditions', async (c) => {
  const parsed = startExpeditionBody.safeParse(await c.req.json().catch(() => null));
  const key = idempotencyKey.safeParse(c.req.header('Idempotency-Key'));
  if (!parsed.success) throw new HttpError(400, 'invalid_request', parsed.error.issues[0]?.message ?? '수색 요청이 올바르지 않습니다');
  if (!key.success) throw new HttpError(400, 'invalid_request', '올바른 Idempotency-Key 헤더가 필요합니다');
  const body = parsed.data;
  const playerId = c.var.user.id;
  await advanceExpeditions(c.var.db, playerId, new Date());

  const result = await c.var.db.transaction(async (tx) => {
    // 공유 스태미너와 같은 헌터의 중복 시작을 플레이어 단위로 직렬화한다.
    const [player] = await tx.select().from(players).where(eq(players.id, playerId)).for('update');
    if (!player) throw new HttpError(404, 'needs_signup', '닉네임을 정하고 시작해 주세요');
    const now = new Date();
    const [previous] = await tx.select().from(expeditions).where(and(eq(expeditions.playerId, playerId), eq(expeditions.startRequestKey, key.data)));
    if (previous) {
      if (previous.hunterId !== body.hunterId || previous.regionId !== body.regionId || previous.repeatTotal !== body.repeatTotal ||
          JSON.stringify(huntOptionsBody.parse(previous.options)) !== JSON.stringify(body.options)) {
        throw new HttpError(409, 'idempotency_conflict', '같은 요청 키를 다른 수색 요청에 사용할 수 없습니다');
      }
      return { expedition: previous, now, replayed: true };
    }

    await settleExpeditions(tx, player, now);

    const owned = await tx.select().from(hunters).where(eq(hunters.ownerId, playerId)).orderBy(asc(hunters.createdAt), asc(hunters.id));
    const hunterIndex = owned.findIndex((hunter) => hunter.id === body.hunterId);
    if (hunterIndex < 0) throw new HttpError(404, 'not_found', '헌터를 찾을 수 없습니다');
    const [subscription] = await tx.select().from(subscriptions).where(and(eq(subscriptions.playerId, playerId), gt(subscriptions.activeUntil, now)));
    if (hunterIndex >= hunterSlots(player.level, !!subscription, player.vipTier)) throw new HttpError(403, 'hunter_slot_locked', '아직 열리지 않은 헌터 슬롯입니다');
    const [active] = await tx.select({ id: expeditions.id }).from(expeditions).where(and(eq(expeditions.hunterId, body.hunterId), eq(expeditions.status, 'active')));
    if (active) throw new HttpError(409, 'hunter_busy', '이미 수색 중인 헌터입니다');

    const [region] = await tx.select().from(regions).where(eq(regions.id, body.regionId));
    if (!region) throw new HttpError(404, 'not_found', '지역을 찾을 수 없습니다');
    if (player.level < region.requiredLevel) throw new HttpError(403, 'region_locked', '아직 열리지 않은 지역입니다');
    const repeatMax = subscription || player.vipTier >= HUNTER_SLOT_TEMP.vipTierForBonus ? REPEAT_MAX_PREMIUM : REPEAT_MAX_BASE;
    if (body.repeatTotal > repeatMax) throw new HttpError(400, 'repeat_limit', `반복 수색은 최대 ${repeatMax}회입니다`);
    for (const [kind, itemId] of [['float', body.options.floatId], ['bait', body.options.baitId]] as const) {
      if (!itemId) continue;
      const [item] = await tx.select({ kind: items.kind }).from(items).where(eq(items.id, itemId));
      if (!item || item.kind !== kind) throw new HttpError(400, 'invalid_request', '찌·미끼 선택이 올바르지 않습니다');
    }
    const stamina = computeStamina(player.stamina, player.staminaUpdatedAt, now, player.level);
    if (stamina.stamina < region.huntStaminaCost) throw new HttpError(409, 'insufficient_stamina', '수색을 시작할 스태미너가 부족합니다');
    if (region.requiresTimeTicket && player.timeTickets < 1) throw new HttpError(409, 'insufficient_time_tickets', '고대 지역 입장에 필요한 시간 티켓이 부족합니다');

    await tx.update(players).set({
      stamina: stamina.stamina - region.huntStaminaCost,
      staminaUpdatedAt: stamina.updatedAt,
      timeTickets: player.timeTickets - (region.requiresTimeTicket ? 1 : 0),
    }).where(eq(players.id, playerId));
    const [expedition] = await tx.insert(expeditions).values({
      playerId, hunterId: body.hunterId, regionId: region.id, startRequestKey: key.data,
      startedAt: now, endsAt: new Date(now.getTime() + region.huntSeconds * 1000),
      staminaCost: region.huntStaminaCost, repeatTotal: body.repeatTotal, options: body.options,
      usedTimeTicket: region.requiresTimeTicket,
    }).returning();
    return { expedition, now, replayed: false };
  });
  const e = result.expedition;
  return c.json<StartExpeditionResponse>({
    serverTime: result.now.toISOString(),
    expedition: {
      id: e.id, hunterId: e.hunterId, regionId: e.regionId,
      startedAt: e.startedAt.toISOString(), endsAt: e.endsAt.toISOString(),
      repeatTotal: e.repeatTotal, options: e.options, staminaCost: e.staminaCost, usedTimeTicket: e.usedTimeTicket,
    },
  }, result.replayed ? 200 : 201);
});
