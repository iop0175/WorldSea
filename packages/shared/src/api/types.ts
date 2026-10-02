/**
 * Workers API 계약 (클라이언트·서버 공용). docs/api.md 와 같이 고친다.
 * 요청 본문은 zod 스키마로 검증하고, 응답은 아래 타입을 따른다.
 */
import { z } from 'zod';

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
  };
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
