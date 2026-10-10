import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import * as schema from '@worldsea/shared/db/main';
import { chooseSpecies, huntOutcome } from '../src/game/hunt';
import * as hunt from '../src/game/hunt';
import { advanceExpeditions } from '../src/game/expeditionProgress';
import { claimExpeditions } from '../src/game/expeditionClaims';
import type { Db } from '../src/db';

const USER = '11111111-1111-4111-8111-111111111111';
const HUNTER = '22222222-2222-4222-8222-222222222222';
const SECOND = '33333333-3333-4333-8333-333333333333';
const START = new Date('2026-10-09T00:00:00Z');
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
  await pg.exec(`insert into auth.users values ('${USER}')`);
});
afterAll(async () => { await pg.close(); });
beforeEach(async () => {
  vi.restoreAllMocks();
  await pg.exec(`truncate players, regions cascade;
    insert into players(id,nickname,stamina,stamina_updated_at) values ('${USER}','테스트대장',59,'${START.toISOString()}');
    insert into hunters(id,owner_id,name) values ('${HUNTER}','${USER}','헌터1'),('${SECOND}','${USER}','헌터2');
    insert into regions(id,name_ko,kind,unlock_stage,required_level,special_map_chance,hunt_seconds,hunt_stamina_cost)
      values ('test','시험 바다','freshwater',1,1,0,300,1);
    insert into species(id,name_ko,region_id,rarity,temp_min,temp_max,salinity,max_size_cm,base_price,initial_population)
      values ('test_fish','시험 물고기','test','common',20,30,'fresh',10,100,100);
    insert into wild_populations(species_id,count) values ('test_fish',100);`);
  vi.spyOn(hunt, 'huntOutcome').mockReturnValue('fish');
  vi.spyOn(hunt, 'random').mockReturnValue(0);
});

async function expedition(values: Partial<typeof schema.expeditions.$inferInsert> = {}) {
  const [e] = await db.insert(schema.expeditions).values({
    playerId: USER, hunterId: HUNTER, regionId: 'test', startedAt: START, endsAt: at(300), staminaCost: 1, ...values,
  }).returning();
  return e!;
}
async function state() {
  const [p] = await db.select().from(schema.players);
  const [population] = await db.select().from(schema.wildPopulations);
  return { p: p!, population: population!, exps: await db.select().from(schema.expeditions), fish: await db.select().from(schema.fish), bites: await db.select().from(schema.rareBites) };
}

describe('수색 진행·결과 확정', () => {
  it('회차 종료 전에는 처리하지 않고 종료 시 소유권과 야생 개체수를 함께 확정한다', async () => {
    await expedition();
    await advanceExpeditions(db, USER, at(299));
    expect((await state()).fish).toHaveLength(0);
    await advanceExpeditions(db, USER, at(300));
    const s = await state();
    expect(s.exps[0]).toMatchObject({ status: 'completed', repeatDone: 1, result: { catches: [{ speciesId: 'test_fish', count: 1 }] } });
    expect(s.fish[0]).toMatchObject({ ownerId: USER, origin: 'wild', pendingClaim: true, bornAt: at(300) });
    expect(s.population.count).toBe(99);
    expect(s.p.gold).toBe(0);
  });
  it('반복 조회와 동시 조회가 포획이나 스태미너를 중복 처리하지 않는다', async () => {
    await expedition({ repeatTotal: 3 });
    await Promise.all([advanceExpeditions(db, USER, at(900)), advanceExpeditions(db, USER, at(900))]);
    const first = await state();
    await advanceExpeditions(db, USER, at(900));
    expect(await state()).toEqual(first);
    expect(first.fish).toHaveLength(3);
    expect(first.exps[0].repeatDone).toBe(3);
    expect(first.p.stamina).toBe(60);
  });
  it('여러 헌터의 회차를 종료 시각순으로 처리하며 한 스태미너를 공유한다', async () => {
    await pg.exec(`update players set stamina=1 where id='${USER}'; update regions set hunt_seconds=100`);
    await expedition({ repeatTotal: 3, endsAt: at(100) });
    await expedition({ hunterId: SECOND, repeatTotal: 3, endsAt: at(150) });
    await advanceExpeditions(db, USER, at(250));
    const s = await state();
    expect(s.fish.map((f) => f.bornAt)).toEqual([at(100), at(150), at(200)]);
    expect(s.exps.map((e) => e.repeatDone).sort()).toEqual([1, 2]);
    expect(s.exps.every((e) => e.stopReason === 'stamina_empty')).toBe(true);
  });
  it('자연 회복을 기다리는 회차는 회복 시점에만 차감하고 수색 시간이 지난 뒤 완료한다', async () => {
    await pg.exec(`update players set stamina=0 where id='${USER}'; update regions set hunt_seconds=100`);
    await expedition({ repeatTotal: 2, endsAt: at(100), options: { recovery: 'wait_regen' } });
    await advanceExpeditions(db, USER, at(100));
    expect((await state()).exps[0]).toMatchObject({ repeatDone: 1, waitingForStamina: true, endsAt: at(300) });
    await advanceExpeditions(db, USER, at(300));
    expect((await state()).exps[0]).toMatchObject({ repeatDone: 1, waitingForStamina: false, endsAt: at(400) });
    await advanceExpeditions(db, USER, at(400));
    expect((await state()).exps[0]).toMatchObject({ repeatDone: 2, status: 'completed' });
  });
  it('프리미엄 회복은 반복 상한·잔액·일일 제한을 검사하고 실제 사용량을 저장한다', async () => {
    await pg.exec(`update players set stamina=0,premium=20 where id='${USER}'; update regions set hunt_seconds=100`);
    await expedition({ repeatTotal: 2, endsAt: at(100), options: { recovery: 'premium', premiumCap: 10 } });
    await advanceExpeditions(db, USER, at(200));
    const s = await state();
    expect(s.exps[0]).toMatchObject({ premiumSpent: 10, repeatDone: 2 });
    expect(s.p.premium).toBe(10);
    expect(await db.select().from(schema.dailyCounters)).toMatchObject([{ day: '2026-10-09', kind: 'buy_stamina', count: 1 }]);
  });
  it.each([
    ['premium_cap', 0, 20, 0], ['premium_empty', 10, 0, 0], ['daily_limit', 10, 20, 5],
  ])('프리미엄 회복 제한 %s이면 추가 차감 없이 중단한다', async (reason, cap, premium, count) => {
    await pg.exec(`update players set stamina=0,premium=${premium} where id='${USER}'; update regions set hunt_seconds=100;
      insert into daily_counters(player_id,day,kind,count) values ('${USER}','2026-10-09','buy_stamina',${count})`);
    await expedition({ repeatTotal: 2, endsAt: at(100), options: { recovery: 'premium', premiumCap: cap } });
    await advanceExpeditions(db, USER, at(100));
    expect((await state()).exps[0]).toMatchObject({ status: 'completed', repeatDone: 1, stopReason: reason, premiumSpent: 0 });
    expect((await state()).p.premium).toBe(premium);
  });
  it('보호종과 일일 한도를 넘는 취약 어종은 놓아줌 보상을 주고 야생 수를 줄이지 않는다', async () => {
    await pg.exec(`update wild_populations set count=12,status='vulnerable'`);
    await expedition({ repeatTotal: 2 });
    await advanceExpeditions(db, USER, at(600));
    let s = await state();
    expect(s.fish).toHaveLength(1);
    expect(s.population.count).toBe(11);
    expect(s.exps[0].result?.gold).toBe(10);
    expect(s.p.conservationPoints).toBeGreaterThan(0);
    await pg.exec(`update wild_populations set count=9,status='protected'`);
    await expedition({ hunterId: SECOND });
    await advanceExpeditions(db, USER, at(600));
    s = await state();
    expect(s.fish).toHaveLength(1);
    expect(s.population.count).toBe(9);
  });
  it('높은 등급 입질은 예약하고 반복을 중단하며 만료 때 정확히 한 번 돌려보낸다', async () => {
    await pg.exec(`update species set rarity='epic'`);
    await expedition({ repeatTotal: 3 });
    await advanceExpeditions(db, USER, at(300));
    let s = await state();
    expect(s.exps[0]).toMatchObject({ status: 'completed', repeatDone: 1, stopReason: 'high_grade_bite' });
    expect(s.population).toMatchObject({ count: 99, reserved: 1 });
    await advanceExpeditions(db, USER, at(2100));
    await advanceExpeditions(db, USER, at(2100));
    s = await state();
    expect(s.bites[0]).toMatchObject({ status: 'expired', attemptsUsed: 0 });
    expect(s.population).toMatchObject({ count: 100, reserved: 0 });
    expect(s.fish).toHaveLength(0);
  });
  it('낮은 등급 입질은 반복을 멈추지 않고 만료 시 자동 확률로 한 번 판정한다', async () => {
    await pg.exec(`update species set rarity='rare'`);
    await expedition({ repeatTotal: 2 });
    await advanceExpeditions(db, USER, at(600));
    expect((await state()).population).toMatchObject({ count: 98, reserved: 2 });
    await advanceExpeditions(db, USER, at(2400));
    const s = await state();
    expect(s.fish).toHaveLength(2);
    expect(s.population).toMatchObject({ count: 98, reserved: 0 });
    expect(s.bites.every((b) => b.status === 'caught' && b.attemptsUsed === 1)).toBe(true);
  });
  it('특별 맵은 24시간 보관하고 야생 개체를 예약하지 않는다', async () => {
    await pg.exec(`update regions set special_map_chance=1;
      insert into species(id,name_ko,region_id,rarity,is_original,is_special_map_only,temp_min,temp_max,salinity,max_size_cm,base_price,initial_population)
      values ('special','특별 물고기','test','epic',true,true,20,30,'fresh',10,100,10)`);
    await expedition();
    await advanceExpeditions(db, USER, at(300));
    const encounters = await db.select().from(schema.specialEncounters);
    expect(encounters).toHaveLength(1);
    expect(encounters[0]).toMatchObject({ speciesId: 'special', chancesLeft: 5, expiresAt: at(86700), status: 'active' });
    expect((await state()).population.reserved).toBe(0);
  });
  it('같은 바다의 마지막 한 마리는 두 플레이어 중 한 명에게만 넘어간다', async () => {
    const other = '44444444-4444-4444-8444-444444444444';
    const hunter = '55555555-5555-4555-8555-555555555555';
    await pg.exec(`insert into auth.users values ('${other}') on conflict do nothing;
      insert into players(id,nickname,stamina,stamina_updated_at) values ('${other}','다른대장',59,'${START.toISOString()}');
      insert into hunters(id,owner_id,name) values ('${hunter}','${other}','다른헌터');
      update species set initial_population=1; update wild_populations set count=1;`);
    await expedition();
    await expedition({ playerId: other, hunterId: hunter });
    await Promise.all([advanceExpeditions(db, USER, at(300)), advanceExpeditions(db, other, at(300))]);
    const s = await state();
    expect(s.fish).toHaveLength(1);
    expect(s.population).toMatchObject({ count: 0, reserved: 0 });
    expect(s.exps.reduce((total, e) => total + (e.result?.catches[0]?.count ?? 0), 0)).toBe(1);
  });
  it('포획 개체 저장이 실패하면 야생 개체수와 회차·결과 변경도 되돌린다', async () => {
    await expedition();
    await pg.exec(`create function reject_test_capture() returns trigger language plpgsql as $$ begin raise exception '포획 저장 실패'; end $$;
      create trigger reject_test_capture before insert on fish for each row execute function reject_test_capture();`);
    const before = await state();
    try {
      await expect(advanceExpeditions(db, USER, at(300))).rejects.toThrow();
      expect(await state()).toEqual(before);
    } finally {
      await pg.exec('drop trigger reject_test_capture on fish; drop function reject_test_capture();');
    }
  });
  it('플레이어가 돌아오지 않아도 다른 요청이 만료된 입질 예약을 해제한다', async () => {
    await pg.exec(`update species set rarity='epic'`);
    await expedition();
    await advanceExpeditions(db, USER, at(300));
    expect((await state()).population.reserved).toBe(1);
    await advanceExpeditions(db, '00000000-0000-4000-8000-000000000000', at(2100));
    expect((await state()).population).toMatchObject({ count: 100, reserved: 0 });
  });
  it('계정 삭제가 원정에 연결된 포획 개체 때문에 막히지 않는다', async () => {
    await expedition();
    await advanceExpeditions(db, USER, at(300));
    await pg.exec(`delete from players where id='${USER}'`);
    expect(await db.select().from(schema.fish)).toMatchObject([{ ownerId: null, expeditionId: null }]);
  });
  it('자동 입질은 성공 여부와 관계없이 선택한 장비를 시도당 한 번 소모한다', async () => {
    await pg.exec(`update species set rarity='rare'; update players set auto_minigame=true;
      insert into items(id,name_ko,kind,grade,chance_bonus) values ('test_float','시험 찌','float','common',0.1);
      insert into player_items(player_id,item_id,count) values ('${USER}','test_float',2);`);
    await expedition({ repeatTotal: 2, options: { recovery: 'none', floatId: 'test_float' } });
    await advanceExpeditions(db, USER, at(600));
    expect((await state()).fish).toHaveLength(2);
    expect((await db.select().from(schema.playerItems))[0].count).toBe(0);
    expect((await db.select().from(schema.biteAttempts)).map((b) => b.floatId)).toEqual(['test_float', 'test_float']);
  });
});

describe('수색 확률 규칙', () => {
  it('꽝 천장이 되면 꽝을 제외한다', () => {
    vi.restoreAllMocks();
    expect(huntOutcome(0, 0.999)).toBe('miss');
    expect(huntOutcome(3, 0.999)).not.toBe('miss');
  });
  it('특별 맵·오리지널 전설급을 제외하고 없는 등급의 확률을 재분배한다', () => {
    const normal = { rarity: 'common' as const, isOriginal: false, isSpecialMapOnly: false };
    const special = { rarity: 'epic' as const, isOriginal: true, isSpecialMapOnly: true };
    const legend = { rarity: 'legendary' as const, isOriginal: true, isSpecialMapOnly: false };
    expect(chooseSpecies([normal, special, legend], 4, 0.999, 0)).toBe(normal);
    expect(chooseSpecies([special, legend], 4)).toBeUndefined();
  });
});

describe('배치 수령', () => {
  const ready = async (count = 2, overrides: Partial<typeof schema.expeditions.$inferInsert> = {}) => {
    const e = await expedition({ status: 'completed', repeatDone: 1, result: { catches: count ? [{ speciesId: 'test_fish', count }] : [], gold: 40, premium: 2, exp: 10, items: [] }, ...overrides });
    if (count) await db.insert(schema.fish).values(Array.from({ length: count }, () => ({ ownerId: USER, speciesId: 'test_fish', origin: 'wild' as const, sex: 'male' as const, genotype: {}, morphKey: 'wild', sizeCm: 5, health: 95, growthRate: 1, expeditionId: e.id, pendingClaim: true })));
    return e;
  };
  it('소유한 개체만 수령 상태로 바꾸고 재화·아이템·경험치를 함께 지급한다', async () => {
    await db.insert(schema.items).values({ id: 'claim_float', nameKo: '수령 찌', kind: 'float', grade: 'common' });
    await db.insert(schema.playerItems).values({ playerId: USER, itemId: 'claim_float', count: 5 });
    const e = await ready(2, { result: { catches: [{ speciesId: 'test_fish', count: 2 }], gold: 40, premium: 2, exp: 10, items: [{ id: 'claim_float', count: 4 }] } });
    const response = await claimExpeditions(db, USER, e.id, 'claim_1');
    expect(response).toMatchObject({ claimed: { catches: [{ speciesId: 'test_fish', count: 2 }], gold: 40, premium: 2, exp: 10, items: [{ id: 'claim_float', count: 4 }] }, hasMore: false });
    expect(response.claimed.fishIds).toHaveLength(2);
    const s = await state();
    expect(s.fish).toHaveLength(2);
    expect(s.fish.every((f) => f.ownerId === USER && !f.pendingClaim)).toBe(true);
    expect(s.p).toMatchObject({ gold: 40, premium: 2, exp: 10 });
    expect(s.exps[0].status).toBe('claimed');
    expect((await db.select().from(schema.playerItems))[0].count).toBe(9);
  });
  it('동시·응답 유실 재시도에는 같은 응답을 반환하고 중복 지급하지 않는다', async () => {
    const e = await ready();
    const [first, second] = await Promise.all([claimExpeditions(db, USER, e.id, 'same'), claimExpeditions(db, USER, e.id, 'same')]);
    expect(second).toEqual(first);
    expect(await claimExpeditions(db, USER, e.id, 'same')).toEqual(first);
    expect((await state()).p).toMatchObject({ gold: 40, premium: 2, exp: 10 });
    expect(await db.select().from(schema.expeditionClaims)).toHaveLength(1);
    const repeated = await claimExpeditions(db, USER, e.id, 'new_key');
    expect(repeated.claimed.fishIds).toHaveLength(0);
    expect(repeated.claimed.gold).toBe(0);
  });
  it('50마리씩 나누고 재화는 첫 배치에만 지급하며 다음 키로 남은 배치를 받는다', async () => {
    const e = await ready(65);
    const first = await claimExpeditions(db, USER, e.id, 'batch_1');
    expect(first.claimed.fishIds).toHaveLength(50);
    expect(first.hasMore).toBe(true);
    expect((await state()).exps[0].result?.catches).toEqual([{ speciesId: 'test_fish', count: 15 }]);
    const second = await claimExpeditions(db, USER, e.id, 'batch_2');
    expect(second.claimed.fishIds).toHaveLength(15);
    expect(second.claimed.gold).toBe(0);
    expect(second.hasMore).toBe(false);
    expect(new Set([...first.claimed.fishIds, ...second.claimed.fishIds]).size).toBe(65);
    expect(await claimExpeditions(db, USER, e.id, 'batch_1')).toEqual(first);
    expect((await state()).p.gold).toBe(40);
    expect((await state()).fish).toHaveLength(65);
  });
  it('아이템 스택도 50개씩 수령한다', async () => {
    await db.insert(schema.items).values({ id: 'claim_float', nameKo: '수령 찌', kind: 'float', grade: 'common' });
    const e = await ready(0, { result: { catches: [], gold: 0, exp: 0, items: [{ id: 'claim_float', count: 65 }] } });
    expect((await claimExpeditions(db, USER, e.id, 'items_1')).claimed.items).toEqual([{ id: 'claim_float', count: 50 }]);
    const second = await claimExpeditions(db, USER, e.id, 'items_2');
    expect(second.claimed.items).toEqual([{ id: 'claim_float', count: 15 }]);
    expect(second.hasMore).toBe(false);
    expect((await db.select().from(schema.playerItems))[0].count).toBe(65);
  });
  it('모두 수령도 한 요청에 50원정까지만 처리한다', async () => {
    for (let i = 0; i < 55; i++) await ready(0, { result: { catches: [], gold: 1, exp: 0 } });
    const first = await claimExpeditions(db, USER, 'all', 'all_1');
    expect(first).toMatchObject({ claimed: { gold: 50 }, hasMore: true });
    const second = await claimExpeditions(db, USER, 'all', 'all_2');
    expect(second).toMatchObject({ claimed: { gold: 5 }, hasMore: false });
    expect((await state()).p.gold).toBe(55);
  });
  it('다른 원정·다른 플레이어의 보상은 수령하지 않고 요청 키 대상 변경도 거절한다', async () => {
    const e = await ready();
    const other = await ready(0, { hunterId: SECOND });
    await claimExpeditions(db, USER, e.id, 'scope');
    expect((await db.select().from(schema.expeditions)).find((x) => x.id === other.id)?.status).toBe('completed');
    await expect(claimExpeditions(db, USER, 'all', 'scope')).rejects.toMatchObject({ code: 'idempotency_conflict' });
    const otherUser = '66666666-6666-4666-8666-666666666666';
    await pg.exec(`insert into auth.users values ('${otherUser}') on conflict do nothing; insert into players(id,nickname,stamina) values ('${otherUser}','다른수령대장',60)`);
    await expect(claimExpeditions(db, otherUser, other.id, 'foreign')).rejects.toMatchObject({ code: 'not_found' });
  });
  it('보상 지급 실패는 개체 이동·아이템·수령 기록까지 모두 되돌린다', async () => {
    const e = await ready();
    await pg.exec(`create function reject_test_reward() returns trigger language plpgsql as $$ begin raise exception '보상 저장 실패'; end $$;
      create trigger reject_test_reward before update on players for each row execute function reject_test_reward();`);
    const before = await state();
    try {
      await expect(claimExpeditions(db, USER, e.id, 'failed')).rejects.toThrow();
      expect(await state()).toEqual(before);
      expect(await db.select().from(schema.expeditionClaims)).toHaveLength(0);
    } finally { await pg.exec('drop trigger reject_test_reward on players; drop function reject_test_reward();'); }
  });
  it('수색 중에도 현재까지 쌓인 결과를 수령할 수 있다', async () => {
    const e = await ready(1, { status: 'active', repeatTotal: 3, endsAt: new Date('2099-01-01T00:00:00Z') });
    await claimExpeditions(db, USER, e.id, 'active');
    expect((await state()).exps[0]).toMatchObject({ status: 'active', repeatDone: 1, result: { catches: [], gold: 0, exp: 0 } });
    expect((await state()).p.gold).toBe(40);
  });
  it('입질 대기가 남은 원정은 유지해 만료 자동 포획 결과도 나중에 수령한다', async () => {
    const e = await ready(0);
    await pg.exec(`update species set rarity='rare'; update wild_populations set count=99,reserved=1;`);
    const expiresAt = new Date(Date.now() + 60_000);
    await db.insert(schema.rareBites).values({ expeditionId: e.id, playerId: USER, speciesId: 'test_fish', expiresAt, minigameSeed: 0 });
    await claimExpeditions(db, USER, e.id, 'before_bite');
    expect((await state()).exps[0].status).toBe('completed');
    await advanceExpeditions(db, USER, expiresAt);
    expect((await state()).fish).toHaveLength(1);
    expect((await claimExpeditions(db, USER, e.id, 'after_bite')).claimed.fishIds).toHaveLength(1);
    expect((await state()).exps[0].status).toBe('claimed');
  });
});
