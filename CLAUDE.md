# 월드씨 (WorldSea)

물고기 포획 + 사육 + 교배 수집형 방치/RPG 게임. 모바일 앱, 웹, PC(독립 실행)를 모두 지원한다.
사용자는 "대장님"이라고 부르고, 모든 대화와 주석은 한국어로 한다.
기획서 원본은 claude.ai Docs("월드씨 게임 기획서 v0.1")에 있으나 CLI에서는 읽을 수 없으므로, 이 파일이 결정 사항의 기준이다. 결정이 바뀌면 이 파일을 갱신한다.

## 핵심 콘셉트
- 2D 픽셀아트. 도트는 레이어 합성(몸 팔레트/무늬/지느러미/크기를 유전자에서 결정).
- 전 세계가 하나의 온라인 바다를 공유하고, 어종별 야생 개체수는 한정.
- 희소할수록 비싸다. 야생 개체가 양식 개체보다 비싸고 건강하다.
- 멘델 유전의 모프(색/무늬) + 연속형 능력치. 근친교배는 건강 저하, 야생 피를 섞으면 회복.
- 출시 어종 120종 = 실존 107(현대 91 + 고대 16) + 오리지널 13(지역별 특별 개체 12 + 오리지널 전설급 크로노피시 1). 심연의 왕과 세 번째 오리지널 전설급은 심해 지역 업데이트 때 추가(확정, 67번). 지역당 8~10종. 실제 학명/이름 사용.

## 월드 구성 (출시 시 전 지역 포함, 레벨로 단계 개방)
1. 1단계: 아시아 + 중미 민물
2. 2단계: 남미/북미 민물 + 태평양
3. 3단계: 아프리카/유럽 민물 + 대서양/인도양/북극해
4. 4단계: 고대(데본기, 백악기). 시간 티켓으로 입장.
- 특별 지역: 원정 중 드물게 특별 맵 발생, 기회 5번, 특별 개체(오리지널) 수집.
- 오리지널 전설급 노출(확정, 65번): 지역 상세 목록에는 "??? (전설)" 실루엣으로 자리만 보이고 이름·학명·개체수 비율은 숨긴다.
- 특별 개체 희귀도(확정, 68번): 지역별 특별 개체 12종은 모두 영웅(epic). 지역 전설급보다 한 단계 아래 (특별 맵 자체가 희소하므로).
- 특별 개체 노출(확정, 66번): 처음엔 "??? (특별 맵)" 실루엣, 서버에서 누군가 처음 잡으면 모두에게 공개(species_discoveries). 실루엣은 목록 끝(특별 개체 → 전설급 순)에 두어 이름순 위치로 정체를 추측하지 못하게 한다.

## 등급
- 고정 희귀도: common / uncommon / rare / epic / legendary
- 동적 보전 상태: stable(≥30%) / vulnerable(<30%, 일일 쿼터) / protected(<10%, 포획 금지) / extinct_wild
- 멸종은 환경 이벤트로만 발생하고 방류로 복원 가능. 숨은 보유량(hiddenReserve)으로 "전설 목격" 연출.
- 실제 야생 현황 반영(확정, 2026-10-02): 실존 어종의 IUCN 등급·추세·규모를 조사해 **비율만** 게임 개체수에 반영한다(실제 마릿수는 쓰지 않음). 수용량 = min(실제 규모 기준값, 희귀도 상한) × scale, 시작 수 = 수용량 × IUCN별 시작 비율(LC 100 / NT 75 / VU 45 / EN 25 / CR 12%). 위급(CR)도 보호종이 아닌 취약으로 시작(보호종 시작이면 복원 순환이 막힘). 전체 크기는 POPULATION_TEMP.scale 하나로 조절. 규칙 shared/game/population.ts, 조사표 docs/species-population.md.

## 게임 시스템
- 헌터와 수색(사냥): 방치형. "수색"과 "사냥"은 같은 뜻. 헌터가 스태미너를 소모해 수색하면 결과가 랜덤으로 나온다. 결과 종류: 물고기, 재화(골드/프리미엄), 아이템(찌, 미끼, 성장 아이템, 교배 촉진 아이템), 낮은 확률의 꽝. 물고기가 걸리면 입질 미니게임. 수령 전까지 결과 보관.
  - 헌터(확정): 능력치·스킬이 없다. 외형(스킨)만 바꿀 수 있고 외형은 뽑기로 얻는다(hunter_skins, player_hunter_skins, 뽑기 기록은 로그 DB gacha_logs). 외형은 코스메틱이므로 프리미엄 소비처 원칙에 맞는다. 뽑기 가중치(gachaWeight)는 확률 공개 확률표의 원본.
  - 헌터 슬롯(확정): 기본 1명, 레벨 10 무렵 2명(초반에 빨리 열림), 월 구독 +1, 높은 VIP 등급 +1, 최대 4명. 슬롯이 열리면 헌터 지급. 슬롯 수는 Workers가 레벨/구독/VIP로 계산해 검사한다(DB 제약 없음). 한 헌터는 동시에 원정 하나.
  - 스태미너(확정): 플레이어 하나의 공유 스태미너(players.stamina)를 헌터들이 나눠 쓴다. 슬롯이 늘어도 하루 총 수확량은 같고, 여러 지역 동시 파견/빠른 소진 같은 편의만 늘어난다. 한정 개체수 경제에서 과금이 수확량 격차가 되지 않게 하기 위한 원칙이므로 바꾸지 말 것.
  - 수색 방식(확정): 1회 수색과 반복 수색. 반복은 설정한 횟수만큼 이어서 진행한다(expeditions.repeatTotal/repeatDone). 반복 진행은 요청 시점에 경과 시간과 스태미너로 계산한다.
  - 수색 시간(확정): 지역별 고정 시간(regions.huntSeconds, 고급 지역일수록 길고 결과가 좋음). 헌터 스킬이 없어졌으므로 단축 요소 없음. 1회 스태미너는 regions.huntStaminaCost.
  - 반복 최대 횟수(확정): 기본 100회, 월 구독 또는 높은 VIP 등급이면 200회. Workers가 검사하고 DB는 200 상한 CHECK만 둔다.
  - 반복 옵션(확정, expeditions.options = HuntOptions): 스태미너 부족 시 자동 회복(`none` 중단 / `wait_regen` 자연 회복 대기 후 계속 / `premium` 프리미엄 자동 구매), 사용할 찌·미끼와 장비가 떨어졌을 때 계속할지, 이 반복에만 적용할 미니게임 자동 설정.
  - 프리미엄 자동 구매는 반드시 이번 반복의 상한(premiumCap)을 받고, 기존 일일 스태미너 구매 제한도 그대로 적용한다. 의도치 않은 결제 재화 소진을 막기 위한 규칙.
  - 꽝 천장(확정): 꽝이 연속 N번 나오면 다음 수색은 꽝 제외(players.missStreak). N은 미정.
  - 미정: 지역별 수색 시간·스태미너 수치, 200회가 되는 VIP 등급, 꽝 확률과 천장 N, 결과 확률표, VIP 몇 등급부터 4번째 슬롯인지, 2번째 슬롯 정확한 레벨(10 전후), 최대 레벨 값, 외형 뽑기 가격과 등급별 확률.
- 희귀어 손맛 미니게임: 푸시 알림, 기본 제한 30분, 놓치면 물고기는 바다로 복귀.
  - 방식(확정): 확률형 + 포켓몬GO 채집 느낌. 넓게 펼쳐진 판정 영역에서 가운데에 가까울수록 성공 확률이 오른다. 반응 속도형이 아니라 위치/타이밍 선택형.
  - 장비 사용(확정, 이전 "성공 시에만 소모" 규칙을 대체): 찌·미끼는 사용 여부를 플레이어가 선택한다. 사용을 선택하면 성공·실패와 무관하게 시도할 때마다 소모. 일반 맵과 특별 맵(5번 기회) 모두 같은 규칙. 사용 장비는 rare_bites에 기록하고 시도 시점에 차감.
  - 장비 등급(확정): 5등급(common/uncommon/rare/epic/legendary). 낮은 등급이 주로 나오고 높은 등급은 낮은 확률.
  - 장비 획득(확정): 수색 드랍, 조합, 상점 구매(3등급 rare까지, DB CHECK items_shop_grade_limit), 길드 보상, 출석 보상.
  - 조합(확정): 같은 아이템 N개를 합쳐 한 등급 위 아이템 1개(예: 일반 찌 5개 → 고급 찌 1개). 전설급 전용 미끼는 조합으로 만들 수 없다(수색에서만). N은 미정.
  - 미끼 종류(확정): 범용 미끼 + 전설급 전용 미끼. 전용 미끼는 전설급 어종에만 있고(items.targetSpeciesId), 수색 중 낮은 확률로만 얻는다.
  - 자동 진행(확정): 입질 미니게임을 자동으로 넘기는 옵션(players.autoMinigame). 자동은 직접 할 때보다 성공 확률이 조금 낮고, 높은 등급 물고기는 더 많이 낮아진다. 판정에 쓰는 rare_bites.isAuto 기록.
  - 높은 등급 입질(확정): 기준 등급은 플레이어가 고른다(players.highGradeThreshold, 기본 epic). 높은 등급 입질이 생기면 `auto`(자동 진행, 확률 더 낮음) 또는 `pause`(반복 수색 정지 후 알림, 직접 진행) 중 플레이어가 선택(players.highGradeBiteMode, 기본 pause).
  - pause 중 야생 개체 처리(기본값, 변경 가능): 예약(reserved)은 입질 시점에 하고 30분 제한도 그대로 둔다. 공유 바다의 물고기를 무기한 묶어 두지 않기 위함. 만료되면 물고기는 바다로 돌아가고 반복은 정지 상태로 남는다.
  - 서버 판정: 클라이언트는 위치 입력만 보내고, 서버가 시드(minigameSeed)·어종 등급·찌/미끼 보정·자동 여부로 결과를 계산한다. 확률 공식은 서버 코드에만 둔다.
  - 미정: 등급별 보정 수치, 자동 감점 수치, 조합 개수 N, 상점 가격(골드 기준 예정).
- 성장 아이템(확정): 물고기 성장(성체까지 시간)을 앞당기고 건강/능력치를 조금 올린다. 야생 개체가 양식보다 건강하다는 핵심 설정이 무너지지 않도록 상승폭은 작게 유지. 교배 시간 단축은 별도 아이템(item_kind breed_boost).
- 시장: 흔한 어종은 NPC, 희귀/모프/오리지널은 플레이어 경매. 신규 계정은 일정 레벨까지 경매 제한.
- 양식장: 수조 환경(수온/염도/수질) + 자동화 설비(여과기/히터/급여기).
- 교배: 현대 어종 전부 가능. 고대 전설급(둔클레오스테우스, 크시팍티누스)과 오리지널은 교배 불가, 경매는 가능.
- 스태미너: 레벨별 최대/재생. 프리미엄 재화 또는 광고로 구매(일일 제한).
- 시간 티켓: 매일 무료 지급, 프리미엄 구매, 광고 획득(일일 제한). 포획 효율은 동일.
- 소셜: 친구 + 길드(길드당 1개). 길드 퀘스트로 위험종 복원. 서버 협동 복원 이벤트.
- 출시 시 최종 콘텐츠: 세계 최초 모프 명명권, 수족관 전시, 협동 복원. 이후 업데이트: 고대 전설 레이드, 모프 콘테스트.
- 화면: 허브 = 작은 브리딩 샵이 공공 수족관으로 성장(1~4단계). 하단 탭 샵/사육/원정/도감/상점. 시장과 길드는 샵 허브 안. 스토리 + 점진적 해금 튜토리얼.

## 수익 모델
- 재화: 골드 + 프리미엄. 프리미엄은 무료로도 충분히 획득 가능, 결제로도 구매. 소비처는 코스메틱/편의만.
- 월 구독: 광고 제거 + 매일 VIP 포인트 보너스.
- VIP 티어: 롤 랭크식(아이언~챌린저), 누적 포인트(결제, 출석, 구독)로 상승. 편의 기능만 제공, 게임 진행에 큰 영향 없음.
- 보상형 광고: 골드/프리미엄/스태미너/시간 티켓, 일일 제한. 광고는 모바일에서만 가능하며 웹/PC에서는 "광고는 모바일에서만 가능합니다" 표시.

## 법적 원칙
- 상표 모프명(예: GloFish) 사용 금지, 이미지 복제 금지, IUCN 로고 사용 금지. 출시 전 법률 검토.
- 확률 공개: 스태미너를 프리미엄 재화(결제 가능)로 살 수 있으므로 사냥 랜덤 결과가 한국 확률형 아이템 확률 공개 의무 대상일 수 있다. 확률표를 공개한다는 전제로 설계하고, 출시 전 법률 검토 항목에 포함.

## 기술 스택
- 모노레포: pnpm workspace (client, server, shared)
- client: Phaser + TypeScript + Vite, React HTML 오버레이(공유 스토어, 예: Zustand). 모바일 Capacitor, PC Tauri.
- server: Cloudflare Workers(게임 로직), Durable Objects + WebSocket Hibernation(희귀어 입질/경매 푸시), Hyperdrive로 메인 DB 연결.
- 인증: Supabase Auth. Workers가 JWT 검증. iOS는 소셜 로그인 시 Apple 로그인 필수.
- 메인 DB: Supabase PostgreSQL. 로그 DB: Neon PostgreSQL (비동기 기록, ctx.waitUntil).
- ORM: Drizzle.
- 결제: 모바일 RevenueCat(Capacitor SDK), 웹 Stripe(PC는 웹 결제 공유, RevenueCat 연동). 서버가 검증한 뒤에만 재화 지급.
- 광고/푸시: AdMob + FCM (모바일만).
- 웹 호스팅: Vercel (Cloudflare Pages 이전 검토 중).

## 설계 원칙 (반드시 지킬 것)
1. 클라이언트는 DB에 직접 쓰지 않는다. 모든 변경은 Workers를 거친다.
2. 야생 개체수 감소와 소유권 이전은 하나의 DB 트랜잭션으로 처리한다.
3. 시간 기반 값(스태미너, 재생, 원정)은 "마지막 갱신 시각"으로 요청 시점에 계산한다. 틱 루프 금지.
4. 모든 테이블은 RLS 활성화(정책 없음). 접근은 서버 역할로만.
5. DB 트리거/제약은 마지막 안전망이다. 규칙 판정은 Workers가 먼저 한다.
6. 희귀어 입질은 예약(reserved) 방식으로 "마지막 한 마리" 경쟁 상태를 막는다.
7. 로그 DB와 메인 DB는 트랜잭션으로 묶지 않는다. FK도 걸지 않는다.

## 현재 저장소 구성 (pnpm 모노레포)
- packages/shared (@worldsea/shared): 클라이언트·서버 공용
  - src/index.ts: 공용 타입·상수 진입점 (클라이언트는 여기만 가져온다. DB 스키마는 번들에 넣지 않는다)
  - src/game/constants.ts: 확정 규칙 상수(등급, 하단 탭, 헌터 슬롯 최대, 반복 최대, 상점 최고 등급, 입질 제한 시간)
  - src/api/types.ts: API 응답 타입
  - src/db/main.schema.ts: 메인 DB 33개 테이블 (서버 전용, '@worldsea/shared/db/main')
  - src/db/log.schema.ts: 로그 DB 6개 테이블(gacha_logs 포함)
  - src/db/types.ts: jsonb 공용 타입
  - migrations/main/0000_init.sql (생성), 0001_safety_guards.sql (수동 트리거: 보호종 감소 차단, 교배 불가 차단, 경매 불가 차단 + 기본 헌터 외형 시드)
  - migrations/main/0002_species_iucn.sql: species에 IUCN 등급·연도·실제 규모·추세·메모·출처 열 추가 (Supabase 적용 후라 증분 마이그레이션)
  - migrations/main/0003_species_discoveries.sql: 어종별 서버 최초 포획 기록 (특별 개체 공개 기준)
  - migrations/log/0000_init.sql, scripts/verify.mjs (PGlite로 마이그레이션 전체·트리거 검증)
  - src/game/population.ts: 실제 야생 현황 → 게임 개체수 변환 규칙
  - src/seed/world.ts: 지역 12 + 어종 120(실존 91, 고대 16, 오리지널 13) 원본. src/seed/build.ts: 시드 SQL 생성(지역·어종 upsert, 야생 개체수는 없을 때만). scripts/seed.ts(pnpm db:seed), scripts/species-table.ts(문서 표 재생성)
- packages/server (@worldsea/server): Cloudflare Workers + Hono
  - src/app.ts: createApp(deps). 공통 CORS·오류 처리, /v1/* 는 Bearer 토큰 검증 후 요청마다 DB 연결. 테스트는 deps로 PGlite DB·로컬 키 검증기를 넣는다
  - src/auth.ts: Supabase 토큰 검증 (JWKS 비대칭 키 기본, SUPABASE_JWT_SECRET 있으면 HS256). 토큰의 sub만 신뢰
  - src/db.ts: postgres-js + Drizzle, Hyperdrive(배포) 또는 DATABASE_URL(로컬)
  - src/routes/players.ts: GET /v1/me(스태미너는 요청 시점 계산), POST /v1/players(가입: 플레이어+첫 헌터, 한 트랜잭션)
  - /ws?token= : 토큰 검증 후 그 사용자 채널(Durable Object)에 연결
  - test/api.test.ts: vitest + PGlite(실제 마이그레이션) + 로컬 서명 토큰으로 인증·가입·내 정보 검증
  - src/realtime/player-channel.ts: 플레이어별 Durable Object, WebSocket Hibernation, push() RPC
  - wrangler.jsonc: Hyperdrive 바인딩은 주석 상태(생성 후 id 입력). 비밀 값은 wrangler secret / .dev.vars(커밋 금지)
- packages/client (@worldsea/client): Vite + Phaser + React 오버레이 + Zustand
  - 9:16 프레임 안에 Phaser 캔버스(#game, 360x640 픽셀아트 정수 배율, 2026-10-02 180x320에서 상향)와 React UI(#ui)를 겹친다
  - src/store.ts: React·Phaser 공유 상태 (Phaser는 subscribe로 받음). phase(loading/preview/login/signup/ready/error)와 me(서버 응답). 재화·스태미너는 서버 응답으로만 갱신
  - src/auth/supabase.ts: Supabase Auth(로그인·토큰만, DB 직접 접근 금지). 환경 변수 없으면 미리보기 모드
  - src/session.ts: 로그인 상태 → /v1/me → needs_signup이면 닉네임 화면 / src/api.ts: 토큰을 붙여 Workers API 호출
  - src/ui/viewModel.ts: 서버 응답(또는 미리보기 mock)을 화면 값으로 변환
  - src/game/layout.ts: 해상도(360x640), 화면 영역(LAYOUT), 1단계 샵 배치(STAGE1_SPOTS). Phaser와 React가 같은 좌표를 쓴다
  - src/game/scenes: BootScene(임시 도트 텍스처: 14x8 물고기 레이어 합성, 치어, 사람), HubScene(1단계 탑다운 3/4 임시 장면: 도형 수조·카운터·교배실·치어 수조·문, 헤엄치는 물고기, 통로를 걷는 사람)
  - src/ui/App.tsx: 로그인·닉네임·오류 화면(최소 구성) + 메인 UI(상단바 한 줄, 간판 글자·샵 단계 바, 장면 라벨·터치 영역, 양옆 패널, 헌터 띠, 탭바). 좌표는 --px(게임 1px = 100cqw/360) 단위
  - src/ui/PixelIcon.tsx: 문자열 도트 임시 아이콘 / src/ui/mock.ts: API 연결 전 화면 확인용 임시 데이터
  - 에셋: src/assets/<폴더>/<이름>.png 를 넣으면 빌드 시 자동 인식(src/game/assets.ts, import.meta.glob)되어 임시 도형·도트 대신 쓰인다. 없는 에셋은 임시 그림 유지. 목록·크기·프롬프트는 docs/assets-main.md
  - scripts/pixelize.py: 생성 도구 이미지를 목표 크기 진짜 픽셀아트로 정리(잘라내기, 축소, 색 수 줄이기, 알파 정리). pillow 필요
  - 글꼴: Galmuri(OFL, npm galmuri, 앱 내장). 본문 Galmuri11, 작은 글자 Galmuri9, 숫자 GalmuriMono
  - 캔버스에서 작은 한글 텍스트는 깨지므로 글자는 React UI 레이어에서 그린다
  - Capacitor(모바일)와 Tauri(PC) 래핑은 아직 안 함

- docs/api.md: API 설계 v1 (공통 규칙, 오류 코드, 엔드포인트 전체와 구현 상태, WebSocket 메시지)
- docs/species-population.md: 실존 어종 IUCN 조사표(출처 포함)와 게임 개체수 변환 규칙·결과
- docs/setup-supabase.md: Supabase 프로젝트·로그인·마이그레이션·로컬 실행·배포 설정 순서
- docs/assets-main.md: 메인 화면(1단계) 에셋 목록 (파일명, 크기, 겹 순서, 9-slice, 생성 프롬프트, 우선순위)
- docs/screens.md: 화면 구성 요소 목록 (페이지 디자인 기준, 확정/제안 구분)
- docs/ui-main.md + docs/reference/main-ui-reference.png: 메인 화면 UI 기준 v2(대장님 제공, 탑다운 3/4 시점, 9:16). 해상도 360x640. 화면 배치·패널·색·아이콘·장면 구성은 이 기준을 따른다. 기준 이미지는 에셋으로 직접 쓰지 않고 진짜 픽셀아트로 새로 그린다. v1(쿼터뷰)은 참고 보관용. 샵 단계별 장면 기준: main-ui-reference.png(1단계), hub-stage2/3/4-reference.png(2~4단계). 컨셉 이미지이며 물고기가 아닌 생물(해파리, 펭귄, 거북 등)은 넣지 않는다.

## 명령어 (저장소 루트에서)
- `pnpm install`
- `pnpm dev:client` (http://localhost:5173), `pnpm dev:server` (http://localhost:8787)
- `pnpm typecheck`, `pnpm build`
- `pnpm verify` (마이그레이션과 가드 트리거 검증), `pnpm -r test` (shared 규칙 함수 + server API 테스트)
- `pnpm db:gen:main` / `pnpm db:gen:log` (스키마 변경 후 마이그레이션 생성). Supabase에 스키마를 적용한 뒤부터는 증분 마이그레이션(0002~)으로 관리한다.
- `pnpm db:seed` (SUPABASE_DB_URL 필요. 지역·어종 시드. 운영 중 야생 개체수는 초기화하지 않음. `--dry`로 SQL만 출력)
- 스키마를 바꾸면 verify를 다시 돌린다. 관리자 작업은 트랜잭션 안에서 `SET LOCAL worldsea.bypass_guard = 'on'`.

## 진행 순서와 남은 일
완료: 기획(구조), 기술 스택, DB 스키마, 프로젝트 뼈대, 메인 화면 UI(임시 그림), API 설계, 인증·가입·내 정보 API. 숫자 밸런싱은 남음.
완료: Supabase 메인 DB 연결과 최신 32테이블 스키마 적용, 지역 목록·상세 API.
완료: 실존 어종 IUCN 조사와 개체수 변환 규칙, 지역·어종 시드(pnpm db:seed).
다음: (1) 수색 시작·진행 계산·수령 → (2) 입질 미니게임.
임시 수치(밸런싱 전): 지역 해금 레벨 1~40·수색 5~30분·스태미너 1~5(seed/world.ts), 어종 기준 가격 100/300/1000/4000/20000(seed/build.ts), 개체수 규칙 값(game/population.ts), 스태미너 기본 최대 60·300초당 1 회복(shared/game/stamina.ts), 시작 지급 골드 1000·시간 티켓 3(server/routes/players.ts), 헌터 슬롯 VIP 기준 5등급(shared/game/hunters.ts).
이후 밸런싱 수치: 재화량, 광고 일일 한도, 길드 규모/퀘스트 보상, VIP 티어 포인트/혜택, 경매 허용 레벨, 유료 호스팅 전환 시점, 고대 어종 모프 유전자.
