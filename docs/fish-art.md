# 물고기 그림 규격 (디자인 결정 84~88번)

물고기는 **어종별 겹(레이어) 그림**을 유전자대로 겹치고, 색은 **팔레트 교체**로 칠한다. 이 문서는 그림을 만드는 사람이 따라야 할 규격과 작업 순서, 어종별 작업 목록이다.

- 규칙 코드: `packages/shared/src/game/fishArt.ts` (규격 상수, 합성 계획), 모프 정의: `packages/shared/src/game/morphs.ts`
- 합성 코드: `packages/client/src/game/fishCompose.ts`
- **미리보기 페이지**: `pnpm dev:client` 후 http://localhost:5173/fish-preview.html. 파일을 넣으면 유전자 조합별 합성 결과, 그려야 할 파일 목록, 규격 검사(크기·회색 단계·반투명)를 바로 보여 준다.
- 어종별 작업 목록(아래 5장)은 `pnpm --filter @worldsea/shared exec tsx scripts/fish-art-list.ts`로 다시 만든다.

## 1. 크기와 파일 위치

| 벌 | 한 프레임 | 파일 크기(2프레임) | 쓰는 곳 |
|---|---|---|---|
| 작은 그림 `s` | 16×10 | 32×10 | 수조·샵 장면 |
| 큰 그림 `l` | 48×32 | 96×32 | 개체 상세·도감·경매 |

- 위치: `packages/client/src/assets/fish/<어종 id>/<s|l>/<겹>[.<모프 id>].png`
  - 예: `fish/betta_splendens/l/body.png`, `fish/betta_splendens/l/fin_back.halfmoon.png`
- **머리는 왼쪽**을 보게 그린다. 오른쪽으로 헤엄칠 때는 코드가 뒤집는다.
- 물고기는 칸 안에서 **가운데**, 모든 겹이 같은 칸·같은 위치 기준으로 겹쳐진다 (겹마다 위치를 옮기지 않는다).
- 작은 그림은 큰 그림을 자동으로 줄이지 않는다. 큰 그림을 보고 손으로 다시 찍는다(줄이면 뭉개짐).

## 2. 프레임 (꼬리 흔들기 2프레임)

- 모든 겹 파일은 **가로 2프레임**: 왼쪽 칸 = 꼬리 위쪽(또는 왼쪽)으로, 오른쪽 칸 = 반대쪽.
- 안 움직이는 겹(몸, 무늬, 눈)은 같은 그림을 두 칸에 둔다. 한 칸짜리(16×10, 48×32) 파일도 받아 주지만(두 칸에 복사) 되도록 2프레임으로 맞춘다.
- 꼬리지느러미는 `fin_front`(또는 꼬리가 몸 뒤로 보이면 `fin_back`)에 넣고 그 겹만 프레임마다 다르게 그린다.
- 두 장을 붙이는 도구: `python packages/client/scripts/fish-strip.py 프레임0.png 프레임1.png 결과.png` (한 장만 주면 복사)
- 위아래 떠다니기, 방향 전환, 속도는 코드가 한다.

## 3. 겹 (아래 → 위 순서 고정)

| 겹 파일 | 내용 | 칠하는 팔레트 줄 |
|---|---|---|
| `fin_back` | 몸 뒤쪽 지느러미(반대편 가슴·배지느러미, 몸 뒤로 보이는 꼬리) | 지느러미 |
| `body` (필수) | 몸 실루엣·명암. 머리, 몸통, 꼬리자루 포함. **윤곽선은 가장 어두운 회색으로 여기 그린다** | 몸 |
| `scale` | 비늘 모프(예: 코이 도이츠) | 몸 |
| `pattern` | 무늬(띠, 반점, 얼룩). **야생형 무늬도 몸에 그리지 말고 여기에** | 무늬 |
| `fin_front` | 앞쪽 지느러미·꼬리지느러미 | 지느러미 |
| `line` (필수) | 눈과 꼭 고정색이어야 하는 선. 팔레트로 바뀌지 않는다 | 바꾸지 않음 |

- 모프 파일 `<겹>.<모프 id>`가 있으면 그 겹의 기본 파일 대신 쓴다. 예: 하프문 베타는 `fin_back.halfmoon` + `fin_front.halfmoon`이 `fin_back`·`fin_front`를 대신한다.
- 야생형 모프는 기본 파일과 같은 뜻이라 따로 그리지 않는다.
- 색 모프(레드, 블루, 알비노 …)는 **그림이 없다**. 팔레트만 다르다.
- 무늬·지느러미 색이 몸과 달라야 하면 반드시 그 겹으로 분리한다(같은 겹에 그리면 같은 색으로 칠해진다).

## 4. 색 (팔레트 교체)

- `line`을 뺀 모든 겹은 아래 **회색 5단계만** 쓴다. 다른 색·반투명 픽셀은 미리보기 검사에서 빨간색으로 표시된다.

| 단계 | 회색 | 뜻 |
|---|---|---|
| 1 | `#ffffff` | 가장 밝은 빛 |
| 2 | `#cccccc` | 밝은 면 |
| 3 | `#999999` | 기본 면 |
| 4 | `#666666` | 그늘 |
| 5 | `#333333` | 가장 어두운 그늘·윤곽선 |

- 게임은 이 5단계를 유전자가 정한 팔레트(몸·지느러미·무늬 줄마다 5색)로 바꿔 칠한다. 팔레트는 `morphs.ts`에 어종·색 모프별로 있고, 미리보기에서 보며 조정한다.
- 투명은 완전 투명만. 반투명(안티앨리어싱) 금지.
- `line` 겹은 자유 색(예: 눈 `#141418`, 눈 반짝임 `#ffffff`).

## 5. 작업 순서 (생성 도구 → 정리 → 겹 나누기)

1. **기본 그림 생성**: 어종별 프롬프트(6장)로 야생형 물고기를 회색조로 생성한다. 생성 이미지 안의 글자는 쓰지 않는다.
2. **정리**: `python packages/client/scripts/pixelize.py 생성.png 정리.png --size 48x32 --align center --gray`
   - `--gray`가 밝기를 늘려 회색 5단계로 강제 변환한다.
3. **겹 나누기** (Aseprite 등): 정리한 그림을 겹 규칙(3장)대로 `body` / `pattern` / `fin_back` / `fin_front` / `line`으로 나눈다.
4. **꼬리 2프레임**: 꼬리가 든 겹만 두 번째 프레임을 그리고 `fish-strip.py`로 붙인다.
5. **모프 겹**: 모프 프롬프트(같은 포즈 + 모프 설명)로 다시 생성 → 정리 → 해당 겹만 잘라 `<겹>.<모프 id>.png`로 저장한다. 몸과 위치가 맞는지 미리보기에서 확인한다.
6. **작은 그림**: 큰 그림을 보고 16×10으로 손으로 찍는다. 겹 나누기·프레임 규칙은 같다.
7. **확인**: 미리보기 페이지에서 모든 색·모프 조합을 돌려 보고, 파일 표가 모두 "정상"인지 본다.

순서: **1단계 지역(아시아·중미 민물) 19종 먼저** 만들어 시험하고, 결과를 보고 나머지 지역으로 넓힌다 (89번).

## 6. 어종별 작업 목록 (1단계 지역)

프롬프트는 생성 도구에 넣는 영어 문구다(그림 안에 글자를 넣는 것이 아님). 모프 겹은 기본 프롬프트에서 생김새 부분만 모프 설명으로 바꾸거나 덧붙여, **같은 포즈·같은 크기**로 생성한다.

### 아시아 민물

#### 베타 · `betta_splendens`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single betta fish (Siamese fighting fish) (Betta splendens), short plakat fins, slender body, upturned mouth, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 야생 · 레드 · 블루 · 화이트
- 필수 파일: `body`, `line`, `pattern.marble`, `pattern.butterfly`, `fin_back.veil`, `fin_front.veil`, `fin_back.halfmoon`, `fin_front.halfmoon` (+ 선택 `fin_back`, `fin_front`, `pattern`)
  - 마블 → pattern 겹: 같은 포즈로 `irregular blotchy marble patches`
  - 버터플라이 → pattern 겹: 같은 포즈로 `clear band at the outer edge of fins`
  - 베일 → 지느러미 겹(fin_back·fin_front): 같은 포즈로 `long flowing veil tail drooping down`
  - 하프문 → 지느러미 겹(fin_back·fin_front): 같은 포즈로 `huge round tail spread in a 180 degree half circle`

#### 드워프 구라미 · `trichogaster_lalius`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single dwarf gourami (Trichogaster lalius), oval laterally compressed body, thread-like pelvic feelers, diagonal stripes, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 야생 · 블루 · 레드 · 파우더블루
- 필수 파일: `body`, `line` (+ 선택 `fin_back`, `fin_front`, `pattern`)

#### 하렌퀸 라스보라 · `trigonostigma_heteromorpha`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single harlequin rasbora (Trigonostigma heteromorpha), small deep-bodied fish with a black triangular wedge patch on the rear half, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 야생 · 골드 · 알비노
- 필수 파일: `body`, `line` (+ 선택 `fin_back`, `fin_front`, `pattern`)

#### 체리바브 · `puntius_titteya`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single cherry barb (Puntius titteya), small torpedo body, dark lateral stripe, tiny barbels, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 레드 · 골드
- 필수 파일: `body`, `line` (+ 선택 `fin_back`, `fin_front`, `pattern`)

#### 금붕어 · `carassius_auratus`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single goldfish (Carassius auratus), common goldfish, chunky body, single short tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 야생 · 레드 · 캘리코 · 블랙
- 필수 파일: `body`, `line`, `fin_back.comet`, `fin_front.comet`, `fin_back.fantail`, `fin_front.fantail`, `fin_back.veil`, `fin_front.veil` (+ 선택 `fin_back`, `fin_front`, `pattern`)
  - 코멧 → 지느러미 겹(fin_back·fin_front): 같은 포즈로 `long deeply forked single tail`
  - 팬테일 → 지느러미 겹(fin_back·fin_front): 같은 포즈로 `short double split tail fanned out`
  - 베일 → 지느러미 겹(fin_back·fin_front): 같은 포즈로 `very long flowing double veil tail`

#### 펄 구라미 · `trichopodus_leerii`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single pearl gourami (Trichopodus leerii), oval compressed body, thread-like pelvic feelers, covered in tiny pearl dots, dark zigzag line, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 필수 파일: `body`, `line`, `pattern.reduced` (+ 선택 `fin_back`, `fin_front`, `pattern`)
  - 스팟 감소 → pattern 겹: 같은 포즈로 `fewer, larger pearl dots`

#### 클라운 로치 · `chromobotia_macracanthus`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single clown loach (Chromobotia macracanthus), elongated body, down-turned mouth with barbels, three thick vertical bands, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 오렌지 · 옅은 오렌지 · 진한 오렌지
- 필수 파일: `body`, `line` (+ 선택 `fin_back`, `fin_front`, `pattern`)

#### 쉬리 · `coreoleuciscus_splendidus`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single Korean splendid dace (Coreoleuciscus splendidus), slender stream minnow, horizontal band along the side, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 필수 파일: `body`, `line`, `pattern.faint`, `pattern.bold` (+ 선택 `fin_back`, `fin_front`, `pattern`)
  - 흐린 띠 → pattern 겹: 같은 포즈로 `thin faded band`
  - 선명한 띠 → pattern 겹: 같은 포즈로 `thick vivid band`

#### 코이 · `cyprinus_rubrofuscus`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single koi carp (Cyprinus rubrofuscus), large carp body, barbels, full scales, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 야생 · 홍백 · 삼색 · 황금
- 필수 파일: `body`, `line`, `pattern.spotted`, `scale.doitsu` (+ 선택 `fin_back`, `fin_front`, `pattern`)
  - 반점 → pattern 겹: 같은 포즈로 `large irregular patches over the back`
  - 도이츠 → scale 겹: 같은 포즈로 `scaleless skin with a single row of big scales along the back`

#### 아시아 아로와나 · `scleropages_formosus`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single Asian arowana (Scleropages formosus), long sword-shaped body, large metallic scales, upturned mouth with chin barbels, fins set far back, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 그린 · 레드 · 골드
- 필수 파일: `body`, `line` (+ 선택 `fin_back`, `fin_front`, `pattern`)


### 중미 민물

#### 소드테일 · `xiphophorus_hellerii`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single green swordtail (Xiphophorus hellerii), slim livebearer, long sword extension on the lower tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 그린 · 레드 · 블랙
- 필수 파일: `body`, `line`, `fin_back.hifin`, `fin_front.hifin` (+ 선택 `fin_back`, `fin_front`, `pattern`)
  - 하이핀 → 지느러미 겹(fin_back·fin_front): 같은 포즈로 `tall sail-like dorsal fin`

#### 플래티 · `xiphophorus_maculatus`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single southern platy (Xiphophorus maculatus), small stocky livebearer, rounded tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 야생 · 레드 · 블루 · 선셋
- 필수 파일: `body`, `line`, `pattern.mickey`, `pattern.tuxedo` (+ 선택 `fin_back`, `fin_front`, `pattern`)
  - 미키마우스 → pattern 겹: 같은 포즈로 `three-dot mickey mouse mark at the tail base`
  - 턱시도 → pattern 겹: 같은 포즈로 `dark rear half of the body`

#### 몰리 · `poecilia_sphenops`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single molly (Poecilia sphenops), stocky livebearer, rounded tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 야생 · 블랙 · 달마시안 · 골드
- 필수 파일: `body`, `line` (+ 선택 `fin_back`, `fin_front`, `pattern`)

#### 컨빅 시클리드 · `amatitlania_nigrofasciata`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single convict cichlid (Amatitlania nigrofasciata), compact cichlid with 8 dark vertical bars, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 야생 · 핑크 알비노
- 필수 파일: `body`, `line` (+ 선택 `fin_back`, `fin_front`, `pattern`)

#### 파이어마우스 시클리드 · `thorichthys_meeki`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single firemouth cichlid (Thorichthys meeki), cichlid with a bright throat, dark spot on the gill cover, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 야생 · 진한 붉은 목
- 필수 파일: `body`, `line` (+ 선택 `fin_back`, `fin_front`, `pattern`)

#### 레드 데빌 시클리드 · `amphilophus_labiatus`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single red devil cichlid (Amphilophus labiatus), heavy cichlid with thick lips and a slight nuchal hump, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 야생 · 오렌지 · 화이트
- 필수 파일: `body`, `line` (+ 선택 `fin_back`, `fin_front`, `pattern`)

#### 멕시코 테트라 · `astyanax_mexicanus`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single Mexican tetra (Astyanax mexicanus), small silvery tetra with an adipose fin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 색 모프(그림 없음, 팔레트): 야생 · 알비노
- 필수 파일: `body`, `line`, `line.blind` (+ 선택 `fin_back`, `fin_front`, `pattern`)
  - 동굴형 무안형 → 눈 겹(line): 같은 포즈로 `cave form without eyes, skin over the eye sockets`

#### 재규어 시클리드 · `parachromis_managuensis`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single jaguar cichlid (Parachromis managuensis), large predatory cichlid, big mouth, dark spots all over, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 필수 파일: `body`, `line`, `pattern.dense`, `pattern.sparse` (+ 선택 `fin_back`, `fin_front`, `pattern`)
  - 빽빽한 반점 → pattern 겹: 같은 포즈로 `many small dense spots`
  - 듬성한 반점 → pattern 겹: 같은 포즈로 `few scattered spots`

#### 트로피컬 가 · `atractosteus_tropicus`

- 기본(야생형) 프롬프트: `pixel art sprite, side view, head facing left, single tropical gar (Atractosteus tropicus), very long cylindrical body, long toothy snout, rear-set dorsal fin, spotted, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark`
- 필수 파일: `body`, `line`, `pattern.dense`, `pattern.faint` (+ 선택 `fin_back`, `fin_front`, `pattern`)
  - 진한 점박이 → pattern 겹: 같은 포즈로 `heavy dark spotting`
  - 흐린 점박이 → pattern 겹: 같은 포즈로 `faint sparse spots`

