import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const db = new PGlite();
const run = async (sql) => { for (const s of sql.split('--> statement-breakpoint')) { if (s.trim()) await db.exec(s); } };
// Supabase 환경 흉내: auth 스키마와 역할
await db.exec(`create schema auth; create table auth.users (id uuid primary key, email varchar);
  do $$ begin create role anon; create role authenticated; create role service_role; exception when others then null; end $$;`);
await run(readFileSync(new URL('../migrations/main/0000_init.sql', import.meta.url),'utf8'));
await run(readFileSync(new URL('../migrations/main/0001_safety_guards.sql', import.meta.url),'utf8'));
console.log('main migrations OK');
const log = new PGlite();
await (async()=>{ for (const s of readFileSync(new URL('../migrations/log/0000_init.sql', import.meta.url),'utf8').split('--> statement-breakpoint')) if (s.trim()) await log.exec(s); })();
console.log('log migrations OK');

// 시나리오 테스트
const uid = '11111111-1111-1111-1111-111111111111';
await db.exec(`
insert into auth.users(id) values ('${uid}');
insert into regions values ('asia_fresh','아시아 민물','freshwater',1,1,false,0.01,1);
insert into species(id,name_ko,region_id,rarity,temp_min,temp_max,salinity,max_size_cm,base_price,initial_population)
  values ('betta','베타','asia_fresh','common',24,30,'fresh',7,100,1000);
insert into species(id,name_ko,region_id,rarity,is_original,breedable,temp_min,temp_max,salinity,max_size_cm,base_price,initial_population)
  values ('moonscale','월광비늘어','asia_fresh','legendary',true,false,20,26,'fresh',10,99999,5);
insert into wild_populations(species_id,count) values ('betta',50),('moonscale',5);
insert into players(id,nickname,stamina) values ('${uid}','대장',100);
`);
const expectFail = async (label, sql) => { try { await db.exec(sql); console.log('FAIL (허용됨):', label); } catch (e) { console.log('차단 OK:', label, '→', e.message.split('\n')[0]); } };
// 정상 포획
await db.exec(`update wild_populations set count = count - 1 where species_id='betta'`);
console.log('일반 포획 OK:', (await db.query(`select count from wild_populations where species_id='betta'`)).rows[0]);
await expectFail('개체수 음수', `update wild_populations set count = -1 where species_id='betta'`);
await expectFail('골드 음수', `update players set gold = -5`);
await db.exec(`update wild_populations set status='protected' where species_id='betta'`);
await expectFail('보호종 포획', `update wild_populations set count = count - 1 where species_id='betta'`);
await db.exec(`update wild_populations set count = count + 3 where species_id='betta'`);
console.log('보호종 방류(증가) OK');
await db.exec(`begin; set local worldsea.bypass_guard='on'; update wild_populations set count = count - 1 where species_id='betta'; commit;`);
console.log('관리자 우회 OK');
// 교배 가드
const f = await db.query(`insert into fish(owner_id,species_id,origin,sex,genotype,morph_key,size_cm,health,growth_rate)
  values ('${uid}','moonscale','wild','male','{}','',5,100,1),('${uid}','moonscale','wild','female','{}','',5,100,1),
         ('${uid}','betta','wild','female','{}','',5,100,1) returning id`);
const [a,b,c] = f.rows.map(r=>r.id);
const t = await db.query(`insert into tanks(owner_id,purpose,salinity,capacity,temperature) values ('${uid}','breeding','fresh',4,26) returning id`);
const tank = t.rows[0].id;
await expectFail('오리지널 교배', `insert into breedings(player_id,tank_id,parent_a_id,parent_b_id,ready_at) values ('${uid}','${tank}','${a}','${b}',now())`);
await expectFail('다른 어종끼리 교배', `insert into breedings(player_id,tank_id,parent_a_id,parent_b_id,ready_at) values ('${uid}','${tank}','${a}','${c}',now())`);
await db.exec(`update species set auctionable=false where id='moonscale'`);
await expectFail('경매 불가 어종 등록', `insert into auctions(seller_id,fish_id,start_price,fee_rate,ends_at) values ('${uid}','${a}',100,0.05,now())`);
await db.exec(`update species set auctionable=true where id='moonscale'`);
await db.exec(`insert into auctions(seller_id,fish_id,start_price,fee_rate,ends_at) values ('${uid}','${a}',100,0.05,now())`);
console.log('오리지널 경매 등록 OK');
await expectFail('같은 개체 중복 경매', `insert into auctions(seller_id,fish_id,start_price,fee_rate,ends_at) values ('${uid}','${a}',100,0.05,now())`);
await db.exec(`insert into species(id,name_ko,region_id,rarity,temp_min,temp_max,salinity,max_size_cm,base_price,initial_population)
  values ('guppy','구피','asia_fresh','common',22,28,'fresh',5,50,1000)`);
const g = await db.query(`insert into fish(owner_id,species_id,origin,sex,genotype,morph_key,size_cm,health,growth_rate)
  values ('${uid}','guppy','wild','male','{}','',3,100,1),('${uid}','betta','wild','male','{}','',5,100,1) returning id`);
const [guppy, bettaM] = g.rows.map(r=>r.id);
await expectFail('베타×구피 교배', `insert into breedings(player_id,tank_id,parent_a_id,parent_b_id,ready_at) values ('${uid}','${tank}','${c}','${guppy}',now())`);
await db.exec(`insert into breedings(player_id,tank_id,parent_a_id,parent_b_id,ready_at) values ('${uid}','${tank}','${c}','${bettaM}',now())`);
console.log('베타×베타 교배 OK');

// 헌터: 기본 외형으로 생성, 반복 횟수 상한
await db.exec(`insert into hunters(owner_id,name) values ('${uid}','첫 헌터')`);
console.log('기본 외형 헌터 생성 OK');
await db.exec(`insert into regions(id,name_ko,kind,unlock_stage,required_level) values ('test_r','테스트','freshwater',1,1) on conflict do nothing`);
const h = (await db.query(`select id from hunters where owner_id='${uid}' limit 1`)).rows[0].id;
await expectFail('반복 201회', `insert into expeditions(player_id,hunter_id,region_id,ends_at,stamina_cost,repeat_total) values ('${uid}','${h}','test_r',now(),1,201)`);
