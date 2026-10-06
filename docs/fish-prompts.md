# 물고기 생성 프롬프트 (120종)

규격과 작업 순서는 `docs/fish-art.md`. 이 문서는 `pnpm --filter @worldsea/shared exec tsx scripts/fish-art-list.ts > docs/fish-prompts.md`로 다시 만든다 (직접 고치지 말고 `scripts/fish-art-notes.ts`·`src/game/morphs.ts`를 고친다).

- **기본 프롬프트**: 야생형 한 장. 이것으로 `body`·`line`(+ 있으면 `fin_back`·`fin_front`·`pattern`)을 만든다.
- **모프 프롬프트**: 같은 포즈·같은 크기로 생성해 해당 겹만 잘라 `<겹>.<모프 id>.png`로 저장한다. 기본 그림을 참고 이미지로 함께 넣으면 포즈가 잘 맞는다.
- **색 모프**는 그림이 없다(팔레트만). 고대 어종과 오리지널은 아직 모프가 없어 기본 한 장이면 된다.
- 정리: `python packages/client/scripts/fish-pixelize.py 생성.png 정리.png` → 겹 나누기 → 꼬리 2프레임(`fish-strip.py`) → 미리보기 확인.

## 1단계

### 아시아 민물 (11종)

#### 베타 · `betta_splendens` · 일반

기본:
```
pixel art sprite, side view, head facing left, single betta fish (Siamese fighting fish) (Betta splendens), plakat type with very short rounded fins and a short round tail, not long-finned, slender muscular body, upturned mouth, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 레드 · 블루 · 화이트
- 필수 파일: `body`, `line`, `pattern.marble`, `pattern.butterfly`, `fin_back.veil`, `fin_back.halfmoon`
- 모프 **마블** → `pattern.marble`
  ```
  pixel art sprite, side view, head facing left, single betta fish (Siamese fighting fish) (Betta splendens), irregular blotchy marble patches, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **버터플라이** → `pattern.butterfly`
  ```
  pixel art sprite, side view, head facing left, single betta fish (Siamese fighting fish) (Betta splendens), clear band at the outer edge of fins, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **베일** → `fin_back.veil`, `fin_front.veil` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single betta fish (Siamese fighting fish) (Betta splendens), long flowing veil tail drooping down, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **하프문** → `fin_back.halfmoon`, `fin_front.halfmoon` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single betta fish (Siamese fighting fish) (Betta splendens), huge round tail spread in a 180 degree half circle, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 드워프 구라미 · `trichogaster_lalius` · 일반

기본:
```
pixel art sprite, side view, head facing left, single dwarf gourami (Trichogaster lalius), oval laterally compressed body, thread-like pelvic feelers, diagonal stripes, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 블루 · 레드 · 파우더블루
- 필수 파일: `body`, `line`

#### 하렌퀸 라스보라 · `trigonostigma_heteromorpha` · 일반

기본:
```
pixel art sprite, side view, head facing left, single harlequin rasbora (Trigonostigma heteromorpha), small deep-bodied fish with a black triangular wedge patch on the rear half, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 골드 · 알비노
- 필수 파일: `body`, `line`

#### 체리바브 · `puntius_titteya` · 일반

기본:
```
pixel art sprite, side view, head facing left, single cherry barb (Puntius titteya), small torpedo body, dark lateral stripe, tiny barbels, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 레드 · 골드
- 필수 파일: `body`, `line`

#### 금붕어 · `carassius_auratus` · 고급

기본:
```
pixel art sprite, side view, head facing left, single goldfish (Carassius auratus), common goldfish, chunky body, single short tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 레드 · 캘리코 · 블랙
- 필수 파일: `body`, `line`, `fin_back.comet`, `fin_back.fantail`, `fin_back.veil`
- 모프 **코멧** → `fin_back.comet`, `fin_front.comet` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single goldfish (Carassius auratus), long deeply forked single tail, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **팬테일** → `fin_back.fantail`, `fin_front.fantail` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single goldfish (Carassius auratus), short double split tail fanned out, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **베일** → `fin_back.veil`, `fin_front.veil` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single goldfish (Carassius auratus), very long flowing double veil tail, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 펄 구라미 · `trichopodus_leerii` · 고급

기본:
```
pixel art sprite, side view, head facing left, single pearl gourami (Trichopodus leerii), oval compressed body, thread-like pelvic feelers, covered in tiny pearl dots, dark zigzag line, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.reduced`
- 모프 **스팟 감소** → `pattern.reduced`
  ```
  pixel art sprite, side view, head facing left, single pearl gourami (Trichopodus leerii), fewer, larger pearl dots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 클라운 로치 · `chromobotia_macracanthus` · 고급

기본:
```
pixel art sprite, side view, head facing left, single clown loach (Chromobotia macracanthus), elongated body, down-turned mouth with barbels, three thick vertical bands, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 오렌지 · 옅은 오렌지 · 진한 오렌지
- 필수 파일: `body`, `line`

#### 쉬리 · `coreoleuciscus_splendidus` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single Korean splendid dace (Coreoleuciscus splendidus), slender stream minnow, horizontal band along the side, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.faint`, `pattern.bold`
- 모프 **흐린 띠** → `pattern.faint`
  ```
  pixel art sprite, side view, head facing left, single Korean splendid dace (Coreoleuciscus splendidus), thin faded band, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **선명한 띠** → `pattern.bold`
  ```
  pixel art sprite, side view, head facing left, single Korean splendid dace (Coreoleuciscus splendidus), thick vivid band, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 코이 · `cyprinus_rubrofuscus` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single koi carp (Cyprinus rubrofuscus), large carp body, barbels, full scales, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 홍백 · 삼색 · 황금
- 필수 파일: `body`, `line`, `pattern.spotted`, `scale.doitsu`
- 모프 **반점** → `pattern.spotted`
  ```
  pixel art sprite, side view, head facing left, single koi carp (Cyprinus rubrofuscus), large irregular patches over the back, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **도이츠** → `scale.doitsu`
  ```
  pixel art sprite, side view, head facing left, single koi carp (Cyprinus rubrofuscus), scaleless skin with a single row of big scales along the back, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 아시아 아로와나 · `scleropages_formosus` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single Asian arowana (Scleropages formosus), long sword-shaped body, large metallic scales, upturned mouth with chin barbels, fins set far back, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 그린 · 레드 · 골드
- 필수 파일: `body`, `line`

#### 월광비늘어 · `orig_moonscale` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy moonlight scale fish, small elegant fish with crescent-shaped glowing scales, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

### 중미 민물 (10종)

#### 소드테일 · `xiphophorus_hellerii` · 일반

기본:
```
pixel art sprite, side view, head facing left, single green swordtail (Xiphophorus hellerii), slim livebearer, long sword extension on the lower tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 그린 · 레드 · 블랙
- 필수 파일: `body`, `line`, `fin_back.hifin`
- 모프 **하이핀** → `fin_back.hifin`, `fin_front.hifin` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single green swordtail (Xiphophorus hellerii), tall sail-like dorsal fin, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 플래티 · `xiphophorus_maculatus` · 일반

기본:
```
pixel art sprite, side view, head facing left, single southern platy (Xiphophorus maculatus), small stocky livebearer, rounded tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 레드 · 블루 · 선셋
- 필수 파일: `body`, `line`, `pattern.mickey`, `pattern.tuxedo`
- 모프 **미키마우스** → `pattern.mickey`
  ```
  pixel art sprite, side view, head facing left, single southern platy (Xiphophorus maculatus), three-dot mickey mouse mark at the tail base, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **턱시도** → `pattern.tuxedo`
  ```
  pixel art sprite, side view, head facing left, single southern platy (Xiphophorus maculatus), dark rear half of the body, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 몰리 · `poecilia_sphenops` · 일반

기본:
```
pixel art sprite, side view, head facing left, single molly (Poecilia sphenops), stocky livebearer, rounded tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 블랙 · 달마시안 · 골드
- 필수 파일: `body`, `line`

#### 컨빅 시클리드 · `amatitlania_nigrofasciata` · 일반

기본:
```
pixel art sprite, side view, head facing left, single convict cichlid (Amatitlania nigrofasciata), compact cichlid with 8 dark vertical bars, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 핑크 알비노
- 필수 파일: `body`, `line`

#### 파이어마우스 시클리드 · `thorichthys_meeki` · 고급

기본:
```
pixel art sprite, side view, head facing left, single firemouth cichlid (Thorichthys meeki), cichlid with a bright throat, dark spot on the gill cover, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 진한 붉은 목
- 필수 파일: `body`, `line`

#### 레드 데빌 시클리드 · `amphilophus_labiatus` · 고급

기본:
```
pixel art sprite, side view, head facing left, single red devil cichlid (Amphilophus labiatus), heavy cichlid with thick lips and a slight nuchal hump, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 오렌지 · 화이트
- 필수 파일: `body`, `line`

#### 멕시코 테트라 · `astyanax_mexicanus` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single Mexican tetra (Astyanax mexicanus), small silvery tetra with an adipose fin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 알비노
- 필수 파일: `body`, `line`, `line.blind`
- 모프 **동굴형 무안형** → `line.blind`
  ```
  pixel art sprite, side view, head facing left, single Mexican tetra (Astyanax mexicanus), cave form without eyes, skin over the eye sockets, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 재규어 시클리드 · `parachromis_managuensis` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single jaguar cichlid (Parachromis managuensis), large predatory cichlid, big mouth, dark spots all over, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.dense`, `pattern.sparse`
- 모프 **빽빽한 반점** → `pattern.dense`
  ```
  pixel art sprite, side view, head facing left, single jaguar cichlid (Parachromis managuensis), many small dense spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **듬성한 반점** → `pattern.sparse`
  ```
  pixel art sprite, side view, head facing left, single jaguar cichlid (Parachromis managuensis), few scattered spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 트로피컬 가 · `atractosteus_tropicus` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single tropical gar (Atractosteus tropicus), very long cylindrical body, long toothy snout, rear-set dorsal fin, spotted, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.dense`, `pattern.faint`
- 모프 **진한 점박이** → `pattern.dense`
  ```
  pixel art sprite, side view, head facing left, single tropical gar (Atractosteus tropicus), many small dense spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **흐린 점박이** → `pattern.faint`
  ```
  pixel art sprite, side view, head facing left, single tropical gar (Atractosteus tropicus), faint, barely visible markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 수정유리어 · `orig_crystalglass` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy glass fish, small fish with a transparent body showing bones and organs, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

## 2단계

### 남미 민물 (11종)

#### 구피 · `poecilia_reticulata` · 일반

기본:
```
pixel art sprite, side view, head facing left, single guppy (Poecilia reticulata), small livebearer, short rounded tail fin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 레드 · 블루 · 옐로
- 필수 파일: `body`, `line`, `pattern.tuxedo`, `pattern.mosaic`, `pattern.cobra`, `fin_back.delta`, `fin_back.sword`
- 모프 **턱시도** → `pattern.tuxedo`
  ```
  pixel art sprite, side view, head facing left, single guppy (Poecilia reticulata), dark rear half of the body, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **모자이크** → `pattern.mosaic`
  ```
  pixel art sprite, side view, head facing left, single guppy (Poecilia reticulata), mosaic pattern on the tail, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **코브라** → `pattern.cobra`
  ```
  pixel art sprite, side view, head facing left, single guppy (Poecilia reticulata), snakeskin cobra pattern on the body, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **델타** → `fin_back.delta`, `fin_front.delta` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single guppy (Poecilia reticulata), large triangular delta tail, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **소드** → `fin_back.sword`, `fin_front.sword` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single guppy (Poecilia reticulata), tail with a long sword extension, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 네온 테트라 · `paracheirodon_innesi` · 일반

기본:
```
pixel art sprite, side view, head facing left, single neon tetra (Paracheirodon innesi), tiny slender tetra with a glowing horizontal stripe from eye to adipose fin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 골드 · 알비노
- 필수 파일: `body`, `line`

#### 팬더 코리도라스 · `corydoras_panda` · 일반

기본:
```
pixel art sprite, side view, head facing left, single panda corydoras (Corydoras panda), small armored catfish, short barbels, dark eye patch and dark spot near the tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 알비노
- 필수 파일: `body`, `line`, `fin_back.longfin`
- 모프 **롱핀** → `fin_back.longfin`, `fin_front.longfin` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single panda corydoras (Corydoras panda), long flowing fins, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 엔젤피시 · `pterophyllum_scalare` · 고급

기본:
```
pixel art sprite, side view, head facing left, single freshwater angelfish (Pterophyllum scalare), tall triangular disc body, long trailing dorsal and anal fins, vertical stripes, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 실버 · 골드 · 블랙
- 필수 파일: `body`, `line`, `pattern.marble`, `pattern.zebra`, `fin_back.veil`
- 모프 **마블** → `pattern.marble`
  ```
  pixel art sprite, side view, head facing left, single freshwater angelfish (Pterophyllum scalare), irregular marble patches instead of stripes, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **지브라** → `pattern.zebra`
  ```
  pixel art sprite, side view, head facing left, single freshwater angelfish (Pterophyllum scalare), many thin zebra stripes, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **베일** → `fin_back.veil`, `fin_front.veil` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single freshwater angelfish (Pterophyllum scalare), extra long flowing veil fins, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 오스카 · `astronotus_ocellatus` · 고급

기본:
```
pixel art sprite, side view, head facing left, single oscar cichlid (Astronotus ocellatus), large oval cichlid, big head, eye spot on the tail base, irregular blotches, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 타이거 · 레드 · 알비노
- 필수 파일: `body`, `line`

#### 레드벨리 피라냐 · `pygocentrus_nattereri` · 고급

기본:
```
pixel art sprite, side view, head facing left, single red-bellied piranha (Pygocentrus nattereri), deep body, blunt head, underbite with sharp teeth, bright belly, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 붉은 배 · 진한 붉은 배
- 필수 파일: `body`, `line`

#### 디스커스 · `symphysodon_aequifasciatus` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single discus fish (Symphysodon aequifasciatus), round flat disc-shaped body, vertical bars, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 블루 · 레드 · 옐로
- 필수 파일: `body`, `line`, `pattern.turquoise`, `pattern.leopard`
- 모프 **터콰이즈** → `pattern.turquoise`
  ```
  pixel art sprite, side view, head facing left, single discus fish (Symphysodon aequifasciatus), wavy turquoise lines across the body, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **표범** → `pattern.leopard`
  ```
  pixel art sprite, side view, head facing left, single discus fish (Symphysodon aequifasciatus), small dense leopard spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 실버 아로와나 · `osteoglossum_bicirrhosum` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single silver arowana (Osteoglossum bicirrhosum), very long ribbon-like body, large scales, upturned mouth with two chin barbels, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 실버 · 플래티넘
- 필수 파일: `body`, `line`

#### 전기뱀장어 · `electrophorus_electricus` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single electric eel (Electrophorus electricus), very long eel-like body, long anal fin along the belly, flat head, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 피라루쿠 · `arapaima_gigas` · 전설

기본:
```
pixel art sprite, side view, head facing left, single arapaima (pirarucu) (Arapaima gigas), huge long cylindrical body, flat head, large scales, red spots toward the tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.wide`, `pattern.narrow`
- 모프 **넓은 붉은 반점** → `pattern.wide`
  ```
  pixel art sprite, side view, head facing left, single arapaima (pirarucu) (Arapaima gigas), red spots spread over most of the rear body, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **좁은 붉은 반점** → `pattern.narrow`
  ```
  pixel art sprite, side view, head facing left, single arapaima (pirarucu) (Arapaima gigas), red spots only on the tail edge, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 황금가시어 · `orig_goldspine` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy golden spine fish, fish with tall spiky golden fin rays like spines, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

### 북미 민물 (10종)

#### 블루길 · `lepomis_macrochirus` · 일반

기본:
```
pixel art sprite, side view, head facing left, single bluegill sunfish (Lepomis macrochirus), deep oval sunfish, dark ear flap, faint vertical bars, colored cheek, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 푸른 뺨 · 진한 푸른 뺨
- 필수 파일: `body`, `line`

#### 펌프킨시드 · `lepomis_gibbosus` · 일반

기본:
```
pixel art sprite, side view, head facing left, single pumpkinseed sunfish (Lepomis gibbosus), deep round sunfish, wavy cheek lines, dark ear flap with a bright edge, spotted body, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.faint`, `pattern.bold`
- 모프 **흐린 반점** → `pattern.faint`
  ```
  pixel art sprite, side view, head facing left, single pumpkinseed sunfish (Lepomis gibbosus), faint, barely visible markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **선명한 반점** → `pattern.bold`
  ```
  pixel art sprite, side view, head facing left, single pumpkinseed sunfish (Lepomis gibbosus), bold, high-contrast markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 세일핀 몰리 · `poecilia_latipinna` · 일반

기본:
```
pixel art sprite, side view, head facing left, single sailfin molly (Poecilia latipinna), stocky livebearer, rounded tail, normal dorsal fin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 블랙 · 골드 · 달마시안
- 필수 파일: `body`, `line`, `fin_back.sailfin`
- 모프 **세일핀** → `fin_back.sailfin`, `fin_front.sailfin` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single sailfin molly (Poecilia latipinna), huge sail-like dorsal fin, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 큰입배스 · `micropterus_salmoides` · 고급

기본:
```
pixel art sprite, side view, head facing left, single largemouth bass (Micropterus salmoides), robust bass, very large mouth reaching behind the eye, dark lateral band, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 골드
- 필수 파일: `body`, `line`

#### 무지개송어 · `oncorhynchus_mykiss` · 고급

기본:
```
pixel art sprite, side view, head facing left, single rainbow trout (Oncorhynchus mykiss), streamlined trout, small black spots, pink lateral band, adipose fin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 골든 · 알비노
- 필수 파일: `body`, `line`

#### 채널메기 · `ictalurus_punctatus` · 고급

기본:
```
pixel art sprite, side view, head facing left, single channel catfish (Ictalurus punctatus), long catfish, long barbels, forked tail, small dark spots, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 알비노
- 필수 파일: `body`, `line`

#### 패들피시 · `polyodon_spathula` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single American paddlefish (Polyodon spathula), shark-like body with a very long flat paddle-shaped snout, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 앨리게이터 가 · `atractosteus_spatula` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single alligator gar (Atractosteus spatula), huge torpedo body, broad alligator-like snout, rear-set fins, diamond scales, spotted, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.dense`, `pattern.faint`
- 모프 **진한 점박이** → `pattern.dense`
  ```
  pixel art sprite, side view, head facing left, single alligator gar (Atractosteus spatula), many small dense spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **흐린 점박이** → `pattern.faint`
  ```
  pixel art sprite, side view, head facing left, single alligator gar (Atractosteus spatula), faint, barely visible markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 호수철갑상어 · `acipenser_fulvescens` · 전설

기본:
```
pixel art sprite, side view, head facing left, single lake sturgeon (Acipenser fulvescens), long sturgeon, rows of bony plates, pointed snout with barbels, shark-like tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 안개은린어 · `orig_mistsilver` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy mist silver fish, large graceful fish with wispy trailing fins like mist, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

### 태평양 (11종)

#### 넙치 (광어) · `paralichthys_olivaceus` · 일반

기본:
```
pixel art sprite, side view, head facing left, single olive flounder (Paralichthys olivaceus), flat flatfish seen from the eyed side, both eyes on one side, long fringe fins, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 흰동가리 · `amphiprion_ocellaris` · 일반

기본:
```
pixel art sprite, side view, head facing left, single ocellaris clownfish (Amphiprion ocellaris), small rounded fish with three white bands outlined in black, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 오렌지 · 블랙
- 필수 파일: `body`, `line`, `pattern.snowflake`, `pattern.picasso`
- 모프 **스노우플레이크** → `pattern.snowflake`
  ```
  pixel art sprite, side view, head facing left, single ocellaris clownfish (Amphiprion ocellaris), large irregular merged white patches, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **피카소** → `pattern.picasso`
  ```
  pixel art sprite, side view, head facing left, single ocellaris clownfish (Amphiprion ocellaris), white patches covering most of the body, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 참돔 · `pagrus_major` · 고급

기본:
```
pixel art sprite, side view, head facing left, single red sea bream (Pagrus major), deep-bodied sea bream, steep forehead, small blue spots, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 붉은 체색 · 진한 붉은 체색
- 필수 파일: `body`, `line`

#### 옐로탱 · `zebrasoma_flavescens` · 고급

기본:
```
pixel art sprite, side view, head facing left, single yellow tang (Zebrasoma flavescens), tall flat disc-like surgeonfish, long snout, white spine near the tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 노랑 · 진한 노랑
- 필수 파일: `body`, `line`

#### 블루탱 · `paracanthurus_hepatus` · 고급

기본:
```
pixel art sprite, side view, head facing left, single blue tang (palette surgeonfish) (Paracanthurus hepatus), oval surgeonfish with a dark palette-shaped marking and a bright tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 블루 · 옐로 배
- 필수 파일: `body`, `line`

#### 만다린피시 · `synchiropus_splendidus` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single mandarinfish (Synchiropus splendidus), small dragonet with wavy maze-like stripes and fan fins, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 그린 · 레드
- 필수 파일: `body`, `line`

#### 나폴레옹피시 · `cheilinus_undulatus` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single humphead wrasse (Napoleon fish) (Cheilinus undulatus), very large wrasse, prominent forehead hump, thick lips, wavy lines on the head, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.faint`, `pattern.bold`
- 모프 **흐린 머리 무늬** → `pattern.faint`
  ```
  pixel art sprite, side view, head facing left, single humphead wrasse (Napoleon fish) (Cheilinus undulatus), faint, barely visible markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **선명한 머리 무늬** → `pattern.bold`
  ```
  pixel art sprite, side view, head facing left, single humphead wrasse (Napoleon fish) (Cheilinus undulatus), bold, high-contrast markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 개복치 · `mola_mola` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single ocean sunfish (mola) (Mola mola), huge flat round body without a real tail, very tall dorsal and anal fins, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 태평양 참다랑어 · `thunnus_orientalis` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single Pacific bluefin tuna (Thunnus orientalis), torpedo-shaped tuna, dark back, silver belly, small yellow finlets, crescent tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 청새치 · `makaira_nigricans` · 전설

기본:
```
pixel art sprite, side view, head facing left, single blue marlin (Makaira nigricans), long marlin with a spear bill, tall pointed dorsal fin, crescent tail, vertical stripes, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.faint`, `pattern.bold`
- 모프 **흐린 줄무늬** → `pattern.faint`
  ```
  pixel art sprite, side view, head facing left, single blue marlin (Makaira nigricans), faint, barely visible markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **진한 줄무늬** → `pattern.bold`
  ```
  pixel art sprite, side view, head facing left, single blue marlin (Makaira nigricans), bold, high-contrast markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 별빛복어 · `orig_starpuffer` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy star pufferfish, round pufferfish with star-shaped glowing dots like a constellation, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

## 3단계

### 아프리카 민물 (11종)

#### 옐로 시클리드 · `labidochromis_caeruleus` · 일반

기본:
```
pixel art sprite, side view, head facing left, single electric yellow cichlid (Labidochromis caeruleus), small cichlid with a dark edge on the dorsal fin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 옐로 · 진한 옐로 · 화이트
- 필수 파일: `body`, `line`

#### 브리샤르디 · `neolamprologus_brichardi` · 일반

기본:
```
pixel art sprite, side view, head facing left, single princess cichlid (Neolamprologus brichardi) (Neolamprologus brichardi), slender cichlid with lyre-shaped tail and long fin tips, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 백색
- 필수 파일: `body`, `line`, `fin_back.longfin`
- 모프 **롱핀** → `fin_back.longfin`, `fin_front.longfin` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single princess cichlid (Neolamprologus brichardi) (Neolamprologus brichardi), very long fin tips and tail streamers, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 나일 틸라피아 · `oreochromis_niloticus` · 일반

기본:
```
pixel art sprite, side view, head facing left, single Nile tilapia (Oreochromis niloticus), deep-bodied tilapia, faint vertical bars, striped tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 레드
- 필수 파일: `body`, `line`

#### 데모이소니 · `pseudotropheus_demasoni` · 고급

기본:
```
pixel art sprite, side view, head facing left, single demasoni cichlid (Pseudotropheus demasoni), small cichlid with bold vertical bars, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.narrow`, `pattern.wide`
- 모프 **좁은 간격** → `pattern.narrow`
  ```
  pixel art sprite, side view, head facing left, single demasoni cichlid (Pseudotropheus demasoni), bars close together, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **넓은 간격** → `pattern.wide`
  ```
  pixel art sprite, side view, head facing left, single demasoni cichlid (Pseudotropheus demasoni), bars far apart, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 블루 돌핀 시클리드 · `cyrtocara_moorii` · 고급

기본:
```
pixel art sprite, side view, head facing left, single blue dolphin cichlid (Cyrtocara moorii), cichlid with a big rounded forehead hump like a dolphin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 블루 · 진한 블루
- 필수 파일: `body`, `line`

#### 아프리카 버터플라이피시 · `pantodon_buchholzi` · 고급

기본:
```
pixel art sprite, side view, head facing left, single African butterflyfish (Pantodon buchholzi), surface fish with huge wing-like pectoral fins, long thread rays, upturned mouth, spotted, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.dense`, `pattern.sparse`
- 모프 **빽빽한 반점** → `pattern.dense`
  ```
  pixel art sprite, side view, head facing left, single African butterflyfish (Pantodon buchholzi), many small dense spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **듬성한 반점** → `pattern.sparse`
  ```
  pixel art sprite, side view, head facing left, single African butterflyfish (Pantodon buchholzi), few scattered spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 엘레펀트노즈 · `gnathonemus_petersii` · 고급

기본:
```
pixel art sprite, side view, head facing left, single elephantnose fish (Gnathonemus petersii), long fish with a trunk-like chin extension, two pale vertical lines near the tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 세네갈 비키르 · `polypterus_senegalus` · 고급

기본:
```
pixel art sprite, side view, head facing left, single Senegal bichir (Polypterus senegalus), long eel-like body, row of small dorsal finlets, rounded pectoral fins, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 알비노
- 필수 파일: `body`, `line`

#### 프론토사 · `cyphotilapia_frontosa` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single frontosa cichlid (Cyphotilapia frontosa), large cichlid with a big forehead hump and dark vertical bars, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 블루 · 화이트
- 필수 파일: `body`, `line`, `pattern.seven_bar`
- 모프 **줄 7개** → `pattern.seven_bar`
  ```
  pixel art sprite, side view, head facing left, single frontosa cichlid (Cyphotilapia frontosa), seven dark vertical bars, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 나일퍼치 · `lates_niloticus` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single Nile perch (Lates niloticus), large perch with a pointed head, humped back and rounded tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 화염시클리드 · `orig_flamecichlid` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy flame cichlid, cichlid with flame-shaped pattern and flickering fin edges, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

### 유럽 민물 (9종)

#### 텐치 · `tinca_tinca` · 일반

기본:
```
pixel art sprite, side view, head facing left, single tench (Tinca tinca), thick-bodied fish with tiny scales, small barbels, rounded fins, small red eye, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 골든
- 필수 파일: `body`, `line`

#### 유럽 퍼치 · `perca_fluviatilis` · 일반

기본:
```
pixel art sprite, side view, head facing left, single European perch (Perca fluviatilis), perch with dark vertical bars, spiny first dorsal fin with a dark spot, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.faint`, `pattern.bold`
- 모프 **흐린 띠** → `pattern.faint`
  ```
  pixel art sprite, side view, head facing left, single European perch (Perca fluviatilis), faint, barely visible markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **선명한 띠** → `pattern.bold`
  ```
  pixel art sprite, side view, head facing left, single European perch (Perca fluviatilis), bold, high-contrast markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 잉어 · `cyprinus_carpio` · 일반

기본:
```
pixel art sprite, side view, head facing left, single common carp (Cyprinus carpio), large carp with barbels and full even scales, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `scale.mirror`, `scale.leather`
- 모프 **미러** → `scale.mirror`
  ```
  pixel art sprite, side view, head facing left, single common carp (Cyprinus carpio), few large uneven mirror scales, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **가죽** → `scale.leather`
  ```
  pixel art sprite, side view, head facing left, single common carp (Cyprinus carpio), almost scaleless smooth skin, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 강꼬치고기 · `esox_lucius` · 고급

기본:
```
pixel art sprite, side view, head facing left, single northern pike (Esox lucius), long torpedo body, duck-bill snout, rear-set dorsal fin, light spots, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.stripe`
- 모프 **줄무늬** → `pattern.stripe`
  ```
  pixel art sprite, side view, head facing left, single northern pike (Esox lucius), light diagonal stripes instead of spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 브라운 송어 · `salmo_trutta` · 고급

기본:
```
pixel art sprite, side view, head facing left, single brown trout (Salmo trutta), trout with dark and red spots, adipose fin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.dense`, `pattern.sparse`
- 모프 **빽빽한 반점** → `pattern.dense`
  ```
  pixel art sprite, side view, head facing left, single brown trout (Salmo trutta), many small dense spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **듬성한 반점** → `pattern.sparse`
  ```
  pixel art sprite, side view, head facing left, single brown trout (Salmo trutta), few scattered spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 유럽 뱀장어 · `anguilla_anguilla` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single European eel (Anguilla anguilla), long snake-like eel, continuous dorsal and anal fin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 웰스메기 · `silurus_glanis` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single wels catfish (Silurus glanis), huge catfish, wide flat head, two very long barbels, long anal fin, tiny dorsal fin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 알비노
- 필수 파일: `body`, `line`

#### 벨루가 철갑상어 · `huso_huso` · 전설

기본:
```
pixel art sprite, side view, head facing left, single beluga sturgeon (Huso huso), huge sturgeon, short pointed snout, big mouth, rows of bony plates, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 샘물요정송어 · `orig_fairytrout` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy fairy trout, small trout with translucent wing-like fins, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

### 대서양 (9종)

#### 대서양 청어 · `clupea_harengus` · 일반

기본:
```
pixel art sprite, side view, head facing left, single Atlantic herring (Clupea harengus), slim silver schooling fish, forked tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 강한 은빛
- 필수 파일: `body`, `line`

#### 대서양 고등어 · `scomber_scombrus` · 일반

기본:
```
pixel art sprite, side view, head facing left, single Atlantic mackerel (Scomber scombrus), streamlined mackerel with wavy dark stripes on the back, small finlets, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.fine`, `pattern.bold`
- 모프 **촘촘한 물결** → `pattern.fine`
  ```
  pixel art sprite, side view, head facing left, single Atlantic mackerel (Scomber scombrus), fine dense wavy stripes, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **굵은 물결** → `pattern.bold`
  ```
  pixel art sprite, side view, head facing left, single Atlantic mackerel (Scomber scombrus), thick bold wavy stripes, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 대서양 대구 · `gadus_morhua` · 고급

기본:
```
pixel art sprite, side view, head facing left, single Atlantic cod (Gadus morhua), cod with three dorsal fins, chin barbel, pale lateral line, speckled, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 대서양 연어 · `salmo_salar` · 고급

기본:
```
pixel art sprite, side view, head facing left, single Atlantic salmon (Salmo salar), streamlined salmon, black cross-shaped spots, adipose fin, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.dense`, `pattern.sparse`
- 모프 **빽빽한 반점** → `pattern.dense`
  ```
  pixel art sprite, side view, head facing left, single Atlantic salmon (Salmo salar), many small dense spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **듬성한 반점** → `pattern.sparse`
  ```
  pixel art sprite, side view, head facing left, single Atlantic salmon (Salmo salar), few scattered spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 퀸 엔젤피시 · `holacanthus_ciliaris` · 고급

기본:
```
pixel art sprite, side view, head facing left, single queen angelfish (Holacanthus ciliaris), tall angelfish with a crown spot on the forehead and trailing fins, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 블루·옐로 · 진한 블루·옐로
- 필수 파일: `body`, `line`

#### 대서양 핼리벗 · `hippoglossus_hippoglossus` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single Atlantic halibut (Hippoglossus hippoglossus), large flatfish seen from the eyed side, both eyes on one side, crescent tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 대서양 참다랑어 · `thunnus_thynnus` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single Atlantic bluefin tuna (Thunnus thynnus), large torpedo-shaped tuna, dark back, silver belly, yellow finlets, crescent tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 황새치 · `xiphias_gladius` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single swordfish (Xiphias gladius), long fish with a very long flat sword bill, tall dorsal fin, crescent tail, no scales, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 유령장어 · `orig_ghosteel` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy ghost eel, pale long eel with a ghostly flowing tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

### 인도양 (10종)

#### 파우더블루탱 · `acanthurus_leucosternon` · 고급

기본:
```
pixel art sprite, side view, head facing left, single powder blue tang (Acanthurus leucosternon), oval surgeonfish with a dark face and a white throat, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 블루 · 진한 블루
- 필수 파일: `body`, `line`

#### 쏠배감펭 · `pterois_miles` · 고급

기본:
```
pixel art sprite, side view, head facing left, single devil firefish (lionfish) (Pterois miles), lionfish with fan-like pectoral fins, venomous spines, vertical stripes, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 레드 · 블랙
- 필수 파일: `body`, `line`, `fin_back.long`
- 모프 **긴 가시** → `fin_back.long`, `fin_front.long` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single devil firefish (lionfish) (Pterois miles), very long spines and fin rays, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 엠퍼러 엔젤피시 · `pomacanthus_imperator` · 고급

기본:
```
pixel art sprite, side view, head facing left, single emperor angelfish (Pomacanthus imperator), tall angelfish with horizontal stripes and a dark mask over the eye, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.faint`, `pattern.bold`
- 모프 **흐린 줄무늬** → `pattern.faint`
  ```
  pixel art sprite, side view, head facing left, single emperor angelfish (Pomacanthus imperator), faint, barely visible markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **선명한 줄무늬** → `pattern.bold`
  ```
  pixel art sprite, side view, head facing left, single emperor angelfish (Pomacanthus imperator), bold, high-contrast markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 무어리시 아이돌 · `zanclus_cornutus` · 고급

기본:
```
pixel art sprite, side view, head facing left, single Moorish idol (Zanclus cornutus), tall disc body, long tubular snout, very long trailing dorsal fin streamer, broad vertical bands, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `fin_back.long`
- 모프 **긴 깃** → `fin_back.long`, `fin_front.long` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single Moorish idol (Zanclus cornutus), extra long dorsal streamer, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 클라운 트리거피시 · `balistoides_conspicillum` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single clown triggerfish (Balistoides conspicillum), triggerfish with large round spots on the belly and a spotted back, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.large`, `pattern.small`
- 모프 **큰 점** → `pattern.large`
  ```
  pixel art sprite, side view, head facing left, single clown triggerfish (Balistoides conspicillum), fewer, larger round spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **작은 점** → `pattern.small`
  ```
  pixel art sprite, side view, head facing left, single clown triggerfish (Balistoides conspicillum), many small round spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 돛새치 · `istiophorus_platypterus` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single Indo-Pacific sailfish (Istiophorus platypterus), long billfish with a huge sail-like dorsal fin covered in spots, spear bill, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.dense`, `pattern.faint`, `fin_back.tall`
- 모프 **빽빽한 돛 반점** → `pattern.dense`
  ```
  pixel art sprite, side view, head facing left, single Indo-Pacific sailfish (Istiophorus platypterus), many small dense spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **흐린 돛 반점** → `pattern.faint`
  ```
  pixel art sprite, side view, head facing left, single Indo-Pacific sailfish (Istiophorus platypterus), faint, barely visible markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **큰 돛** → `fin_back.tall`, `fin_front.tall` (fin_front는 다를 때만)
  ```
  pixel art sprite, side view, head facing left, single Indo-Pacific sailfish (Istiophorus platypterus), even taller sail fin, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 만타가오리 · `mobula_birostris` · 영웅

기본:
```
pixel art sprite, side view, head facing left, single giant oceanic manta ray (Mobula birostris), manta ray seen from the side angled, wide wing fins, head fins (cephalic lobes), grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.heavy`, `pattern.clean`
- 모프 **진한 배 무늬** → `pattern.heavy`
  ```
  pixel art sprite, side view, head facing left, single giant oceanic manta ray (Mobula birostris), dark markings on the belly, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **깨끗한 배** → `pattern.clean`
  ```
  pixel art sprite, side view, head facing left, single giant oceanic manta ray (Mobula birostris), clean pale belly, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 실러캔스 · `latimeria_chalumnae` · 전설

기본:
```
pixel art sprite, side view, head facing left, single coelacanth (Latimeria chalumnae), heavy lobe-finned fish, fleshy limb-like fins, three-lobed tail, white blotches, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.dense`, `pattern.sparse`
- 모프 **빽빽한 흰 반점** → `pattern.dense`
  ```
  pixel art sprite, side view, head facing left, single coelacanth (Latimeria chalumnae), many small dense spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **듬성한 흰 반점** → `pattern.sparse`
  ```
  pixel art sprite, side view, head facing left, single coelacanth (Latimeria chalumnae), few scattered spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 고래상어 · `rhincodon_typus` · 전설

기본:
```
pixel art sprite, side view, head facing left, single whale shark (Rhincodon typus), huge shark with a wide flat head, wide mouth, white spots and stripes on a dark back, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.dense`, `pattern.sparse`
- 모프 **빽빽한 흰 점** → `pattern.dense`
  ```
  pixel art sprite, side view, head facing left, single whale shark (Rhincodon typus), many small dense spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **듬성한 흰 점** → `pattern.sparse`
  ```
  pixel art sprite, side view, head facing left, single whale shark (Rhincodon typus), few scattered spots, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 진주용비늘어 · `orig_pearldragon` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy pearl dragon fish, elegant fish with pearly scales, whisker barbels and long flowing fins like a dragon, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

### 북극해 (9종)

#### 북극대구 · `boreogadus_saida` · 일반

기본:
```
pixel art sprite, side view, head facing left, single Arctic cod (polar cod) (Boreogadus saida), slender cod with a forked tail and small chin barbel, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 열빙어 · `mallotus_villosus` · 일반

기본:
```
pixel art sprite, side view, head facing left, single capelin (Mallotus villosus), small slender silvery smelt-like fish, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 강한 은빛
- 필수 파일: `body`, `line`

#### 럼프피시 · `cyclopterus_lumpus` · 고급

기본:
```
pixel art sprite, side view, head facing left, single lumpfish (Cyclopterus lumpus), round lumpy body with rows of bony bumps, suction disc on the belly, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 그린 · 오렌지 · 블루
- 필수 파일: `body`, `line`

#### 그린란드 핼리벗 · `reinhardtius_hippoglossoides` · 고급

기본:
```
pixel art sprite, side view, head facing left, single Greenland halibut (Reinhardtius hippoglossoides), elongated flatfish, eyes on one side, dark on both sides, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 북극곤들매기 · `salvelinus_alpinus` · 고급

기본:
```
pixel art sprite, side view, head facing left, single Arctic char (Salvelinus alpinus), streamlined char with light spots and a colored belly, white-edged lower fins, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 붉은 배 · 진한 붉은 배
- 필수 파일: `body`, `line`

#### 늑대고기 · `anarhichas_lupus` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single Atlantic wolffish (Anarhichas lupus), long fish with a big head, strong canine teeth, dark vertical bands, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`, `pattern.faint`, `pattern.bold`
- 모프 **흐린 줄무늬** → `pattern.faint`
  ```
  pixel art sprite, side view, head facing left, single Atlantic wolffish (Anarhichas lupus), faint, barely visible markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```
- 모프 **선명한 줄무늬** → `pattern.bold`
  ```
  pixel art sprite, side view, head facing left, single Atlantic wolffish (Anarhichas lupus), bold, high-contrast markings, same pose and size as the base image, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
  ```

#### 북극 홍어 · `amblyraja_hyperborea` · 희귀

기본:
```
pixel art sprite, side view, head facing left, single Arctic skate (Amblyraja hyperborea), skate seen from the side angled, flat diamond body, long thin tail with thorns, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 그린란드상어 · `somniosus_microcephalus` · 전설

기본:
```
pixel art sprite, side view, head facing left, single Greenland shark (Somniosus microcephalus), large slow sleeper shark, small head, small fins, thick body, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 색 모프(팔레트, 그림 없음): 야생 · 옅은 체색 · 진한 체색
- 필수 파일: `body`, `line`

#### 오로라빙어 · `orig_aurorasmelt` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy aurora smelt, slender fish with shimmering bands across the body like an aurora, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

## 4단계 (고대)

### 데본기 (10종)

#### 케팔라스피스 · `cephalaspis` · 일반 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Cephalaspis (armored jawless fish) (Cephalaspis), prehistoric jawless fish with a horseshoe-shaped bony head shield, eyes on top, small tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 보트리올레피스 · `bothriolepis` · 고급 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Bothriolepis (placoderm) (Bothriolepis), prehistoric armored fish with a boxy plated front body and jointed arm-like pectoral appendages, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 유스테놉테론 · `eusthenopteron` · 고급 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Eusthenopteron (lobe-finned fish) (Eusthenopteron), prehistoric lobe-finned fish, fleshy fins, three-lobed tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 스테타칸투스 · `stethacanthus` · 희귀 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Stethacanthus (ancient shark) (Stethacanthus), prehistoric shark with an anvil-shaped brush dorsal fin covered in spikes, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 클라도셀라케 · `cladoselache` · 희귀 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Cladoselache (ancient shark) (Cladoselache), prehistoric slender shark with a crescent tail and two spiny dorsal fins, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 틱타알릭 · `tiktaalik_roseae` · 영웅 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Tiktaalik (Tiktaalik roseae), prehistoric fish-tetrapod with a flat crocodile-like head, neck, sturdy fins like limbs, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 하이네리아 · `hyneria_lindae` · 영웅 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Hyneria (giant lobe-finned fish) (Hyneria lindae), huge prehistoric predatory lobe-finned fish, large head with fangs, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 둔클레오스테우스 · `dunkleosteus_terrelli` · 전설 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Dunkleosteus (giant placoderm) (Dunkleosteus terrelli), huge prehistoric armored fish with a bony plated head and sharp blade-like jaw plates, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 수정갑주어 · `orig_crystalarmor` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy crystal armored fish, prehistoric armored fish with crystal plates on the head and body, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 크로노피시 · `orig_chronofish` · 전설 · 오리지널 전설급

기본:
```
pixel art sprite, side view, head facing left, single fantasy time fish, mysterious fish with clock-like ring markings and fins of different ancient styles, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

### 백악기 (9종)

#### 엔코두스 · `enchodus` · 일반 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Enchodus (saber-toothed herring) (Enchodus), prehistoric slender fish with huge fang teeth in the front of the jaw, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 레피도테스 · `lepidotes` · 일반 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Lepidotes (ray-finned fish) (Lepidotes), prehistoric deep-bodied fish covered in thick shiny diamond scales, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 길리쿠스 · `gillicus_arcuatus` · 고급 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Gillicus (Gillicus arcuatus), prehistoric streamlined fish with a deep forked tail and small mouth, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 프로토스피래나 · `protosphyraena` · 고급 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Protosphyraena (swordfish-like) (Protosphyraena), prehistoric fish with a short sword snout and long sickle pectoral fins, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 스쿠알리코락스 · `squalicorax` · 희귀 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Squalicorax (crow shark) (Squalicorax), prehistoric shark with a typical shark body and serrated teeth, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 크레톡시리나 · `cretoxyrhina_mantelli` · 영웅 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Cretoxyrhina (ginsu shark) (Cretoxyrhina mantelli), large prehistoric shark like a great white, crescent tail, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 프티코두스 · `ptychodus` · 영웅 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Ptychodus (shell-crushing shark) (Ptychodus), large prehistoric shark with a blunt head and flat crushing tooth plates, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 크시팍티누스 · `xiphactinus_audax` · 전설 · 고대

기본:
```
pixel art sprite, side view, head facing left, single Xiphactinus (Xiphactinus audax), huge prehistoric bony fish with an upturned bulldog-like jaw full of fangs, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

#### 폭풍턱어 · `orig_stormjaw` · 영웅 · 오리지널 특별 개체

기본:
```
pixel art sprite, side view, head facing left, single fantasy storm jaw fish, huge predatory fish with a massive jaw and lightning-shaped markings, grayscale only, flat shading with 5 gray tones from white to very dark gray, no color, dark outline, plain transparent background, centered, full body visible, no text, no watermark
```
- 필수 파일: `body`, `line`

---
합계: 기본 120장, 모프 78장 (큰 그림 기준 생성 수. 작은 그림은 손 정리).
