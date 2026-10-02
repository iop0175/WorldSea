/**
 * API 흐름 테스트: 실제 마이그레이션을 적용한 PGlite DB + 로컬 서명 키로 만든 Supabase 형식 토큰.
 */
import { readFileSync, readdirSync } from 'node:fs';
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
  const mainDir = join(import.meta.dirname, '../../shared/migrations/main');
  for (const f of readdirSync(mainDir).filter((n) => n.endsWith('.sql')).sort()) {
    const sql = readFileSync(join(mainDir, f), 'utf8');
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

describe('지역 API', () => {
  beforeAll(async () => {
    await pg.exec(`
      insert into regions
        (id, name_ko, kind, unlock_stage, required_level, requires_time_ticket,
         special_map_chance, hunt_seconds, hunt_stamina_cost, sort_order)
      values
        ('asia_fresh', '아시아 민물', 'freshwater', 1, 1, false, 0.01, 300, 1, 1),
        ('pacific', '태평양', 'sea', 2, 10, false, 0.02, 600, 2, 2)
      on conflict (id) do nothing
    `);
  });

  it('플레이어 진행도에 맞춰 지역 목록과 해금 여부를 반환한다', async () => {
    const response = await call('/v1/regions', await sign(USER_A));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      serverTime: string;
      regions: { id: string; unlocked: boolean; huntSeconds: number }[];
    };

    expect(body.serverTime).toBeTruthy();
    expect(body.regions.map((region) => region.id)).toEqual(['asia_fresh', 'pacific']);
    expect(body.regions[0]).toMatchObject({ unlocked: true, huntSeconds: 300 });
    expect(body.regions[1]).toMatchObject({ unlocked: false, huntSeconds: 600 });
  });

  it('지역은 레벨로만 열린다 (샵 단계와 무관)', async () => {
    await pg.exec(`update players set level = 10, shop_stage = 1 where id = '${USER_A}'`);
    const body = (await (await call('/v1/regions', await sign(USER_A))).json()) as { regions: { id: string; unlocked: boolean }[] };
    expect(body.regions.find((r) => r.id === 'pacific')?.unlocked).toBe(true);
    await pg.exec(`update players set level = 1 where id = '${USER_A}'`);
  });

  it('지역 상세: 어종의 야생 개체수는 비율과 상태만 공개한다', async () => {
    await pg.exec(`
      insert into species(id,name_ko,region_id,rarity,temp_min,temp_max,salinity,max_size_cm,base_price,initial_population)
        values ('betta_splendens','베타','asia_fresh','common',24,30,'fresh',7,100,1000) on conflict do nothing;
      insert into wild_populations(species_id,count,hidden_reserve,reserved) values ('betta_splendens',400,40,3) on conflict do nothing;
    `);
    const body = (await (await call('/v1/regions/asia_fresh', await sign(USER_A))).json()) as { species: { id: string; conservation: Record<string, unknown> | null }[] };
    const betta = body.species.find((x) => x.id === 'betta_splendens')!;
    expect(betta.conservation).toEqual({ percent: 40, status: 'stable' });
    expect(JSON.stringify(body)).not.toMatch(/reserved|hidden|"count"/i);
    await pg.exec(`delete from wild_populations where species_id='betta_splendens'; delete from species where id='betta_splendens';`);
  });

  it('지역 상세: 오리지널 전설급은 항상 실루엣, 특별 개체는 서버 최초 포획 후 공개', async () => {
    await pg.exec(`
      insert into species(id,name_ko,region_id,rarity,is_original,is_special_map_only,breedable,temp_min,temp_max,salinity,max_size_cm,base_price,initial_population) values
        ('orig_moonscale','월광비늘어','asia_fresh','epic',true,true,false,20,26,'fresh',8,4000,60),
        ('orig_legend_test','전설테스트','asia_fresh','legendary',true,false,false,20,26,'fresh',50,20000,5);
      insert into wild_populations(species_id,count) values ('orig_moonscale',60),('orig_legend_test',5);
    `);
    type View = { revealed: boolean; id: string; nameKo: string; rarity: string; conservation: unknown };
    const get = async () => ((await (await call('/v1/regions/asia_fresh', await sign(USER_A))).json()) as { species: View[] }).species;

    let list = await get();
    expect(list.every((s) => !s.revealed && s.nameKo === '???' && s.conservation === null)).toBe(true);
    expect(JSON.stringify(list)).not.toMatch(/orig_|월광|전설테스트/);
    // 특별 개체가 전설급보다 앞에 온다
    expect(list.map((s) => s.rarity)).toEqual(['epic', 'legendary']);

    await pg.exec(`insert into species_discoveries(species_id, discoverer_id) values ('orig_moonscale', '${USER_A}')`);
    list = await get();
    expect(list[0]).toMatchObject({ revealed: true, id: 'orig_moonscale', nameKo: '월광비늘어' });
    expect(list[1]).toMatchObject({ revealed: false, nameKo: '???' });

    // 전설급은 누가 잡아도 실루엣 유지
    await pg.exec(`insert into species_discoveries(species_id) values ('orig_legend_test')`);
    expect((await get())[1]).toMatchObject({ revealed: false, nameKo: '???' });

    await pg.exec(`delete from species_discoveries; delete from wild_populations where species_id like 'orig_%'; delete from species where id like 'orig_%';`);
  });

  it('지역 상세와 해당 지역 어종 배열을 반환한다', async () => {
    const response = await call('/v1/regions/asia_fresh', await sign(USER_A));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { region: { id: string; nameKo: string }; species: unknown[] };
    expect(body.region).toMatchObject({ id: 'asia_fresh', nameKo: '아시아 민물' });
    expect(body.species).toEqual([]);
  });

  it('없는 지역은 404, 미가입 사용자는 needs_signup을 반환한다', async () => {
    expect((await call('/v1/regions/unknown', await sign(USER_A))).status).toBe(404);

    const response = await call('/v1/regions', await sign(USER_B));
    expect(response.status).toBe(404);
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe('needs_signup');
  });
});
