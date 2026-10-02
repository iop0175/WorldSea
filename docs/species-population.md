# 어종 야생 개체수: 실제 현황과 게임 변환

실존 어종 91종의 실제 야생 현황(IUCN 적색목록 등급·추세·알려진 추정치)을 조사하고, 그 **비율**을 게임 야생 개체수에 반영한다.

- 코드: 변환 규칙 `packages/shared/src/game/population.ts`, 원본 데이터 `packages/shared/src/seed/world.ts`, 시드 생성 `packages/shared/src/seed/build.ts`
- DB 반영: `pnpm db:seed` (지역·어종은 갱신, 야생 개체수는 없을 때만 넣고 운영 중 값은 초기화하지 않음)
- 아래 어종 표는 `pnpm --filter @worldsea/shared exec tsx scripts/species-table.ts`로 다시 만든다. 수치를 바꾸면 표도 다시 만든다.
- 모든 게임 수치는 **밸런싱 전 임시값**이다.

## 1. 원칙

1. **실제 마릿수는 쓰지 않는다.** 대부분의 물고기는 전 세계 개체수 추정치가 없다(IUCN도 "알 수 없음"이 대부분). 그리고 게임 개체수는 동시 접속자 수에 맞춰야 한다.
2. **비율만 실제를 따른다.** 흔한 종은 많고, 위협받는 종은 처음부터 줄어든 상태로 시작한다.
3. 전체 크기는 `POPULATION_TEMP.scale` 하나로 조절한다 (서버 규모가 2배가 되면 2).

## 2. 변환 규칙

**수용량**(= `species.initial_population`, 보전 비율 100%의 기준)

`수용량 = min(실제 규모 기준값, 희귀도 상한) × scale`

| 실제 규모 구간 | 기준값 | | 게임 희귀도 | 상한 |
|---|---:|---|---|---:|
| 매우 많음 | 50,000 | | 일반 | 50,000 |
| 많음 | 20,000 | | 고급 | 20,000 |
| 보통 | 6,000 | | 희귀 | 6,000 |
| 적음 | 1,500 | | 영웅 | 1,500 |
| 매우 적음 | 400 | | 전설 | 400 |

실제로 흔해도 게임 희귀도가 높으면 희귀도 상한이 이긴다 (예: 코이는 실제로 매우 많지만 게임 희귀도 '희귀' → 6,000).

**시작 개체수** = 수용량 × IUCN 등급별 시작 비율

| IUCN | 뜻 | 시작 비율 | 시작 상태 | 자연 회복률 r(1일) |
|---|---|---:|---|---:|
| LC | 관심대상 | 100% | 안정 | 0.05 |
| NE / DD | 미평가 / 정보 부족 | 100% | 안정 | 0.05 / 0.04 |
| NT | 준위협 | 75% | 안정 | 0.035 |
| VU | 취약 | 45% | 안정 | 0.025 |
| EN | 위기 | 25% | **취약**(일일 쿼터) | 0.015 |
| CR | 위급 | 12% | **취약**(일일 쿼터) | 0.008 |

- 보전 상태 기준(기존 확정): 안정 ≥30%, 취약 <30%, 보호종 <10%(포획 금지).
- **위급(CR)도 보호종이 아니라 취약으로 시작한다.** 보호종에서 시작하면 아무도 잡을 수 없어 양식·방류로 복원하는 순환이 시작되지 않는다. 실제처럼 아슬아슬하게(12%) 시작해 남획하면 바로 보호종으로 떨어진다.
- 실제 추세가 감소면 r × 0.7, 전설급이면 r × 0.5 (회복이 느림).
- 숨은 보유량(전설 목격 씨앗): 영웅 3%, 전설 5% (수용량 기준).
- 자연 회복은 로지스틱: 개체수가 수용량에 가까울수록 느려진다.

**고대·오리지널**
- 고대(화석) 어종: 실제 데이터가 없으므로 희귀도로 규모를 정한다 (일반 20,000 · 고급 6,000 · 희귀 1,500 · 영웅/전설 400), 100%에서 시작, r 0.02.
- 지역별 특별 개체(오리지널 12종): 수용량 60, r 0.01, 특별 맵 전용.
- 오리지널 전설급: 서버 전체 5마리, 자연 회복 없음.

## 3. 결과 요약

- 시작 상태가 **취약**인 실존 어종 8종: 아시아 아로와나(EN), 호수철갑상어(EN), 나폴레옹피시(EN), 만타가오리(EN), 고래상어(EN), 유럽 뱀장어(CR), 벨루가 철갑상어(CR), 실러캔스(CR).
- 처음부터 보호종인 어종은 없다.
- 피라루쿠는 정보 부족(DD)이지만 관리 구역에서 크게 회복 중이라 100%에서 시작한다 (방류 복원의 실제 사례로 스토리에 쓸 수 있음).

## 4. 주의 사항

- IUCN 등급·연도는 FishBase 요약 페이지에 인용된 IUCN 평가 기준이다. IUCN 사이트의 추세 항목은 직접 읽지 못해, "감소"의 일부는 평가 기준 코드(A2·A4 = 감소 기준)에서 추정했다 (표 메모에 표시).
- "실제 규모" 구간은 분포 범위·어업량·IUCN 근거를 보고 정한 **판단값**이다.
- 실제 마릿수 추정이 있는 종은 메모에 적었다 (실러캔스 500 이하, 고래상어 13만~20만 등). 일부는 2차 출처라 검증이 더 필요하다.
- 학명 변경: 데모이소니는 현재 *Chindongo demasoni*, 전기뱀장어는 2019년 3종으로 분리됨. 게임 표기는 기획서 학명을 유지한다.
- 출시 전 IUCN 최신 평가로 다시 확인한다. 등급이 바뀌면 `world.ts`만 고치고 `pnpm db:seed`로 반영한다 (운영 중 개체수는 바뀌지 않으므로 필요하면 관리자 작업으로 조정).
- 오리지널 전설급은 기획서상 3종이지만 2종만 정해져 있다. 심연의 왕은 등장 지역(가상 심해 확장 지역)이 아직 없어 시드에서 뺐다. 크로노피시는 데본기 지역에 넣었다.

## 5. 지역 (임시 수치)

| 지역 | 월드 단계 | 해금 레벨 | 수색 1회 | 스태미너 | 시간 티켓 | 특별 맵 |
|---|---:|---:|---:|---:|---|---|
| 아시아 민물 | 1 | 1 | 5분 | 1 | - | 달빛 연못 |
| 중미 민물 | 1 | 5 | 6분 | 1 | - | 세노테 샘 |
| 남미 민물 | 2 | 10 | 8분 | 2 | - | 황금 수몰림 |
| 북미 민물 | 2 | 12 | 8분 | 2 | - | 안개 호수 |
| 태평양 | 2 | 15 | 10분 | 2 | - | 별빛 산호정원 |
| 아프리카 민물 | 3 | 20 | 12분 | 3 | - | 불꽃 호수 |
| 유럽 민물 | 3 | 22 | 12분 | 3 | - | 요정의 샘 |
| 대서양 | 3 | 25 | 15분 | 3 | - | 난파선 해역 |
| 인도양 | 3 | 28 | 18분 | 4 | - | 진주 군도 |
| 북극해 | 3 | 30 | 20분 | 4 | - | 오로라 빙하 |
| 데본기 | 4 | 35 | 25분 | 5 | 필요 | 수정 동굴 |
| 백악기 | 4 | 40 | 30분 | 5 | 필요 | 폭풍 해협 |

## 6. 어종 표

수용량·시작 수는 scale 1 기준. r/일은 자연 회복률.

### 아시아 민물 (Lv.1)

| 어종 | 학명 | 희귀도 | IUCN (연도) | 추세 | 실제 규모 | 수용량 | 시작 수 | 시작 상태 | r/일 | 메모 | 출처 |
|---|---|---|---|---|---|---:|---:|---|---:|---|---|
| 베타 | *Betta splendens* | 일반 | VU (2011) | 감소 | 보통 | 6,000 | 2,700 | 안정 | 0.0175 | 서식지(논·습지) 감소로 야생 개체군 위협. 관상어 유통은 거의 양식 개체 | [FishBase](https://www.fishbase.se/summary/Betta-splendens.html) |
| 드워프 구라미 | *Trichogaster lalius* | 일반 | LC (2010) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Trichogaster-lalius.html) |
| 하렌퀸 라스보라 | *Trigonostigma heteromorpha* | 일반 | LC (2019) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Trigonostigma-heteromorpha.html) |
| 체리바브 | *Puntius titteya* | 일반 | VU (2019) | - | 적음 | 1,500 | 675 | 안정 | 0.0250 | 스리랑카 고유종, 분포 좁음 | [FishBase](https://www.fishbase.se/summary/Puntius-titteya.html) |
| 금붕어 | *Carassius auratus* | 고급 | LC (2010) | - | 매우 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Carassius-auratus.html) |
| 펄 구라미 | *Trichopodus leerii* | 고급 | NT (2019) | - | 보통 | 6,000 | 4,500 | 안정 | 0.0350 |  | [FishBase](https://www.fishbase.se/summary/Trichopodus-leerii.html) |
| 클라운 로치 | *Chromobotia macracanthus* | 고급 | LC (2019) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 | 관상용은 대부분 야생 채집 | [FishBase](https://www.fishbase.se/summary/Chromobotia-macracanthus.html) |
| 쉬리 | *Coreoleuciscus splendidus* | 희귀 | NE | - | 보통 | 6,000 | 6,000 | 안정 | 0.0500 | 한국 고유종 (IUCN 미평가) | [FishBase](https://www.fishbase.se/summary/Coreoleuciscus-splendidus.html) |
| 코이 | *Cyprinus rubrofuscus* | 희귀 | LC (2020) | - | 매우 많음 | 6,000 | 6,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Cyprinus-rubrofuscus.html) |
| 아시아 아로와나 | *Scleropages formosus* | 영웅 | EN (2019) | 감소 | 매우 적음 | 400 | 100 | 취약 | 0.0105 | CITES 부속서 I. 유통은 등록 양식장 개체 | [FishBase](https://www.fishbase.se/summary/Scleropages-formosus.html) |

| 고대·오리지널 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 월광비늘어 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 달빛 연못: 달빛을 받으면 비늘이 은은하게 빛나는 소형어 |

### 중미 민물 (Lv.5)

| 어종 | 학명 | 희귀도 | IUCN (연도) | 추세 | 실제 규모 | 수용량 | 시작 수 | 시작 상태 | r/일 | 메모 | 출처 |
|---|---|---|---|---|---|---:|---:|---|---:|---|---|
| 소드테일 | *Xiphophorus hellerii* | 일반 | LC (2018) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Xiphophorus-hellerii.html) |
| 플래티 | *Xiphophorus maculatus* | 일반 | DD (2018) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0400 | 정보 부족(DD) | [FishBase](https://www.fishbase.se/summary/Xiphophorus-maculatus.html) |
| 몰리 | *Poecilia sphenops* | 일반 | LC (2018) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Poecilia-sphenops.html) |
| 컨빅 시클리드 | *Amatitlania nigrofasciata* | 일반 | DD (2019) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0400 | 정보 부족(DD) | [FishBase](https://www.fishbase.se/summary/Amatitlania-nigrofasciata.html) |
| 파이어마우스 시클리드 | *Thorichthys meeki* | 고급 | LC (2018) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Thorichthys-meeki.html) |
| 레드 데빌 시클리드 | *Amphilophus labiatus* | 고급 | NE | - | 보통 | 6,000 | 6,000 | 안정 | 0.0500 | 니카라과·마나과 호수에만 분포 (IUCN 미평가) | [FishBase](https://www.fishbase.se/summary/Amphilophus-labiatus.html) |
| 멕시코 테트라 | *Astyanax mexicanus* | 희귀 | LC (2011) | - | 매우 많음 | 6,000 | 6,000 | 안정 | 0.0500 | 동굴형 개체군은 일부 동굴에만 있음 | [FishBase](https://www.fishbase.se/summary/Astyanax-mexicanus.html) |
| 재규어 시클리드 | *Parachromis managuensis* | 희귀 | LC (2020) | - | 많음 | 6,000 | 6,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Parachromis-managuensis.html) |
| 트로피컬 가 | *Atractosteus tropicus* | 영웅 | LC (2018) | 감소 | 보통 | 1,500 | 1,500 | 안정 | 0.0350 |  | [FishBase](https://www.fishbase.se/summary/Atractosteus-tropicus.html) |

| 고대·오리지널 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 수정유리어 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 세노테 샘: 몸이 투명해 뼈와 내장이 비치는 동굴 샘 물고기 |

### 남미 민물 (Lv.10)

| 어종 | 학명 | 희귀도 | IUCN (연도) | 추세 | 실제 규모 | 수용량 | 시작 수 | 시작 상태 | r/일 | 메모 | 출처 |
|---|---|---|---|---|---|---:|---:|---|---:|---|---|
| 구피 | *Poecilia reticulata* | 일반 | LC (2020) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Poecilia-reticulata.html) |
| 네온 테트라 | *Paracheirodon innesi* | 일반 | LC (2021) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Paracheirodon-innesi.html) |
| 팬더 코리도라스 | *Corydoras panda* | 일반 | NT (2014) | - | 보통 | 6,000 | 4,500 | 안정 | 0.0350 |  | [FishBase](https://www.fishbase.se/summary/Corydoras-panda.html) |
| 엔젤피시 | *Pterophyllum scalare* | 고급 | LC (2020) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Pterophyllum-scalare.html) |
| 오스카 | *Astronotus ocellatus* | 고급 | LC (2020) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Astronotus-ocellatus.html) |
| 레드벨리 피라냐 | *Pygocentrus nattereri* | 고급 | LC (2020) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Pygocentrus-nattereri.html) |
| 디스커스 | *Symphysodon aequifasciatus* | 희귀 | LC (2018) | - | 보통 | 6,000 | 6,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Symphysodon-aequifasciatus.html) |
| 실버 아로와나 | *Osteoglossum bicirrhosum* | 희귀 | LC (2020) | - | 보통 | 6,000 | 6,000 | 안정 | 0.0500 | 관상용 치어 채집 압력 큼 | [FishBase](https://www.fishbase.se/summary/Osteoglossum-bicirrhosum.html) |
| 전기뱀장어 | *Electrophorus electricus* | 영웅 | LC (2020) | - | 보통 | 1,500 | 1,500 | 안정 | 0.0500 | 2019년 3종으로 분리됨 | [FishBase](https://www.fishbase.se/summary/Electrophorus-electricus.html) |
| 피라루쿠 | *Arapaima gigas* | 전설 | DD (1996) | 증가 | 적음 | 400 | 400 | 안정 | 0.0200 | 브라질 관리 구역에서 약 2,500(1999) → 17만 이상(2017)으로 회복. CITES 부속서 II | [FishBase](https://www.fishbase.se/summary/Arapaima-gigas.html) |

| 고대·오리지널 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 황금가시어 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 황금 수몰림: 우기 수몰림에만 나타나는 금빛 가시 지느러미 물고기 |

### 북미 민물 (Lv.12)

| 어종 | 학명 | 희귀도 | IUCN (연도) | 추세 | 실제 규모 | 수용량 | 시작 수 | 시작 상태 | r/일 | 메모 | 출처 |
|---|---|---|---|---|---|---:|---:|---|---:|---|---|
| 블루길 | *Lepomis macrochirus* | 일반 | LC (2018) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Lepomis-macrochirus.html) |
| 펌프킨시드 | *Lepomis gibbosus* | 일반 | LC (2012) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Lepomis-gibbosus.html) |
| 세일핀 몰리 | *Poecilia latipinna* | 일반 | LC (2019) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Poecilia-latipinna.html) |
| 큰입배스 | *Micropterus salmoides* | 고급 | LC (2018) | - | 매우 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Micropterus-salmoides.html) |
| 무지개송어 | *Oncorhynchus mykiss* | 고급 | LC (2020) | - | 매우 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Oncorhynchus-mykiss.html) |
| 채널메기 | *Ictalurus punctatus* | 고급 | LC (2012) | - | 매우 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Ictalurus-punctatus.html) |
| 패들피시 | *Polyodon spathula* | 영웅 | VU (2019) | 감소 | 적음 | 1,500 | 675 | 안정 | 0.0175 | CITES 부속서 II | [FishBase](https://www.fishbase.se/summary/Polyodon-spathula.html) |
| 앨리게이터 가 | *Atractosteus spatula* | 영웅 | LC (2018) | - | 보통 | 1,500 | 1,500 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Atractosteus-spatula.html) |
| 호수철갑상어 | *Acipenser fulvescens* | 전설 | EN (2019) | 감소 | 매우 적음 | 400 | 100 | 취약 | 0.0052 | 오대호 개체군은 역사적 수준의 1% 미만, 레이니강 등 일부는 5만 이상 (COSEWIC) | [FishBase](https://www.fishbase.se/summary/Acipenser-fulvescens.html) |

| 고대·오리지널 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 안개은린어 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 안개 호수: 새벽 안개 속에서만 수면에 오르는 은빛 대형어 |

### 태평양 (Lv.15)

| 어종 | 학명 | 희귀도 | IUCN (연도) | 추세 | 실제 규모 | 수용량 | 시작 수 | 시작 상태 | r/일 | 메모 | 출처 |
|---|---|---|---|---|---|---:|---:|---|---:|---|---|
| 넙치 (광어) | *Paralichthys olivaceus* | 일반 | NE | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 | IUCN 미평가. 유통량 대부분 양식 | [FishBase](https://www.fishbase.se/summary/Paralichthys-olivaceus.html) |
| 흰동가리 | *Amphiprion ocellaris* | 일반 | LC (2021) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Amphiprion-ocellaris.html) |
| 참돔 | *Pagrus major* | 고급 | LC (2009) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Pagrus-major.html) |
| 옐로탱 | *Zebrasoma flavescens* | 고급 | LC (2010) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Zebrasoma-flavescens.html) |
| 블루탱 | *Paracanthurus hepatus* | 고급 | LC (2010) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Paracanthurus-hepatus.html) |
| 만다린피시 | *Synchiropus splendidus* | 희귀 | LC (2018) | - | 많음 | 6,000 | 6,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Synchiropus-splendidus.html) |
| 나폴레옹피시 | *Cheilinus undulatus* | 희귀 | EN (2024) | 감소 | 적음 | 1,500 | 375 | 취약 | 0.0105 | 34년간 50% 이상 감소. CITES 부속서 II | [FishBase](https://www.fishbase.se/summary/Cheilinus-undulatus.html) |
| 개복치 | *Mola mola* | 영웅 | VU (2011) | 감소 | 보통 | 1,500 | 675 | 안정 | 0.0175 | 추세는 평가 기준(A)에서 추정 | [FishBase](https://www.fishbase.se/summary/Mola-mola.html) |
| 태평양 참다랑어 | *Thunnus orientalis* | 영웅 | NT (2021) | 증가 | 보통 | 1,500 | 1,125 | 안정 | 0.0350 | 산란 친어량 비어획 대비 23.2%(2022)까지 회복 중 (ISC 2024) | [FishBase](https://www.fishbase.se/summary/Thunnus-orientalis.html) |
| 청새치 | *Makaira nigricans* | 전설 | VU (2021) | 감소 | 보통 | 400 | 180 | 안정 | 0.0087 | 추세는 평가 기준(A)에서 추정 | [FishBase](https://www.fishbase.se/summary/Makaira-nigricans.html) |

| 고대·오리지널 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 별빛복어 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 별빛 산호정원: 몸에 별자리 같은 발광 점이 있는 복어 |

### 아프리카 민물 (Lv.20)

| 어종 | 학명 | 희귀도 | IUCN (연도) | 추세 | 실제 규모 | 수용량 | 시작 수 | 시작 상태 | r/일 | 메모 | 출처 |
|---|---|---|---|---|---|---:|---:|---|---:|---|---|
| 옐로 시클리드 | *Labidochromis caeruleus* | 일반 | LC (2018) | - | 보통 | 6,000 | 6,000 | 안정 | 0.0500 | 말라위 호수 고유 | [FishBase](https://www.fishbase.se/summary/Labidochromis-caeruleus.html) |
| 브리샤르디 | *Neolamprologus brichardi* | 일반 | LC (2025) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Neolamprologus-brichardi.html) |
| 나일 틸라피아 | *Oreochromis niloticus* | 일반 | LC (2020) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Oreochromis-niloticus.html) |
| 데모이소니 | *Pseudotropheus demasoni* | 고급 | VU (2018) | - | 매우 적음 | 400 | 180 | 안정 | 0.0250 | 말라위 호수 폼보 바위 일대에만 분포 (현재 Chindongo 속) | [FishBase](https://www.fishbase.se/summary/Pseudotropheus-demasoni.html) |
| 블루 돌핀 시클리드 | *Cyrtocara moorii* | 고급 | VU (2018) | - | 적음 | 1,500 | 675 | 안정 | 0.0250 |  | [FishBase](https://www.fishbase.se/summary/Cyrtocara-moorii.html) |
| 아프리카 버터플라이피시 | *Pantodon buchholzi* | 고급 | LC (2019) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Pantodon-buchholzi.html) |
| 엘레펀트노즈 | *Gnathonemus petersii* | 고급 | LC (2019) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Gnathonemus-petersii.html) |
| 세네갈 비키르 | *Polypterus senegalus* | 고급 | LC (2019) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Polypterus-senegalus.html) |
| 프론토사 | *Cyphotilapia frontosa* | 희귀 | NT (2025) | - | 보통 | 6,000 | 4,500 | 안정 | 0.0350 |  | [FishBase](https://www.fishbase.se/summary/Cyphotilapia-frontosa.html) |
| 나일퍼치 | *Lates niloticus* | 영웅 | LC (2019) | - | 많음 | 1,500 | 1,500 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Lates-niloticus.html) |

| 고대·오리지널 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 화염시클리드 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 불꽃 호수: 열수 분출구 근처에 사는 붉은 불꽃 무늬 시클리드 |

### 유럽 민물 (Lv.22)

| 어종 | 학명 | 희귀도 | IUCN (연도) | 추세 | 실제 규모 | 수용량 | 시작 수 | 시작 상태 | r/일 | 메모 | 출처 |
|---|---|---|---|---|---|---:|---:|---|---:|---|---|
| 텐치 | *Tinca tinca* | 일반 | LC (2022) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Tinca-tinca.html) |
| 유럽 퍼치 | *Perca fluviatilis* | 일반 | LC (2022) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Perca-fluviatilis.html) |
| 잉어 | *Cyprinus carpio* | 일반 | LC (2022) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 | 원산지 야생형은 감소, 도입 개체군은 매우 많음 | [FishBase](https://www.fishbase.se/summary/Cyprinus-carpio.html) |
| 강꼬치고기 | *Esox lucius* | 고급 | LC (2022) | - | 매우 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Esox-lucius.html) |
| 브라운 송어 | *Salmo trutta* | 고급 | LC (2022) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Salmo-trutta.html) |
| 유럽 뱀장어 | *Anguilla anguilla* | 희귀 | CR (2018) | 감소 | 매우 적음 | 400 | 48 | 취약 | 0.0056 | 실뱀장어 유입량이 1960~79년 수준의 1.4~6% | [FishBase](https://www.fishbase.se/summary/Anguilla-anguilla.html) |
| 웰스메기 | *Silurus glanis* | 영웅 | LC (2022) | - | 많음 | 1,500 | 1,500 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Silurus-glanis.html) |
| 벨루가 철갑상어 | *Huso huso* | 전설 | CR (2022) | 감소 | 매우 적음 | 400 | 48 | 취약 | 0.0028 | 야생 개체군은 거의 방류 개체에 의존 | [FishBase](https://www.fishbase.se/summary/Huso-huso.html) |

| 고대·오리지널 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 샘물요정송어 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 요정의 샘: 반투명 지느러미를 가진 작은 송어 |

### 대서양 (Lv.25)

| 어종 | 학명 | 희귀도 | IUCN (연도) | 추세 | 실제 규모 | 수용량 | 시작 수 | 시작 상태 | r/일 | 메모 | 출처 |
|---|---|---|---|---|---|---:|---:|---|---:|---|---|
| 대서양 청어 | *Clupea harengus* | 일반 | LC (2009) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Clupea-harengus.html) |
| 대서양 고등어 | *Scomber scombrus* | 일반 | LC (2022) | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Scomber-scombrus.html) |
| 대서양 대구 | *Gadus morhua* | 고급 | VU (1996) | 감소 | 많음 | 20,000 | 9,000 | 안정 | 0.0175 | 1990년대 북서대서양 어장 붕괴. 평가가 오래됨(1996) | [FishBase](https://www.fishbase.se/summary/Gadus-morhua.html) |
| 대서양 연어 | *Salmo salar* | 고급 | NT (2023) | 감소 | 보통 | 6,000 | 4,500 | 안정 | 0.0245 | 야생 회귀 개체 감소. 유통량 대부분 양식 | [FishBase](https://www.fishbase.se/summary/Salmo-salar.html) |
| 퀸 엔젤피시 | *Holacanthus ciliaris* | 고급 | LC (2009) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Holacanthus-ciliaris.html) |
| 대서양 핼리벗 | *Hippoglossus hippoglossus* | 희귀 | NT (2021) | - | 적음 | 1,500 | 1,125 | 안정 | 0.0350 | 회복력 매우 낮음 | [FishBase](https://www.fishbase.se/summary/Hippoglossus-hippoglossus.html) |
| 대서양 참다랑어 | *Thunnus thynnus* | 영웅 | LC (2021) | 증가 | 보통 | 1,500 | 1,500 | 안정 | 0.0500 | 관리 강화 후 회복으로 2021년 하향 조정 | [FishBase](https://www.fishbase.se/summary/Thunnus-thynnus.html) |
| 황새치 | *Xiphias gladius* | 영웅 | NT (2021) | 감소 | 많음 | 1,500 | 1,125 | 안정 | 0.0245 | 평가 기준 A2bd | [FishBase](https://www.fishbase.se/summary/Xiphias-gladius.html) |

| 고대·오리지널 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 유령장어 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 난파선 해역: 난파선 안에서만 발견되는 창백한 장어 |

### 인도양 (Lv.28)

| 어종 | 학명 | 희귀도 | IUCN (연도) | 추세 | 실제 규모 | 수용량 | 시작 수 | 시작 상태 | r/일 | 메모 | 출처 |
|---|---|---|---|---|---|---:|---:|---|---:|---|---|
| 파우더블루탱 | *Acanthurus leucosternon* | 고급 | LC (2010) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Acanthurus-leucosternon.html) |
| 쏠배감펭 | *Pterois miles* | 고급 | LC (2017) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Pterois-miles.html) |
| 엠퍼러 엔젤피시 | *Pomacanthus imperator* | 고급 | LC (2009) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Pomacanthus-imperator.html) |
| 무어리시 아이돌 | *Zanclus cornutus* | 고급 | LC (2015) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Zanclus-cornutus.html) |
| 클라운 트리거피시 | *Balistoides conspicillum* | 희귀 | LC (2022) | - | 보통 | 6,000 | 6,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Balistoides-conspicillum.html) |
| 돛새치 | *Istiophorus platypterus* | 영웅 | VU (2021) | 감소 | 보통 | 1,500 | 675 | 안정 | 0.0175 | 추세는 평가 기준(A)에서 추정 | [FishBase](https://www.fishbase.se/summary/Istiophorus-platypterus.html) |
| 만타가오리 | *Mobula birostris* | 영웅 | EN (2019) | 감소 | 적음 | 1,500 | 375 | 취약 | 0.0105 | CITES 부속서 II | [FishBase](https://www.fishbase.se/summary/Mobula-birostris.html) |
| 실러캔스 | *Latimeria chalumnae* | 전설 | CR (2000) | - | 매우 적음 | 400 | 48 | 취약 | 0.0040 | 추정 500마리 이하(1998). CITES 부속서 I | [FishBase](https://www.fishbase.se/summary/Latimeria-chalumnae.html) |
| 고래상어 | *Rhincodon typus* | 전설 | EN (2025) | 감소 | 적음 | 400 | 100 | 취약 | 0.0052 | 75년간 약 50% 감소. 전 세계 추정 13만~20만(검증 안 됨) | [FishBase](https://www.fishbase.se/summary/Rhincodon-typus.html) |

| 고대·오리지널 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 진주용비늘어 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 진주 군도: 진주광택 비늘을 가진 우아한 해수어 |

### 북극해 (Lv.30)

| 어종 | 학명 | 희귀도 | IUCN (연도) | 추세 | 실제 규모 | 수용량 | 시작 수 | 시작 상태 | r/일 | 메모 | 출처 |
|---|---|---|---|---|---|---:|---:|---|---:|---|---|
| 북극대구 | *Boreogadus saida* | 일반 | NE | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 | IUCN 미평가. 북극 생태계 핵심 먹이종 | [FishBase](https://www.fishbase.se/summary/Boreogadus-saida.html) |
| 열빙어 | *Mallotus villosus* | 일반 | NE | - | 매우 많음 | 50,000 | 50,000 | 안정 | 0.0500 | IUCN 미평가 | [FishBase](https://www.fishbase.se/summary/Mallotus-villosus.html) |
| 럼프피시 | *Cyclopterus lumpus* | 고급 | NE | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 | IUCN 미평가 | [FishBase](https://www.fishbase.se/summary/Cyclopterus-lumpus.html) |
| 그린란드 핼리벗 | *Reinhardtius hippoglossoides* | 고급 | NT (2021) | 감소 | 많음 | 20,000 | 15,000 | 안정 | 0.0245 | 평가 기준 A4bcd | [FishBase](https://www.fishbase.se/summary/Reinhardtius-hippoglossoides.html) |
| 북극곤들매기 | *Salvelinus alpinus* | 고급 | LC (2023) | - | 많음 | 20,000 | 20,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Salvelinus-alpinus.html) |
| 늑대고기 | *Anarhichas lupus* | 희귀 | NE | - | 보통 | 6,000 | 6,000 | 안정 | 0.0500 | IUCN 미평가 | [FishBase](https://www.fishbase.se/summary/Anarhichas-lupus.html) |
| 북극 홍어 | *Amblyraja hyperborea* | 희귀 | LC (2024) | - | 보통 | 6,000 | 6,000 | 안정 | 0.0500 |  | [FishBase](https://www.fishbase.se/summary/Amblyraja-hyperborea.html) |
| 그린란드상어 | *Somniosus microcephalus* | 전설 | VU (2019) | 감소 | 적음 | 400 | 180 | 안정 | 0.0087 | 평가 기준 A2bd. 수명 수백 년, 번식 매우 느림 | [FishBase](https://www.fishbase.se/summary/Somniosus-microcephalus.html) |

| 고대·오리지널 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 오로라빙어 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 오로라 빙하: 오로라 색으로 비늘이 물드는 빙하 물고기 |

### 데본기 (Lv.35)


| 어종 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 케팔라스피스 | *Cephalaspis* | 일반 | 20,000 | 20,000 | 0.0200 | 가능 |  |
| 보트리올레피스 | *Bothriolepis* | 고급 | 6,000 | 6,000 | 0.0200 | 가능 |  |
| 유스테놉테론 | *Eusthenopteron* | 고급 | 6,000 | 6,000 | 0.0200 | 가능 |  |
| 스테타칸투스 | *Stethacanthus* | 희귀 | 1,500 | 1,500 | 0.0200 | 가능 |  |
| 클라도셀라케 | *Cladoselache* | 희귀 | 1,500 | 1,500 | 0.0200 | 가능 |  |
| 틱타알릭 | *Tiktaalik roseae* | 영웅 | 400 | 400 | 0.0200 | 가능 |  |
| 하이네리아 | *Hyneria lindae* | 영웅 | 400 | 400 | 0.0200 | 가능 |  |
| 둔클레오스테우스 | *Dunkleosteus terrelli* | 전설 | 400 | 400 | 0.0100 | 불가 |  |
| 수정갑주어 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 수정 동굴: 투명한 수정 갑옷을 두른 판피어 |
| 크로노피시 | 오리지널 | 전설 | 5 | 5 | 0.0000 | 불가 | 시간 원정(고대 지역) 중 극저확률. 잡을 때마다 다른 시대의 특징을 띤다 |

### 백악기 (Lv.40)


| 어종 | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |
|---|---|---|---:|---:|---:|---|---|
| 엔코두스 | *Enchodus* | 일반 | 20,000 | 20,000 | 0.0200 | 가능 |  |
| 레피도테스 | *Lepidotes* | 일반 | 20,000 | 20,000 | 0.0200 | 가능 |  |
| 길리쿠스 | *Gillicus arcuatus* | 고급 | 6,000 | 6,000 | 0.0200 | 가능 |  |
| 프로토스피래나 | *Protosphyraena* | 고급 | 6,000 | 6,000 | 0.0200 | 가능 |  |
| 스쿠알리코락스 | *Squalicorax* | 희귀 | 1,500 | 1,500 | 0.0200 | 가능 |  |
| 크레톡시리나 | *Cretoxyrhina mantelli* | 영웅 | 400 | 400 | 0.0200 | 가능 |  |
| 프티코두스 | *Ptychodus* | 영웅 | 400 | 400 | 0.0200 | 가능 |  |
| 크시팍티누스 | *Xiphactinus audax* | 전설 | 400 | 400 | 0.0100 | 불가 |  |
| 폭풍턱어 | 오리지널 | 영웅 | 60 | 60 | 0.0100 | 불가 | 폭풍 해협: 폭풍이 치는 날에만 나타나는 거대 포식어 |
