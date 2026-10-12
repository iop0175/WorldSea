import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
// 어브노말 테스트(2026-10-12). 남은 it.fails는 정책 결정을 기다리는 항목이다(CLAUDE.md "결정 필요"). 결정하면 it으로 바꾼다.
import * as schema from '@worldsea/shared/db/main';
import * as hunt from '../src/game/hunt';
import { createApp } from '../src/app';
import { keySetVerifier } from '../src/auth';
import { attemptBite, listBites } from '../src/game/bites';
import { attemptEncounter } from '../src/game/encounters';
import { advanceExpeditions } from '../src/game/expeditionProgress';
import type { Db } from '../src/db';
import type { Env } from '../src/env';

const ISSUER = 'https://test.supabase.co/auth/v1';
const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '44444444-4444-4444-8444-444444444444';
const HUNTER = '22222222-2222-4222-8222-222222222222';
const OTHER_HUNTER = '55555555-5555-4555-8555-555555555555';
const EXPEDITION = '66666666-6666-4666-8666-666666666666';
const OTHER_EXPEDITION = '66666666-6666-4666-8666-666666666667';
const BITE = '77777777-7777-4777-8777-777777777777';
const ENC = '88888888-8888-4888-8888-888888888888';
const START = new Date('2026-10-12T00:00:00Z');
const at = (seconds: number) => new Date(START.getTime() + seconds * 1000);
let pg: PGlite;
let db: Db;
let app: ReturnType<typeof createApp>;
let sign: (sub: string, opts?: { exp?: string; aud?: string }) => Promise<string>;

beforeAll(async () => {
  pg = new PGlite();
  await pg.exec('create schema auth; create table auth.users(id uuid primary key);');
  const dir = join(import.meta.dirname, '../../shared/migrations/main');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    for (const sql of readFileSync(join(dir, file), 'utf8').split('--> statement-breakpoint')) if (sql.trim()) await pg.exec(sql);
  }
  db = drizzle(pg, { schema }) as unknown as Db;
  await pg.exec(`insert into auth.users values ('${USER}'),('${OTHER}')`);
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256' };
  const verifier = keySetVerifier(createLocalJWKSet({ keys: [jwk] }), { audience: 'authenticated', issuer: ISSUER });
  sign = (sub, opts = {}) => new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'ES256', kid: 'k1' }).setSubject(sub).setIssuer(ISSUER)
    .setAudience(opts.aud ?? 'authenticated').setIssuedAt().setExpirationTime(opts.exp ?? '1h').sign(privateKey);
  app = createApp({ db: () => ({ db, close: async () => {} }), verifier: () => verifier });
});
afterAll(async () => { await pg.close(); });
beforeEach(async () => {
  vi.restoreAllMocks();
  await pg.exec(`truncate players, regions, items cascade; truncate species_discoveries;
    insert into players(id,nickname,stamina,stamina_updated_at) values ('${USER}','테스트대장',59,'${START.toISOString()}'),('${OTHER}','다른대장',59,'${START.toISOString()}');
    insert into hunters(id,owner_id,name) values ('${HUNTER}','${USER}','헌터1'),('${OTHER_HUNTER}','${OTHER}','헌터2');
    insert into regions(id,name_ko,kind,unlock_stage,required_level,special_map_chance,hunt_seconds,hunt_stamina_cost)
      values ('test','시험 바다','freshwater',1,1,0,300,1);
    insert into species(id,name_ko,region_id,rarity,temp_min,temp_max,salinity,max_size_cm,base_price,initial_population)
      values ('test_fish','시험 물고기','test','rare',20,30,'fresh',10,100,100);
    insert into species(id,name_ko,region_id,rarity,is_original,is_special_map_only,temp_min,temp_max,salinity,max_size_cm,base_price,initial_population)
      values ('special','특별 물고기','test','epic',true,true,20,30,'fresh',10,100,10);
    insert into wild_populations(species_id,count,reserved) values ('test_fish',99,1),('special',10,0);
    insert into expeditions(id,player_id,hunter_id,region_id,started_at,ends_at,stamina_cost,repeat_total)
      values ('${EXPEDITION}','${USER}','${HUNTER}','test','${START.toISOString()}','${at(99999).toISOString()}',1,5);
    insert into rare_bites(id,expedition_id,player_id,species_id,expires_at,minigame_seed)
      values ('${BITE}','${EXPEDITION}','${USER}','test_fish','${at(1800).toISOString()}',12345);
    insert into special_encounters(id,player_id,region_id,species_id,expires_at)
      values ('${ENC}','${USER}','test','special','${at(86400).toISOString()}');
    insert into items(id,name_ko,kind,grade,chance_bonus) values ('test_float','시험 찌','float','common',0.1);
    insert into player_items(player_id,item_id,count) values ('${USER}','test_float',1);`);
  vi.spyOn(hunt, 'random').mockReturnValue(0);
});

const stock = async () => (await db.select().from(schema.playerItems))[0]?.count;
const wild = async (id = 'test_fish') => (await db.select().from(schema.wildPopulations)).find((p) => p.speciesId === id)!;
const http = (path: string, token: string | null, body?: unknown, raw?: string) => app.request(path, {
  method: body === undefined && raw === undefined ? 'GET' : 'POST',
  headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
  body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
}, {} as Env);

describe('A. 일부 시도 후 만료', () => {
  it('직접 시도를 하다 30분이 지나도 정리가 오류 없이 끝나고 예약이 풀린다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0.999);
    await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0.5 }, at(10));
    await expect(advanceExpeditions(db, USER, at(1801))).resolves.toBeUndefined();
    expect((await wild()).reserved).toBe(0);
  });
  it('한 플레이어의 이 상태가 다른 플레이어의 요청을 막지 않는다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0.999);
    await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0.5 }, at(10));
    await expect(advanceExpeditions(db, OTHER, at(1801))).resolves.toBeUndefined();
  });
});

describe('A1. 수정 확인', () => {
  it('직접 시도 후 만료된 입질은 자동 판정 없이 expired로 닫고 시도 횟수·장비를 유지한다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0.999);
    await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0.5, floatId: 'test_float' }, at(10));
    await advanceExpeditions(db, USER, at(1801));
    const [bite] = await db.select().from(schema.rareBites);
    expect(bite).toMatchObject({ status: 'expired', attemptsUsed: 1, isAuto: false, fishId: null });
    expect(await db.select().from(schema.biteAttempts)).toHaveLength(1);
    expect(await db.select().from(schema.fish)).toHaveLength(0);
    expect(await wild()).toMatchObject({ count: 100, reserved: 0 });
    expect(await stock()).toBe(0);
  });
  it('자동 시도를 한 번 한 입질도 만료 정리가 같은 방식으로 닫는다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0.999);
    await attemptBite(db, USER, BITE, { attemptNo: 1, auto: true }, at(10));
    await expect(advanceExpeditions(db, USER, at(1801))).resolves.toBeUndefined();
    expect((await db.select().from(schema.rareBites))[0]).toMatchObject({ status: 'expired', attemptsUsed: 1, isAuto: true });
  });
  it('다른 플레이어의 정리가 실패해도 요청한 플레이어는 정상 처리된다', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await pg.exec(`update rare_bites set expires_at='${at(100).toISOString()}'`);
    await pg.exec(`create function reject_other() returns trigger language plpgsql as $$ begin raise exception '정리 실패'; end $$;
      create trigger reject_other before update on rare_bites for each row execute function reject_other();`);
    try {
      await expect(advanceExpeditions(db, OTHER, at(200))).resolves.toBeUndefined();
      expect(err).toHaveBeenCalled();
      // 본인 정리가 실패하면 그대로 알린다.
      await expect(advanceExpeditions(db, USER, at(200))).rejects.toBeDefined();
    } finally {
      await pg.exec('drop trigger reject_other on rare_bites; drop function reject_other();');
    }
  });
  it('잡을 수 없는 시도를 하면 입질은 바로 끝나고 장비는 그대로이며 오류 없이 바다로 돌려보낸다', async () => {
    await pg.exec(`update wild_populations set status='protected' where species_id='test_fish'`);
    const res = await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0, floatId: 'test_float' }, at(10));
    expect(res.bite.status).toBe('escaped');
    expect(await wild()).toMatchObject({ count: 100, reserved: 0 });
  });
  it('장비가 없어도 잡을 수 없는 시도는 장비 오류 없이 끝나지만 잡을 수 있는 시도는 장비 오류로 거절한다', async () => {
    await pg.exec('delete from player_items');
    await expect(attemptBite(db, USER, BITE, { attemptNo: 1, position: 0, floatId: 'test_float' }, at(10))).rejects.toMatchObject({ code: 'insufficient_items' });
    expect((await db.select().from(schema.rareBites))[0]!.attemptsUsed).toBe(0);
  });
  it('야생 개체수 행이 없으면 입질 시도도 정의된 오류를 낸다', async () => {
    await pg.exec(`alter table rare_bites disable trigger all; delete from wild_populations where species_id='test_fish'; alter table rare_bites enable trigger all`);
    await expect(attemptBite(db, USER, BITE, { attemptNo: 1, position: 0 }, at(10))).rejects.toMatchObject({ code: 'internal' });
  });
});

describe('A2. 위 상태가 HTTP에서 번지는 범위', () => {
  it('정리 대상 플레이어가 막히면 아무 플레이어의 조회도 500이 되지 않는다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0.999);
    await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0.5 }, at(10));
    await pg.exec(`update rare_bites set expires_at = now() - interval '1 minute'`);
    const other = await http('/v1/expeditions', await sign(OTHER));
    const owner = await http('/v1/me', await sign(USER));
    expect([other.status, owner.status]).toEqual([200, 200]);
  });
});

describe('B. 동시 요청', () => {
  it('같은 시도를 동시에 두 번 보내도 한 번만 처리하고 장비를 한 번만 쓴다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0.999);
    const body = { attemptNo: 1, position: 0.2, floatId: 'test_float' };
    const [a, b] = await Promise.all([attemptBite(db, USER, BITE, body, at(10)), attemptBite(db, USER, BITE, body, at(10))]);
    expect(a.attempt).toEqual(b.attempt);
    expect(await stock()).toBe(0);
    expect(await db.select().from(schema.biteAttempts)).toHaveLength(1);
  });
  it('장비 1개로 서로 다른 순번을 동시에 보내도 재고가 음수가 되지 않는다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0.999);
    const results = await Promise.allSettled([
      attemptBite(db, USER, BITE, { attemptNo: 1, position: 0.2, floatId: 'test_float' }, at(10)),
      attemptBite(db, USER, BITE, { attemptNo: 2, position: 0.2, floatId: 'test_float' }, at(10)),
    ]);
    expect(await stock()).toBeGreaterThanOrEqual(0);
    expect(results.filter((r) => r.status === 'rejected').every((r) => (r as PromiseRejectedResult).reason?.code)).toBe(true);
  });
  it('특별 맵 같은 순번을 동시에 보내면 한 번만 처리한다', async () => {
    vi.spyOn(hunt, 'random').mockReturnValue(0.999);
    const body = { attemptNo: 1, position: 0.2, floatId: 'test_float' };
    const results = await Promise.allSettled([attemptEncounter(db, USER, ENC, body, at(10)), attemptEncounter(db, USER, ENC, body, at(10))]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await db.select().from(schema.specialEncounters))[0]!.chancesLeft).toBe(4);
    expect(await stock()).toBe(0);
  });
  it('입질 시도와 만료 정리가 동시에 와도 개체수가 맞는다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0);
    await Promise.allSettled([
      attemptBite(db, USER, BITE, { attemptNo: 1, position: 0 }, at(1800)),
      advanceExpeditions(db, OTHER, at(1800)),
    ]);
    const p = await wild();
    expect(p.reserved).toBe(0);
    expect(p.count + (await db.select().from(schema.fish)).length).toBe(99 + 1);
  });
});

describe('C. 시각 경계', () => {
  it('만료 1ms 전까지는 시도할 수 있고 만료 시각부터는 닫힌다', async () => {
    const ok = await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0 }, new Date(at(1800).getTime() - 1));
    expect(ok.attempt.attemptNo).toBe(1);
    await pg.exec(`update rare_bites set status='pending', attempts_used=0, resolved_at=null, fish_id=null; delete from bite_attempts; delete from fish;
      update wild_populations set count=99, reserved=1 where species_id='test_fish'`);
    await expect(attemptBite(db, USER, BITE, { attemptNo: 1, position: 0 }, at(1800))).rejects.toMatchObject({ code: 'bite_closed' });
  });
  it('서버 시각이 플레이어 갱신 시각보다 과거여도 오류 없이 처리한다', async () => {
    await pg.exec(`update players set stamina_updated_at='${at(500).toISOString()}'`);
    await expect(attemptBite(db, USER, BITE, { attemptNo: 1, position: 0 }, at(10))).resolves.toBeDefined();
  });
});

describe('D. 불공정·정책', () => {
  it('보호종이 되어 어차피 잡을 수 없는 시도에는 장비를 쓰지 않는다 (입질)', async () => {
    await pg.exec(`update wild_populations set status='protected' where species_id='test_fish'`);
    await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0, floatId: 'test_float' }, at(10));
    expect(await stock()).toBe(1);
  });
  it('보호종이 되어 어차피 잡을 수 없는 시도에는 장비를 쓰지 않는다 (특별 맵)', async () => {
    await pg.exec(`update wild_populations set status='protected' where species_id='special'`);
    await attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0, floatId: 'test_float' }, at(10));
    expect(await stock()).toBe(1);
  });
  it.fails('높은 등급 정지 입질에 자동 시도를 보내도 직접 진행 규칙을 어기지 않는다', async () => {
    await pg.exec(`update rare_bites set paused_repeat=true`);
    await expect(attemptBite(db, USER, BITE, { attemptNo: 1, auto: true }, at(10))).rejects.toBeDefined();
  });
  it('이미 포획한 입질에 다시 시도하면 닫힌 입질로 거절한다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0);
    await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0 }, at(10));
    await expect(attemptBite(db, USER, BITE, { attemptNo: 2, position: 0 }, at(11))).rejects.toMatchObject({ code: 'bite_closed' });
    expect(await db.select().from(schema.fish)).toHaveLength(1);
  });
});

describe('E. 깨진 데이터', () => {
  it('야생 개체수 행이 없는 어종이어도 서버 오류 대신 정의된 오류를 낸다 (특별 맵)', async () => {
    await pg.exec(`delete from wild_populations where species_id='special'`);
    await expect(attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0 }, at(10))).rejects.toMatchObject({ code: expect.any(String) });
  });
  it('예약 수가 0인데 입질이 남은 불일치 데이터는 개체수를 음수로 만들지 않는다', async () => {
    await pg.exec(`update wild_populations set reserved=0 where species_id='test_fish'`);
    await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0 }, at(10)).catch(() => undefined);
    const p = await wild();
    expect(p.reserved).toBeGreaterThanOrEqual(0);
    expect(p.count).toBeGreaterThanOrEqual(0);
  });
  it('입질 목록은 찌·미끼가 하나도 없어도 비어 있는 장비 목록을 준다', async () => {
    await pg.exec('delete from player_items');
    expect((await listBites(db, USER, at(10))).bites[0]!.gear).toEqual([]);
  });
});

describe('F. HTTP 비정상 입력', () => {
  const bodies: [string, unknown, string?][] = [
    ['null', null], ['빈 객체', {}], ['배열', []], ['문자열', 'x'],
    ['position 문자열', { attemptNo: 1, position: '0.5' }], ['attemptNo 소수', { attemptNo: 1.5, position: 0 }],
    ['attemptNo 0', { attemptNo: 0, position: 0 }], ['attemptNo 음수', { attemptNo: -1, position: 0 }],
    ['attemptNo 11', { attemptNo: 11, position: 0 }], ['position 범위 밖', { attemptNo: 1, position: 1.0001 }],
    ['position 음수', { attemptNo: 1, position: -0.0001 }], ['position null', { attemptNo: 1, position: null }],
    ['auto와 position 동시', { attemptNo: 1, auto: true, position: 0 }], ['알 수 없는 키', { attemptNo: 1, position: 0, cheat: 1 }],
    ['floatId 빈 문자열', { attemptNo: 1, position: 0, floatId: '' }], ['floatId 너무 김', { attemptNo: 1, position: 0, floatId: 'x'.repeat(101) }],
    ['floatId 숫자', { attemptNo: 1, position: 0, floatId: 5 }],
  ];
  it.each(bodies)('입질 시도 본문 %s → 400이고 상태가 바뀌지 않는다', async (_name, body) => {
    const r = await http(`/v1/bites/${BITE}/attempt`, await sign(USER), body);
    expect(r.status).toBe(400);
    expect(await stock()).toBe(1);
    expect(await db.select().from(schema.biteAttempts)).toHaveLength(0);
  });
  it.each(bodies.filter(([name]) => !name.startsWith('auto')))('특별 맵 시도 본문 %s → 400', async (_name, body) => {
    expect((await http(`/v1/encounters/${ENC}/attempt`, await sign(USER), body)).status).toBe(400);
  });
  it('깨진 JSON, 비어 있는 본문, 숫자 오버플로는 400이다', async () => {
    const token = await sign(USER);
    for (const raw of ['{', '', '{"attemptNo":1,"position":1e999}', '{"attemptNo":1e999,"position":0}']) {
      expect((await http(`/v1/bites/${BITE}/attempt`, token, undefined, raw)).status).toBe(400);
    }
  });
  it('경로 id가 이상하면 400, 없는 id면 404, 남의 id면 404이다', async () => {
    const token = await sign(USER);
    const good = { attemptNo: 1, position: 0 };
    for (const id of ['abc', '%00', '..%2F..', '7'.repeat(500)]) expect((await http(`/v1/bites/${id}/attempt`, token, good)).status).toBe(400);
    expect((await http('/v1/bites/00000000-0000-4000-8000-000000000000/attempt', token, good)).status).toBe(404);
    expect((await http(`/v1/bites/${BITE}/attempt`, await sign(OTHER), good)).status).toBe(404);
    expect((await http(`/v1/encounters/${ENC}/attempt`, await sign(OTHER), good)).status).toBe(404);
  });
  it('토큰이 없거나 만료·대상 불일치·위조면 401이다', async () => {
    const good = { attemptNo: 1, position: 0 };
    expect((await http(`/v1/bites/${BITE}/attempt`, null, good)).status).toBe(401);
    expect((await http(`/v1/bites/${BITE}/attempt`, await sign(USER, { exp: '-1h' }), good)).status).toBe(401);
    expect((await http(`/v1/bites/${BITE}/attempt`, await sign(USER, { aud: 'other' }), good)).status).toBe(401);
    expect((await http(`/v1/bites/${BITE}/attempt`, 'a.b.c', good)).status).toBe(401);
    expect((await http('/v1/bites', null)).status).toBe(401);
    expect((await http('/v1/encounters', null)).status).toBe(401);
  });
  it('가입하지 않은 계정이 호출하면 서버 오류 없이 처리한다', async () => {
    await pg.exec(`insert into auth.users values ('99999999-9999-4999-8999-999999999999')`);
    const ghost = await sign('99999999-9999-4999-8999-999999999999');
    expect((await http('/v1/bites', ghost)).status).toBe(200);
    expect((await http('/v1/encounters', ghost)).status).toBe(200);
    expect((await http(`/v1/bites/${BITE}/attempt`, ghost, { attemptNo: 1, position: 0 })).status).toBe(404);
  });
  it('허용되지 않는 메서드는 404/405이고 서버 오류가 아니다', async () => {
    const token = await sign(USER);
    for (const method of ['PUT', 'DELETE', 'PATCH']) {
      const r = await app.request(`/v1/bites/${BITE}/attempt`, { method, headers: { Authorization: `Bearer ${token}` } }, {} as Env);
      expect(r.status).toBeLessThan(500);
    }
  });
});

describe('G. 확률·난수', () => {
  it('어떤 입력에서도 확률은 0~최대 사이이고 NaN이 아니다', () => {
    for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const) {
      for (const position of [null, 0, 0.5, 1, 1e-9, Number.MIN_VALUE]) {
        for (const attemptNo of [1, 3, 5, 10, 100]) {
          for (const bonus of [-5, 0, 0.1, 5, 1e9]) {
            const c = hunt.biteChance(rarity, position, attemptNo, bonus);
            expect(Number.isFinite(c) && c >= 0 && c <= hunt.HUNT_TEMP.maxChance).toBe(true);
          }
        }
      }
    }
  });
  it('시드 난수는 치우치지 않고 시도 순번끼리 상관이 없다', () => {
    let s1 = 0, s12 = 0, n = 20000;
    const buckets = new Array(10).fill(0);
    for (let i = 0; i < n; i++) {
      const seed = Math.floor(((i * 2654435761) % 0x7fffffff));
      const a = hunt.seededRoll(seed, 1), b = hunt.seededRoll(seed, 2);
      s1 += a; s12 += a * b; buckets[Math.floor(a * 10)]++;
    }
    expect(Math.abs(s1 / n - 0.5)).toBeLessThan(0.01);
    expect(Math.abs(s12 / n - 0.25)).toBeLessThan(0.01);
    for (const c of buckets) expect(Math.abs(c / n - 0.1)).toBeLessThan(0.01);
  });
  it('어떤 시드도 확률과 무관하게 항상 성공하는 값(0)이 나오지 않는다', () => {
    const seed = Math.imul(2, 0x9e3779b1) | 0;
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(hunt.seededRoll(seed, 2)).toBeGreaterThan(0);
  });
});
