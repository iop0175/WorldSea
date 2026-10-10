/**
 * API 흐름 테스트: 실제 마이그레이션을 적용한 PGlite DB + 로컬 서명 키로 만든 Supabase 형식 토큰.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as schema from '@worldsea/shared/db/main';
import type { ExpeditionsResponse, MeResponse, StartExpeditionResponse } from '@worldsea/shared';
import * as hunt from '../src/game/hunt';
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

describe('수색 시작', () => {
  const USER = '33333333-3333-3333-3333-333333333333';
  const HUNTER = '44444444-4444-4444-8444-444444444444';
  const SECOND = '55555555-5555-4555-8555-555555555555';
  const THIRD = '66666666-6666-4666-8666-666666666666';
  const FOURTH = '77777777-7777-4777-8777-777777777777';
  let token: string;
  const start = (body: unknown = { hunterId: HUNTER, regionId: 'hunt_fresh' }, key: string | null = 'start_1', auth = token) =>
    app.request('/v1/expeditions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json', ...(key === null ? {} : { 'Idempotency-Key': key }) },
      body: JSON.stringify(body),
    }, {} as Env);
  const state = async () => (await pg.query<{ stamina: number; time_tickets: number }>(`select stamina, time_tickets from players where id='${USER}'`)).rows[0];

  beforeAll(async () => {
    token = await sign(USER);
    await pg.exec(`
      insert into auth.users(id) values ('${USER}');
      insert into players(id,nickname,stamina,time_tickets) values ('${USER}','수색대장',10,3);
      insert into hunters(id,owner_id,name,created_at) values
        ('${HUNTER}','${USER}','헌터1','2026-01-01'),
        ('${SECOND}','${USER}','헌터2','2026-01-02'),
        ('${THIRD}','${USER}','헌터3','2026-01-03'),
        ('${FOURTH}','${USER}','헌터4','2026-01-04');
      insert into regions(id,name_ko,kind,unlock_stage,required_level,requires_time_ticket,hunt_seconds,hunt_stamina_cost) values
        ('hunt_fresh','수색 민물','freshwater',1,1,false,300,2),
        ('hunt_ancient','수색 고대','ancient',4,20,true,900,5);
      insert into items(id,name_ko,kind,grade) values ('hunt_float','수색 찌','float','common');
    `);
  });
  beforeEach(async () => {
    await pg.exec(`delete from expeditions where player_id='${USER}'; delete from subscriptions where player_id='${USER}';
      update players set level=1,vip_tier=0,stamina=10,stamina_updated_at=now(),time_tickets=3 where id='${USER}';`);
  });

  it('첫 회차만 차감하고 지역의 고정 시간으로 원정을 만든다', async () => {
    const r = await start({ hunterId: HUNTER, regionId: 'hunt_fresh', repeatTotal: 100 });
    expect(r.status).toBe(201);
    const body = await r.json() as StartExpeditionResponse;
    expect(body.expedition).toMatchObject({ hunterId: HUNTER, regionId: 'hunt_fresh', repeatTotal: 100, staminaCost: 2, usedTimeTicket: false, options: { recovery: 'none' } });
    expect(Date.parse(body.expedition.endsAt) - Date.parse(body.expedition.startedAt)).toBe(300000);
    expect(body.serverTime).toBe(body.expedition.startedAt);
    expect(await state()).toEqual({ stamina: 8, time_tickets: 3 });
    const me = await (await call('/v1/me', token)).json() as MeResponse;
    expect(me.hunters[0].expedition).toMatchObject({ id: body.expedition.id, status: 'active', repeatDone: 0 });
  });

  it('같은 키의 재시도는 완료·수령 후에도 새 원정이나 차감을 만들지 않는다', async () => {
    const first = await (await start()).json() as StartExpeditionResponse;
    await pg.exec(`update expeditions set status='claimed',claimed_at=now() where id='${first.expedition.id}'`);
    const replay = await start({ hunterId: HUNTER, regionId: 'hunt_fresh', repeatTotal: 1, options: { recovery: 'none' } });
    expect(replay.status).toBe(200);
    expect((await replay.json() as StartExpeditionResponse).expedition).toEqual(first.expedition);
    expect(await state()).toEqual({ stamina: 8, time_tickets: 3 });
    expect((await pg.query(`select id from expeditions where player_id='${USER}'`)).rows).toHaveLength(1);
    expect((await start({ hunterId: HUNTER, regionId: 'hunt_fresh', repeatTotal: 2 })).status).toBe(409);
  });

  it('원정이 진행 중이면 다른 요청 키로 다시 시작할 수 없다', async () => {
    expect((await start()).status).toBe(201);
    const r = await start(undefined, 'start_2');
    expect(r.status).toBe(409);
    expect(await r.json()).toMatchObject({ error: { code: 'hunter_busy' } });
    expect(await state()).toEqual({ stamina: 8, time_tickets: 3 });
  });

  it('동시에 재전송하거나 다른 키로 시작해도 한 번만 차감한다', async () => {
    const same = await Promise.all([start(), start()]);
    expect(same.map((r) => r.status).sort()).toEqual([200, 201]);
    expect(await state()).toEqual({ stamina: 8, time_tickets: 3 });
    await pg.exec(`delete from expeditions where player_id='${USER}'; update players set stamina=10 where id='${USER}'`);
    const different = await Promise.all([start(undefined, 'parallel_a'), start(undefined, 'parallel_b')]);
    expect(different.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await state()).toEqual({ stamina: 8, time_tickets: 3 });
  });

  it('인증·가입·요청 형식과 프리미엄 상한을 검사한다', async () => {
    expect((await start(undefined, 'start_1', 'invalid')).status).toBe(401);
    expect((await start(undefined, 'start_1', await sign(USER_B))).status).toBe(404);
    expect((await start(undefined, null)).status).toBe(400);
    expect((await start(undefined, 'bad key')).status).toBe(400);
    for (const extra of [{ repeatTotal: 0 }, { repeatTotal: 201 }, { repeatTotal: 1.5 }, { playerId: USER_A }, { options: { recovery: 'premium' } }, { options: { recovery: 'premium', premiumCap: -1 } }]) {
      expect((await start({ hunterId: HUNTER, regionId: 'hunt_fresh', ...extra })).status).toBe(400);
    }
    expect(await state()).toEqual({ stamina: 10, time_tickets: 3 });
  });

  it('남의 헌터·잠긴 슬롯·잠긴 지역·없는 지역을 거절하고 차감하지 않는다', async () => {
    const other = (await pg.query<{ id: string }>(`select id from hunters where owner_id='${USER_A}' limit 1`)).rows[0].id;
    expect((await start({ hunterId: other, regionId: 'hunt_fresh' })).status).toBe(404);
    expect((await start({ hunterId: SECOND, regionId: 'hunt_fresh' })).status).toBe(403);
    expect((await start({ hunterId: HUNTER, regionId: 'hunt_ancient' })).status).toBe(403);
    expect((await start({ hunterId: HUNTER, regionId: 'unknown' })).status).toBe(404);
    expect(await state()).toEqual({ stamina: 10, time_tickets: 3 });
  });

  it('기본 반복 100회, 구독 또는 높은 VIP는 200회까지 허용한다', async () => {
    const body = { hunterId: HUNTER, regionId: 'hunt_fresh', repeatTotal: 200 };
    expect((await start(body)).status).toBe(400);
    await pg.exec(`insert into subscriptions(player_id,platform,product_id,active_until) values ('${USER}','stripe','monthly',now() - interval '1 second')`);
    expect((await start(body)).status).toBe(400);
    await pg.exec(`update subscriptions set active_until=now() + interval '1 day' where player_id='${USER}'`);
    expect((await start(body)).status).toBe(201);
    await pg.exec(`delete from expeditions where player_id='${USER}'; delete from subscriptions where player_id='${USER}'; update players set vip_tier=5 where id='${USER}'`);
    expect((await start(body, 'vip_start')).status).toBe(201);
  });

  it('레벨·구독·VIP로 열린 슬롯은 같은 플레이어의 스태미너를 나눠 쓴다', async () => {
    await pg.exec(`update players set level=10,vip_tier=5 where id='${USER}'; insert into subscriptions(player_id,platform,product_id,active_until) values ('${USER}','stripe','monthly',now() + interval '1 day')`);
    for (const hunterId of [HUNTER, SECOND, THIRD, FOURTH]) {
      expect((await start({ hunterId, regionId: 'hunt_fresh' }, hunterId)).status).toBe(201);
    }
    expect(await state()).toEqual({ stamina: 2, time_tickets: 3 });
  });

  it('부족한 스태미너·티켓은 거절하고 고대 입장 티켓은 반복 전체에 한 장만 쓴다', async () => {
    await pg.exec(`update players set level=20,stamina=4 where id='${USER}'`);
    const body = { hunterId: HUNTER, regionId: 'hunt_ancient', repeatTotal: 10 };
    expect(await (await start(body)).json()).toMatchObject({ error: { code: 'insufficient_stamina' } });
    expect(await state()).toEqual({ stamina: 4, time_tickets: 3 });
    await pg.exec(`update players set stamina=10,time_tickets=0 where id='${USER}'`);
    expect(await (await start(body)).json()).toMatchObject({ error: { code: 'insufficient_time_tickets' } });
    expect(await state()).toEqual({ stamina: 10, time_tickets: 0 });
    await pg.exec(`update players set time_tickets=3 where id='${USER}'`);
    expect((await start(body)).status).toBe(201);
    expect(await state()).toEqual({ stamina: 5, time_tickets: 2 });
    expect((await start(body)).status).toBe(200);
    expect(await state()).toEqual({ stamina: 5, time_tickets: 2 });
  });

  it('회복된 스태미너를 반영하고 남은 회복 시간을 보존한다', async () => {
    await pg.exec(`update players set stamina=0,stamina_updated_at=now() - interval '650 seconds' where id='${USER}'`);
    expect((await start()).status).toBe(201);
    expect((await state()).stamina).toBe(0);
    const me = await (await call('/v1/me', token)).json() as MeResponse;
    expect(me.player.staminaNextSec).toBeGreaterThan(240);
    expect(me.player.staminaNextSec).toBeLessThanOrEqual(250);
  });

  it('장비 종류를 검사하며 시작할 때 장비나 프리미엄을 소모하지 않는다', async () => {
    expect((await start({ hunterId: HUNTER, regionId: 'hunt_fresh', options: { baitId: 'hunt_float' } })).status).toBe(400);
    expect((await start({ hunterId: HUNTER, regionId: 'hunt_fresh', options: { floatId: 'missing' } })).status).toBe(400);
    expect((await start({ hunterId: HUNTER, regionId: 'hunt_fresh', options: { floatId: 'hunt_float', recovery: 'premium', premiumCap: 0 } })).status).toBe(201);
    expect((await pg.query<{ premium: number }>(`select premium from players where id='${USER}'`)).rows[0].premium).toBe(0);
    expect((await pg.query(`select * from player_items where player_id='${USER}'`)).rows).toHaveLength(0);
  });

  it('브라우저의 요청 키 헤더를 CORS에서 허용한다', async () => {
    const r = await app.request('/v1/expeditions', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,idempotency-key' } }, {} as Env);
    expect(r.status).toBe(204);
    expect(r.headers.get('Access-Control-Allow-Headers')?.toLowerCase()).toContain('idempotency-key');
  });
});

describe('수색 진행 API', () => {
  const USER = '88888888-8888-4888-8888-888888888888';
  const HUNTER = '99999999-9999-4999-8999-999999999999';
  let token: string;
  const start = (key: string) => app.request('/v1/expeditions', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ hunterId: HUNTER, regionId: 'progress_test' }),
  }, {} as Env);
  beforeAll(async () => {
    token = await sign(USER);
    await pg.exec(`insert into auth.users(id) values ('${USER}');
      insert into players(id,nickname,stamina) values ('${USER}','진행대장',10);
      insert into hunters(id,owner_id,name) values ('${HUNTER}','${USER}','진행헌터');
      insert into regions(id,name_ko,kind,unlock_stage,required_level,special_map_chance,hunt_seconds,hunt_stamina_cost)
        values ('progress_test','진행 시험 지역','freshwater',1,1,0,300,1);`);
  });
  it('인증·플레이어를 검사하고 다른 플레이어의 원정을 공개하지 않는다', async () => {
    expect((await call('/v1/expeditions')).status).toBe(401);
    const e = (await (await start('progress_1')).json() as StartExpeditionResponse).expedition;
    const own = await (await call('/v1/expeditions', token)).json() as ExpeditionsResponse;
    expect(own.expeditions.map((x) => x.id)).toContain(e.id);
    const other = await (await call('/v1/expeditions', await sign(USER_A))).json() as ExpeditionsResponse;
    expect(other.expeditions.map((x) => x.id)).not.toContain(e.id);
  });
  it('내 상태 조회가 지난 회차를 완료하고 같은 헌터로 다시 출발할 수 있다', async () => {
    const outcome = vi.spyOn(hunt, 'huntOutcome').mockReturnValue('gold');
    try {
      await pg.exec(`update expeditions set ends_at=now()-interval '1 second' where player_id='${USER}'`);
      const me = await (await call('/v1/me', token)).json() as MeResponse;
      expect(me.hunters[0].expedition).toMatchObject({ status: 'completed', repeatDone: 1 });
      const list = await (await call('/v1/expeditions', token)).json() as ExpeditionsResponse;
      expect(list.expeditions[0]).toMatchObject({ status: 'completed', result: { gold: 20, exp: 10 } });
      expect(me.player.gold).toBe(0);
      expect((await start('progress_2')).status).toBe(201);
      const refreshed = await (await call('/v1/me', token)).json() as MeResponse;
      expect(refreshed.hunters[0].expedition?.status).toBe('active');
    } finally { outcome.mockRestore(); }
  });
  const claim = (path: string, key?: string, bearer = token) => app.request(path, {
    method: 'POST', headers: { ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), ...(key ? { 'Idempotency-Key': key } : {}) },
  }, {} as Env);
  it('수령 HTTP API는 인증·요청 키·원정 소유권을 검사한다', async () => {
    const list = await (await call('/v1/expeditions', token)).json() as ExpeditionsResponse;
    const id = list.expeditions.find((e) => e.status === 'completed')!.id;
    expect((await claim('/v1/expeditions/claim-all', 'auth', '')).status).toBe(401);
    expect((await claim('/v1/expeditions/claim-all')).status).toBe(400);
    expect((await claim('/v1/expeditions/invalid/claim', 'invalid')).status).toBe(400);
    expect((await claim(`/v1/expeditions/${id}/claim`, 'foreign', await sign(USER_A))).status).toBe(404);
    const first = await claim(`/v1/expeditions/${id}/claim`, 'http_claim');
    expect(first.status).toBe(200);
    const result = await first.json();
    expect(result).toMatchObject({ claimed: { gold: 20, exp: 10 }, hasMore: false });
    expect(await (await claim(`/v1/expeditions/${id}/claim`, 'http_claim')).json()).toEqual(result);
    expect((await claim('/v1/expeditions/claim-all', 'http_claim')).status).toBe(409);
    const all = await claim('/v1/expeditions/claim-all', 'http_all');
    expect(await all.json()).toMatchObject({ claimed: { gold: 0 }, hasMore: false });
    const me = await (await call('/v1/me', token)).json() as MeResponse;
    expect(me.player).toMatchObject({ gold: 20, exp: 10 });
  });
});
