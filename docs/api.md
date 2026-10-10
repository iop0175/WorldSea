# 월드씨 API 설계 (v1)

서버: Cloudflare Workers + Hono (`packages/server`). 요청·응답 타입은 `packages/shared/src/api/types.ts`가 기준이며, 이 문서와 같이 고친다.

## 공통 규칙

- **인증**: Supabase Auth 액세스 토큰을 `Authorization: Bearer <토큰>`으로 보낸다. 서버는 토큰 서명을 검증하고 `sub`(사용자 id)만 믿는다. 클라이언트가 보낸 사용자 id는 절대 쓰지 않는다.
  - 새 Supabase 프로젝트: 비대칭 서명 키(JWKS, `SUPABASE_URL/auth/v1/.well-known/jwks.json`)로 검증
  - 예전 프로젝트: `SUPABASE_JWT_SECRET`(HS256)으로 검증
  - `aud`는 `authenticated`여야 한다.
- **쓰기는 모두 서버**: 클라이언트는 DB에 직접 접근하지 않는다 (Supabase는 로그인에만 사용).
- **시간 값**: 스태미너·원정 진행 등은 서버가 요청 시점에 계산해 돌려준다. 모든 응답에 `serverTime`을 넣어, 클라이언트는 남은 시간 표시에만 쓴다.
- **오류 형식**: `{ "error": { "code": "...", "message": "한국어 메시지" } }`

| code | HTTP | 뜻 |
|---|---|---|
| `unauthorized` | 401 | 토큰 없음·만료·위조 |
| `needs_signup` | 404 | 로그인은 됐지만 닉네임(플레이어)이 없음 |
| `already_registered` | 409 | 이미 가입 |
| `nickname_taken` | 409 | 닉네임 중복 |
| `invalid_request` | 400 | 요청 형식 오류 |
| `not_found` | 404 | 대상 없음 |
| `hunter_busy` | 409 | 이미 진행 중인 원정이 있는 헌터 |
| `hunter_slot_locked` | 403 | 현재 레벨·구독·VIP로 열리지 않은 헌터 슬롯 |
| `region_locked` | 403 | 지역 해금 레벨 부족 |
| `repeat_limit` | 400 | 현재 구독·VIP의 반복 상한 초과 |
| `insufficient_stamina` | 409 | 첫 회차를 시작할 스태미너 부족 |
| `insufficient_time_tickets` | 409 | 고대 지역 입장 티켓 부족 |
| `idempotency_conflict` | 409 | 같은 요청 키에 다른 수색 요청을 보냄 |
| `internal` | 500 | 서버 오류 |

- **멱등성**: 수색 시작·결과 수령 POST는 `Idempotency-Key` 헤더가 필수다(영문·숫자·밑줄·하이픈 1~128자). 시작 키는 플레이어별 원정에 보관하고 수령 키와 응답은 `expedition_claims`에 보관한다. 같은 요청을 재전송하면 이미 확정한 원정 또는 수령 응답을 반환하며 재차 차감·지급하지 않는다. 같은 키에 다른 시작 요청·수령 대상을 보내면 `idempotency_conflict`.

## 엔드포인트

상태: ✅ 구현 · 🔜 다음 · 📝 설계만

### 기본·계정
| 상태 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| ✅ | GET | `/health` | 서버 상태 (인증 없음) |
| ✅ | GET | `/v1/me` | 내 상태: 재화, 스태미너(계산값), 헌터와 진행 중 원정, 헌터 슬롯 수. 미가입이면 `needs_signup` |
| ✅ | POST | `/v1/players` | 가입: `{ nickname }` → 플레이어 + 첫 헌터 생성(한 트랜잭션), 내 상태 반환 |
| 📝 | PATCH | `/v1/me/settings` | 미니게임 기준 등급(이 등급 이상만 입질 미니게임, 높은 등급 기준 이하만 허용), 미니게임 자동 진행, 높은 등급 기준, 높은 등급 입질 처리(auto/pause) |
| 📝 | POST | `/v1/me/push-token` | 모바일 FCM 토큰 등록 |

### 월드·도감
| 상태 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| ✅ | GET | `/v1/regions` | 지역 목록: 레벨 기준 해금 여부(샵 단계와 무관), 수색 시간·스태미너, 시간 티켓 필요 여부 |
| ✅ | GET | `/v1/regions/:id` | 지역 상세: 출현 어종과 보전 상태. 야생 개체수는 **초기 대비 비율(%)과 상태만** 공개 (정확한 수·예약분·숨은 보유량 비공개). 오리지널 전설급은 항상, 특별 개체는 서버 최초 포획 전까지 `revealed: false` 실루엣(`???`, 자리 표시 id, 비율 비공개)으로 목록 끝에 둔다 |
| 📝 | GET | `/v1/dex` | 내 도감 (발견 어종, 모프) |
| 📝 | GET | `/v1/species/:id` | 어종 상세 (야생 개체수 비율, 발견 모프, 세계 최초 명명) |

### 헌터·수색 (첫 기능)
| 상태 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| ✅ | POST | `/v1/expeditions` | 수색 시작: `{ hunterId, regionId, repeatTotal?, options? }`. 헌터 소유·슬롯·중복 수색·지역 레벨·반복 상한·스태미너·고대 티켓 검사 |
| ✅ | GET | `/v1/expeditions` | 진행 중·완료 원정, 요청 시점 회차 계산·결과 확정 |
| ✅ | POST | `/v1/expeditions/:id/claim` | 해당 원정의 결과 배치 수령. 포획 개체를 다시 생성하지 않으며 개체 수령·재화·아이템·수령 응답을 한 트랜잭션으로 확정 |
| ✅ | POST | `/v1/expeditions/claim-all` | 내 원정의 결과를 배치로 모두 수령 |
| 📝 | POST | `/v1/expeditions/:id/stop` | 반복 중지 |
| 📝 | PATCH | `/v1/hunters/:id` | 헌터 이름·외형 변경 |

수색 시작:
- 기본 `repeatTotal`은 1, `options`는 `{ recovery: 'none' }`. 기본 상한 100회, 유효한 월 구독 또는 VIP 5 이상은 200회(임시 VIP 기준).
- 플레이어를 행 잠금하고 첫 회차 스태미너 차감과 원정 생성을 한 트랜잭션으로 처리한다. 스태미너는 모든 헌터가 공유한다. 고대 지역 티켓은 반복 전체 입장에 1장만 차감한다.
- 첫 회차 스태미너가 부족하면 시작을 거절한다. `wait_regen`·`premium`은 이후 반복 회차의 회복 정책이다. `premium`은 `premiumCap`이 필수이고 첫 회차 시작 시 프리미엄을 쓰지 않는다.
- 찌·미끼는 아이템 존재와 종류만 검사해 옵션에 보관한다. 장비 차감·부족 처리는 입질 시도 단계에서 한다.
- 최초 응답은 201, 같은 키의 재전송은 200. 응답은 `{ serverTime, expedition: { id, hunterId, regionId, startedAt, endsAt, repeatTotal, options, staminaCost, usedTimeTicket } }`. 시작 응답의 `endsAt`은 첫 회차 종료 시각이다.
- 시작 전 기존 원정의 지난 회차를 처리한다. 같은 헌터의 이전 원정이 완료됐으면 수령 전에도 새 원정을 시작할 수 있다.

수색 진행·결과 확정:
- `/v1/me`, `GET /v1/expeditions`, 수색 시작 요청에서 지난 회차를 종료 시각 순서대로 처리한다. 플레이어 행 잠금으로 공유 스태미너와 중복 처리 방지를 보장한다. 회차 처리와 포획 개체·야생 개체수 변경은 한 트랜잭션이다.
- 목록 응답은 `{ serverTime, expeditions }`. 각 원정은 `id`, `hunterId`, `regionId`, `status`, `repeatDone`, `repeatTotal`, `endsAt`, `waitingForStamina`, `stopReason`, `premiumSpent`, `result`, `claimable`(지금 수령할 보상 유무), `pendingBites`(입질 대기 건수)를 제공한다. `claimed` 원정은 제외한다.
- `waitingForStamina: false`의 `endsAt`은 다음 회차 종료 시각이다. `true`이면 회복 대기 후 다음 회차를 시작할 예정 시각이다. 스태미너를 실제로 확보한 뒤 한 회차의 수색 시간이 지나야 결과가 생긴다.
- 반복 횟수를 채우거나 중단 조건이 생기면 `completed`. `stopReason`은 `stamina_empty`, `premium_cap`, `premium_empty`, `daily_limit`, `gear_empty`, `high_grade_bite`이며 정상 완료는 `null`이다.
- 자동 프리미엄 회복은 원정별 누적 `premiumSpent`, 플레이어 잔액, UTC 날짜별 구매 한도를 모두 검사한다. 임시값은 10 프리미엄 → 60 스태미너, 하루 최대 5회다.
- 결과 확률·지역 단계별 등급 확률·꽝 천장과 자동 입질 확률은 서버 `game/hunt.ts`의 `HUNT_TEMP`가 원본이다. 특별 맵 전용·오리지널 전설급은 일반 어종 추첨에서 제외한다. 존재하지 않는 등급의 확률은 나머지 등급으로 재분배한다.
- 일반 포획은 회차 종료 시 `fish`에 소유권을 확정한다. `expeditionId`와 `pendingClaim: true`로 수령 대기 개체를 식별한다. 결과의 재화·아이템·경험치는 수령 전까지 지급하지 않는다. 보호종·야생 0마리·취약 어종 일일 한도 소진은 놓아줌 보상으로 처리한다(보전 포인트·샵 평판은 활동 시 확정).
- 미니게임 대상은 `rare_bites`에 예약한다. 높은 등급의 `pause`는 원정을 정지시키고, 낮은 등급의 직접 진행 입질은 반복을 계속한다. 자동 설정 또는 낮은 등급 입질의 30분 만료는 서버 임시 확률로 한 번 판정하며 장비·시도 기록을 함께 반영한다. 높은 등급 정지 입질은 만료 시 자동 시도 없이 바다로 돌아간다.
- 다른 플레이어의 조회·시작 요청도 만료된 입질을 최대 100명의 플레이어 단위로 정리하므로, 소유자가 자리를 비워도 예약이 계속 남지 않는다. 요청이 없을 때는 다음 요청에서 정리한다.
- 특별 맵은 발생 시각부터 24시간 보관하고 개체를 예약하지 않는다. 직접 입질 미니게임·특별 맵 시도 API는 다음 단계다.
- `0010_expedition_progress.sql`까지 적용해야 한다. 수색 시작 재전송은 동일 원정의 현재 `endsAt`을 반환할 수 있으며, 추가 차감·새 원정 생성은 하지 않는다.

배치 수령:
- 요청 본문 없이 `Idempotency-Key`를 보낸다. 응답은 `{ serverTime, claimed: { fishIds, catches, gold, premium, exp, items }, hasMore }`다. `fishIds`는 이번 배치에서 수령한 기존 개체 id, `catches`는 그 어종별 요약이다.
- 한 요청에 물고기와 아이템을 합쳐 최대 50개, 원정은 최대 50건 처리한다. 재화·경험치는 해당 원정의 첫 수령 배치에서 지급하고 잔여 결과는 원정에 남긴다.
- `hasMore: true`이면 **새 요청 키**로 다음 배치를 요청한다. 응답 유실 재시도는 **같은 키**를 사용해야 같은 배치 응답을 받는다. 클라이언트는 키를 `sessionStorage`에 저장하고 모두 수령을 여러 배치로 이어서 처리한다.
- 수색 중에도 완료된 회차의 결과를 받을 수 있다. `pendingClaim`을 해제해 기존 물고기를 수령하며 야생 개체수를 다시 줄이지 않는다.
- 완료된 원정의 결과를 전부 받고 입질 대기가 없으면 `claimed`. 입질이 남아 있으면 원정을 유지해 나중의 자동 포획도 수령할 수 있다. 이미 받은 보상이 비어 있고 마지막 입질이 놓침·만료로 끝나면 원정을 정리한다.
- 원정 탭은 수령 대기 결과·개별 수령·모두 수령·진행 횟수·회복 대기·정지 사유를 표시한다. 수색 또는 입질이 있는 동안 5초마다 서버 상태를 갱신하며, 남은 시간만 클라이언트가 표시한다. 샵 허브의 모두 수령과 완료 카드도 연결돼 있다.
- 실제 DB에는 `0011_expedition_claims.sql`까지 적용해야 한다. 수령 중복 지급 방지 테이블은 RLS가 켜져 있고 서버 역할로만 접근한다.

클라이언트 연결:
- 원정 탭과 헌터 카드에서 지역·헌터·반복 횟수·회복 정책을 선택한다. 현재 화면은 `none`·`wait_regen` 정책을 제공한다.
- 응답 유실에 대비해 요청 내용과 키를 `sessionStorage`에 보관하고 같은 요청을 재시도할 때 키를 재사용한다. 시작 성공 후 `/v1/me`를 다시 조회해 스태미너와 헌터 현황을 갱신한다.
- 환경 설정이 없는 미리보기에서는 수색을 시작할 수 없다. 실제 Supabase 없이 확인하려면 `docs/setup-supabase.md`의 `pnpm dev:smoke` 절차를 따른다.

### 입질 미니게임·특별 맵
| 상태 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| 📝 | GET | `/v1/bites` | 대기 중인 입질 (남은 시간) |
| 📝 | POST | `/v1/bites/:id/attempt` | 시도: `{ position, floatId?, baitId? }` 또는 `{ auto: true }`. 서버가 시드·등급·장비로 판정. 장비는 시도 시 차감 |
| 📝 | POST | `/v1/encounters/:id/attempt` | 특별 맵 기회 사용 (5번) |

### 사육·교배
| 상태 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| 📝 | GET | `/v1/tanks` · `/v1/fish` | 수조와 개체 |
| 📝 | POST | `/v1/fish/:id/move` | 수조 이동·진열·보관 |
| 📝 | POST | `/v1/fish/:id/release` | 방류 (야생 개체수 복원) |
| 📝 | POST | `/v1/breedings` | 교배 시작 (같은 종, 교배 가능 어종) |
| 📝 | POST | `/v1/breedings/:id/hatch` | 부화 → 새끼 개체, 세계 최초 모프면 명명 |
| 📝 | POST | `/v1/items/use` | 성장·교배 촉진 아이템 사용 |

### 시장·상점
| 상태 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| 📝 | POST | `/v1/market/npc-sell` | NPC 판매 (시세는 희소성 반영) |
| 📝 | GET/POST | `/v1/auctions` | 경매 목록·등록 (레벨 제한) |
| 📝 | POST | `/v1/auctions/:id/bid` · `/buyout` | 입찰·즉시 구매 |
| 📝 | POST | `/v1/shop/buy` | 상점 구매 (장비는 rare까지, 골드) |
| 📝 | POST | `/v1/items/combine` | 조합 (같은 아이템 N개 → 상위 1개) |
| 📝 | POST | `/v1/gacha/hunter-skin` | 헌터 외형 뽑기 (확률 공개, gacha_logs 기록) |
| 📝 | POST | `/v1/purchases/verify` | 결제 검증 후 지급 (RevenueCat/Stripe 웹훅과 함께) |
| 📝 | POST | `/v1/ads/reward` | 광고 보상 (모바일만, 일일 제한) |
| 📝 | POST | `/v1/attendance` | 출석 |

### 소셜
| 상태 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| 📝 | `/v1/friends` | | 친구 목록·요청·수락 |
| 📝 | `/v1/guilds` | | 길드 생성·가입·퀘스트 기여 |
| 📝 | `/v1/restoration` | | 서버 협동 복원 이벤트 |

## 실시간 채널 (WebSocket)

- ✅ 연결: `GET /ws?token=<액세스 토큰>` (브라우저 WebSocket은 헤더를 붙일 수 없어 쿼리로 받음). 토큰의 사용자 id 채널(Durable Object)에만 연결된다. 잘못된 토큰은 연결 거부.
- ✅ 클라이언트 → 서버: `ping` → `pong` 만. **게임 행동은 모두 HTTP API**로 한다.
- 서버 → 클라이언트 메시지 형식: `{ "type": "...", "payload": {...} }`

| 상태 | type | payload | 언제 |
|---|---|---|---|
| 📝 | `bite.new` | `{ biteId, speciesId, rarity, expiresAt, paused }` | 입질 발생 (높은 등급 pause면 `paused: true`) |
| 📝 | `bite.expired` | `{ biteId }` | 30분 만료, 물고기 바다로 |
| 📝 | `expedition.completed` | `{ expeditionId, hunterId }` | 수색(반복) 완료·정지 |
| 📝 | `auction.outbid` | `{ auctionId, price }` | 입찰 경쟁에서 밀림 |
| 📝 | `auction.won` / `auction.sold` | `{ auctionId, price }` | 낙찰·판매 완료 |
| 📝 | `me.changed` | `{}` | 재화 등 변화 → 클라이언트가 `/v1/me` 다시 받음 |

앱이 꺼져 있으면 모바일은 같은 내용을 FCM 푸시로 보낸다.
