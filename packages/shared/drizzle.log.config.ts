import { defineConfig } from 'drizzle-kit';

// 로그 DB (Neon)
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/log.schema.ts',
  out: './migrations/log',
  dbCredentials: { url: process.env.NEON_LOG_DB_URL ?? '' },
  strict: true,
});
