# 메인 화면(샵 1단계) 에셋 목록

기준: `docs/ui-main.md`, 기준 이미지 `docs/reference/main-ui-reference.png`
- 모든 크기는 **게임 해상도 360×640 기준 픽셀**이다. 화면에서는 정수 배로 확대된다.
- 파일은 `packages/client/src/assets/<폴더>/<이름>.png`에 넣는다. **넣기만 하면 임시 도형 대신 자동으로 쓰인다** (없는 파일은 계속 임시 도형).
- 모두 PNG, 투명 배경(배경 이미지만 불투명). 글자는 절대 넣지 않는다 (글자는 UI 코드가 얹는다).
- 물고기가 아닌 생물은 넣지 않는다.

## 0. 만드는 법

1. 이미지 생성 도구의 **입력창(프롬프트)에** "공통 스타일 문구 + 에셋별 문구"를 이어 붙여 넣고 객체 하나씩 뽑는다. 문구는 생성 도구에 주는 지시문이며 **이미지 안에 글자로 들어가는 것이 아니다** (오히려 "글자 넣지 마"가 포함됨). 크게(목표 크기의 4~8배) 뽑아도 된다.
   - 예 (메인 수조 뒤판): `pixel art game asset, top-down 3/4 view ..., no watermark, large main display aquarium, rock arch, colorful coral, tall seaweed, sand, ceiling lights on the top frame, empty of fish`
2. 정리 스크립트로 목표 크기의 진짜 픽셀아트로 바꾼다.
   ```
   python packages/client/scripts/pixelize.py 원본.png packages/client/src/assets/obj/tank_main_back.png --size 158x136 --colors 32
   ```
   - 투명 영역을 잘라내고, 목표 크기에 맞게 줄이고, 색 수를 줄이고, 반투명 가장자리를 정리한다.
   - 필요하면 Aseprite 같은 도트 툴로 마무리한다.
3. `pnpm dev:client`로 확인한다. 위치·크기는 `src/game/layout.ts`의 좌표에 맞춰 놓인다.

### 지금 자동 교체되는 것
- 장면: 배경, 수조 뒤판·앞판(물고기는 코드가 사이에 그림), 교배실, 치어 수조, 카운터, 문, 매트, 간판, 액자, 벽등, 화분
- 사람: 시트가 있으면 4방향 걷기 애니메이션
- UI: 아이콘 전부, 9-slice 틀(패널·글로우 패널·금색 버튼·카드 테두리·배지), 헌터 카드 배경

### 공통 스타일 문구 (모든 에셋 프롬프트 앞에 붙임)

> pixel art game asset, top-down 3/4 view (like Stardew Valley), same style as the reference image, cozy aquarium shop, warm lamp lighting from above, dark navy and warm wood palette, crisp pixel edges, no anti-aliasing, single object centered, transparent background, no text, no letters, no watermark

## 1. 배경

| 파일 | 크기 | 설명 | 생성 문구 |
|---|---|---|---|
| `bg/hub_stage1.png` | 360×462 | 장면 영역(y 38–500) 전체. 빈 방: 뒷벽(위 96px, 나무 판자), 좌우 벽, 남청 석재 타일 바닥, 입구 쪽 나무 바닥(왼쪽 아래), 아래쪽 벽. **수조·가구·사람·글자 없음** | empty room interior, back wooden plank wall on top, dark navy stone tile floor, wooden floor strip near bottom left entrance, thin wooden side walls, no furniture, opaque background |

## 2. 장면 객체

좌표는 `layout.ts`의 STAGE1_SPOTS. 크기는 그 칸에 딱 맞게 만든다.

### 수조 (3겹 구조)
수조는 **뒤판(`_back`) → 물고기(코드) → 앞판(`_front`)** 순서로 겹친다.
- `_back`: 금속 틀, 물, 바닥 모래, 수초, 바위, 산호. 물고기는 그리지 않는다.
- `_front`: 같은 크기에 **앞 유리 반사광, 유리 테두리, 위 조명 빛만** 있고 나머지는 투명.

| 파일 | 크기 | 쓰는 곳 | 생성 문구 (뒤판) |
|---|---|---|---|
| `obj/tank_wall_back.png` / `_front` | 68×30 | 벽 선반 수조 2개 (같은 그림 재사용) | small wall-mounted shelf aquarium, front view, wooden shelf under it, plants, empty of fish |
| `obj/tank_long_back.png` / `_front` | 112×52 | 긴 진열 수조 | long low display aquarium on metal stand, sand and plants, empty of fish |
| `obj/tank_tall_back.png` / `_front` | 48×116 | 왼쪽 세로 수조 | tall vertical aquarium seen from top-down 3/4 view, coral and plants along the bottom, empty of fish |
| `obj/tank_main_back.png` / `_front` | 158×136 | 메인 수조 | large main display aquarium, rock arch, colorful coral, tall seaweed, sand, ceiling lights on the top frame, empty of fish |
| `obj/breeding_back.png` / `_front` | 58×136 | 교배실 (메인 수조 옆) | breeding station in a glass enclosure, two round glass dome incubators on metal bases with green indicator lights, stacked vertically, empty of fish |
| `obj/tank_fry_back.png` / `_front` | 80×80 | 치어 수조 2개 (재사용) | shallow low nursery aquarium, wide top water surface visible, sand, small plants, small rocks, empty of fish |

### 가구·문·장식

| 파일 | 크기 | 설명 | 생성 문구 |
|---|---|---|---|
| `obj/counter.png` | 86×66 | L자 나무 카운터 + 계산 단말기 + 작은 화분 (점원 제외) | L-shaped wooden shop counter with a small cash register screen and a tiny potted plant |
| `obj/door_double.png` | 110×70 | 칸막이 벽 + 나무 문 2개(둥근 현창, 금속 띠). 왼쪽 문 = 시장, 오른쪽 문 = 길드 | wooden partition wall with two arched wooden double doors, round porthole windows, iron bands, wall lamps on both sides |
| `obj/mat.png` | 96×44 | 입구 매트 (초록 + 금색 테두리) | green entrance rug with gold border pattern |
| `obj/sign_board.png` | 150×34 | 간판 명판 + 양옆 물결·산호 장식. **명판은 비워 둠** | blank wooden sign plate with ocean wave and coral ornaments on both sides, no text |
| `obj/painting_a.png` | 30×24 | 벽 액자 (물고기 그림) | small framed painting of tropical fish, gold frame |
| `obj/painting_b.png` | 26×20 | 벽 액자 (바닷속 풍경) | small framed painting of underwater scene, gold frame |
| `obj/lamp_wall.png` | 8×14 | 벽등 | small brass wall lantern with warm light |
| `obj/plant_a.png` | 16×20 | 화분 (넓은 잎) | potted leafy plant |
| `obj/plant_b.png` | 14×22 | 화분 (야자) | potted small palm plant |
| `obj/pedestal_empty.png` | 64×24 | 아직 해금 안 된 수조 자리의 빈 받침대 | empty metal aquarium stand, no tank on it |

## 3. 사람 (걷기 스프라이트 시트)

- 한 칸 16×24, **가로 3칸(걷기 3프레임) × 세로 4줄(아래·왼쪽·오른쪽·위)** = 48×96.
- 발이 칸 아래쪽 가운데에 오게 그린다.

| 파일 | 설명 | 생성 문구 |
|---|---|---|
| `chr/player.png` | 플레이어(대장): 갈색 모자, 탐험가 옷, 배낭 | chibi explorer with brown fedora hat and backpack, walking sprite sheet, 4 directions, 3 frames each |
| `chr/staff.png` | 점원: 빨간 셔츠 | shop clerk in red shirt, walking sprite sheet, 4 directions, 3 frames each |
| `chr/guest_a.png` ~ `guest_d.png` | 손님 4종 (어른·아이, 옷 색 다르게) | visitor character, walking sprite sheet, 4 directions, 3 frames each |

## 4. 물고기

**규격이 바뀌었다 (디자인 결정 84~88번). `docs/fish-art.md`를 따른다.** 이전의 몸틀 3종(body_round 등) 공유 방식은 쓰지 않는다.
- 어종별 겹 그림, 회색 5단계 + 팔레트 교체, 작은 그림 16×10 / 큰 그림 48×32, 꼬리 2프레임.
- 위치: `fish/<어종 id>/<s|l>/<겹>[.<모프>].png`, 확인: http://localhost:5173/fish-preview.html
- 치어(`fish/fry.png`, 6×4)는 아직 이전 규칙 그대로(공통 그림).

## 5. 효과
효과 연출 코드는 해당 기능을 만들 때 연결한다.


| 파일 | 크기 | 설명 |
|---|---|---|
| `fx/bubble.png` | 4×12 | 거품 3프레임 (4×4 세로 3칸) |
| `fx/sparkle.png` | 24×8 | 반짝임 3프레임 (8×8 가로 3칸) |
| `fx/bubble_dna.png` | 14×14 | 교배 완료 말풍선 아이콘 |
| `fx/bubble_guest.png` | 14×14 | 손님 대기 말풍선 아이콘 |

## 6. UI 틀 (9-slice)

모서리는 그대로, 가운데만 늘어나는 이미지. **slice** 값은 모서리 두께(px).

| 파일 | 크기 | slice | 쓰는 곳 | 설명 |
|---|---|---|---|---|
| `ui/panel_dark.png` | 24×24 | 6 | 상단바 칸, 장면 라벨, 샵 단계 바 | 어두운 남청 바탕, 검정 외곽 + 밝은 금속 안쪽 테두리 |
| `ui/panel_glow.png` | 32×32 | 10 | 양옆 버튼 패널 | 청록 글로우 테두리, 반투명 남청 바탕 |
| `ui/btn_gold.png` | 24×16 | 5 | 모두 수령, 활성 탭 | 금색 버튼, 아래쪽 진한 금색 그림자 |
| `ui/card_frame.png` | 32×32 | 8 | 헌터 카드 테두리(수색 중) | 청록 금속 테두리, 가운데 투명 |
| `ui/card_frame_gold.png` | 32×32 | 8 | 헌터 카드 테두리(완료) | 금색 테두리, 가운데 투명 |
| `ui/card_frame_locked.png` | 32×32 | 8 | 잠긴 카드 | 어두운 금속 테두리 + 모서리 바다 모티프 장식 |
| `ui/badge.png` | 11×11 | 3 | 알림 배지 | 빨강, 흰 안쪽 테두리 |

| 파일 | 크기 | 설명 |
|---|---|---|
| `ui/card_complete_bg.png` | 84×52 | 완료 카드 배경: 금색 세계지도 |
| `ui/card_locked_bg.png` | 84×52 | 잠긴 카드 배경: 어두운 세계지도 |
| `ui/region/asia_fresh.png` 등 | 84×52 | 수색 중 카드 배경: **지역별 바닷속 그림** (지역 id 이름으로) |

## 7. 아이콘

| 파일 | 크기 | 설명 |
|---|---|---|
| `icon/tab_shop.png` | 32×32 | 줄무늬 차양 가게 |
| `icon/tab_farm.png` | 32×32 | 물고기가 든 수조 |
| `icon/tab_expedition.png` | 32×32 | 접힌 지도 |
| `icon/tab_dex.png` | 32×32 | 왕관이 그려진 책 |
| `icon/tab_store.png` | 32×32 | 파란 장바구니 |
| `icon/res_premium.png` | 12×12 | 보라 보석 |
| `icon/res_gold.png` | 12×12 | 금화 |
| `icon/res_stamina.png` | 12×12 | 초록 번개 |
| `icon/res_ticket.png` | 12×12 | 청록 모래시계 |
| `icon/menu.png` | 14×14 | 햄버거 |
| `icon/lock.png` | 14×14 | 자물쇠 |
| `icon/side_attend.png` | 22×22 | 달력 + 체크 |
| `icon/side_restore.png` | 22×22 | 분재 |
| `icon/side_bag.png` | 22×22 | 서류 가방(흰 외곽선) |
| `icon/side_friends.png` | 22×22 | 두 사람(흰 외곽선) |
| `icon/avatar_default.png` | 24×24 | 헌터 얼굴 (프로필) |

아이콘 생성 문구: `pixel art game UI icon, <설명>, bold outline, transparent background, no text`

## 8. 우선순위

1. **배경 + 메인 수조 + 카운터 + 문** (화면 인상의 대부분)
2. 나머지 수조, 교배실, 치어 수조
3. 탭·재화 아이콘, UI 틀
4. 사람 스프라이트
5. 물고기 레이어, 효과
