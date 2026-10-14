# 전체 화면 에셋 목록 (메인 화면 외)

메인 화면(샵 1단계)은 `docs/assets-main.md`가 따로 정리한다. 이 문서는 **그 외 모든 화면**(`docs/screens.md`, 스켈레톤 `client/src/ui/screens.ts`)에 필요한 에셋이다.
- 규칙은 assets-main.md와 같다: 게임 해상도 360×640 기준 px, PNG 투명 배경, **이미지 안에 글자 금지**(글자는 UI 레이어), 물고기가 아닌 생물 금지, `python packages/client/scripts/pixelize.py`로 정리, `packages/client/src/assets/<폴더>/<이름>.png`에 넣으면 `src/game/assets.ts`가 인식.
- 스켈레톤 화면은 임시 시안(`reference/`)만 읽는다. 정식 에셋은 실제 화면을 만들 때 `assetUrl('폴더/이름')`으로 연결하고, 파일이 없으면 임시 도형을 쓴다.
- **우선순위** P1 = 화면 인상·핵심 흐름 / P2 = 완성도 / P3 = 있으면 좋음. 수량은 개수.
- 이 문서는 **아직 없는 것만** 적는다. 도착한 것은 §0에 묶음별로만 적고 목록에서는 지웠다. 적용 완료분: 시안 사본(`images/asset/asset_copy` → `src/assets/reference/`)을 쓰는 제목 바·닫기·설정/우편/트로피/별 아이콘·목록 행·정보 팝업·나무 패널·코랄 배너·잠금 카드, `bg/hub_stage1~4`, `icon/` 16종, `ui/card_*_bg`.
- `reference/`와 `bg/hub_stage2~4`는 고해상도 시안 크롭이라 **임시**다. 정식 도트 에셋이 나오면 같은 이름으로 바꿔 넣는다.

## 0. 도착해서 `src/assets/`에 복사한 묶음 (2026-10-14) — 화면 연결은 아직
`images/asset/worldsea_p1_A` `p1_B` `p1_C` `p2` 네 묶음, PNG 161장을 폴더 트리 그대로 `packages/client/src/assets/`에 복사했다(`ui/region/asia_fresh.png`는 덮어씀). 크기는 아래 규격과 모두 맞다. 원본과 `manifest.json`(9-slice 값·프레임 수)은 `images/asset/`에 남아 있다.

| 묶음 | 내용 (장수) |
|---|---|
| `p1_A` (30) | `ui/` 틀 13: `sheet_frame` `dialog_frame` `slot_frame` `list_row` `btn_gray` `btn_red` `tab_on/off` `gauge_frame` `toggle_on/off` `input_frame` `scroll_thumb` / `icon/` 시스템 17: `back` `info` `check` `plus` `search` `filter` `sort` `timer` `gavel` `ad_play` `release` `friend_add` `refresh` `close` `mail` `settings` `trophy` |
| `p1_B` (11) | `bg/splash` `ui/logo_emblem` `chr/portrait_elder` `portrait_staff` `story/intro_01~04` `fx/finger` `arrow_down` `egg` |
| `p1_C` (49) | `bg/hdr_farm` `hdr_dex` `hdr_store` `tank_interior_fresh/sea/ancient` `world_map` `fx/map_pin` / `icon/` 사육·개체·상점: `tank_*`3 `env_*`3 `equip_*`3 `sex_*`2 `health` `growth` `inbreed` `origin_*`2 `status_*`4 `store_*`8 / `item/` 13(찌 5·미끼 6·`growth`·`breed_boost`) |
| `p2` (71) | `ui/region/<id>` 12, `bg/region/<id>` 12, `bg/hdr_market` `hdr_auction` `hdr_guild` `gacha_machine` `restoration_event` / `guild/emblem_01~08` / `icon/vip_*` 10, `region_*`3, `res_conservation` `res_vip`, `role_*`3, `legend_seen` `dex_new` `popup_error` `attend_check` / `fx/` 12: `attend_cell` `capsule_*`5 `discovery_rays` `dna_helix` `gacha_flash` `hatch_burst` `levelup_burst` `reward_chest` |

- **연결 방법**: `assetUrl('폴더/이름')`. 글자는 HTML/CSS, 확대는 `image-rendering: pixelated`와 정수 배.
- **스프라이트 시트**: 가로로 이어 붙인 프레임이다. `finger` 32×16(2) `arrow_down` 24×12(2) `egg` 48×12(4) `map_pin` 36×12(3) `capsule_*` 120×24(5) `attend_cell` 324×40(3, 칸 108×40) `reward_chest` 96×40(2) `hatch_burst` 128×32(4) `dna_helix` 96×48(4) `levelup_burst` 192×64(3) `gacha_flash` 192×64(3). 정확한 프레임 정보는 `manifest.json`.
- **복사하지 않음**: `images/asset/bg/hub_stage2~4.png`(+`manifest.json`)는 시안 크롭 원본이다. 특히 `hub_stage4`는 360×900(드래그 장면)이라 **확정한 한 화면(360×462)** 과 다르다. 클라이언트 쪽 `bg/hub_stage4.png`는 이미 462로 잘라 놓은 것을 그대로 둔다.
- p2 README: 새로 그린 기준 아트이며 눈으로 검수한 뒤 수정할 수 있다. VIP 10단계·길드 엠블럼 8종·지역 12개는 §11 결정과 같이 확인할 것.
- 도착한 에셋을 쓰는 화면이 아직 없다(스켈레톤은 `reference/`만 읽음). 실제 화면을 만들 때 하나씩 연결하고, 연결한 뒤에는 §0 표에서 지운다.

## 1. 헌터·사람 — 아직 없음

| 파일 | 크기 | 쓰는 곳 | 우선 |
|---|---|---|---|
| `chr/hunter/<skinId>.png` | 48×48 초상 | 헌터 외형 목록·뽑기 결과. 현재 시드된 외형은 `default` 1종뿐이라 **뽑기 외형 수는 기획 확정 후** (임시 목표 12종) | P1(default) / P2 |
| `chr/hunter/<skinId>_card.png` | 64×80 | 뽑기 결과 카드 | P2 |
| 헌터 걷기 시트 | 48×96 | 외형마다 `chr/player` 규격으로 필요한지 결정 필요(샵에서 헌터가 걷지 않으면 불필요) | 보류 |
| `chr/guest_e` ~ `guest_h` | 48×96 | 2~4단계 관람객 4종(`docs/assets-stages.md` §4) | P3 |

## 2. 배경·연출 — 아직 없음

| 파일 | 크기 | 쓰는 곳 | 우선 |
|---|---|---|---|
| `bg/sub_banner.png` | 336×80 | 월 구독 혜택 배너 | P3 |
| `fx/catch_flash.png` | 48×48 ×3 | 입질 성공 연출(현재 코드 효과로 대체 중) | P3 |
| `bg/hub_stage2~4.png` 빈 방 + 객체 | | **객체로 쪼개서 만든다(확정).** 시안 크롭은 임시. 목록·크기·위치는 `docs/assets-stages.md` (67장) | P2 |

## 3. 원정 흐름 시안에서 더 필요한 것 (images/ui 원정 시안 대조) — P1~P2
지역 카드(`ui/region`)·큰 그림(`bg/region`)은 p2 묶음으로 도착했다(§0). 연결 전까지 원정 화면은 시안 이미지 2장(`reference/region-coral`, `region-ancient`)과 헌터 3명(`hunter-kai/luna/rex`)으로 모든 지역·헌터를 대신한다.

| 파일 | 크기 | 설명 | 우선 |
|---|---|---|---|
| `fx/spinner.png` | 24×24 ×4 | 수색 시작·수령 처리 중 로딩 | P1 |
| `icon/compass.png` | 16×16 | 원정 제목 아이콘(시안은 나침반, 지금은 지도) | P2 |
| `ui/step_dot_on.png` `step_dot_off.png` `step_line.png` | 8×8 / 8×8 / 24×2 | 지역 선택-진행-수령 단계 표시 | P2 |
| `ui/ribbon_success.png` `ribbon_fail.png` | 96×28 | 입질 결과 리본(글자 없음, 시안의 성공/실패 띠) | P2 |
| `ui/hunter_card_frame.png` | 48×48 slice 8 | 헌터 선택 카드 틀(선택 체크 포함) | P2 |
| `ui/grade_star_common` … `_legendary` | 10×10 ×5 | 물고기 칸 모서리 등급 별(시안 결과 격자) | P2 |
| `ui/slot_empty_unknown.png` | 24×24 | 진행 중 미획득 칸 "?" 자리(글자는 코드) | P3 |

## 4. 물고기 관련 (신규 도안 없음, 기존 파이프라인 사용)
- 목록·도감·경매의 물고기 = `fishCompose.ts` 합성 결과. 도감 미발견·입질 실루엣 = 합성 결과를 단색 틴트(코드).
- 큰 그림(48×32)이 필요한 화면: 개체 상세, 도감 상세, 경매 상세, 부화 결과, 모프 명명. 작은 그림(16×10): 수조 상세·보관함 목록. 상세는 `docs/fish-art.md`.
- 120종 전체 물고기 겹은 별도 진행(현재 베타 큰 그림 일부만).

## 5. 앱 출시 필수 (Capacitor/Tauri) — P2

| 파일 | 크기 | 설명 |
|---|---|---|
| `app/icon.png` | 1024×1024 | 스토어 앱 아이콘 (고해상도 가능, 픽셀 느낌 유지) |
| `app/icon_foreground.png` / `icon_background.png` | 1024×1024 | 안드로이드 어댑티브 아이콘 |
| `app/notif_small.png` | 24×24 | 안드로이드 푸시 알림 작은 아이콘(흰색 단색 투명) |
| `app/splash.png` / `splash_dark.png` | 2732×2732 | 네이티브 스플래시 |
| `app/store_screenshots` | 스토어 규격 | 출시 직전 |
| 스토어 그래픽(피처) | 1024×500 | 안드로이드 |

## 6. 소리 (코드 연결은 아직 없음) — P2
- 형식 ogg(웹/모바일), 짧은 효과음 100KB 이하, 배경음은 루프.
- **BGM**: 샵(아늑한 허브), 원정 대기, 입질 미니게임(긴장), 메뉴/상점/도감 공용, 뽑기. 최소 5곡.
- **효과음**: 탭, 확인, 취소, 잠금, 오류, 코인, 보상 획득, 레벨 업, 입질 알림, 게이지 틱, 성공, 놓침, 방류, 부화, 모프 발견, 뽑기 굴림, 뽑기 공개(등급별 3단), 출석 도장. 약 20개.
- 라이선스가 확인된 소스만 사용하고 출처를 기록한다.

## 7. 폰트
Galmuri(OFL) 앱 내장 완료. 추가 불필요. (법적 원칙: IUCN 로고·상표 모프명 이미지 사용 금지.)

## 8. 제작 순서 제안
1. **연결 작업(그림 없음)**: §0 묶음을 쓰도록 스켈레톤을 실제 화면으로 바꾸면서 하나씩 연결
2. **P1 남은 것**: 로딩 스피너, 헌터 `default` 초상
3. **P2**: 2~4단계 정식 장면(`assets-stages.md`, 물고기 아닌 생물 제외), 원정 보강 §3, 헌터 외형·카드, 앱 아이콘, 소리
4. **P3**: 구독 배너, 입질 성공 효과, 관람객 4종, "?" 칸

대략 남은 수량: 원정 보강 14 · 헌터 초상/카드 2+(외형 수×2) · 배너/연출 2 · 2~4단계 67 · 앱 7 · 소리 약 25.

## 9. 결정이 필요한 것 (대장님)
1. 헌터 외형 뽑기 종류 수와 등급 분포 → 초상·카드 수량
2. 길드 엠블럼 8종이 적당한지(p2에 8종 도착), 직접 업로드 없이 고르기만 하는지
3. 우편함·프로필(제안 화면)을 만들지 → 헤더·아이콘 포함 여부 (우편 아이콘 `icon/mail`은 p1_A에 있음)
4. (결정됨) 샵 2~4단계는 객체로 쪼개고 교배는 1단계 유리 돔을 재사용하며 4단계도 한 화면만 만든다 → `docs/assets-stages.md`.
5. 소리를 출시 범위에 넣을지
