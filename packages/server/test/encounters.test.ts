import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { encounterAttemptBody } from '@worldsea/shared';
import * as schema from '@worldsea/shared/db/main';
import * as hunt from '../src/game/hunt';
import { attemptEncounter, expireEncounters, listEncounters } from '../src/game/encounters';
import type { Db } from '../src/db';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '44444444-4444-4444-8444-444444444444';
const ENC = '88888888-8888-4888-8888-888888888888';
const START = new Date('2026-10-12T00:00:00Z');
const at = (seconds: number) => new Date(START.getTime() + seconds * 1000);
let pg: PGlite;
let db: Db;

beforeAll(async () => {
  pg = new PGlite();
  await pg.exec('create schema auth; create table auth.users(id uuid primary key);');
  const dir = join(import.meta.dirname, '../../shared/migrations/main');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    for (const sql of readFileSync(join(dir, file), 'utf8').split('--> statement-breakpoint')) if (sql.trim()) await pg.exec(sql);
  }
  db = drizzle(pg, { schema }) as unknown as Db;
  await pg.exec(`insert into auth.users values ('${USER}'),('${OTHER}')`);
});
afterAll(async () => { await pg.close(); });
beforeEach(async () => {
  vi.restoreAllMocks();
  // 특별 개체(영웅) 야생 10마리 중 시작 상태, 특별 맵 하나가 24시간 열려 있다.
  await pg.exec(`truncate players, regions, items cascade; truncate species_discoveries;
    insert into players(id,nickname,stamina,stamina_updated_at) values ('${USER}','테스트대장',59,'${START.toISOString()}'),('${OTHER}','다른대장',59,'${START.toISOString()}');
    insert into regions(id,name_ko,kind,unlock_stage,required_level,special_map_chance,hunt_seconds,hunt_stamina_cost)
      values ('test','시험 바다','freshwater',1,1,0,300,1);
    insert into species(id,name_ko,region_id,rarity,is_original,is_special_map_only,temp_min,temp_max,salinity,max_size_cm,base_price,initial_population)
      values ('special','특별 물고기','test','epic',true,true,20,30,'fresh',10,100,10);
    insert into wild_populations(species_id,count) values ('special',10);
    insert into special_encounters(id,player_id,region_id,species_id,expires_at)
      values ('${ENC}','${USER}','test','special','${at(86400).toISOString()}');
    insert into items(id,name_ko,kind,grade,chance_bonus) values ('test_float','시험 찌','float','common',0.1);
    insert into player_items(player_id,item_id,count) values ('${USER}','test_float',2);`);
  vi.spyOn(hunt, 'random').mockReturnValue(0);
});

async function state() {
  const [population] = await db.select().from(schema.wildPopulations);
  const [encounter] = await db.select().from(schema.specialEncounters);
  return {
    population: population!, encounter: encounter!, fish: await db.select().from(schema.fish),
    discoveries: await db.select().from(schema.speciesDiscoveries),
    stock: Object.fromEntries((await db.select().from(schema.playerItems)).map((i) => [i.itemId, i.count])),
  };
}

describe('특별 맵 시도', () => {
  it('성공하면 야생 개체수를 줄이고 바로 소유하며 서버 최초 포획으로 공개한다', async () => {
    const res = await attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0 }, at(10));
    expect(res.attempt).toEqual({ attemptNo: 1, success: true, chance: 0.5 });
    expect(res.encounter).toMatchObject({ status: 'finished', chancesLeft: 4, speciesId: 'special', chances: null });
    const s = await state();
    expect(s.fish).toMatchObject([{ ownerId: USER, speciesId: 'special', pendingClaim: false, expeditionId: null, caughtRegionId: 'test' }]);
    expect(res.encounter.fishId).toBe(s.fish[0]!.id);
    expect(s.population.count).toBe(9);
    expect(s.discoveries).toMatchObject([{ speciesId: 'special', discovererId: USER }]);
    expect(s.encounter.status).toBe('finished');
  });

  it('실패하면 야생은 그대로이고 기회가 줄며 확률이 내려가고, 5번 실패하면 끝난다', async () => {
    vi.spyOn(hunt, 'random').mockReturnValue(0.999);
    const first = await attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0.5 }, at(10));
    expect(first.attempt).toMatchObject({ success: false, chance: 0.35 });
    expect(first.encounter).toMatchObject({ status: 'active', chancesLeft: 4, fishId: null, speciesId: null });
    expect(first.encounter.chances![0]).toBe(0.45);
    for (let n = 2; n <= 4; n++) await attemptEncounter(db, USER, ENC, { attemptNo: n, position: 0.5 }, at(10 + n));
    const last = await attemptEncounter(db, USER, ENC, { attemptNo: 5, position: 0.5 }, at(20));
    expect(last.encounter).toMatchObject({ status: 'finished', chancesLeft: 0, chances: null });
    const s = await state();
    expect(s.population).toMatchObject({ count: 10, reserved: 0 });
    expect(s.fish).toHaveLength(0);
    expect(s.discoveries).toHaveLength(0);
    await expect(attemptEncounter(db, USER, ENC, { attemptNo: 6, position: 0 }, at(30))).rejects.toMatchObject({ code: 'encounter_closed' });
  });

  it('찌는 확률을 올리고 시도마다 한 개 소모한다', async () => {
    vi.spyOn(hunt, 'random').mockReturnValue(0.999);
    const res = await attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0, floatId: 'test_float' }, at(10));
    expect(res.attempt.chance).toBe(0.6);
    expect((await state()).stock.test_float).toBe(1);
    await expect(attemptEncounter(db, USER, ENC, { attemptNo: 2, position: 0, baitId: 'test_float' }, at(11))).rejects.toMatchObject({ code: 'insufficient_items' });
    expect((await state()).stock.test_float).toBe(1);
  });

  it('이미 처리된 순번은 장비를 다시 차감하지 않고 거절하며, 건너뛴 순번도 거절한다', async () => {
    vi.spyOn(hunt, 'random').mockReturnValue(0.999);
    await attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0, floatId: 'test_float' }, at(10));
    await expect(attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0, floatId: 'test_float' }, at(11))).rejects.toMatchObject({ code: 'idempotency_conflict' });
    await expect(attemptEncounter(db, USER, ENC, { attemptNo: 3, position: 0 }, at(12))).rejects.toMatchObject({ code: 'invalid_request' });
    const s = await state();
    expect(s.stock.test_float).toBe(1);
    expect(s.encounter.chancesLeft).toBe(4);
  });

  it('남의 특별 맵은 찾을 수 없고, 24시간이 지나면 만료된다', async () => {
    await expect(attemptEncounter(db, OTHER, ENC, { attemptNo: 1, position: 0 }, at(10))).rejects.toMatchObject({ code: 'not_found' });
    await expireEncounters(db, USER, at(86400));
    expect((await state()).encounter.status).toBe('expired');
    await expect(attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0 }, at(86401))).rejects.toMatchObject({ code: 'encounter_closed' });
    expect((await state()).population.count).toBe(10);
  });

  it('만료 시각 직전까지는 시도할 수 있다', async () => {
    const res = await attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0 }, at(86399));
    expect(res.attempt.success).toBe(true);
  });

  it('그 사이 보호종이 되거나 마릿수가 0이면 확률과 관계없이 끝내고 개체를 만들지 않는다', async () => {
    await pg.exec(`update wild_populations set status='protected', count=0`);
    const res = await attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0 }, at(10));
    expect(res.attempt.success).toBe(false);
    expect(res.encounter).toMatchObject({ status: 'finished', chancesLeft: 0 });
    expect((await state()).fish).toHaveLength(0);
  });

  it('두 플레이어가 마지막 한 마리를 동시에 시도해도 한 명만 잡는다', async () => {
    const other = '99999999-9999-4999-8999-999999999999';
    await pg.exec(`update wild_populations set count=1;
      insert into special_encounters(id,player_id,region_id,species_id,expires_at)
        values ('${other}','${OTHER}','test','special','${at(86400).toISOString()}');`);
    const results = await Promise.allSettled([
      attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0 }, at(10)),
      attemptEncounter(db, OTHER, other, { attemptNo: 1, position: 0 }, at(10)),
    ]);
    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    const s = await state();
    expect(s.fish).toHaveLength(1);
    expect(s.population.count).toBe(0);
    expect(s.discoveries).toHaveLength(1);
  });
});

describe('특별 맵 목록', () => {
  it('처음엔 어종을 숨기고, 서버에서 누군가 잡은 뒤에는 공개하며 쓸 수 있는 장비를 보여 준다', async () => {
    let { encounters } = await listEncounters(db, USER, at(10));
    expect(encounters).toHaveLength(1);
    expect(encounters[0]).toMatchObject({ id: ENC, regionId: 'test', speciesId: null, rarity: 'epic', chancesLeft: 5, chancesMax: 5 });
    expect(encounters[0]!.chances[0]).toBe(0.5);
    expect(encounters[0]!.gear).toEqual([{ id: 'test_float', kind: 'float', count: 2, chanceBonus: 0.1 }]);
    await pg.exec(`insert into species_discoveries(species_id) values ('special')`);
    ({ encounters } = await listEncounters(db, USER, at(10)));
    expect(encounters[0]!.speciesId).toBe('special');
    expect((await listEncounters(db, OTHER, at(10))).encounters).toEqual([]);
  });
  it('끝난 특별 맵은 목록에서 빠진다', async () => {
    await attemptEncounter(db, USER, ENC, { attemptNo: 1, position: 0 }, at(10));
    expect((await listEncounters(db, USER, at(11))).encounters).toEqual([]);
  });
});

describe('특별 맵 요청 본문', () => {
  it('직접 시도(position)만 허용한다', () => {
    expect(encounterAttemptBody.safeParse({ attemptNo: 1, position: 0.5 }).success).toBe(true);
    expect(encounterAttemptBody.safeParse({ attemptNo: 1 }).success).toBe(false);
    expect(encounterAttemptBody.safeParse({ attemptNo: 1, position: 0.5, auto: true }).success).toBe(false);
    expect(encounterAttemptBody.safeParse({ attemptNo: 1, position: -0.1 }).success).toBe(false);
  });
});
