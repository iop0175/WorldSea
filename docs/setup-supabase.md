# Supabase 연결 설정

로그인(Supabase Auth)과 메인 DB(Supabase PostgreSQL)를 연결하는 순서. 설정 전에는 클라이언트가 **미리보기 모드**(예시 데이터)로 실행된다.

## 1. 프로젝트 만들기
1. https://supabase.com 에서 새 프로젝트 생성. 지역은 **Northeast Asia (Seoul)** 권장.
2. DB 비밀번호를 안전한 곳에 적어 둔다.

## 2. 값 확인 (Project Settings)
| 값 | 위치 | 쓰는 곳 |
|---|---|---|
| Project URL (`https://xxxx.supabase.co`) | API | 클라이언트 `VITE_SUPABASE_URL`, 서버 `SUPABASE_URL` |
| Publishable key (`sb_publishable_...`, 예전 이름 anon key) | API Keys | 클라이언트 `VITE_SUPABASE_PUBLISHABLE_KEY` |
| DB 연결 문자열 (Session pooler) | Database → Connection string | 마이그레이션 `SUPABASE_DB_URL`, 서버 로컬 `DATABASE_URL`, 배포 Hyperdrive |
| JWT secret (예전 프로젝트만) | JWT Keys → Legacy | 서버 `SUPABASE_JWT_SECRET` (새 프로젝트는 불필요, JWKS 자동) |

- **secret/service_role 키는 클라이언트에 절대 넣지 않는다.** 이 프로젝트 서버는 service 키가 필요 없다 (DB 연결 문자열로 직접 접속).

## 3. 로그인 방식 켜기 (Authentication → Sign In / Providers)
- Email: 켜기 (개발용 매직 링크)
- Google: Google Cloud에서 OAuth 클라이언트를 만들어 Client ID/Secret 입력
- Apple: iOS 출시 시 필수 (Apple Developer에서 Services ID, 키 발급)
- URL Configuration → Redirect URLs에 `http://localhost:5173` 추가 (배포 주소도 나중에 추가)

## 4. DB 마이그레이션
```
SUPABASE_DB_URL="postgres://...(Session pooler 주소)" pnpm --filter @worldsea/shared db:migrate:main
```
- 테이블 32개, 안전장치 트리거, 기본 헌터 외형이 만들어진다. 모든 테이블은 RLS가 켜져 있고 정책이 없어 클라이언트 키로는 읽기·쓰기가 막힌다 (의도된 설계).
- 이미 적용한 DB에서 다시 실행하면 새 마이그레이션(예: `0002_species_iucn`)만 적용된다. SQL Editor로 직접 넣었다면 새 파일 내용만 SQL Editor에서 실행한다.
- 수색 시작 API를 사용하기 전에 `0009_expedition_start_key.sql`까지 적용한다. 이 파일은 `expeditions.start_request_key`와 플레이어별 요청 키 유니크 인덱스를 추가해 재시도 시 중복 차감을 막는다.

## 4-1. 지역·어종 시드
```
SUPABASE_DB_URL="postgres://...(Session pooler 주소)" pnpm db:seed
```
- 지역 12개, 어종 120종, 어종별 야생 개체수가 들어간다 (수치 근거: `docs/species-population.md`).
- 여러 번 실행해도 된다. 지역·어종 정보는 최신 값으로 갱신되고, 야생 개체수는 이미 있으면 건드리지 않는다.
- `pnpm db:seed --dry` 는 DB에 넣지 않고 SQL만 출력한다 (SQL Editor에 붙여 넣어도 된다).

## 5. 로컬 실행
서버 `packages/server/.dev.vars` (`.dev.vars.example` 복사, 커밋 금지):
```
DATABASE_URL=postgres://...(Session pooler 주소)
SUPABASE_URL=https://xxxx.supabase.co
```
클라이언트 `packages/client/.env.local` (`.env.example` 복사):
```
VITE_API_URL=http://localhost:8787
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```
```
pnpm dev:server   # http://localhost:8787
pnpm dev:client   # http://localhost:5173 → 로그인 → 닉네임 → 메인
```

## 5-1. Supabase 없이 원정 화면 테스트
```
pnpm dev:smoke
```
- http://127.0.0.1:8790/__smoke/login 에서 임시 계정으로 진입한다. 프론트는 5174, 테스트 API는 8790을 쓴다.
- 실제 마이그레이션을 적용한 메모리 PGlite DB와 임시 JWT 서명 키를 쓴다. 운영 DB·실제 계정·프론트 환경 파일을 바꾸지 않는다.
- 원정 탭에서 지역·헌터·반복 횟수를 고르고 수색을 시작하면 서버 응답으로 헌터와 스태미너가 갱신된다. 1레벨 계정이므로 반복 200회와 고대 지역 입장은 제한된다.
- Ctrl+C로 종료하면 임시 데이터가 사라진다. 다시 실행하면 초기 상태로 돌아간다. 테스트 토큰은 1시간 유효하다.
- 현재 수색 시작만 구현되어 회차 진행·수령은 동작하지 않는다. 스태미너 부족 시 회복 정책은 옵션으로 저장한다.

## 6. 배포 (나중에)
- `npx wrangler hyperdrive create worldsea-main --connection-string="postgres://..."` → 나온 id를 `wrangler.jsonc`의 hyperdrive에 넣고 주석 해제
- `npx wrangler secret put SUPABASE_URL` (예전 프로젝트면 `SUPABASE_JWT_SECRET`도)
- `ALLOWED_ORIGINS`에 웹 주소 지정 (비우면 모든 출처 허용 = 개발용)
