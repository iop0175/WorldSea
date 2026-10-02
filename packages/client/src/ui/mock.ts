/**
 * 화면 확인용 임시 데이터. API 연결 전까지만 쓴다.
 * 실제 재화·스태미너·헌터 상태는 반드시 서버 응답으로 채운다 (클라이언트에서 계산해 쓰지 않음).
 */
export const MOCK_PLAYER = {
  nickname: '대장',
  level: 12,
  expRatio: 0.64,
  premium: 330,
  gold: 12450,
  stamina: 32,
  staminaMax: 60,
  staminaNext: '04:12' as string | null,
  timeTickets: 3,
  unread: 3,
  shopStageName: '1단계 동네 샵',
  shopStageProgress: 0.62,
};

export type HunterCard =
  | { kind: 'hunting'; region: string; regionId: string; done: number; total: number; remain: string }
  | { kind: 'complete'; region: string }
  | { kind: 'idle'; name: string }
  | { kind: 'locked'; condition: string };

export const MOCK_HUNTERS: HunterCard[] = [
  { kind: 'hunting', region: '아시아 민물', regionId: 'asia_fresh', done: 37, total: 100, remain: '02:41' },
  { kind: 'complete', region: '중미 민물' },
  { kind: 'locked', condition: 'LV.10 해금' },
  { kind: 'locked', condition: '구독 해금' },
];

export const MOCK_BADGES: Partial<Record<string, string>> = { expedition: '1', attend: '1' };

/** 지역 이름 (지역 목록 API가 생기기 전까지 임시) */
export const REGION_NAME_KO: Record<string, string> = {
  asia_fresh: '아시아 민물',
  central_america_fresh: '중미 민물',
};
