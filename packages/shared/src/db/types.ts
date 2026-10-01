/**
 * 월드씨 - DB jsonb 컬럼에 들어가는 공용 타입
 * 클라이언트, Workers, DB 스키마가 모두 이 타입을 공유한다.
 */

/** 유전자 우열 관계 */
export type Dominance = 'dominant' | 'recessive' | 'codominant';

/** 유전자가 담당하는 그림 레이어 */
export type GeneLayer = 'body' | 'pattern' | 'fin' | 'scale' | 'form';

/** 대립유전자 정의 (예: 베타 지느러미 유전자의 '하프문') */
export interface AlleleDef {
  id: string; // 'halfmoon'
  nameKo: string; // '하프문'
  dominance: Dominance;
  /** 레이어 합성용 에셋 키 (팔레트 id, 무늬 스프라이트 id 등) */
  assetKey: string;
}

/** 유전자 좌위 정의 (어종마다 여러 개) */
export interface LocusDef {
  id: string; // 'fin'
  nameKo: string; // '지느러미'
  layer: GeneLayer;
  wildTypeAlleleId: string; // 야생형 대립유전자
  alleles: AlleleDef[];
}

/** 개체의 유전자형: 좌위 id -> 대립유전자 2개 (부, 모) */
export type Genotype = Record<string, [string, string]>;

/** 수조 설비 레벨 */
export interface TankEquipment {
  filter: number; // 여과기
  heater: number; // 히터
  feeder: number; // 사료 자동급여기
}

/** 헌터 스킬 */
export interface HunterSkills {
  speed: number; // 기동: 원정 시간 단축
  detection: number; // 탐지: 희귀어 입질 확률
  angling: number; // 손맛 보조: 미니게임 난이도 완화
  haul: number; // 운반: 원정 한 번에 가져오는 수확량
}

/** 반복 사냥 옵션 */
export interface HuntOptions {
  /**
   * 스태미너가 부족할 때:
   * none = 반복 중단, wait_regen = 자연 회복을 기다렸다가 이어서,
   * premium = 프리미엄 재화로 자동 구매 (premiumCap 한도 안에서만, 일일 구매 제한도 적용)
   */
  recovery: 'none' | 'wait_regen' | 'premium';
  /** recovery = premium일 때 이번 반복에서 쓸 프리미엄 상한 (필수) */
  premiumCap?: number;
  /** 사용할 찌/미끼. 다 떨어지면 장비 없이 계속할지 */
  floatId?: string;
  baitId?: string;
  continueWithoutGear?: boolean;
  /** 이 반복에만 적용할 미니게임 자동 설정 (없으면 players의 기본 설정) */
  autoMinigame?: boolean;
  highGradeBiteMode?: 'auto' | 'notify';
}

/** 원정 일반 수확 결과 (수령 전까지 보관) */
export interface ExpeditionResult {
  catches: { speciesId: string; count: number }[];
  gold: number;
  premium?: number;
  exp: number;
  /** 획득한 찌, 미끼, 성장 아이템 */
  items?: { id: string; count: number }[];
  /** 꽝으로 끝난 횟수 */
  misses?: number;
}

/** 퀘스트·이벤트 보상 */
export interface Reward {
  gold?: number;
  premium?: number;
  exp?: number;
  timeTickets?: number;
  items?: { id: string; count: number }[];
}
