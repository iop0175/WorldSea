import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { HealthResponse } from '@worldsea/shared';
import { bearerToken, supabaseVerifier, type AuthUser, type TokenVerifier } from './auth';
import { connectDb, type Db } from './db';
import type { Env } from './env';
import { HttpError, sendError } from './errors';
import { playerRoutes } from './routes/players';
import { regionRoutes } from './routes/regions';

export type AppEnv = {
  Bindings: Env;
  Variables: { db: Db; user: AuthUser };
};

/** 외부 의존성. 테스트에서는 PGlite DB와 로컬 키 검증기를 넣는다 */
export interface AppDeps {
  db: (env: Env) => { db: Db; close: () => Promise<void> };
  verifier: (env: Env) => TokenVerifier;
}

export const defaultDeps: AppDeps = { db: connectDb, verifier: supabaseVerifier };

export function createApp(deps: AppDeps = defaultDeps) {
  const app = new Hono<AppEnv>();

  app.use('*', (c, next) => {
    const allowed = c.env?.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean);
    return cors({ origin: allowed?.length ? allowed : '*', allowHeaders: ['Authorization', 'Content-Type'], maxAge: 600 })(c, next);
  });
  app.onError((err, c) => sendError(c, err));

  app.get('/health', (c) => c.json<HealthResponse>({ ok: true, service: 'worldsea-server', time: new Date().toISOString() }));

  /** 로그인 필요 구간: 토큰 검증 → DB 연결 */
  const v1 = new Hono<AppEnv>();
  v1.use('*', async (c, next) => {
    const token = bearerToken(c.req.header('Authorization'));
    if (!token) throw new HttpError(401, 'unauthorized', '로그인이 필요합니다');
    c.set('user', await deps.verifier(c.env)(token));
    const { db, close } = deps.db(c.env);
    c.set('db', db);
    try {
      await next();
    } finally {
      const done = close();
      try { c.executionCtx.waitUntil(done); } catch { await done; }
    }
  });
  v1.route('/', playerRoutes);
  v1.route('/', regionRoutes);
  app.route('/v1', v1);

  /**
   * 실시간 채널. 브라우저 WebSocket은 헤더를 못 붙이므로 토큰을 쿼리로 받는다 (?token=).
   * 검증된 사용자 id의 채널에만 연결된다.
   */
  app.get('/ws', async (c) => {
    const token = c.req.query('token');
    if (!token) throw new HttpError(401, 'unauthorized', '로그인이 필요합니다');
    const user = await deps.verifier(c.env)(token);
    const stub = c.env.PLAYER_CHANNEL.get(c.env.PLAYER_CHANNEL.idFromName(user.id));
    return stub.fetch(c.req.raw);
  });

  return app;
}
