/**
 * Workers API 계약 (클라이언트·서버 공용). docs/api.md 와 같이 고친다.
 * 요청 본문은 zod 스키마로 검증하고, 응답은 아래 타입을 따른다.
 */
import { z } from 'zod';
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
