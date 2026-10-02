import type { PlayerChannel } from './realtime/player-channel';

/** Workers 바인딩과 환경 변수 (docs/setup-supabase.md) */
export interface Env {
  ENVIRONMENT: string;
  PLAYER_CHANNEL: DurableObjectNamespace<PlayerChannel>;
  /** 메인 DB (Supabase). 배포: Hyperdrive, 로컬: DATABASE_URL */
  HYPERDRIVE?: Hyperdrive;
  DATABASE_URL?: string;
  /** Supabase 프로젝트 주소. JWKS(비대칭 서명 키)로 토큰을 검증할 때 쓴다 */
  SUPABASE_URL?: string;
  /** 예전 방식(HS256 공유 비밀) 프로젝트일 때만 */
  SUPABASE_JWT_SECRET?: string;
  /** 로그 DB (Neon) */
  NEON_LOG_DB_URL?: string;
  /** CORS 허용 출처 (쉼표 구분). 비우면 개발용으로 모두 허용 */
  ALLOWED_ORIGINS?: string;
}
