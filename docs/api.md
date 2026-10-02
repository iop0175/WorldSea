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
| `internal` | 500 | 서버 오류 |

- **멱등성**(설계, 수색 기능부터): 재화가 오가는 POST는 `Idempotency-Key` 헤더를 받아, 같은 키의 재시도는 한 번만 처리한다 (네트워크 재시도로 이중 지급 방지).

## 엔드포인트

상태: ✅ 구현 · 🔜 다음 · 📝 설계만

### 기본·계정
| 상태 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| ✅ | GET | `/health` | 서버 상태 (인증 없음) |
| ✅ | GET | `/v1/me` | 내 상태: 재화, 스태미너(계산값), 헌터와 진행 중 원정, 헌터 슬롯 수. 미가입이면 `needs_signup` |
| ✅ | POST | `/v1/players` | 가입: `{ nickname }` → 플레이어 + 첫 헌터 생성(한 트랜잭션), 내 상태 반환 |
| 📝 | PATCH | `/v1/me/settings` | 미니게임 자동 진행, 높은 등급 기준, 높은 등급 입질 처리(auto/pause) |
| 📝 | POST | `/v1/me/push-token` | 모바일 FCM 토큰 등록 |

### 월드·도감
| 상태 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| ✅ | GET | `/v1/regions` | 지역 목록: 플레이어 진행도 기준 해금 여부, 수색 시간·스태미너, 시간 티켓 필요 여부 |
| ✅ | GET | `/v1/regions/:id` | 지역 상세: 출현 어종과 보전 상태 |
| 📝 | GET | `/v1/dex` | 내 도감 (발견 어종, 모프) |
| 📝 | GET | `/v1/species/:id` | 어종 상세 (야생 개체수 비율, 발견 모프, 세계 최초 명명) |

### 헌터·수색 (첫 기능)
| 상태 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| 🔜 | POST | `/v1/expeditions` | 수색 시작: `{ hunterId, regionId, repeatTotal, options }`. 슬롯·레벨·반복 상한·스태미너 검사 |
| 🔜 | GET | `/v1/expeditions` | 진행 중·완료 원정 (진행 회차는 요청 시점 계산) |
| 🔜 | POST | `/v1/expeditions/:id/claim` | 결과 수령 (물고기·재화·아이템을 한 트랜잭션으로 지급) |
| 🔜 | POST | `/v1/expeditions/claim-all` | 모두 수령 |
| 📝 | POST | `/v1/expeditions/:id/stop` | 반복 중지 |
| 📝 | PATCH | `/v1/hunters/:id` | 헌터 이름·외형 변경 |

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
