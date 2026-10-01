/**
 * 월드씨 - 메인 DB 스키마 (Supabase PostgreSQL)
 *
 * 원칙
 * - 클라이언트는 이 DB에 직접 접근하지 않는다. 모든 테이블에 RLS를 켜고 정책을 두지 않아
 *   Supabase REST(anon/authenticated 키)로는 읽기·쓰기가 모두 막힌다.
 *   Workers는 Hyperdrive를 통해 RLS를 우회하는 서버 역할로 접속한다.
 * - 개체수 차감과 소유권 이동은 한 트랜잭션에서 처리한다 (SELECT ... FOR UPDATE).
 * - 시간에 따라 변하는 값(개체수 회복, 스테미너, 성장)은 "마지막 갱신 시각"을 저장하고
 *   요청이 올 때 경과 시간만큼 계산한다.
 */
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { authUsers } from 'drizzle-orm/supabase';
import type {
  HunterSkills,
  ExpeditionResult,
  Genotype,
  LocusDef,
  Reward,
  TankEquipment,
} from './types';

// ---------------------------------------------------------------------------
// 공통 헬퍼
// ---------------------------------------------------------------------------
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const ts = (name: string) => timestamp(name, { withTimezone: true });
const money = (name: string) => bigint(name, { mode: 'number' });

// ---------------------------------------------------------------------------
// Enum
// ---------------------------------------------------------------------------
export const regionKind = pgEnum('region_kind', ['freshwater', 'sea', 'ancient']);
/** 기본 희귀도: 일반, 고급, 희귀, 영웅, 전설 */
export const rarity = pgEnum('rarity', ['common', 'uncommon', 'rare', 'epic', 'legendary']);
/** 염분: 민물, 기수, 해수, 광염성(민물·해수 모두) */
export const salinity = pgEnum('salinity', ['fresh', 'brackish', 'marine', 'euryhaline']);
/** 보전 상태: 안정, 취약, 보호종, 야생 멸종 */
export const conservationStatus = pgEnum('conservation_status', [
  'stable',
  'vulnerable',
  'protected',
  'extinct_wild',
]);
export const fishOrigin = pgEnum('fish_origin', ['wild', 'farmed']);
export const fishStatus = pgEnum('fish_status', [
  'holding', // 수조 밖 보관함
  'tank', // 사육 수조
  'display', // 샵 진열
  'breeding', // 교배 중
  'auction', // 경매 등록
  'released', // 방류됨
  'sold', // NPC 판매됨
  'dead',
]);
export const sex = pgEnum('sex', ['male', 'female']);
export const tankPurpose = pgEnum('tank_purpose', ['breeding', 'display', 'holding']);
export const expeditionStatus = pgEnum('expedition_status', ['active', 'completed', 'claimed']);
/** 낚시 장비 종류: 찌(미니게임 판정 범위/확률 보정), 미끼(어종·등급별 입질/성공 확률 보정) */
export const itemKind = pgEnum('item_kind', ['float', 'bait']);
export const biteStatus = pgEnum('bite_status', ['pending', 'caught', 'escaped', 'expired']);
export const encounterStatus = pgEnum('encounter_status', ['active', 'finished', 'expired']);
export const breedingStatus = pgEnum('breeding_status', ['active', 'hatched', 'failed']);
export const auctionStatus = pgEnum('auction_status', ['active', 'sold', 'expired', 'cancelled']);
export const guildRole = pgEnum('guild_role', ['leader', 'officer', 'member']);
export const progressStatus = pgEnum('progress_status', ['active', 'completed', 'failed']);
export const friendStatus = pgEnum('friend_status', ['pending', 'accepted']);
export const devicePlatform = pgEnum('device_platform', ['android', 'ios']);
export const paymentPlatform = pgEnum('payment_platform', ['revenuecat', 'stripe']);
/** 일일 제한 카운터 종류 */
export const dailyCounterKind = pgEnum('daily_counter_kind', [
  'attendance', // 출석
  'ad_gold', // 광고 보상: 골드
  'ad_premium', // 광고 보상: 프리미엄 재화
  'ad_stamina', // 광고 보상: 스테미너
  'ad_time_ticket', // 광고 보상: 시간 티켓
  'buy_stamina', // 프리미엄 재화로 스테미너 구매
  'buy_time_ticket', // 프리미엄 재화로 시간 티켓 구매
  'ancient_entry', // 고대 입장 (하루 최대 입장 수)
]);

// ---------------------------------------------------------------------------
// 1. 월드 정적 데이터 (지역, 어종)
// ---------------------------------------------------------------------------
export const regions = pgTable('regions', {
  id: text('id').primaryKey(), // 'asia_fresh', 'pacific', 'devonian'
  nameKo: varchar('name_ko', { length: 40 }).notNull(),
  kind: regionKind('kind').notNull(),
  /** 지역 개방 단계 1~4 */
  unlockStage: smallint('unlock_stage').notNull(),
  requiredLevel: smallint('required_level').notNull(),
  requiresTimeTicket: boolean('requires_time_ticket').notNull().default(false),
  /** 특별 맵 등장 확률 (원정 1회당) */
  specialMapChance: real('special_map_chance').notNull().default(0.01),
  sortOrder: smallint('sort_order').notNull().default(0),
}).enableRLS();

export const species = pgTable(
  'species',
  {
    id: text('id').primaryKey(), // 'betta_splendens'
    nameKo: varchar('name_ko', { length: 40 }).notNull(),
    scientificName: varchar('scientific_name', { length: 80 }),
    regionId: text('region_id').notNull().references(() => regions.id),
    rarity: rarity('rarity').notNull(),
    /** 게임 오리지널 (특별 개체, 오리지널 전설급) */
    isOriginal: boolean('is_original').notNull().default(false),
    /** 특별 맵 전용 개체 */
    isSpecialMapOnly: boolean('is_special_map_only').notNull().default(false),
    /** 교배 가능 여부 (고대 전설급, 오리지널 = false) */
    breedable: boolean('breedable').notNull().default(true),
    /** 경매 가능 여부 */
    auctionable: boolean('auctionable').notNull().default(true),
    tempMin: real('temp_min').notNull(),
    tempMax: real('temp_max').notNull(),
    salinity: salinity('salinity').notNull(),
    maxSizeCm: real('max_size_cm').notNull(),
    /** 필요한 최소 수조 크기 등급 */
    minTankSize: smallint('min_tank_size').notNull().default(1),
    basePrice: integer('base_price').notNull(),
    /** 유전자 좌위 정의 (레이어 합성 규칙 포함) */
    geneLoci: jsonb('gene_loci').$type<LocusDef[]>().notNull().default([]),
    /** 서버 오픈 시 야생 개체수 */
    initialPopulation: integer('initial_population').notNull(),
    /** 자연 회복률 (로지스틱 성장 r, 1일 기준) */
    regenRatePerDay: real('regen_rate_per_day').notNull().default(0.02),
  },
  (t) => [
    index('species_region_idx').on(t.regionId),
    check('species_temp_range', sql`${t.tempMin} <= ${t.tempMax}`),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// 2. 공유 바다 (한정 개체수, 시세)
// ---------------------------------------------------------------------------
export const wildPopulations = pgTable(
  'wild_populations',
  {
    speciesId: text('species_id')
      .primaryKey()
      .references(() => species.id),
    /** 현재 포획 가능한 야생 개체수 */
    count: integer('count').notNull(),
    /** 숨은 개체: 멸종 상태에서 극저확률 '전설 목격'의 씨앗 */
    hiddenReserve: integer('hidden_reserve').notNull().default(0),
    /** 희귀어 입질로 예약된 개체수 (포획 성공 전까지 잡아둠) */
    reserved: integer('reserved').notNull().default(0),
    status: conservationStatus('status').notNull().default('stable'),
    /** 자연 회복을 마지막으로 반영한 시각 */
    lastRegenAt: ts('last_regen_at').notNull().defaultNow(),
    /** 낙관적 잠금용 */
    version: integer('version').notNull().default(0),
  },
  (t) => [
    check('wild_count_nonneg', sql`${t.count} >= 0`),
    check('wild_reserved_nonneg', sql`${t.reserved} >= 0`),
    check('wild_hidden_nonneg', sql`${t.hiddenReserve} >= 0`),
  ],
).enableRLS();

/** NPC 시장 시세 (희소성 + 최근 공급량으로 계산) */
export const marketPrices = pgTable('market_prices', {
  speciesId: text('species_id')
    .primaryKey()
    .references(() => species.id),
  currentPrice: integer('current_price').notNull(),
  /** 최근 판매량 지수 (시간에 따라 감쇠) */
  supplyIndex: real('supply_index').notNull().default(0),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}).enableRLS();

// ---------------------------------------------------------------------------
// 3. 플레이어 (계정, 재화, 제한)
// ---------------------------------------------------------------------------
export const players = pgTable(
  'players',
  {
    /** Supabase Auth 사용자 id와 동일 */
    id: uuid('id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    nickname: varchar('nickname', { length: 20 }).notNull().unique(),
    level: smallint('level').notNull().default(1),
    exp: integer('exp').notNull().default(0),
    gold: money('gold').notNull().default(0),
    premium: integer('premium').notNull().default(0),
    stamina: integer('stamina').notNull(),
    /** 스테미너 재생을 마지막으로 반영한 시각 */
    staminaUpdatedAt: ts('stamina_updated_at').notNull().defaultNow(),
    timeTickets: smallint('time_tickets').notNull().default(0),
    /** 무료 시간 티켓을 마지막으로 지급한 날짜 */
    ticketsGrantedOn: date('tickets_granted_on'),
    vipPoints: integer('vip_points').notNull().default(0),
    /** VIP 티어 0=아이언 … 9=챌린저 */
    vipTier: smallint('vip_tier').notNull().default(0),
    /** 허브 단계 1=동네 브리딩샵 … 4=공공 수족관 */
    shopStage: smallint('shop_stage').notNull().default(1),
    tutorialStep: smallint('tutorial_step').notNull().default(0),
    createdAt: createdAt(),
    lastSeenAt: ts('last_seen_at').notNull().defaultNow(),
  },
  (t) => [
    check('players_gold_nonneg', sql`${t.gold} >= 0`),
    check('players_premium_nonneg', sql`${t.premium} >= 0`),
    check('players_stamina_nonneg', sql`${t.stamina} >= 0`),
    check('players_tickets_nonneg', sql`${t.timeTickets} >= 0`),
  ],
).enableRLS();

/** 일일 제한 카운터 (광고 보상, 구매 상한, 고대 입장, 출석) */
export const dailyCounters = pgTable(
  'daily_counters',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    /** 서버 기준 날짜 (KST 자정 리셋 등은 Workers에서 계산) */
    day: date('day').notNull(),
    kind: dailyCounterKind('kind').notNull(),
    count: smallint('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.day, t.kind] })],
).enableRLS();

/** FCM 푸시 토큰 (모바일 전용) */
export const pushTokens = pgTable(
  'push_tokens',
  {
    token: text('token').primaryKey(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    platform: devicePlatform('platform').notNull(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [index('push_tokens_player_idx').on(t.playerId)],
).enableRLS();

/** 월정액 구독 상태 (RevenueCat, Stripe 공통) */
export const subscriptions = pgTable('subscriptions', {
  playerId: uuid('player_id')
    .primaryKey()
    .references(() => players.id, { onDelete: 'cascade' }),
  platform: paymentPlatform('platform').notNull(),
  productId: text('product_id').notNull(),
  activeUntil: ts('active_until').notNull(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}).enableRLS();

/** 결제 기록 (중복 지급 방지용: 같은 거래 id는 한 번만 처리) */
export const purchases = pgTable(
  'purchases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id),
    platform: paymentPlatform('platform').notNull(),
    transactionId: text('transaction_id').notNull(),
    productId: text('product_id').notNull(),
    premiumGranted: integer('premium_granted').notNull().default(0),
    vipPointsGranted: integer('vip_points_granted').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('purchases_tx_uidx').on(t.platform, t.transactionId),
    index('purchases_player_idx').on(t.playerId),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// 3-1. 낚시 장비 (찌, 미끼): 등급별로 획득·구매해 포획 확률을 올린다
// ---------------------------------------------------------------------------
export const items = pgTable('items', {
  id: text('id').primaryKey(), // 'float_rare', 'bait_worm_common'
  nameKo: varchar('name_ko', { length: 40 }).notNull(),
  kind: itemKind('kind').notNull(),
  grade: rarity('grade').notNull(),
  /** 성공 확률 보정 배율 (예: 0.10 = +10%). 정확한 공식은 서버 코드가 판정한다. */
  chanceBonus: real('chance_bonus').notNull().default(0),
  /** 미끼 전용: 특정 어종/지역 전용이면 지정, 없으면 범용 */
  targetSpeciesId: text('target_species_id').references(() => species.id),
  priceGold: money('price_gold'),
  pricePremium: integer('price_premium'),
  sortOrder: smallint('sort_order').notNull().default(0),
}).enableRLS();

/** 플레이어 보유 장비 수량 */
export const playerItems = pgTable(
  'player_items',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    itemId: text('item_id')
      .notNull()
      .references(() => items.id),
    count: integer('count').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.playerId, t.itemId] }),
    check('player_items_count_nonneg', sql`${t.count} >= 0`),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// 4. 원정 (헌터, 원정, 희귀어 입질, 특별 맵)
// ---------------------------------------------------------------------------
/** 헌터: 원정을 나가 자동으로 수확하는 캐릭터. 한 명은 동시에 원정 하나만 나갈 수 있다. */
export const hunters = pgTable(
  'hunters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 20 }).notNull(),
    level: smallint('level').notNull().default(1),
    skills: jsonb('skills').$type<HunterSkills>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('hunters_owner_idx').on(t.ownerId)],
).enableRLS();

export const expeditions = pgTable(
  'expeditions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    hunterId: uuid('hunter_id')
      .notNull()
      .references(() => hunters.id),
    regionId: text('region_id')
      .notNull()
      .references(() => regions.id),
    status: expeditionStatus('status').notNull().default('active'),
    startedAt: ts('started_at').notNull().defaultNow(),
    endsAt: ts('ends_at').notNull(),
    staminaCost: smallint('stamina_cost').notNull(),
    usedTimeTicket: boolean('used_time_ticket').notNull().default(false),
    /** 완료 시 서버가 확정한 일반 수확 (수령 전까지 보관) */
    result: jsonb('result').$type<ExpeditionResult>(),
    claimedAt: ts('claimed_at'),
  },
  (t) => [
    index('expeditions_player_status_idx').on(t.playerId, t.status),
    index('expeditions_active_ends_idx').on(t.endsAt).where(sql`${t.status} = 'active'`),
    // 헌터 한 명은 동시에 원정 하나만
    uniqueIndex('expeditions_one_active_per_hunter')
      .on(t.hunterId)
      .where(sql`${t.status} = 'active'`),
  ],
).enableRLS();

/**
 * 희귀어 입질: 입질이 생기는 순간 야생 개체 1마리를 reserved로 옮겨 잡아두고,
 * 성공하면 fish 생성, 실패·만료되면 바다로 돌려보낸다.
 */
export const rareBites = pgTable(
  'rare_bites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expeditionId: uuid('expedition_id')
      .notNull()
      .references(() => expeditions.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    speciesId: text('species_id')
      .notNull()
      .references(() => species.id),
    status: biteStatus('status').notNull().default('pending'),
    /** 제한 시간 (초기값 30분) */
    expiresAt: ts('expires_at').notNull(),
    /** 미니게임 난수 시드: 서버가 입력 기록을 재현·검증할 때 사용 */
    minigameSeed: integer('minigame_seed').notNull(),
    /** 사용한 장비 (시도 시점에 수량 차감) */
    floatId: text('float_id').references(() => items.id),
    baitId: text('bait_id').references(() => items.id),
    fishId: uuid('fish_id').references((): AnyPgColumn => fish.id),
    createdAt: createdAt(),
    resolvedAt: ts('resolved_at'),
  },
  (t) => [
    index('rare_bites_player_status_idx').on(t.playerId, t.status),
    index('rare_bites_pending_expires_idx')
      .on(t.expiresAt)
      .where(sql`${t.status} = 'pending'`),
  ],
).enableRLS();

/** 특별 맵 조우: 등장 시 포획 기회 5번 */
export const specialEncounters = pgTable(
  'special_encounters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    expeditionId: uuid('expedition_id').references(() => expeditions.id, {
      onDelete: 'set null',
    }),
    regionId: text('region_id')
      .notNull()
      .references(() => regions.id),
    speciesId: text('species_id')
      .notNull()
      .references(() => species.id),
    chancesLeft: smallint('chances_left').notNull().default(5),
    status: encounterStatus('status').notNull().default('active'),
    expiresAt: ts('expires_at').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index('special_encounters_player_idx').on(t.playerId, t.status),
    check('special_chances_range', sql`${t.chancesLeft} between 0 and 5`),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// 5. 양식장 (수조, 개체, 교배)
// ---------------------------------------------------------------------------
export const tanks = pgTable(
  'tanks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 20 }),
    purpose: tankPurpose('purpose').notNull(),
    salinity: salinity('salinity').notNull(),
    /** 수조 크기 등급 (대형어는 큰 수조 필요) */
    sizeClass: smallint('size_class').notNull().default(1),
    capacity: smallint('capacity').notNull(),
    /** 고대 어종용 특수 수조 */
    isAncient: boolean('is_ancient').notNull().default(false),
    temperature: real('temperature').notNull(),
    /** 수질 0~100, 시간에 따라 떨어지고 설비가 속도를 늦춤 */
    waterQuality: real('water_quality').notNull().default(100),
    qualityUpdatedAt: ts('quality_updated_at').notNull().defaultNow(),
    equipment: jsonb('equipment')
      .$type<TankEquipment>()
      .notNull()
      .default({ filter: 0, heater: 0, feeder: 0 }),
    /** 샵 안 배치 좌표 */
    posX: smallint('pos_x').notNull().default(0),
    posY: smallint('pos_y').notNull().default(0),
    skinId: text('skin_id'),
    createdAt: createdAt(),
  },
  (t) => [
    index('tanks_owner_idx').on(t.ownerId),
    check('tanks_quality_range', sql`${t.waterQuality} between 0 and 100`),
  ],
).enableRLS();

/** 개체 한 마리 (야생 포획, 양식, 오리지널 모두) */
export const fish = pgTable(
  'fish',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** 방류·판매·폐사 후에는 null 가능 */
    ownerId: uuid('owner_id').references(() => players.id, { onDelete: 'set null' }),
    speciesId: text('species_id')
      .notNull()
      .references(() => species.id),
    origin: fishOrigin('origin').notNull(),
    sex: sex('sex').notNull(),
    /** 0 = 야생 개체, 양식은 부모 세대 + 1 */
    generation: smallint('generation').notNull().default(0),
    genotype: jsonb('genotype').$type<Genotype>().notNull(),
    /** 표현형 정규화 키: 도감·세계 최초 모프 판정용 (예: 'color:blue|fin:halfmoon') */
    morphKey: text('morph_key').notNull(),
    sizeCm: real('size_cm').notNull(),
    /** 건강 0~100 (근친도가 높을수록 상한이 낮아짐) */
    health: real('health').notNull(),
    growthRate: real('growth_rate').notNull(),
    /** 근친 계수 0~1 (야생 = 0) */
    inbreeding: real('inbreeding').notNull().default(0),
    /** 성장도 0~1, 1이면 성체(교배 가능) */
    maturity: real('maturity').notNull().default(0),
    statsUpdatedAt: ts('stats_updated_at').notNull().defaultNow(),
    parentAId: uuid('parent_a_id').references((): AnyPgColumn => fish.id, {
      onDelete: 'set null',
    }),
    parentBId: uuid('parent_b_id').references((): AnyPgColumn => fish.id, {
      onDelete: 'set null',
    }),
    tankId: uuid('tank_id').references(() => tanks.id, { onDelete: 'set null' }),
    status: fishStatus('status').notNull().default('holding'),
    caughtRegionId: text('caught_region_id').references(() => regions.id),
    nickname: varchar('nickname', { length: 20 }),
    bornAt: ts('born_at').notNull().defaultNow(),
  },
  (t) => [
    index('fish_owner_status_idx').on(t.ownerId, t.status),
    index('fish_tank_idx').on(t.tankId),
    index('fish_species_morph_idx').on(t.speciesId, t.morphKey),
    check('fish_health_range', sql`${t.health} between 0 and 100`),
    check('fish_inbreeding_range', sql`${t.inbreeding} between 0 and 1`),
    check('fish_maturity_range', sql`${t.maturity} between 0 and 1`),
  ],
).enableRLS();

/** 교배: 부모 한 쌍을 교배실에 넣고 시간이 지나면 새끼가 태어남 */
export const breedings = pgTable(
  'breedings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    tankId: uuid('tank_id')
      .notNull()
      .references(() => tanks.id),
    parentAId: uuid('parent_a_id')
      .notNull()
      .references(() => fish.id),
    parentBId: uuid('parent_b_id')
      .notNull()
      .references(() => fish.id),
    status: breedingStatus('status').notNull().default('active'),
    startedAt: ts('started_at').notNull().defaultNow(),
    readyAt: ts('ready_at').notNull(),
    offspringCount: smallint('offspring_count'),
    resolvedAt: ts('resolved_at'),
  },
  (t) => [
    index('breedings_player_status_idx').on(t.playerId, t.status),
    check('breedings_distinct_parents', sql`${t.parentAId} <> ${t.parentBId}`),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// 6. 도감, 세계 최초 모프
// ---------------------------------------------------------------------------
export const dexEntries = pgTable(
  'dex_entries',
  {
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    speciesId: text('species_id')
      .notNull()
      .references(() => species.id),
    /** '' = 어종 자체 등록, 그 외 = 모프별 등록 */
    morphKey: text('morph_key').notNull().default(''),
    firstObtainedAt: ts('first_obtained_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.speciesId, t.morphKey] })],
).enableRLS();

/** 세계 최초 모프: (어종, 모프 키)마다 서버 전체에서 한 줄만 존재 */
export const morphDiscoveries = pgTable(
  'morph_discoveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    speciesId: text('species_id')
      .notNull()
      .references(() => species.id),
    morphKey: text('morph_key').notNull(),
    discovererId: uuid('discoverer_id').references(() => players.id, { onDelete: 'set null' }),
    fishId: uuid('fish_id').references(() => fish.id, { onDelete: 'set null' }),
    /** 발견자가 지은 이름 (명명 전에는 null) */
    name: varchar('name', { length: 30 }),
    discoveredAt: ts('discovered_at').notNull().defaultNow(),
    namedAt: ts('named_at'),
  },
  (t) => [uniqueIndex('morph_discoveries_uidx').on(t.speciesId, t.morphKey)],
).enableRLS();

// ---------------------------------------------------------------------------
// 7. 경매장
// ---------------------------------------------------------------------------
export const auctions = pgTable(
  'auctions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => players.id),
    fishId: uuid('fish_id')
      .notNull()
      .references(() => fish.id),
    startPrice: money('start_price').notNull(),
    buyoutPrice: money('buyout_price'),
    currentBid: money('current_bid'),
    currentBidderId: uuid('current_bidder_id').references(() => players.id),
    /** 거래 수수료율 (VIP 할인 반영 후 값) */
    feeRate: real('fee_rate').notNull(),
    status: auctionStatus('status').notNull().default('active'),
    endsAt: ts('ends_at').notNull(),
    createdAt: createdAt(),
    closedAt: ts('closed_at'),
    version: integer('version').notNull().default(0),
  },
  (t) => [
    index('auctions_active_ends_idx').on(t.endsAt).where(sql`${t.status} = 'active'`),
    index('auctions_seller_idx').on(t.sellerId),
    // 한 개체는 동시에 경매 하나만
    uniqueIndex('auctions_one_active_per_fish')
      .on(t.fishId)
      .where(sql`${t.status} = 'active'`),
    check(
      'auctions_buyout_gte_start',
      sql`${t.buyoutPrice} is null or ${t.buyoutPrice} >= ${t.startPrice}`,
    ),
  ],
).enableRLS();

export const auctionBids = pgTable(
  'auction_bids',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    auctionId: uuid('auction_id')
      .notNull()
      .references(() => auctions.id, { onDelete: 'cascade' }),
    bidderId: uuid('bidder_id')
      .notNull()
      .references(() => players.id),
    amount: money('amount').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('auction_bids_auction_idx').on(t.auctionId, t.amount)],
).enableRLS();

// ---------------------------------------------------------------------------
// 8. 소셜 (친구, 길드, 수족관 평가)
// ---------------------------------------------------------------------------
export const friendships = pgTable(
  'friendships',
  {
    requesterId: uuid('requester_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    addresseeId: uuid('addressee_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    status: friendStatus('status').notNull().default('pending'),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.requesterId, t.addresseeId] }),
    index('friendships_addressee_idx').on(t.addresseeId),
    check('friendships_not_self', sql`${t.requesterId} <> ${t.addresseeId}`),
  ],
).enableRLS();

export const guilds = pgTable('guilds', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 20 }).notNull().unique(),
  leaderId: uuid('leader_id').references(() => players.id, { onDelete: 'set null' }),
  level: smallint('level').notNull().default(1),
  memberLimit: smallint('member_limit').notNull().default(20),
  notice: varchar('notice', { length: 200 }),
  createdAt: createdAt(),
}).enableRLS();

export const guildMembers = pgTable(
  'guild_members',
  {
    /** 플레이어는 길드 하나에만 가입 */
    playerId: uuid('player_id')
      .primaryKey()
      .references(() => players.id, { onDelete: 'cascade' }),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    role: guildRole('role').notNull().default('member'),
    contribution: integer('contribution').notNull().default(0),
    joinedAt: ts('joined_at').notNull().defaultNow(),
  },
  (t) => [index('guild_members_guild_idx').on(t.guildId)],
).enableRLS();

/** 길드 퀘스트: 위기종 복원 목표를 길드원이 함께 달성 */
export const guildQuests = pgTable(
  'guild_quests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guildId: uuid('guild_id')
      .notNull()
      .references(() => guilds.id, { onDelete: 'cascade' }),
    speciesId: text('species_id')
      .notNull()
      .references(() => species.id),
    targetCount: integer('target_count').notNull(),
    progress: integer('progress').notNull().default(0),
    status: progressStatus('status').notNull().default('active'),
    reward: jsonb('reward').$type<Reward>().notNull(),
    startsAt: ts('starts_at').notNull().defaultNow(),
    endsAt: ts('ends_at').notNull(),
  },
  (t) => [index('guild_quests_guild_status_idx').on(t.guildId, t.status)],
).enableRLS();

export const guildQuestContributions = pgTable(
  'guild_quest_contributions',
  {
    questId: uuid('quest_id')
      .notNull()
      .references(() => guildQuests.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.questId, t.playerId] })],
).enableRLS();

/** 수족관 방문 평가 (시즌 랭킹) */
export const aquariumRatings = pgTable(
  'aquarium_ratings',
  {
    season: smallint('season').notNull(),
    visitorId: uuid('visitor_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    score: smallint('score').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.season, t.visitorId, t.ownerId] }),
    index('aquarium_ratings_owner_idx').on(t.season, t.ownerId),
    check('aquarium_ratings_score_range', sql`${t.score} between 1 and 5`),
    check('aquarium_ratings_not_self', sql`${t.visitorId} <> ${t.ownerId}`),
  ],
).enableRLS();

// ---------------------------------------------------------------------------
// 9. 서버 협력 복원 작전
// ---------------------------------------------------------------------------
export const restorationEvents = pgTable(
  'restoration_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 60 }).notNull(),
    /** 대상 어종 (환경 재앙처럼 특정 어종이 없으면 null) */
    speciesId: text('species_id').references(() => species.id),
    targetCount: integer('target_count').notNull(),
    progress: integer('progress').notNull().default(0),
    status: progressStatus('status').notNull().default('active'),
    reward: jsonb('reward').$type<Reward>().notNull(),
    startsAt: ts('starts_at').notNull(),
    endsAt: ts('ends_at').notNull(),
  },
  (t) => [index('restoration_events_status_idx').on(t.status)],
).enableRLS();

export const restorationContributions = pgTable(
  'restoration_contributions',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => restorationEvents.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.playerId] }),
    index('restoration_contrib_rank_idx').on(t.eventId, t.amount),
  ],
).enableRLS();
