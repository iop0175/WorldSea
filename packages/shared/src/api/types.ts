/**
 * Workers API 계약 (클라이언트·서버 공용). docs/api.md 와 같이 고친다.
 * 요청 본문은 zod 스키마로 검증하고, 응답은 아래 타입을 따른다.
 */
import { z } from 'zod';
import type { Rarity } from '../game/constants';
import type { ExpeditionClaimResult, ExpeditionResult, HuntOptions } from '../db/types';

export interface HealthResponse {
  ok: true;
  service: 'worldsea-server';
  time: string;
}

/** 오류 응답 공통 형식 */
export type ApiErrorCode =
  | 'unauthorized' // 토큰 없음/만료/위조
  | 'needs_signup' // 로그인은 됐지만 플레이어(닉네임)가 없음
  | 'already_registered'
  | 'nickname_taken'
  | 'invalid_request'
  | 'not_found'
  | 'hunter_busy'
  | 'hunter_slot_locked'
  | 'region_locked'
  | 'repeat_limit'
  | 'insufficient_stamina'
  | 'insufficient_time_tickets'
  | 'idempotency_conflict'
  | 'bite_closed' // 이미 끝났거나 만료된 입질
  | 'encounter_closed' // 이미 끝났거나 24시간이 지난 특별 맵
  | 'insufficient_items' // 선택한 찌·미끼가 없거나 이 어종에 쓸 수 없음
  | 'internal';

export interface ApiError {
  error: { code: ApiErrorCode; message: string };
}

/** 닉네임: 2~12자, 한글·영문·숫자 */
export const NICKNAME_RE = /^[가-힣A-Za-z0-9]{2,12}$/;

export const createPlayerBody = z.object({
  nickname: z.string().trim().regex(NICKNAME_RE, '닉네임은 2~12자의 한글, 영문, 숫자만 쓸 수 있습니다'),
});
export type CreatePlayerBody = z.infer<typeof createPlayerBody>;

export const huntOptionsBody = z.strictObject({
  recovery: z.enum(['none', 'wait_regen', 'premium']).default('none'),
  premiumCap: z.number().int().min(0).max(2147483647).optional(),
  floatId: z.string().min(1).max(100).optional(),
  baitId: z.string().min(1).max(100).optional(),
  continueWithoutGear: z.boolean().optional(),
  autoMinigame: z.boolean().optional(),
  highGradeBiteMode: z.enum(['auto', 'pause']).optional(),
}).refine((options) => options.recovery !== 'premium' || options.premiumCap !== undefined, {
  message: '프리미엄 자동 회복에는 이번 반복의 사용 상한이 필요합니다', path: ['premiumCap'],
});

export const startExpeditionBody = z.strictObject({
  hunterId: z.uuid(),
  regionId: z.string().min(1).max(100),
  repeatTotal: z.number().int().min(1).max(200).default(1),
  options: huntOptionsBody.default({ recovery: 'none' }),
});
export type StartExpeditionBody = z.infer<typeof startExpeditionBody>;
export const idempotencyKey = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/, '요청 키는 영문·숫자·밑줄·하이픈 1~128자여야 합니다');

export interface StartExpeditionResponse {
  serverTime: string;
  expedition: {
    id: string;
    hunterId: string;
    regionId: string;
    startedAt: string;
    /** 첫 회차 종료 시각 */
    endsAt: string;
    repeatTotal: number;
    options: HuntOptions;
    staminaCost: number;
    usedTimeTicket: boolean;
  };
}

/** 잡을 수 없어 놓아준 사유 (94번). protected=보호종·멸종, daily_limit=오늘 한도 소진, depleted=야생 0마리 */
export type ReleaseReason = 'protected' | 'daily_limit' | 'depleted';

/** 입질 시도: 직접(position 0=가운데~1=가장자리) 또는 auto. attemptNo는 이번이 몇 번째 시도인지(재전송 구분용) */
export const biteAttemptBody = z.strictObject({
  attemptNo: z.number().int().min(1).max(10),
  position: z.number().min(0).max(1).optional(),
  auto: z.boolean().optional(),
  floatId: z.string().min(1).max(100).optional(),
  baitId: z.string().min(1).max(100).optional(),
}).refine((body) => body.auto ? body.position === undefined : body.position !== undefined, {
  message: '직접 시도에는 position이, 자동 시도에는 auto만 보내야 합니다', path: ['position'],
});
export type BiteAttemptBody = z.infer<typeof biteAttemptBody>;

export interface BiteView {
  id: string;
  expeditionId: string;
  speciesId: string;
  rarity: Rarity;
  expiresAt: string;
  attemptsUsed: number;
  attemptsMax: number;
  /** 높은 등급 정지 입질 */
  paused: boolean;
  /** 이번 시도의 장비 없는 위치별 성공 확률. chances[i]는 position i/(길이-1) */
  chances: number[];
  autoChance: number;
  /** 쓸 수 있는 찌·미끼. chanceBonus는 확률(0~1)에 그대로 더해지고 최대 확률에서 잘린다 */
  gear: { id: string; kind: 'float' | 'bait'; count: number; chanceBonus: number }[];
}

export interface BitesResponse {
  serverTime: string;
  bites: BiteView[];
}

export interface BiteAttemptResponse {
  serverTime: string;
  attempt: { attemptNo: number; success: boolean; chance: number; gearConsumed: boolean; releaseReason: ReleaseReason | null };
  bite: {
    id: string;
    status: 'pending' | 'caught' | 'escaped';
    attemptsUsed: number;
    attemptsMax: number;
    /** 포획 성공 시 수령 대기 개체 id */
    fishId: string | null;
    /** 계속 시도할 수 있을 때 다음 시도의 위치별 확률(장비 없음) */
    chances: number[] | null;
  };
}

/** 특별 맵 시도: 직접 시도만 있다(자동 없음). attemptNo는 이번이 몇 번째 기회인지 */
export const encounterAttemptBody = z.strictObject({
  attemptNo: z.number().int().min(1).max(10),
  position: z.number().min(0).max(1),
  floatId: z.string().min(1).max(100).optional(),
  baitId: z.string().min(1).max(100).optional(),
});
export type EncounterAttemptBody = z.infer<typeof encounterAttemptBody>;

export interface EncounterView {
  id: string;
  regionId: string;
  /** 서버에서 누군가 처음 잡기 전에는 null("??? (특별 맵)") */
  speciesId: string | null;
  rarity: Rarity;
  expiresAt: string;
  chancesLeft: number;
  chancesMax: number;
  /** 이번 기회의 장비 없는 위치별 성공 확률. BiteView.chances와 같은 규칙 */
  chances: number[];
  gear: BiteView['gear'];
}

export interface EncountersResponse {
  serverTime: string;
  encounters: EncounterView[];
}

export interface EncounterAttemptResponse {
  serverTime: string;
  attempt: { attemptNo: number; success: boolean; chance: number; gearConsumed: boolean; releaseReason: ReleaseReason | null };
  encounter: {
    id: string;
    status: 'active' | 'finished';
    chancesLeft: number;
    /** 포획 성공 시 새 개체 id(바로 소유). 이때 어종이 공개된다 */
    fishId: string | null;
    speciesId: string | null;
    chances: number[] | null;
  };
}

export interface HunterView {
  id: string;
  name: string;
  skinId: string;
  /** 진행 중인 원정이 있으면 그 요약 (수색 기능에서 채움) */
  expedition: null | {
    id: string;
    regionId: string;
    status: 'active' | 'completed';
    repeatDone: number;
    repeatTotal: number;
    endsAt: string;
    waitingForStamina?: boolean;
    stopReason?: string | null;
  };
}

export interface ExpeditionsResponse {
  serverTime: string;
  expeditions: {
    id: string;
    hunterId: string;
    regionId: string;
    status: 'active' | 'completed';
    repeatDone: number;
    repeatTotal: number;
    endsAt: string;
    waitingForStamina: boolean;
    stopReason: string | null;
    premiumSpent: number;
    result: ExpeditionResult | null;
    claimable: boolean;
    pendingBites: number;
  }[];
}

export interface ClaimExpeditionsResponse {
  serverTime: string;
  claimed: ExpeditionClaimResult;
  /** 같은 대상에 아직 수령할 배치가 남았는지 */
  hasMore: boolean;
}

/** 내 상태. 시간에 따라 변하는 값(스태미너)은 서버가 요청 시점에 계산해 준다 */
export interface MeResponse {
  serverTime: string;
  player: {
    id: string;
    nickname: string;
    level: number;
    exp: number;
    gold: number;
    premium: number;
    stamina: number;
    staminaMax: number;
    /** 다음 1 회복까지 남은 초 (가득 차 있으면 null) */
    staminaNextSec: number | null;
    timeTickets: number;
    vipTier: number;
    shopStage: number;
    tutorialStep: number;
  };
  hunters: HunterView[];
  /** 헌터 슬롯 수 (레벨·구독·VIP로 계산) */
  hunterSlots: number;
}

export type RegionKind = 'freshwater' | 'sea' | 'ancient';

/** 지역 목록에 표시하는 서버 계산 값. 해금 여부는 플레이어 진행도에 따라 달라진다. */
export interface RegionView {
  id: string;
  nameKo: string;
  kind: RegionKind;
  unlockStage: number;
  requiredLevel: number;
  requiresTimeTicket: boolean;
  specialMapChance: number;
  huntSeconds: number;
  huntStaminaCost: number;
  unlocked: boolean;
}

export interface RegionSpeciesView {
  /**
   * false면 실루엣("???"): id는 자리 표시용(unknown_N), 이름·학명·개체수 비율은 비공개.
   * 오리지널 전설급은 항상 실루엣(65번), 특별 개체는 서버에서 누군가 처음 잡기 전까지 실루엣(66번).
   */
  revealed: boolean;
  id: string;
  nameKo: string;
  scientificName: string | null;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isOriginal: boolean;
  isSpecialMapOnly: boolean;
  breedable: boolean;
  auctionable: boolean;
  /** 야생 개체수: 정확한 수는 공개하지 않고 초기 대비 비율(%)과 보전 상태만 */
  conservation: null | {
    percent: number;
    status: 'stable' | 'vulnerable' | 'protected' | 'extinct_wild';
  };
}

export interface RegionsResponse {
  serverTime: string;
  regions: RegionView[];
}

export interface RegionDetailResponse {
  serverTime: string;
  region: RegionView;
  species: RegionSpeciesView[];
}
