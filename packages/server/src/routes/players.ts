import { Hono } from 'hono';
import { and, eq, inArray } from 'drizzle-orm';
import { createPlayerBody, computeStamina, hunterSlots, staminaMax, type MeResponse } from '@worldsea/shared';
import { expeditions, hunters, players, subscriptions } from '@worldsea/shared/db/main';
import type { AppEnv } from '../app';
import { HttpError } from '../errors';
import type { Db } from '../db';

/** 임시 시작 지급값 (밸런싱 단계에서 확정) */
const STARTING = { gold: 1000, premium: 0, timeTickets: 3 } as const;

export const playerRoutes = new Hono<AppEnv>();

/** 내 상태. 플레이어가 없으면 needs_signup */
playerRoutes.get('/me', async (c) => {
  const me = await loadMe(c.var.db, c.var.user.id, new Date());
  if (!me) throw new HttpError(404, 'needs_signup', '닉네임을 정하고 시작해 주세요');
  return c.json<MeResponse>(me);
});

/** 가입: 닉네임을 정하면 플레이어와 첫 헌터를 만든다 (한 트랜잭션) */
playerRoutes.post('/players', async (c) => {
  const parsed = createPlayerBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, 'invalid_request', parsed.error.issues[0]?.message ?? '요청이 올바르지 않습니다');
  const { nickname } = parsed.data;
  const userId = c.var.user.id;
  const db = c.var.db;

  const existing = await db.select({ id: players.id }).from(players).where(eq(players.id, userId));
  if (existing.length) throw new HttpError(409, 'already_registered', '이미 가입되어 있습니다');
  const taken = await db.select({ id: players.id }).from(players).where(eq(players.nickname, nickname));
  if (taken.length) throw new HttpError(409, 'nickname_taken', '이미 쓰고 있는 닉네임입니다');

  try {
    await db.transaction(async (tx) => {
      await tx.insert(players).values({
        id: userId,
        nickname,
        stamina: staminaMax(1),
        gold: STARTING.gold,
        premium: STARTING.premium,
        timeTickets: STARTING.timeTickets,
      });
      await tx.insert(hunters).values({ ownerId: userId, name: '헌터 1' });
    });
  } catch (e) {
    // 동시에 같은 닉네임으로 가입한 경우 (유니크 제약)
    if (String((e as { cause?: unknown })?.cause ?? e).includes('nickname')) throw new HttpError(409, 'nickname_taken', '이미 쓰고 있는 닉네임입니다');
    throw e;
  }
  const me = await loadMe(db, userId, new Date());
  return c.json<MeResponse>(me!, 201);
});

export async function loadMe(db: Db, userId: string, now: Date): Promise<MeResponse | null> {
  const [p] = await db.select().from(players).where(eq(players.id, userId));
  if (!p) return null;
  const st = computeStamina(p.stamina, p.staminaUpdatedAt, now, p.level);
  const hs = await db.select().from(hunters).where(eq(hunters.ownerId, userId)).orderBy(hunters.createdAt);
  const exps = hs.length
    ? await db.select().from(expeditions).where(and(inArray(expeditions.hunterId, hs.map((h) => h.id)), inArray(expeditions.status, ['active', 'completed'])))
    : [];
  const subs = await db.select({ activeUntil: subscriptions.activeUntil }).from(subscriptions).where(eq(subscriptions.playerId, userId));
  const subscribed = subs.some((s) => s.activeUntil > now);

  return {
    serverTime: now.toISOString(),
    player: {
      id: p.id,
      nickname: p.nickname,
      level: p.level,
      exp: p.exp,
      gold: p.gold,
      premium: p.premium,
      stamina: st.stamina,
      staminaMax: st.max,
      staminaNextSec: st.nextSec,
      timeTickets: p.timeTickets,
      vipTier: p.vipTier,
      shopStage: p.shopStage,
      tutorialStep: p.tutorialStep,
    },
    hunters: hs.map((h) => {
      const e = exps.find((x) => x.hunterId === h.id);
      return {
        id: h.id,
        name: h.name,
        skinId: h.skinId,
        expedition: e
          ? { id: e.id, regionId: e.regionId, status: e.status as 'active' | 'completed', repeatDone: e.repeatDone, repeatTotal: e.repeatTotal, endsAt: e.endsAt.toISOString() }
          : null,
      };
    }),
    hunterSlots: hunterSlots(p.level, subscribed, p.vipTier),
  };
}
