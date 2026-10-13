# 전체 화면 에셋 목록 (메인 화면 외)

메인 화면(샵 1단계)은 `docs/assets-main.md`가 따로 정리한다. 이 문서는 **그 외 모든 화면**(`docs/screens.md`, 스켈레톤 `client/src/ui/screens.ts`)에 필요한 에셋이다.
- 규칙은 assets-main.md와 같다: 게임 해상도 360×640 기준 px, PNG 투명 배경, **이미지 안에 글자 금지**(글자는 UI 레이어), 물고기가 아닌 생물 금지, `python packages/client/scripts/pixelize.py`로 정리, `packages/client/src/assets/<폴더>/<이름>.png`에 넣으면 `src/game/assets.ts`가 인식.
- 스켈레톤 화면은 임시 시안(`reference/`)만 읽는다. 정식 에셋은 실제 화면을 만들 때 `assetUrl('폴더/이름')`으로 연결하고, 파일이 없으면 임시 도형을 쓴다.
- **우선순위** P1 = 화면 인상·핵심 흐름 / P2 = 완성도 / P3 = 있으면 좋음. 수량은 개수.
- 이 문서는 **아직 없는 것만** 적는다. 이미 적용된 것은 지웠다: 시안(`images/asset` → `src/assets/reference/`)을 쓰는 제목 바·닫기·설정/우편/트로피/별 아이콘·목록 행·정보 팝업·나무 패널·코랄 배너·잠금 카드, `bg/hub_stage1~4`, `icon/` 16종, `ui/card_*_bg`.
- `reference/`와 `bg/hub_stage2~4`는 고해상도 시안 크롭이라 **임시**다. 정식 도트 에셋이 나오면 같은 이름으로 바꿔 넣는다.

## 1. UI 공통 틀 (9-slice, 여러 화면이 공유) — P1

| 파일 | 크기 | slice | 쓰는 곳 |
|---|---|---|---|
| `ui/sheet_frame.png` | 32×32 | 8 | 스켈레톤 `.sheet`를 대신할 전체 화면 시트 틀(원정 시트 스타일 통일) |
| `ui/slot_frame.png` | 24×24 | 4 | 아이템·물고기·부모 선택 칸. 등급 색은 코드로 테두리 틴트 |
| `ui/btn_gray.png` | 24×16 | 5 | 취소, 비활성, 보조 버튼 |
| `ui/btn_red.png` | 24×16 | 5 | 탈퇴, 추방, 경매 입찰 같은 위험·경쟁 동작 (P2) |
| `ui/tab_on.png` / `tab_off.png` | 40×16 | 4 | 화면 안 소탭(시장 NPC/경매, 도감 단계, 경매 상태) |
| `ui/gauge_frame.png` | 24×10 | 3 | 환경 게이지, 퀘스트·성장 진행바 틀(채움은 코드 색) |
| `ui/toggle_on.png` / `toggle_off.png` | 24×12 | — | 설정 켜기/끄기 |
| `ui/input_frame.png` | 24×16 | 4 | 닉네임·검색·길드명·경매가 입력창 |
| `ui/scroll_thumb.png` | 4×16 | 1 | 시트 스크롤 표시(P3, 현재는 숨김) |

## 2. 공통 아이콘

### 2-1. 시스템 (14×14) — P1
`icon/back`(지금은 글자 ‹) `icon/info` `icon/check` `icon/plus` `icon/search` `icon/filter` `icon/sort` `icon/timer` `icon/gavel`(경매) `icon/ad_play`(광고) `icon/release`(방류) `icon/friend_add` `icon/refresh`

### 2-2. 재화 추가 (12×12) — P2
`icon/res_conservation`(보전 포인트, 72번) `icon/res_vip`(VIP 포인트)

### 2-3. 보전 상태 (12×12) — P1 (지역 정보·도감·어종 상세)
`icon/status_stable` `icon/status_vulnerable` `icon/status_protected` `icon/status_extinct`

### 2-4. 사육 (12~16px) — P1
- 용도 16×16: `icon/tank_breed` `icon/tank_display` `icon/tank_hold`
- 환경 12×12: `icon/env_temp` `icon/env_salt` `icon/env_quality`
- 설비 16×16: `icon/equip_filter` `icon/equip_heater` `icon/equip_feeder`
- 개체 정보 10×10: `icon/sex_male` `icon/sex_female` `icon/health` `icon/growth` `icon/inbreed` `icon/origin_wild` `icon/origin_farm`

### 2-5. 상점 카테고리 (24×24) — P1
`icon/store_gear`(찌) `icon/store_combine` `icon/store_gacha`(캡슐) `icon/store_premium`(보석) `icon/store_sub`(왕관+달력) `icon/store_vip` `icon/store_stamina` `icon/store_ads`

### 2-6. 아이템 (20×20) — P1
- 찌 5등급: `item/float_common` `_uncommon` `_rare` `_epic` `_legendary`
- 미끼 5등급: `item/bait_common` … `item/bait_legendary`
- `item/bait_legend_special`(전설 전용 미끼, 어종별 그림은 만들지 않고 공용 + 코드 틴트) `item/growth`(성장 아이템) `item/breed_boost`(교배 촉진)
- 합계 13장. 등급 색은 팔레트 통일(common 회, uncommon 초록, rare 파랑, epic 보라, legendary 금색).

### 2-7. 도감·소셜·기타 — P2
- `icon/region_freshwater` `icon/region_sea` `icon/region_ancient` (12×12, 도감 탭)
- `icon/legend_seen`(전설 목격) `icon/dex_new` (12×12)
- 길드 역할 10×10: `icon/role_leader` `icon/role_sub` `icon/role_member`
- 길드 엠블럼 32×32 × 8: `guild/emblem_01` … `emblem_08`
- `icon/popup_error` (32×32, 끊어진 연결), `icon/attend_check` (16×16)

### 2-8. VIP 등급 (28×28 × 10) — P2
`icon/vip_iron` `_bronze` `_silver` `_gold` `_platinum` `_emerald` `_diamond` `_master` `_grandmaster` `_challenger` (롤 랭크식 10단계)

## 3. 배경·헤더 일러스트

| 파일 | 크기 | 쓰는 곳 | 우선 |
|---|---|---|---|
| `bg/splash.png` | 360×640 | 스플래시, 로그인 배경 (바다 단면, 글자 없음) | P1 |
| `ui/logo_emblem.png` | 64×64 | 로고 문양(물결+산호+물고기). 글자 "월드씨"는 UI 폰트로 얹음 | P1 |
| `bg/hdr_market.png` `hdr_auction.png` `hdr_guild.png` | 336×56 | 시장·경매·길드 배너 | P2 |
| `bg/tank_interior_fresh.png` `_sea.png` `_ancient.png` | 336×150 | 수조 상세·개체 상세 뒤 배경(물고기는 코드로 헤엄) | P1 |
| `bg/world_map.png` | 336×200 | 지역 선택 세계 지도 (12개 지역 위치 포함) | P1 |
| `bg/region/<id>.png` ×12 | 336×96 | 지역 정보 큰 배너. 카드용 `ui/region/<id>` 84×52와 짝 | P2 |
| `bg/gacha_machine.png` | 120×140 | 헌터 외형 뽑기 기계 | P2 |
| `bg/restoration_event.png` | 336×80 | 협동 복원 이벤트 배너 (물고기 방류 장면) | P2 |
| `bg/sub_banner.png` | 336×80 | 월 구독 혜택 배너 | P3 |
| `bg/hub_stage2~4.png` 빈 방 + 객체 | | **객체로 쪼개서 만든다(확정).** 시안 크롭은 임시. 목록·크기·위치는 `docs/assets-stages.md` | P2 |

지역 id(12): `asia_fresh` `central_america_fresh` `south_america_fresh` `north_america_fresh` `pacific` `africa_fresh` `europe_fresh` `atlantic` `indian` `arctic` `devonian` `cretaceous`. 카드용 `ui/region/<id>.png` 84×52도 12장 필요(현재 임시 `reference/`만 있음).

## 4. 사람·캐릭터

| 파일 | 크기 | 쓰는 곳 | 우선 |
|---|---|---|---|
| `chr/portrait_elder.png` | 64×64 | 스토리 인트로(샵을 물려준 인물) | P1 |
| `chr/portrait_staff.png` | 64×64 | 튜토리얼 안내자, 점원 대사 | P1 |
| `story/intro_01.png` ~ `intro_04.png` | 360×360 | 스토리 컷 4장(① 낡은 동네 샵 ② 물려받는 장면 ③ 빈 수조 ④ 첫 물고기) | P1 |
| `chr/hunter/<skinId>.png` | 48×48 초상 | 헌터 외형 목록·뽑기 결과. 현재 시드된 외형은 `default` 1종뿐이라 **뽑기 외형 수는 기획 확정 후** (임시 목표 12종) | P1(default) / P2 |
| `chr/hunter/<skinId>_card.png` | 64×80 | 뽑기 결과 카드 | P2 |
| 헌터 걷기 시트 | 48×96 | 외형마다 `chr/player` 규격으로 필요한지 결정 필요(샵에서 헌터가 걷지 않으면 불필요) | 보류 |

## 5. 효과·연출 (fx)

| 파일 | 크기 | 설명 | 우선 |
|---|---|---|---|
| `fx/finger.png` | 16×16 ×2프레임 | 튜토리얼 손가락 포인터 | P1 |
| `fx/arrow_down.png` | 12×12 ×2 | 튜토리얼 화살표 | P1 |
| `fx/egg.png` | 12×12 ×4 | 교배 알/부화 단계 | P1 |
| `fx/hatch_burst.png` | 32×32 ×4 | 부화 순간 | P2 |
| `fx/dna_helix.png` | 24×48 ×4 | 교배 진행 연출 | P2 |
| `fx/discovery_rays.png` | 96×96 | 세계 최초 모프 발견 후광(회전은 코드) | P2 |
| `fx/levelup_burst.png` | 64×64 ×3 | 레벨 업 | P2 |
| `fx/reward_chest.png` | 48×40 ×2(닫힘/열림) | 보상 획득 팝업 | P2 |
| `fx/capsule_common.png` … `_legendary` | 24×24 ×5 | 뽑기 캡슐 등급별 | P2 |
| `fx/gacha_flash.png` | 64×64 ×3 | 뽑기 공개 섬광 | P3 |
| `fx/catch_flash.png` | 48×48 ×3 | 입질 성공 연출(현재 코드 효과로 대체 중) | P3 |
| `fx/map_pin.png` | 36×12 (열림/잠김/티켓) | 세계 지도 핀 3종 | P1 |
| `fx/attend_cell.png` | 108×40 (일반/수령/오늘) | 출석 달력 칸 3종 | P2 |

## 5-2. 원정 흐름 시안에서 더 필요한 것 (images/ui 원정 시안 대조) — P1~P2
현재 원정 화면은 시안 이미지 2장(`reference/region-coral`, `region-ancient`)과 헌터 3명(`hunter-kai/luna/rex`)으로 모든 지역·헌터를 대신한다.

| 파일 | 크기 | 설명 | 우선 |
|---|---|---|---|
| `ui/region/<id>.png` ×12 | 84×52 | 지역 카드·썸네일. 지금은 지역 종류별 2장 돌려쓰기 | P1 |
| `bg/region/<id>.png` ×12 | 336×96 | 수색 설정 큰 지역 그림. 시안은 지역마다 다름 | P1 |
| `icon/compass.png` | 16×16 | 원정 제목 아이콘(시안은 나침반, 지금은 지도) | P2 |
| `ui/step_dot_on.png` `step_dot_off.png` `step_line.png` | 8×8 / 8×8 / 24×2 | 지역 선택-진행-수령 단계 표시 | P2 |
| `ui/ribbon_success.png` `ribbon_fail.png` | 96×28 | 입질 결과 리본(글자 없음, 시안의 성공/실패 띠) | P2 |
| `ui/hunter_card_frame.png` | 48×48 slice 8 | 헌터 선택 카드 틀(선택 체크 포함) | P2 |
| `ui/grade_star_common` … `_legendary` | 10×10 ×5 | 물고기 칸 모서리 등급 별(시안 결과 격자) | P2 |
| `fx/spinner.png` | 24×24 ×4 | 수색 시작·수령 처리 중 로딩 | P1 |
| `ui/slot_empty_unknown.png` | 24×24 | 진행 중 미획득 칸 "?" 자리(글자는 코드) | P3 |

## 6. 물고기 관련 (신규 도안 없음, 기존 파이프라인 사용)
- 목록·도감·경매의 물고기 = `fishCompose.ts` 합성 결과. 도감 미발견·입질 실루엣 = 합성 결과를 단색 틴트(코드).
- 큰 그림(48×32)이 필요한 화면: 개체 상세, 도감 상세, 경매 상세, 부화 결과, 모프 명명. 작은 그림(16×10): 수조 상세·보관함 목록. 상세는 `docs/fish-art.md`.
- 120종 전체 물고기 겹은 별도 진행(현재 베타 큰 그림 일부만).

## 7. 앱 출시 필수 (Capacitor/Tauri) — P2

| 파일 | 크기 | 설명 |
|---|---|---|
| `app/icon.png` | 1024×1024 | 스토어 앱 아이콘 (고해상도 가능, 픽셀 느낌 유지) |
| `app/icon_foreground.png` / `icon_background.png` | 1024×1024 | 안드로이드 어댑티브 아이콘 |
| `app/notif_small.png` | 24×24 | 안드로이드 푸시 알림 작은 아이콘(흰색 단색 투명) |
| `app/splash.png` / `splash_dark.png` | 2732×2732 | 네이티브 스플래시 |
| `app/store_screenshots` | 스토어 규격 | 출시 직전 |
| 스토어 그래픽(피처) | 1024×500 | 안드로이드 |

## 8. 소리 (코드 연결은 아직 없음) — P2
- 형식 ogg(웹/모바일), 짧은 효과음 100KB 이하, 배경음은 루프.
- **BGM**: 샵(아늑한 허브), 원정 대기, 입질 미니게임(긴장), 메뉴/상점/도감 공용, 뽑기. 최소 5곡.
- **효과음**: 탭, 확인, 취소, 잠금, 오류, 코인, 보상 획득, 레벨 업, 입질 알림, 게이지 틱, 성공, 놓침, 방류, 부화, 모프 발견, 뽑기 굴림, 뽑기 공개(등급별 3단), 출석 도장. 약 20개.
- 라이선스가 확인된 소스만 사용하고 출처를 기록한다.

## 9. 폰트
Galmuri(OFL) 앱 내장 완료. 추가 불필요. (법적 원칙: IUCN 로고·상표 모프명 이미지 사용 금지.)

## 10. 제작 순서 제안
1. **P1 묶음 A (모든 화면 공통)**: §1 틀 9종(슬롯·버튼·소탭·게이지·토글·입력창 등), §2-1 시스템 아이콘
2. **P1 묶음 B (흐름)**: 스플래시·로고, 스토리 4컷+초상 2, 튜토리얼 손가락/화살표
3. **P1 묶음 C (탭별)**: 수조 배경 3종, 세계 지도+핀, 상점 카테고리 아이콘 8, 아이템 13, 사육·보전 상태 아이콘, 지역 카드·큰 그림 24(§5-2), 로딩 스피너
4. **P2**: 2~4단계 정식 장면(물고기 아닌 생물 제외), VIP 10, 길드 엠블럼 8, 연출 fx, 앱 아이콘, 소리
5. **P3**: 나머지

대략 남은 수량: 틀 약 9 · 아이콘 약 85 · 배경/배너 약 40(지역 24 포함) · 캐릭터/컷 약 8 + 외형 · fx 약 14 · 원정 보강 약 10 · 앱 7 · 소리 약 25.

## 11. 결정이 필요한 것 (대장님)
1. 헌터 외형 뽑기 종류 수와 등급 분포 → 초상·카드 수량
2. 길드 엠블럼 8종이 적당한지, 직접 업로드 없이 고르기만 하는지
3. 우편함·프로필(제안 화면)을 만들지 → 헤더·아이콘 포함 여부
4. (결정됨) 샵 2~4단계는 객체로 쪼개고 교배는 1단계 유리 돔을 재사용하며 4단계도 한 화면만 만든다 → `docs/assets-stages.md`.
5. 소리를 출시 범위에 넣을지
