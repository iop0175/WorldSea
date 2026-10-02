import { drizzle } from 'drizzle-orm/postgres-js';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import * as schema from '@worldsea/shared/db/main';
import type { Env } from './env';

export type Schema = typeof schema;
/** postgres-js(운영)와 PGlite(테스트) 모두 받을 수 있는 공통 타입 */
export type Db = PgDatabase<PgQueryResultHKT, Schema>;

/**
 * 요청마다 연결을 만든다. Hyperdrive가 실제 연결을 풀링하므로 Workers에서는 이 방식이 권장된다.
 * 응답 후 ctx.waitUntil(close()) 로 닫는다.
 */
export function connectDb(env: Env): { db: Db; close: () => Promise<void> } {
  const url = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;
  if (!url) throw new Error('DB 연결 정보가 없습니다 (HYPERDRIVE 또는 DATABASE_URL)');
  const sql = postgres(url, { max: 5, fetch_types: false, prepare: true });
  const db = drizzle(sql, { schema }) as unknown as Db;
  return { db, close: () => sql.end({ timeout: 5 }) };
}
