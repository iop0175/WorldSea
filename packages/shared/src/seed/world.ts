/**
 * 월드 정적 데이터 원본: 지역 12개 + 어종 (실존 91 + 고대 16 + 오리지널 13).
 * 어종 목록은 기획서 "어종 목록" 탭 기준, 실제 야생 현황은 docs/species-population.md 조사 결과.
 * 지역 수치(해금 레벨, 수색 시간, 스태미너)와 가격은 밸런싱 전 임시값.
 * 서버 전용 (클라이언트 번들에 넣지 않는다).
 */
import type { GameRarity, IucnCategory, PopulationTier, PopulationTrend } from '../game/population';

export type RegionKind = 'freshwater' | 'sea' | 'ancient';
export type Salinity = 'fresh' | 'brackish' | 'marine' | 'euryhaline';

export interface RegionSeed {
  id: string;
  nameKo: string;
  kind: RegionKind;
  unlockStage: number;
  requiredLevel: number;
  requiresTimeTicket: boolean;
  specialMapChance: number;
  huntSeconds: number;
  huntStaminaCost: number;
  sortOrder: number;
  /** 이 지역 특별 맵 이름 (기획 참고) */
  specialMapName: string;
}

const r = (
  sortOrder: number, id: string, nameKo: string, kind: RegionKind, unlockStage: number,
  requiredLevel: number, huntSeconds: number, huntStaminaCost: number, specialMapName: string,
): RegionSeed => ({
  id, nameKo, kind, unlockStage, requiredLevel, requiresTimeTicket: kind === 'ancient',
  specialMapChance: 0.01, huntSeconds, huntStaminaCost, sortOrder, specialMapName,
});

/** 임시 수치: 해금 레벨, 수색 1회 시간(초), 스태미너 */
export const REGIONS: RegionSeed[] = [
  r(1, 'asia_fresh', '아시아 민물', 'freshwater', 1, 1, 300, 1, '달빛 연못'),
  r(2, 'central_america_fresh', '중미 민물', 'freshwater', 1, 5, 360, 1, '세노테 샘'),
  r(3, 'south_america_fresh', '남미 민물', 'freshwater', 2, 10, 480, 2, '황금 수몰림'),
  r(4, 'north_america_fresh', '북미 민물', 'freshwater', 2, 12, 480, 2, '안개 호수'),
  r(5, 'pacific', '태평양', 'sea', 2, 15, 600, 2, '별빛 산호정원'),
  r(6, 'africa_fresh', '아프리카 민물', 'freshwater', 3, 20, 720, 3, '불꽃 호수'),
  r(7, 'europe_fresh', '유럽 민물', 'freshwater', 3, 22, 720, 3, '요정의 샘'),
  r(8, 'atlantic', '대서양', 'sea', 3, 25, 900, 3, '난파선 해역'),
  r(9, 'indian', '인도양', 'sea', 3, 28, 1080, 4, '진주 군도'),
  r(10, 'arctic', '북극해', 'sea', 3, 30, 1200, 4, '오로라 빙하'),
  r(11, 'devonian', '데본기', 'ancient', 4, 35, 1500, 5, '수정 동굴'),
  r(12, 'cretaceous', '백악기', 'ancient', 4, 40, 1800, 5, '폭풍 해협'),
];

export interface SpeciesSeedBase {
  id: string;
  nameKo: string;
  scientificName: string | null;
  regionId: string;
  rarity: GameRarity;
  tempMin: number;
  tempMax: number;
  salinity: Salinity;
  maxSizeCm: number;
}

export interface ExtantSeed extends SpeciesSeedBase {
  origin: 'extant';
  iucn: IucnCategory;
  /** IUCN 평가 연도 (NE면 null) */
  iucnYear: number | null;
  tier: PopulationTier;
  trend: PopulationTrend;
  /** 알려진 실제 개체수·특이 사항 */
  note: string | null;
}

export interface FossilSeed extends SpeciesSeedBase {
  origin: 'fossil';
}

export interface OriginalSeed extends SpeciesSeedBase {
  origin: 'original' | 'original_legend';
  /** 등장 장소·컨셉 (기획 초안) */
  concept: string;
}

export type SpeciesSeed = ExtantSeed | FossilSeed | OriginalSeed;

/** 학명 → id (snake_case). 속 이름만 있는 고대 어종은 속 이름 */
export const speciesIdFromName = (scientificName: string): string =>
  scientificName.toLowerCase().trim().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');

const RARITY_KO: Record<string, GameRarity> = { 일반: 'common', 고급: 'uncommon', 희귀: 'rare', 영웅: 'epic', 전설: 'legendary' };
const SAL_KO: Record<string, Salinity> = { 민물: 'fresh', 해수: 'marine', '민물·기수': 'brackish', '민물·해수': 'euryhaline' };

type ExtantRow = [nameKo: string, sci: string, rarityKo: string, temp: string, salKo: string, size: number,
  iucn: IucnCategory, year: number | null, tier: PopulationTier, trend: PopulationTrend, note?: string];

function parseTemp(t: string): [number, number] {
  const m = t.match(/^(-?\d+)–(-?\d+)$/);
  if (!m) throw new Error(`수온 형식 오류: ${t}`);
  return [Number(m[1]), Number(m[2])];
}

function extant(regionId: string, rows: ExtantRow[]): ExtantSeed[] {
  return rows.map(([nameKo, sci, rk, temp, sk, size, iucn, year, tier, trend, note]) => {
    const [tempMin, tempMax] = parseTemp(temp);
    return {
      origin: 'extant', id: speciesIdFromName(sci), nameKo, scientificName: sci, regionId,
      rarity: RARITY_KO[rk]!, tempMin, tempMax, salinity: SAL_KO[sk]!, maxSizeCm: size,
      iucn, iucnYear: year, tier, trend, note: note ?? null,
    };
  });
}

type FossilRow = [nameKo: string, sci: string, rarityKo: string, temp: string, salKo: string, size: number];
function fossil(regionId: string, rows: FossilRow[]): FossilSeed[] {
  return rows.map(([nameKo, sci, rk, temp, sk, size]) => {
    const [tempMin, tempMax] = parseTemp(temp);
    return { origin: 'fossil', id: speciesIdFromName(sci), nameKo, scientificName: sci, regionId,
      rarity: RARITY_KO[rk]!, tempMin, tempMax, salinity: SAL_KO[sk]!, maxSizeCm: size };
  });
}

// 추세 표기: 'decreasing'은 IUCN 추세 또는 평가 기준(A2·A4 = 감소 기준)에서 읽은 값. 확인 못 한 것은 'unknown'.
export const EXTANT: ExtantSeed[] = [
  ...extant('asia_fresh', [
    ['베타', 'Betta splendens', '일반', '24–30', '민물', 7, 'VU', 2011, 'uncommon', 'decreasing', '서식지(논·습지) 감소로 야생 개체군 위협. 관상어 유통은 거의 양식 개체'],
    ['드워프 구라미', 'Trichogaster lalius', '일반', '22–28', '민물', 9, 'LC', 2010, 'common', 'unknown'],
    ['하렌퀸 라스보라', 'Trigonostigma heteromorpha', '일반', '22–27', '민물', 5, 'LC', 2019, 'common', 'unknown'],
    ['체리바브', 'Puntius titteya', '일반', '23–27', '민물', 5, 'VU', 2019, 'scarce', 'unknown', '스리랑카 고유종, 분포 좁음'],
    ['금붕어', 'Carassius auratus', '고급', '18–24', '민물', 30, 'LC', 2010, 'very_common', 'unknown'],
    ['펄 구라미', 'Trichopodus leerii', '고급', '24–28', '민물', 12, 'NT', 2019, 'uncommon', 'unknown'],
    ['클라운 로치', 'Chromobotia macracanthus', '고급', '25–30', '민물', 30, 'LC', 2019, 'common', 'unknown', '관상용은 대부분 야생 채집'],
    ['쉬리', 'Coreoleuciscus splendidus', '희귀', '12–20', '민물', 13, 'NE', null, 'uncommon', 'unknown', '한국 고유종 (IUCN 미평가)'],
    ['코이', 'Cyprinus rubrofuscus', '희귀', '15–25', '민물', 90, 'LC', 2020, 'very_common', 'unknown'],
    ['아시아 아로와나', 'Scleropages formosus', '영웅', '24–30', '민물', 90, 'EN', 2019, 'very_scarce', 'decreasing', 'CITES 부속서 I. 유통은 등록 양식장 개체'],
  ]),
  ...extant('central_america_fresh', [
    ['소드테일', 'Xiphophorus hellerii', '일반', '22–28', '민물', 14, 'LC', 2018, 'very_common', 'unknown'],
    ['플래티', 'Xiphophorus maculatus', '일반', '20–26', '민물', 6, 'DD', 2018, 'common', 'unknown', '정보 부족(DD)'],
    ['몰리', 'Poecilia sphenops', '일반', '24–28', '민물', 10, 'LC', 2018, 'very_common', 'unknown'],
    ['컨빅 시클리드', 'Amatitlania nigrofasciata', '일반', '20–28', '민물', 12, 'DD', 2019, 'common', 'unknown', '정보 부족(DD)'],
    ['파이어마우스 시클리드', 'Thorichthys meeki', '고급', '24–30', '민물', 17, 'LC', 2018, 'common', 'unknown'],
    ['레드 데빌 시클리드', 'Amphilophus labiatus', '고급', '24–28', '민물', 25, 'NE', null, 'uncommon', 'unknown', '니카라과·마나과 호수에만 분포 (IUCN 미평가)'],
    ['멕시코 테트라', 'Astyanax mexicanus', '희귀', '20–25', '민물', 12, 'LC', 2011, 'very_common', 'unknown', '동굴형 개체군은 일부 동굴에만 있음'],
    ['재규어 시클리드', 'Parachromis managuensis', '희귀', '24–28', '민물', 55, 'LC', 2020, 'common', 'unknown'],
    ['트로피컬 가', 'Atractosteus tropicus', '영웅', '20–30', '민물', 125, 'LC', 2018, 'uncommon', 'decreasing'],
  ]),
  ...extant('south_america_fresh', [
    ['구피', 'Poecilia reticulata', '일반', '22–28', '민물', 5, 'LC', 2020, 'very_common', 'unknown'],
    ['네온 테트라', 'Paracheirodon innesi', '일반', '20–26', '민물', 3, 'LC', 2021, 'very_common', 'unknown'],
    ['팬더 코리도라스', 'Corydoras panda', '일반', '20–25', '민물', 5, 'NT', 2014, 'uncommon', 'unknown'],
    ['엔젤피시', 'Pterophyllum scalare', '고급', '24–30', '민물', 15, 'LC', 2020, 'common', 'unknown'],
    ['오스카', 'Astronotus ocellatus', '고급', '22–28', '민물', 35, 'LC', 2020, 'common', 'unknown'],
    ['레드벨리 피라냐', 'Pygocentrus nattereri', '고급', '24–28', '민물', 33, 'LC', 2020, 'common', 'unknown'],
    ['디스커스', 'Symphysodon aequifasciatus', '희귀', '28–31', '민물', 20, 'LC', 2018, 'uncommon', 'unknown'],
    ['실버 아로와나', 'Osteoglossum bicirrhosum', '희귀', '24–30', '민물', 90, 'LC', 2020, 'uncommon', 'unknown', '관상용 치어 채집 압력 큼'],
    ['전기뱀장어', 'Electrophorus electricus', '영웅', '24–28', '민물', 200, 'LC', 2020, 'uncommon', 'unknown', '2019년 3종으로 분리됨'],
    ['피라루쿠', 'Arapaima gigas', '전설', '24–30', '민물', 300, 'DD', 1996, 'scarce', 'increasing', '브라질 관리 구역에서 약 2,500(1999) → 17만 이상(2017)으로 회복. CITES 부속서 II'],
  ]),
  ...extant('north_america_fresh', [
    ['블루길', 'Lepomis macrochirus', '일반', '16–27', '민물', 30, 'LC', 2018, 'very_common', 'unknown'],
    ['펌프킨시드', 'Lepomis gibbosus', '일반', '16–25', '민물', 25, 'LC', 2012, 'very_common', 'unknown'],
    ['세일핀 몰리', 'Poecilia latipinna', '일반', '22–28', '민물·기수', 15, 'LC', 2019, 'very_common', 'unknown'],
    ['큰입배스', 'Micropterus salmoides', '고급', '15–27', '민물', 75, 'LC', 2018, 'very_common', 'unknown'],
    ['무지개송어', 'Oncorhynchus mykiss', '고급', '10–18', '민물', 80, 'LC', 2020, 'very_common', 'unknown'],
    ['채널메기', 'Ictalurus punctatus', '고급', '18–29', '민물', 130, 'LC', 2012, 'very_common', 'unknown'],
    ['패들피시', 'Polyodon spathula', '영웅', '10–25', '민물', 220, 'VU', 2019, 'scarce', 'decreasing', 'CITES 부속서 II'],
    ['앨리게이터 가', 'Atractosteus spatula', '영웅', '18–30', '민물', 300, 'LC', 2018, 'uncommon', 'unknown'],
    ['호수철갑상어', 'Acipenser fulvescens', '전설', '5–20', '민물', 270, 'EN', 2019, 'very_scarce', 'decreasing', '오대호 개체군은 역사적 수준의 1% 미만, 레이니강 등 일부는 5만 이상 (COSEWIC)'],
  ]),
  ...extant('pacific', [
    ['넙치 (광어)', 'Paralichthys olivaceus', '일반', '10–25', '해수', 100, 'NE', null, 'common', 'unknown', 'IUCN 미평가. 유통량 대부분 양식'],
    ['흰동가리', 'Amphiprion ocellaris', '일반', '24–28', '해수', 11, 'LC', 2021, 'common', 'unknown'],
    ['참돔', 'Pagrus major', '고급', '15–25', '해수', 100, 'LC', 2009, 'common', 'unknown'],
    ['옐로탱', 'Zebrasoma flavescens', '고급', '24–28', '해수', 20, 'LC', 2010, 'common', 'unknown'],
    ['블루탱', 'Paracanthurus hepatus', '고급', '24–28', '해수', 31, 'LC', 2010, 'common', 'unknown'],
    ['만다린피시', 'Synchiropus splendidus', '희귀', '24–27', '해수', 7, 'LC', 2018, 'common', 'unknown'],
    ['나폴레옹피시', 'Cheilinus undulatus', '희귀', '24–28', '해수', 200, 'EN', 2024, 'scarce', 'decreasing', '34년간 50% 이상 감소. CITES 부속서 II'],
    ['개복치', 'Mola mola', '영웅', '10–25', '해수', 330, 'VU', 2011, 'uncommon', 'decreasing', '추세는 평가 기준(A)에서 추정'],
    ['태평양 참다랑어', 'Thunnus orientalis', '영웅', '13–25', '해수', 300, 'NT', 2021, 'uncommon', 'increasing', '산란 친어량 비어획 대비 23.2%(2022)까지 회복 중 (ISC 2024)'],
    ['청새치', 'Makaira nigricans', '전설', '22–30', '해수', 400, 'VU', 2021, 'uncommon', 'decreasing', '추세는 평가 기준(A)에서 추정'],
  ]),
  ...extant('africa_fresh', [
    ['옐로 시클리드', 'Labidochromis caeruleus', '일반', '24–28', '민물', 10, 'LC', 2018, 'uncommon', 'unknown', '말라위 호수 고유'],
    ['브리샤르디', 'Neolamprologus brichardi', '일반', '24–27', '민물', 10, 'LC', 2025, 'common', 'unknown'],
    ['나일 틸라피아', 'Oreochromis niloticus', '일반', '22–30', '민물', 60, 'LC', 2020, 'very_common', 'unknown'],
    ['데모이소니', 'Pseudotropheus demasoni', '고급', '24–28', '민물', 7, 'VU', 2018, 'very_scarce', 'unknown', '말라위 호수 폼보 바위 일대에만 분포 (현재 Chindongo 속)'],
    ['블루 돌핀 시클리드', 'Cyrtocara moorii', '고급', '24–28', '민물', 20, 'VU', 2018, 'scarce', 'unknown'],
    ['아프리카 버터플라이피시', 'Pantodon buchholzi', '고급', '24–30', '민물', 13, 'LC', 2019, 'common', 'unknown'],
    ['엘레펀트노즈', 'Gnathonemus petersii', '고급', '24–28', '민물', 23, 'LC', 2019, 'common', 'unknown'],
    ['세네갈 비키르', 'Polypterus senegalus', '고급', '24–28', '민물', 30, 'LC', 2019, 'common', 'unknown'],
    ['프론토사', 'Cyphotilapia frontosa', '희귀', '24–27', '민물', 33, 'NT', 2025, 'uncommon', 'unknown'],
    ['나일퍼치', 'Lates niloticus', '영웅', '22–30', '민물', 200, 'LC', 2019, 'common', 'unknown'],
  ]),
  ...extant('europe_fresh', [
    ['텐치', 'Tinca tinca', '일반', '10–25', '민물', 70, 'LC', 2022, 'very_common', 'unknown'],
    ['유럽 퍼치', 'Perca fluviatilis', '일반', '10–24', '민물', 50, 'LC', 2022, 'very_common', 'unknown'],
    ['잉어', 'Cyprinus carpio', '일반', '10–28', '민물', 120, 'LC', 2022, 'very_common', 'unknown', '원산지 야생형은 감소, 도입 개체군은 매우 많음'],
    ['강꼬치고기', 'Esox lucius', '고급', '4–22', '민물', 150, 'LC', 2022, 'very_common', 'unknown'],
    ['브라운 송어', 'Salmo trutta', '고급', '4–19', '민물', 100, 'LC', 2022, 'common', 'unknown'],
    ['유럽 뱀장어', 'Anguilla anguilla', '희귀', '10–25', '민물·해수', 130, 'CR', 2018, 'very_scarce', 'decreasing', '실뱀장어 유입량이 1960~79년 수준의 1.4~6%'],
    ['웰스메기', 'Silurus glanis', '영웅', '10–25', '민물', 270, 'LC', 2022, 'common', 'unknown'],
    ['벨루가 철갑상어', 'Huso huso', '전설', '5–20', '민물·해수', 500, 'CR', 2022, 'very_scarce', 'decreasing', '야생 개체군은 거의 방류 개체에 의존'],
  ]),
  ...extant('atlantic', [
    ['대서양 청어', 'Clupea harengus', '일반', '2–15', '해수', 45, 'LC', 2009, 'very_common', 'unknown'],
    ['대서양 고등어', 'Scomber scombrus', '일반', '8–20', '해수', 60, 'LC', 2022, 'very_common', 'unknown'],
    ['대서양 대구', 'Gadus morhua', '고급', '0–12', '해수', 200, 'VU', 1996, 'common', 'decreasing', '1990년대 북서대서양 어장 붕괴. 평가가 오래됨(1996)'],
    ['대서양 연어', 'Salmo salar', '고급', '2–18', '민물·해수', 150, 'NT', 2023, 'uncommon', 'decreasing', '야생 회귀 개체 감소. 유통량 대부분 양식'],
    ['퀸 엔젤피시', 'Holacanthus ciliaris', '고급', '24–28', '해수', 45, 'LC', 2009, 'common', 'unknown'],
    ['대서양 핼리벗', 'Hippoglossus hippoglossus', '희귀', '3–9', '해수', 470, 'NT', 2021, 'scarce', 'unknown', '회복력 매우 낮음'],
    ['대서양 참다랑어', 'Thunnus thynnus', '영웅', '10–25', '해수', 300, 'LC', 2021, 'uncommon', 'increasing', '관리 강화 후 회복으로 2021년 하향 조정'],
    ['황새치', 'Xiphias gladius', '영웅', '13–27', '해수', 450, 'NT', 2021, 'common', 'decreasing', '평가 기준 A2bd'],
  ]),
  ...extant('indian', [
    ['파우더블루탱', 'Acanthurus leucosternon', '고급', '24–28', '해수', 23, 'LC', 2010, 'common', 'unknown'],
    ['쏠배감펭', 'Pterois miles', '고급', '22–28', '해수', 35, 'LC', 2017, 'common', 'unknown'],
    ['엠퍼러 엔젤피시', 'Pomacanthus imperator', '고급', '24–28', '해수', 40, 'LC', 2009, 'common', 'unknown'],
    ['무어리시 아이돌', 'Zanclus cornutus', '고급', '24–28', '해수', 23, 'LC', 2015, 'common', 'unknown'],
    ['클라운 트리거피시', 'Balistoides conspicillum', '희귀', '24–28', '해수', 50, 'LC', 2022, 'uncommon', 'unknown'],
    ['돛새치', 'Istiophorus platypterus', '영웅', '21–28', '해수', 340, 'VU', 2021, 'uncommon', 'decreasing', '추세는 평가 기준(A)에서 추정'],
    ['만타가오리', 'Mobula birostris', '영웅', '20–29', '해수', 700, 'EN', 2019, 'scarce', 'decreasing', 'CITES 부속서 II'],
    ['실러캔스', 'Latimeria chalumnae', '전설', '14–22', '해수', 200, 'CR', 2000, 'very_scarce', 'unknown', '추정 500마리 이하(1998). CITES 부속서 I'],
    ['고래상어', 'Rhincodon typus', '전설', '21–30', '해수', 1800, 'EN', 2025, 'scarce', 'decreasing', '75년간 약 50% 감소. 전 세계 추정 13만~20만(검증 안 됨)'],
  ]),
  ...extant('arctic', [
    ['북극대구', 'Boreogadus saida', '일반', '-1–4', '해수', 40, 'NE', null, 'very_common', 'unknown', 'IUCN 미평가. 북극 생태계 핵심 먹이종'],
    ['열빙어', 'Mallotus villosus', '일반', '0–8', '해수', 25, 'NE', null, 'very_common', 'unknown', 'IUCN 미평가'],
    ['럼프피시', 'Cyclopterus lumpus', '고급', '2–10', '해수', 60, 'NE', null, 'common', 'unknown', 'IUCN 미평가'],
    ['그린란드 핼리벗', 'Reinhardtius hippoglossoides', '고급', '0–6', '해수', 120, 'NT', 2021, 'common', 'decreasing', '평가 기준 A4bcd'],
    ['북극곤들매기', 'Salvelinus alpinus', '고급', '0–12', '민물·해수', 100, 'LC', 2023, 'common', 'unknown'],
    ['늑대고기', 'Anarhichas lupus', '희귀', '0–10', '해수', 150, 'NE', null, 'uncommon', 'unknown', 'IUCN 미평가'],
    ['북극 홍어', 'Amblyraja hyperborea', '희귀', '-1–4', '해수', 100, 'LC', 2024, 'uncommon', 'unknown'],
    ['그린란드상어', 'Somniosus microcephalus', '전설', '-1–10', '해수', 640, 'VU', 2019, 'scarce', 'decreasing', '평가 기준 A2bd. 수명 수백 년, 번식 매우 느림'],
  ]),
];

export const FOSSIL: FossilSeed[] = [
  ...fossil('devonian', [
    ['케팔라스피스', 'Cephalaspis', '일반', '18–26', '민물', 25],
    ['보트리올레피스', 'Bothriolepis', '고급', '18–26', '민물·해수', 30],
    ['유스테놉테론', 'Eusthenopteron', '고급', '18–26', '민물·기수', 180],
    ['스테타칸투스', 'Stethacanthus', '희귀', '20–28', '해수', 150],
    ['클라도셀라케', 'Cladoselache', '희귀', '20–28', '해수', 180],
    ['틱타알릭', 'Tiktaalik roseae', '영웅', '20–28', '민물', 270],
    ['하이네리아', 'Hyneria lindae', '영웅', '18–26', '민물', 300],
    ['둔클레오스테우스', 'Dunkleosteus terrelli', '전설', '20–28', '해수', 400],
  ]),
  ...fossil('cretaceous', [
    ['엔코두스', 'Enchodus', '일반', '20–28', '해수', 150],
    ['레피도테스', 'Lepidotes', '일반', '20–28', '민물·해수', 200],
    ['길리쿠스', 'Gillicus arcuatus', '고급', '20–28', '해수', 200],
    ['프로토스피래나', 'Protosphyraena', '고급', '20–28', '해수', 300],
    ['스쿠알리코락스', 'Squalicorax', '희귀', '20–28', '해수', 500],
    ['크레톡시리나', 'Cretoxyrhina mantelli', '영웅', '20–28', '해수', 700],
    ['프티코두스', 'Ptychodus', '영웅', '20–28', '해수', 1000],
    ['크시팍티누스', 'Xiphactinus audax', '전설', '20–28', '해수', 500],
  ]),
];

/** 고대 전설급: 교배 불가 (경매는 가능) */
export const NON_BREEDABLE_FOSSILS = new Set(['dunkleosteus_terrelli', 'xiphactinus_audax']);

const o = (
  id: string, nameKo: string, regionId: string, tempMin: number, tempMax: number, salinity: Salinity,
  maxSizeCm: number, concept: string,
): OriginalSeed => ({
  origin: 'original', id, nameKo, scientificName: null, regionId, rarity: 'epic',
  tempMin, tempMax, salinity, maxSizeCm, concept,
});

/**
 * 오리지널 (교배 불가, 경매 가능). 수온·크기는 게임용 임시값.
 * 지역별 특별 개체는 특별 맵 전용, 희귀도는 영웅(임시).
 */
export const ORIGINAL: OriginalSeed[] = [
  o('orig_moonscale', '월광비늘어', 'asia_fresh', 20, 26, 'fresh', 8, '달빛 연못: 달빛을 받으면 비늘이 은은하게 빛나는 소형어'),
  o('orig_crystalglass', '수정유리어', 'central_america_fresh', 20, 25, 'fresh', 10, '세노테 샘: 몸이 투명해 뼈와 내장이 비치는 동굴 샘 물고기'),
  o('orig_goldspine', '황금가시어', 'south_america_fresh', 24, 30, 'fresh', 40, '황금 수몰림: 우기 수몰림에만 나타나는 금빛 가시 지느러미 물고기'),
  o('orig_mistsilver', '안개은린어', 'north_america_fresh', 8, 18, 'fresh', 120, '안개 호수: 새벽 안개 속에서만 수면에 오르는 은빛 대형어'),
  o('orig_flamecichlid', '화염시클리드', 'africa_fresh', 26, 32, 'fresh', 20, '불꽃 호수: 열수 분출구 근처에 사는 붉은 불꽃 무늬 시클리드'),
  o('orig_fairytrout', '샘물요정송어', 'europe_fresh', 6, 16, 'fresh', 18, '요정의 샘: 반투명 지느러미를 가진 작은 송어'),
  o('orig_starpuffer', '별빛복어', 'pacific', 24, 28, 'marine', 25, '별빛 산호정원: 몸에 별자리 같은 발광 점이 있는 복어'),
  o('orig_ghosteel', '유령장어', 'atlantic', 6, 16, 'marine', 150, '난파선 해역: 난파선 안에서만 발견되는 창백한 장어'),
  o('orig_pearldragon', '진주용비늘어', 'indian', 24, 28, 'marine', 60, '진주 군도: 진주광택 비늘을 가진 우아한 해수어'),
  o('orig_aurorasmelt', '오로라빙어', 'arctic', -1, 6, 'marine', 20, '오로라 빙하: 오로라 색으로 비늘이 물드는 빙하 물고기'),
  o('orig_crystalarmor', '수정갑주어', 'devonian', 18, 26, 'euryhaline', 80, '수정 동굴: 투명한 수정 갑옷을 두른 판피어'),
  o('orig_stormjaw', '폭풍턱어', 'cretaceous', 20, 28, 'marine', 600, '폭풍 해협: 폭풍이 치는 날에만 나타나는 거대 포식어'),
  // 오리지널 전설급: 서버 전체에 몇 마리만. 특별 맵 전용 아님(등장 경로가 따로 있음)
  {
    origin: 'original_legend', id: 'orig_chronofish', nameKo: '크로노피시', scientificName: null, regionId: 'devonian',
    rarity: 'legendary', tempMin: 18, tempMax: 28, salinity: 'euryhaline', maxSizeCm: 120,
    concept: '시간 원정(고대 지역) 중 극저확률. 잡을 때마다 다른 시대의 특징을 띤다',
  },
  // 심연의 왕(가상 심해 확장 지역)은 지역이 아직 없어 시드에서 뺀다. 세 번째 오리지널 전설급도 미정.
];

export const ALL_SPECIES: SpeciesSeed[] = [...EXTANT, ...FOSSIL, ...ORIGINAL];
