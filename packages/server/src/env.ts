import type { PlayerChannel } from './realtime/player-channel';

/** Workers 바인딩과 환경 변수 */
export interface Env {
  ENVIRONMENT: string;
  PLAYER_CHANNEL: DurableObjectNamespace<PlayerChannel>;
  /** Hyperdrive 설정 후 사용 (메인 DB) */
  HYPERDRIVE?: Hyperdrive;
  /** Supabase Auth JWT 검증 키 */
  SUPABASE_JWT_SECRET?: string;
  /** 로그 DB (Neon) */
  NEON_LOG_DB_URL?: string;
}
