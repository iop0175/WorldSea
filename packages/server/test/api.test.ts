/**
 * API 흐름 테스트: 실제 마이그레이션을 적용한 PGlite DB + 로컬 서명 키로 만든 Supabase 형식 토큰.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import * as schema from '@worldsea/shared/db/main';
import type { MeResponse } from '@worldsea/shared';
import { createApp } from '../src/app';
import { keySetVerifier, supabaseVerifier } from '../src/auth';
import type { Db } from '../src/db';
import type { Env } from '../src/env';

const ISSUER = 'https://test.supabase.co/auth/v1';
const USER_A = '11111111-1111-1111-1111-111111111111';
const USER_B = '22222222-2222-2222-2222-222222222222';

let app: ReturnType<typeof createApp>;
let sign: (sub: string, opts?: { exp?: string; aud?: string }) => Promise<string>;
let pg: PGlite;

beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(`create schema auth; create table auth.users (id uuid primary key, email varchar);
    do $$ begin create role anon; create role authenticated; create role service_role; exception when others then null; end $$;`);
  for (const f of ['0000_init.sql', '0001_safety_guards.sql']) {
    const sql = readFileSync(join(import.meta.dirname, '../../shared/migrations/main', f), 'utf8');
    for (const s of sql.split('--> statement-breakpoint')) if (s.trim()) await pg.exec(s);
  }
  await pg.exec(`insert into auth.users(id) values ('${USER_A}'), ('${USER_B}')`);
  const db = drizzle(pg, { schema }) as unknown as Db;

  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256' };
  const verifier = keySetVerifier(createLocalJWKSet({ keys: [jwk] }), { audience: 'authenticated', issuer: ISSUER });
  sign = (sub, opts = {}) =>
    new SignJWT({ role: 'authenticated' })
      .setProtectedHeader({ alg: 'ES256', kid: 'k1' })
      .setSubject(sub).setIssuer(ISSUER).setAudience(opts.aud ?? 'authenticated')
      .setIssuedAt().setExpirationTime(opts.exp ?? '1h')
      .sign(privateKey);

  app = createApp({ db: () => ({ db, close: async () => {} }), verifier: () => verifier });
});

const call = (path: string, token?: string, body?: unknown) =>
  app.request(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }, {} as Env);

describe('인증', () => {
  it('토큰 없으면 401', async () => {
    const r = await call('/v1/me');
    expect(r.status).toBe(401);
    expect(((await r.json()) as { error: { code: string } }).error.code).toBe('unauthorized');
  });
  it('위조·만료·다른 aud 토큰은 401', async () => {
    expect((await call('/v1/me', 'abc.def.ghi')).status).toBe(401);
    expect((await call('/v1/me', await sign(USER_A, { exp: '-1m' }))).status).toBe(401);
    expect((await call('/v1/me', await sign(USER_A, { aud: 'anon' }))).status).toBe(401);
  });
  it('HS256(예전 방식) 검증기도 동작', async () => {
    const secret = 'super-secret-jwt-token-with-at-least-32-characters';
    const v = supabaseVerifier({ SUPABASE_JWT_SECRET: secret } as Env);
    const t = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(USER_A).setAudience('authenticated').setExpirationTime('1h').sign(new TextEncoder().encode(secret));
    expect((await v(t)).id).toBe(USER_A);
    await expect(v(t + 'x')).rejects.toThrow();
  });
});

describe('가입과 내 정보', () => {
  it('가입 전에는 needs_signup', async () => {
    const r = await call('/v1/me', await sign(USER_A));
    expect(r.status).toBe(404);
    expect(((await r.json()) as { error: { code: string } }).error.code).toBe('needs_signup');
  });
  it('잘못된 닉네임은 400', async () => {
    const r = await call('/v1/players', await sign(USER_A), { nickname: '!!' });
    expect(r.status).toBe(400);
  });
  it('가입하면 플레이어와 첫 헌터가 생기고 내 정보를 돌려준다', async () => {
    const r = await call('/v1/players', await sign(USER_A), { nickname: '대장' });
    expect(r.status).toBe(201);
    const me = (await r.json()) as MeResponse;
    expect(me.player.nickname).toBe('대장');
    expect(me.player.stamina).toBe(me.player.staminaMax);
    expect(me.hunters).toHaveLength(1);
    expect(me.hunters[0].skinId).toBe('default');
    expect(me.hunterSlots).toBe(1);
  });
  it('두 번 가입은 409, 같은 닉네임도 409', async () => {
    expect((await call('/v1/players', await sign(USER_A), { nickname: '다른이름' })).status).toBe(409);
    const r = await call('/v1/players', await sign(USER_B), { nickname: '대장' });
    expect(r.status).toBe(409);
    expect(((await r.json()) as { error: { code: string } }).error.code).toBe('nickname_taken');
  });
  it('스태미너는 저장값과 갱신 시각으로 요청 시점에 계산된다', async () => {
    await pg.exec(`update players set stamina = 10, stamina_updated_at = now() - interval '650 seconds' where id = '${USER_A}'`);
    const me = (await (await call('/v1/me', await sign(USER_A))).json()) as MeResponse;
    expect(me.player.stamina).toBe(12); // 임시 규칙: 300초당 1
    expect(me.player.staminaNextSec).toBeGreaterThan(0);
  });
  it('다른 사용자의 토큰으로는 남의 정보를 볼 수 없다', async () => {
    const r = await call('/v1/me', await sign(USER_B));
    expect(((await r.json()) as { error: { code: string } }).error.code).toBe('needs_signup');
  });
});
