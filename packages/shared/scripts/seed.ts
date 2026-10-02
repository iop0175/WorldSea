/**
 * 지역·어종 시드를 메인 DB에 넣는다.  pnpm db:seed  (SUPABASE_DB_URL 필요, direct 연결 문자열)
 * - 지역·어종 정적 필드는 갱신, 야생 개체수는 없는 어종에만 넣는다 (운영 중 개체수 초기화 없음).
 * - --dry 를 붙이면 SQL만 출력한다.
 */
import postgres from 'postgres';
import { buildSeedSql } from '../src/seed/build';

const sqlText = buildSeedSql();
if (process.argv.includes('--dry')) {
  console.log(sqlText);
  process.exit(0);
}
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('SUPABASE_DB_URL 환경 변수가 없습니다 (Supabase direct 연결 문자열)');
  process.exit(1);
}
const db = postgres(url, { max: 1, prepare: false });
try {
  await db.begin(async (tx) => {
    await tx.unsafe(sqlText);
  });
  const [r] = await db`select (select count(*) from regions) as regions, (select count(*) from species) as species, (select count(*) from wild_populations) as wild`;
  console.log('시드 완료:', r);
} finally {
  await db.end();
}
