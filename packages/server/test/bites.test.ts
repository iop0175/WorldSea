import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { biteAttemptBody } from '@worldsea/shared';
import * as schema from '@worldsea/shared/db/main';
import * as hunt from '../src/game/hunt';
import { attemptBite, listBites } from '../src/game/bites';
import { advanceExpeditions } from '../src/game/expeditionProgress';
import type { Db } from '../src/db';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '44444444-4444-4444-8444-444444444444';
const HUNTER = '22222222-2222-4222-8222-222222222222';
const EXPEDITION = '66666666-6666-4666-8666-666666666666';
const BITE = '77777777-7777-4777-8777-777777777777';
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
  // 희귀 어종 입질 하나가 예약된 상태: 야생 99 + 예약 1
  await pg.exec(`truncate players, regions, items cascade;
    insert into players(id,nickname,stamina,stamina_updated_at) values ('${USER}','테스트대장',59,'${START.toISOString()}'),('${OTHER}','다른대장',59,'${START.toISOString()}');
    insert into hunters(id,owner_id,name) values ('${HUNTER}','${USER}','헌터1');
    insert into regions(id,name_ko,kind,unlock_stage,required_level,special_map_chance,hunt_seconds,hunt_stamina_cost)
      values ('test','시험 바다','freshwater',1,1,0,300,1);
    insert into species(id,name_ko,region_id,rarity,temp_min,temp_max,salinity,max_size_cm,base_price,initial_population)
      values ('test_fish','시험 물고기','test','rare',20,30,'fresh',10,100,100),('other_fish','다른 물고기','test','rare',20,30,'fresh',10,100,100);
    insert into wild_populations(species_id,count,reserved) values ('test_fish',99,1),('other_fish',100,0);
    insert into expeditions(id,player_id,hunter_id,region_id,started_at,ends_at,stamina_cost,repeat_total)
      values ('${EXPEDITION}','${USER}','${HUNTER}','test','${START.toISOString()}','${at(99999).toISOString()}',1,5);
    insert into rare_bites(id,expedition_id,player_id,species_id,expires_at,minigame_seed)
      values ('${BITE}','${EXPEDITION}','${USER}','test_fish','${at(1800).toISOString()}',12345);
    insert into items(id,name_ko,kind,grade,chance_bonus) values ('test_float','시험 찌','float','common',0.1);
    insert into items(id,name_ko,kind,grade,chance_bonus,target_species_id) values ('other_bait','다른 전용 미끼','bait','legendary',0.2,'other_fish');
    insert into player_items(player_id,item_id,count) values ('${USER}','test_float',2),('${USER}','other_bait',1);`);
  vi.spyOn(hunt, 'random').mockReturnValue(0);
});

async function state() {
  const [population] = await db.select().from(schema.wildPopulations).where(eq(schema.wildPopulations.speciesId, 'test_fish'));
  const [bite] = await db.select().from(schema.rareBites);
  const [expedition] = await db.select().from(schema.expeditions);
  return {
    population: population!, bite: bite!, expedition: expedition!,
    fish: await db.select().from(schema.fish), attempts: await db.select().from(schema.biteAttempts),
    stock: Object.fromEntries((await db.select().from(schema.playerItems)).map((i) => [i.itemId, i.count])),
  };
}

describe('입질 직접 시도', () => {
  it('성공하면 개체를 수령 대기로 만들고 예약을 정리하며 원정 결과에 더한다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0);
    const res = await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0 }, at(10));
    expect(res.attempt).toEqual({ attemptNo: 1, success: true, chance: 0.75, gearConsumed: true, releaseReason: null });
    expect(res.bite).toMatchObject({ status: 'caught', attemptsUsed: 1, chances: null });
    const s = await state();
    expect(s.fish).toMatchObject([{ ownerId: USER, speciesId: 'test_fish', pendingClaim: true, expeditionId: EXPEDITION }]);
    expect(res.bite.fishId).toBe(s.fish[0]!.id);
    expect(s.population).toMatchObject({ count: 99, reserved: 0 });
    expect(s.expedition.result?.catches).toEqual([{ speciesId: 'test_fish', count: 1 }]);
    expect(s.attempts).toMatchObject([{ attemptNo: 1, position: 0, isAuto: false, success: true }]);
  });

  it('실패할 때마다 확률이 내려가고 3번째 실패면 바다로 돌려보낸다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0.999);
    const first = await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0.5 }, at(10));
    expect(first.attempt).toMatchObject({ success: false, chance: 0.525 });
    expect(first.bite).toMatchObject({ status: 'pending', attemptsUsed: 1 });
    expect(first.bite.chances![0]).toBe(0.7);
    expect((await state()).population).toMatchObject({ count: 99, reserved: 1 });
    await attemptBite(db, USER, BITE, { attemptNo: 2, position: 0.5 }, at(20));
    const last = await attemptBite(db, USER, BITE, { attemptNo: 3, position: 0.5 }, at(30));
    expect(last.bite).toMatchObject({ status: 'escaped', attemptsUsed: 3, fishId: null });
    const s = await state();
    expect(s.population).toMatchObject({ count: 100, reserved: 0 });
    expect(s.fish).toHaveLength(0);
    expect(s.bite.resolvedAt).toEqual(at(30));
    await expect(attemptBite(db, USER, BITE, { attemptNo: 4, position: 0 }, at(40))).rejects.toMatchObject({ code: 'bite_closed' });
  });

  it('찌는 확률을 올리고 성공·실패와 무관하게 시도마다 한 개 소모한다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0.999);
    const res = await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0, floatId: 'test_float' }, at(10));
    expect(res.attempt).toMatchObject({ success: false, chance: 0.85 });
    const s = await state();
    expect(s.stock.test_float).toBe(1);
    expect(s.attempts[0]).toMatchObject({ floatId: 'test_float', baitId: null });
  });

  it('쓸 수 없는 장비(없음·다른 어종 전용·종류 불일치)는 거절하고 아무것도 바꾸지 않는다', async () => {
    const before = await state();
    for (const body of [
      { attemptNo: 1, position: 0, baitId: 'other_bait' },
      { attemptNo: 1, position: 0, baitId: 'test_float' },
      { attemptNo: 1, position: 0, floatId: 'missing' },
    ]) await expect(attemptBite(db, USER, BITE, body, at(10))).rejects.toMatchObject({ code: 'insufficient_items' });
    await pg.exec(`update player_items set count=0 where item_id='test_float'`);
    await expect(attemptBite(db, USER, BITE, { attemptNo: 1, position: 0, floatId: 'test_float' }, at(10))).rejects.toMatchObject({ code: 'insufficient_items' });
    expect(await state()).toEqual({ ...before, stock: { ...before.stock, test_float: 0 } });
  });

  it('같은 시도의 재전송은 저장된 결과를 돌려주고 장비를 다시 차감하지 않으며, 내용이 다르면 거절한다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0);
    const body = { attemptNo: 1, position: 0.3, floatId: 'test_float' };
    const first = await attemptBite(db, USER, BITE, body, at(10));
    const again = await attemptBite(db, USER, BITE, body, at(11));
    expect(again).toMatchObject({ attempt: first.attempt, bite: first.bite });
    const s = await state();
    expect(s.stock.test_float).toBe(1);
    expect(s.fish).toHaveLength(1);
    expect(s.attempts).toHaveLength(1);
    // 입질이 끝난 뒤에는 내용이 달라도 닫힌 입질로 알린다.
    await expect(attemptBite(db, USER, BITE, { ...body, position: 0.4 }, at(12))).rejects.toMatchObject({ code: 'bite_closed' });
  });

  it('아직 열려 있는 입질의 같은 시도 순번을 다른 내용으로 보내면 거절한다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0.999);
    await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0.3 }, at(10));
    await expect(attemptBite(db, USER, BITE, { attemptNo: 1, position: 0.4 }, at(11))).rejects.toMatchObject({ code: 'idempotency_conflict' });
    await expect(attemptBite(db, USER, BITE, { attemptNo: 1, position: 0.3, floatId: 'test_float' }, at(11))).rejects.toMatchObject({ code: 'idempotency_conflict' });
    expect((await state()).stock.test_float).toBe(2);
  });

  it('건너뛴 시도 순번은 거절한다', async () => {
    await expect(attemptBite(db, USER, BITE, { attemptNo: 2, position: 0 }, at(10))).rejects.toMatchObject({ code: 'invalid_request' });
  });

  it('남의 입질은 찾을 수 없고, 만료된 입질은 자동 판정으로 끝나 시도할 수 없다', async () => {
    await expect(attemptBite(db, OTHER, BITE, { attemptNo: 1, position: 0 }, at(10))).rejects.toMatchObject({ code: 'not_found' });
    await advanceExpeditions(db, USER, at(1801));
    await expect(attemptBite(db, USER, BITE, { attemptNo: 1, position: 0 }, at(1801))).rejects.toMatchObject({ code: 'bite_closed' });
    expect((await state()).population.reserved).toBe(0);
  });

  it('그 사이 보호종이 된 어종은 확률과 관계없이 바다로 돌려보낸다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0);
    await pg.exec(`update wild_populations set status='protected', count=5 where species_id='test_fish'`);
    const res = await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0 }, at(10));
    expect(res.attempt.success).toBe(false);
    expect(res.bite.status).toBe('escaped');
    expect((await state()).population).toMatchObject({ count: 6, reserved: 0 });
  });

  it('잡을 수 없게 된 시도는 사유를 알리고 장비를 쓰지 않은 것으로 기록한다 (94번)', async () => {
    await pg.exec(`update wild_populations set status='protected' where species_id='test_fish'`);
    const res = await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0, floatId: 'test_float' }, at(10));
    expect(res.attempt).toMatchObject({ success: false, gearConsumed: false, releaseReason: 'protected' });
    const s = await state();
    expect(s.attempts[0]).toMatchObject({ floatId: 'test_float', gearConsumed: false, releaseReason: 'protected' });
    expect(s.stock.test_float).toBe(2);
    // 재전송에도 같은 사유를 돌려준다.
    expect((await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0, floatId: 'test_float' }, at(11))).attempt).toEqual(res.attempt);
  });

  it('일일 한도에 막힌 시도는 daily_limit 사유로 끝난다', async () => {
    await pg.exec(`update wild_populations set count=19, reserved=1 where species_id='test_fish'; update species set initial_population=100 where id='test_fish';
      insert into species_daily_catches(player_id, day, species_id, count) values ('${USER}', '${START.toISOString().slice(0, 10)}', 'test_fish', 3)`);
    const res = await attemptBite(db, USER, BITE, { attemptNo: 1, position: 0 }, at(10));
    expect(res.attempt).toMatchObject({ gearConsumed: false, releaseReason: 'daily_limit' });
  });

  it('자동 시도는 자동 확률을 쓰고 시도 기록에 자동으로 남긴다', async () => {
    vi.spyOn(hunt, 'seededRoll').mockReturnValue(0.5);
    const res = await attemptBite(db, USER, BITE, { attemptNo: 1, auto: true }, at(10));
    expect(res.attempt).toMatchObject({ success: true, chance: 0.55 });
    const s = await state();
    expect(s.attempts[0]).toMatchObject({ isAuto: true, position: null });
    expect(s.bite.isAuto).toBe(true);
  });
});

describe('입질 목록', () => {
  it('대기 입질과 이번 시도의 확률 표, 쓸 수 있는 장비만 보여 준다', async () => {
    const { bites } = await listBites(db, USER, at(10));
    expect(bites).toHaveLength(1);
    expect(bites[0]).toMatchObject({ id: BITE, speciesId: 'test_fish', rarity: 'rare', attemptsUsed: 0, attemptsMax: 3, paused: false, autoChance: 0.55 });
    expect(bites[0]!.chances).toHaveLength(11);
    expect(bites[0]!.chances[0]).toBe(0.75);
    expect(bites[0]!.chances[10]).toBe(0.3);
    expect(bites[0]!.gear).toEqual([{ id: 'test_float', kind: 'float', count: 2, chanceBonus: 0.1 }]);
    expect((await listBites(db, OTHER, at(10))).bites).toEqual([]);
  });
});

describe('입질 확률 규칙', () => {
  it('가운데일수록 높고 등급이 높을수록 낮으며 최대 확률에서 잘린다', () => {
    const table = hunt.biteChanceTable('epic', 1);
    expect(table).toEqual([...table].sort((a, b) => b - a));
    expect(hunt.biteChance('legendary', 0, 1)).toBeLessThan(hunt.biteChance('common', 0, 1));
    expect(hunt.biteChance('common', 0, 1, 0.5)).toBe(hunt.HUNT_TEMP.maxChance);
    expect(hunt.biteChance('legendary', 1, 3)).toBeGreaterThanOrEqual(0);
  });
  it('시드 난수는 같은 입력에 같은 값이고 0~1 범위이며 시도마다 다르다', () => {
    expect(hunt.seededRoll(12345, 1)).toBe(hunt.seededRoll(12345, 1));
    expect(hunt.seededRoll(12345, 1)).not.toBe(hunt.seededRoll(12345, 2));
    for (let seed = 0; seed < 200; seed++) expect(hunt.seededRoll(seed * 7919, 1)).toBeGreaterThanOrEqual(0);
  });
  it('요청 본문은 직접(position) 또는 자동(auto) 중 하나만 허용한다', () => {
    expect(biteAttemptBody.safeParse({ attemptNo: 1, position: 0.5 }).success).toBe(true);
    expect(biteAttemptBody.safeParse({ attemptNo: 1, auto: true }).success).toBe(true);
    expect(biteAttemptBody.safeParse({ attemptNo: 1 }).success).toBe(false);
    expect(biteAttemptBody.safeParse({ attemptNo: 1, auto: true, position: 0.5 }).success).toBe(false);
    expect(biteAttemptBody.safeParse({ attemptNo: 1, position: 1.5 }).success).toBe(false);
  });
});
