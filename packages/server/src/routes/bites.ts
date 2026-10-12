import { Hono } from 'hono';
import { z } from 'zod';
import { biteAttemptBody } from '@worldsea/shared';
import type { AppEnv } from '../app';
import { HttpError } from '../errors';
import { advanceExpeditions } from '../game/expeditionProgress';
import { attemptBite, listBites } from '../game/bites';

export const biteRoutes = new Hono<AppEnv>();

biteRoutes.get('/bites', async (c) => {
  const now = new Date();
  await advanceExpeditions(c.var.db, c.var.user.id, now);
  return c.json(await listBites(c.var.db, c.var.user.id, now));
});

biteRoutes.post('/bites/:id/attempt', async (c) => {
  const id = z.uuid().safeParse(c.req.param('id'));
  const body = biteAttemptBody.safeParse(await c.req.json().catch(() => null));
  if (!id.success) throw new HttpError(400, 'invalid_request', '올바른 입질 id가 필요합니다');
  if (!body.success) throw new HttpError(400, 'invalid_request', body.error.issues[0]?.message ?? '시도 요청이 올바르지 않습니다');
  const now = new Date();
  // 만료된 입질을 먼저 확정한다. 시도 트랜잭션 안에서 오류가 나면 되돌려지기 때문이다.
  await advanceExpeditions(c.var.db, c.var.user.id, now);
  return c.json(await attemptBite(c.var.db, c.var.user.id, id.data, body.data, now));
});
