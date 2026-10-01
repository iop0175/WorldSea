/**
 * 월드씨 - 로그 DB 스키마 (Neon PostgreSQL)
 *
 * 원칙
 * - 쌓이기만 하는 기록 전용. 메인 DB와 트랜잭션으로 묶지 않고 Workers가 비동기로 쓴다
 *   (ctx.waitUntil 로 응답 후 기록).
 * - 메인 DB와 외래 키를 걸지 않는다 (다른 DB이므로). id는 값으로만 보관한다.
 * - 작업장 탐지, 시세 분석, 고객 문의 대응, 밸런싱 분석에 쓴다.
 */
import { bigserial, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const catchSource = pgEnum('catch_source', [
  'expedition', // 원정 일반 수확
  'rare_bite', // 희귀어 손맛
  'special_map', // 특별 맵
  'legend_sighting', // 숨은 개체 '전설 목격'
]);
export const tradeKind = pgEnum('trade_kind', ['npc_sale', 'auction_sale', 'auction_buyout']);
export const currencyKind = pgEnum('currency_kind', [
  'gold',
  'premium',
  'stamina',
  'time_ticket',
  'vip_points',
]);
export const populationReason = pgEnum('population_reason', [
  'catch',
  'bite_reserve',
  'bite_return',
  'release',
  'regen',
  'event',
  'admin',
]);

/** 포획 기록 */
export const catchLogs = pgTable(
  'catch_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    playerId: uuid('player_id').notNull(),
    speciesId: text('species_id').notNull(),
    fishId: uuid('fish_id'),
    regionId: text('region_id').notNull(),
    source: catchSource('source').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index('catch_logs_player_time_idx').on(t.playerId, t.createdAt),
    index('catch_logs_species_time_idx').on(t.speciesId, t.createdAt),
  ],
);

/** 거래 기록 (NPC 판매, 경매) */
export const tradeLogs = pgTable(
  'trade_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    kind: tradeKind('kind').notNull(),
    sellerId: uuid('seller_id').notNull(),
    buyerId: uuid('buyer_id'),
    fishId: uuid('fish_id').notNull(),
    speciesId: text('species_id').notNull(),
    morphKey: text('morph_key'),
    price: integer('price').notNull(),
    fee: integer('fee').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index('trade_logs_seller_time_idx').on(t.sellerId, t.createdAt),
    index('trade_logs_buyer_time_idx').on(t.buyerId, t.createdAt),
    index('trade_logs_species_time_idx').on(t.speciesId, t.createdAt),
  ],
);

/** 재화 변동 기록 (고객 문의 대응, 부정 획득 추적) */
export const currencyLogs = pgTable(
  'currency_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    playerId: uuid('player_id').notNull(),
    currency: currencyKind('currency').notNull(),
    delta: integer('delta').notNull(),
    balanceAfter: integer('balance_after').notNull(),
    /** 'expedition_claim', 'npc_sale', 'ad_reward', 'purchase', 'buy_stamina' 등 */
    reason: text('reason').notNull(),
    /** 관련 엔티티 id (원정, 경매, 결제 등) */
    refId: text('ref_id'),
    createdAt: createdAt(),
  },
  (t) => [index('currency_logs_player_time_idx').on(t.playerId, t.createdAt)],
);

/** 야생 개체수 변동 기록 (보전 상태 추이, 남획 분석) */
export const populationLogs = pgTable(
  'population_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    speciesId: text('species_id').notNull(),
    delta: integer('delta').notNull(),
    countAfter: integer('count_after').notNull(),
    reason: populationReason('reason').notNull(),
    actorId: uuid('actor_id'),
    createdAt: createdAt(),
  },
  (t) => [index('population_logs_species_time_idx').on(t.speciesId, t.createdAt)],
);

/** 그 밖의 행동 기록 (로그인, 튜토리얼 진행, 미니게임 입력 요약 등) */
export const actionLogs = pgTable(
  'action_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    playerId: uuid('player_id').notNull(),
    action: text('action').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index('action_logs_player_time_idx').on(t.playerId, t.createdAt)],
);
