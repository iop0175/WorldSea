import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { HealthResponse } from '@worldsea/shared';
import type { Env } from './env';

export { PlayerChannel } from './realtime/player-channel';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

/** 상태 확인 */
app.get('/health', (c) =>
  c.json<HealthResponse>({ ok: true, service: 'worldsea-server', time: new Date().toISOString() }),
);

/**
 * 실시간 채널 연결. 지금은 뼈대라 플레이어 id를 쿼리로 받지만,
 * 인증 단계에서 Supabase JWT를 검증해 그 사용자 id로 바꾼다 (클라이언트가 고른 id를 믿지 않는다).
 */
app.get('/ws', async (c) => {
  const playerId = c.req.query('player');
  if (!playerId) return c.text('player가 필요합니다', 400);
  const stub = c.env.PLAYER_CHANNEL.get(c.env.PLAYER_CHANNEL.idFromName(playerId));
  return stub.fetch(c.req.raw);
});

export default app;
