import { Hono } from 'hono';
import { z } from 'zod';
import { encounterAttemptBody } from '@worldsea/shared';
import type { AppEnv } from '../app';
import { HttpError } from '../errors';
import { advanceExpeditions } from '../game/expeditionProgress';
import { attemptEncounter, expireEncounters, listEncounters } from '../game/encounters';

export const encounterRoutes = new Hono<AppEnv>();

encounterRoutes.get('/encounters', async (c) => {
  const now = new Date();
  await advanceExpeditions(c.var.db, c.var.user.id, now);
  await expireEncounters(c.var.db, c.var.user.id, now);
  return c.json(await listEncounters(c.var.db, c.var.user.id, now));
});

encounterRoutes.post('/encounters/:id/attempt', async (c) => {
  const id = z.uuid().safeParse(c.req.param('id'));
  const body = encounterAttemptBody.safeParse(await c.req.json().catch(() => null));
  if (!id.success) throw new HttpError(400, 'invalid_request', '올바른 특별 맵 id가 필요합니다');
  if (!body.success) throw new HttpError(400, 'invalid_request', body.error.issues[0]?.message ?? '시도 요청이 올바르지 않습니다');
  const now = new Date();
  await advanceExpeditions(c.var.db, c.var.user.id, now);
  await expireEncounters(c.var.db, c.var.user.id, now);
  return c.json(await attemptEncounter(c.var.db, c.var.user.id, id.data, body.data, now));
});
