import { defineConfig } from 'drizzle-kit';

// 메인 DB (Supabase). 마이그레이션은 Supabase direct 연결 문자열로 실행한다.
export default defineConfig({
  dialect: 'postgresql',
  schema: './packages/shared/src/db/main.schema.ts',
  out: './migrations/main',
  schemaFilter: ['public'],
  entities: { roles: { provider: 'supabase' } },
  dbCredentials: { url: process.env.SUPABASE_DB_URL ?? '' },
  strict: true,
});
