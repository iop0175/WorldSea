/**
 * 어종별 모프 정의 (유전자 좌위 + 색 팔레트). 기획서 "어종 목록"의 모프 유전자 예시를 옮겼다.
 * 실존 91종 전부. 고대 어종(모프 유전자 추후)과 오리지널(교배 불가)은 모프 없이 기본 팔레트만 (fish-art-notes 참고).
 *
 * 임시 규칙(교배 기능 때 다시 정함):
 * - 야생형이 우성, 돌연변이(모프)는 열성. 예외는 dominance를 따로 적었다.
 * - 색·무늬 '농도'처럼 연속형인 특징도 그림 작업을 위해 몇 단계 대립유전자로 나눴다.
 * - 팔레트 기준색은 그림이 나온 뒤 미리보기 페이지에서 보며 조정한다.
 */
import type { Dominance, GeneLayer, LocusDef } from '../db/types';
import { palette, shiftHex, type FishPalette, type SpeciesMorphs } from './fishArt';

type AlleleSpec = [id: string, nameKo: string, dominance?: Dominance];

/** 첫 대립유전자 = 야생형(우성), 나머지는 열성 (따로 적은 경우 제외). assetKey는 대립유전자 id = 파일 이름 뒤쪽 */
function locus(id: string, nameKo: string, layer: GeneLayer, alleles: AlleleSpec[]): LocusDef {
  return {
    id,
    nameKo,
    layer,
    wildTypeAlleleId: alleles[0]![0],
    alleles: alleles.map(([aid, n, d], i) => ({ id: aid, nameKo: n, dominance: d ?? (i === 0 ? 'dominant' : 'recessive'), assetKey: aid })),
  };
}

function morphs(loci: LocusDef[], palettes: Record<string, FishPalette>): SpeciesMorphs {
  const color = loci.find((l) => l.id === 'color');
  return { loci, colorLocus: color?.id, palettes };
}

/** '체색 농도'처럼 연속형 색 특징: 야생 / 옅은 / 진한 3단계 */
const shadeLocus = (nameKo = '체색') => locus('color', '색', 'body', [['wild', '야생'], ['pale', `옅은 ${nameKo}`], ['deep', `진한 ${nameKo}`]]);
const shadePalettes = (body: string, fin: string = body, pattern: string = fin): Record<string, FishPalette> => ({
  wild: palette(body, fin, pattern),
  pale: palette(shiftHex(body, 0.12, 0.7), shiftHex(fin, 0.12, 0.7), shiftHex(pattern, 0.12, 0.7)),
  deep: palette(shiftHex(body, -0.1, 1.2), shiftHex(fin, -0.1, 1.2), shiftHex(pattern, -0.1, 1.2)),
});
/** 무늬 선명도·밀도처럼 연속형 무늬 특징: 보통 / 두 단계 */
const patternLocus = (a: AlleleSpec, b: AlleleSpec, c: AlleleSpec) => locus('pattern', '무늬', 'pattern', [a, b, c]);
const intensityMorphs = (nameKo: string, body: string, fin?: string, pattern?: string) => morphs([shadeLocus(nameKo)], shadePalettes(body, fin, pattern));

export const FISH_MORPHS: Record<string, SpeciesMorphs> = {
  // ---------------- 아시아 민물 ----------------
  betta_splendens: morphs(
    [
      locus('color', '색', 'body', [['wild', '야생'], ['red', '레드'], ['blue', '블루'], ['white', '화이트']]),
      locus('pattern', '무늬', 'pattern', [['solid', '솔리드'], ['marble', '마블'], ['butterfly', '버터플라이']]),
      locus('fin', '지느러미', 'fin', [['plakat', '플라캇'], ['veil', '베일'], ['halfmoon', '하프문']]),
    ],
    {
      wild: palette('#7a6a4f', '#8a5a3a', '#3f6f8f'),
      red: palette('#c8323a', '#d63a3a', '#f2e6d8'),
      blue: palette('#2f5fbf', '#2a6fd6', '#e8eef8'),
      white: palette('#ece8e0', '#f4f0ea', '#c8323a'),
    },
  ),
  trichogaster_lalius: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['blue', '블루'], ['red', '레드'], ['powder_blue', '파우더블루']])],
    {
      wild: palette('#c8603a', '#4a7fb8', '#3a6fb0'),
      blue: palette('#3a6fc8', '#c8603a', '#2a4f98'),
      red: palette('#d8402f', '#e86a3a', '#a82f25'),
      powder_blue: palette('#7fb2e0', '#9cc6ea', '#5a8fc8'),
    },
  ),
  trigonostigma_heteromorpha: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['gold', '골드'], ['albino', '알비노']])],
    {
      wild: palette('#d88a6a', '#e07a5a', '#2a2a3a'),
      gold: palette('#e8c25a', '#f0b04a', '#8a6a2a'),
      albino: palette('#f0dccf', '#f5c8b8', '#d8a898'),
    },
  ),
  puntius_titteya: morphs(
    [locus('color', '색', 'body', [['red', '레드'], ['gold', '골드']])],
    {
      red: palette('#c8402f', '#d8503a', '#4a3a2a'),
      gold: palette('#e0b04a', '#e8c06a', '#8a6a3a'),
    },
  ),
  carassius_auratus: morphs(
    [
      locus('color', '색', 'body', [['wild', '야생'], ['red', '레드'], ['calico', '캘리코'], ['black', '블랙']]),
      locus('fin', '지느러미', 'fin', [['single', '홑꼬리'], ['comet', '코멧'], ['fantail', '팬테일'], ['veil', '베일']]),
    ],
    {
      wild: palette('#8a7a3a', '#7a6a3a', '#5a4a2a'),
      red: palette('#e0602a', '#e8703a', '#f4ead8'),
      calico: palette('#d8d0c8', '#d0c8c0', '#e0602a'),
      black: palette('#3a3a42', '#2f2f38', '#55555f'),
    },
  ),
  trichopodus_leerii: morphs(
    [locus('pattern', '무늬', 'pattern', [['pearl', '펄'], ['reduced', '스팟 감소']])],
    { wild: palette('#9aa8a0', '#a8b0a8', '#f0f0e8') },
  ),
  chromobotia_macracanthus: morphs(
    [locus('color', '색', 'body', [['wild', '오렌지'], ['pale', '옅은 오렌지'], ['deep', '진한 오렌지']])],
    {
      wild: palette('#e8862a', '#d8402f', '#2a2a2a'),
      pale: palette('#f0b06a', '#e87a5a', '#3a3a3a'),
      deep: palette('#e0601a', '#c8301f', '#1f1f1f'),
    },
  ),
  coreoleuciscus_splendidus: morphs(
    [locus('pattern', '무늬', 'pattern', [['band', '띠'], ['faint', '흐린 띠'], ['bold', '선명한 띠']])],
    { wild: palette('#8a9a6a', '#7a8a5a', '#e0a03a') },
  ),
  cyprinus_rubrofuscus: morphs(
    [
      locus('color', '색', 'body', [['wild', '야생'], ['kohaku', '홍백'], ['sanke', '삼색'], ['ogon', '황금']]),
      locus('pattern', '무늬', 'pattern', [['solid', '단색'], ['spotted', '반점']]),
      locus('scale', '비늘', 'scale', [['normal', '일반'], ['doitsu', '도이츠']]),
    ],
    {
      wild: palette('#6a6a4a', '#5a5a3a', '#4a4a2a'),
      kohaku: palette('#f0ece4', '#f0ece4', '#d8302a'),
      sanke: palette('#f0ece4', '#f0ece4', '#d8302a'),
      ogon: palette('#e8c040', '#f0d060', '#c89a2a'),
    },
  ),
  scleropages_formosus: morphs(
    [locus('color', '색', 'body', [['green', '그린'], ['red', '레드'], ['gold', '골드']])],
    {
      green: palette('#7a9a7a', '#6a8a6a', '#3a5a4a'),
      red: palette('#c84a3a', '#d8402f', '#8a2a2a'),
      gold: palette('#d8b04a', '#e0c060', '#a8802a'),
    },
  ),

  // ---------------- 중미 민물 ----------------
  xiphophorus_hellerii: morphs(
    [
      locus('color', '색', 'body', [['green', '그린'], ['red', '레드'], ['black', '블랙']]),
      locus('fin', '지느러미', 'fin', [['normal', '일반'], ['hifin', '하이핀']]),
    ],
    {
      green: palette('#7a9a5a', '#e0c04a', '#c8402f'),
      red: palette('#d8402f', '#e0503a', '#2a2a2a'),
      black: palette('#2f2f35', '#3a3a42', '#55555f'),
    },
  ),
  xiphophorus_maculatus: morphs(
    [
      locus('color', '색', 'body', [['wild', '야생'], ['red', '레드'], ['blue', '블루'], ['sunset', '선셋']]),
      locus('pattern', '무늬', 'pattern', [['none', '없음'], ['mickey', '미키마우스'], ['tuxedo', '턱시도']]),
    ],
    {
      wild: palette('#a8a070', '#b0a878', '#2a2a2a'),
      red: palette('#e0402f', '#e8503a', '#1f1f1f'),
      blue: palette('#5a7fc8', '#6a8fd0', '#1f1f2a'),
      sunset: palette('#f0a03a', '#e0402f', '#1f1f1f'),
    },
  ),
  poecilia_sphenops: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['black', '블랙'], ['dalmatian', '달마시안'], ['gold', '골드']])],
    {
      wild: palette('#9a9a80', '#a8a088', '#5a5a48'),
      black: palette('#2a2a30', '#33333a', '#4a4a52'),
      dalmatian: palette('#ecece4', '#e4e4dc', '#1f1f1f'),
      gold: palette('#e8b84a', '#f0c860', '#c0902a'),
    },
  ),
  amatitlania_nigrofasciata: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['pink_albino', '핑크 알비노']])],
    {
      wild: palette('#8a9098', '#7a8088', '#1f1f24'),
      pink_albino: palette('#f0d8d0', '#f4e0d8', '#e8b8a8'),
    },
  ),
  thorichthys_meeki: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['deep_red', '진한 붉은 목']])],
    {
      wild: palette('#8a9aa0', '#d8503a', '#c8402f'),
      deep_red: palette('#8a9aa0', '#e0302a', '#d8201f'),
    },
  ),
  amphilophus_labiatus: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['orange', '오렌지'], ['white', '화이트']])],
    {
      wild: palette('#7a7a6a', '#6a6a5a', '#e08a3a'),
      orange: palette('#f08a2a', '#f0a04a', '#d8602a'),
      white: palette('#f0ece4', '#f4f0e8', '#e0d8cc'),
    },
  ),
  astyanax_mexicanus: morphs(
    [
      locus('form', '형태', 'form', [['eyed', '유안형'], ['blind', '동굴형 무안형']]),
      locus('color', '색', 'body', [['wild', '야생'], ['albino', '알비노']]),
    ],
    {
      wild: palette('#b0b8b0', '#c0c8c0', '#5a6a6a'),
      albino: palette('#f0e0dc', '#f4e8e4', '#e8c8c0'),
    },
  ),
  parachromis_managuensis: morphs(
    [locus('pattern', '무늬', 'pattern', [['normal', '보통 반점'], ['dense', '빽빽한 반점'], ['sparse', '듬성한 반점']])],
    { wild: palette('#c8c0a0', '#b8b090', '#2a2a2a') },
  ),
  atractosteus_tropicus: morphs(
    [locus('pattern', '무늬', 'pattern', [['normal', '보통 점박이'], ['dense', '진한 점박이'], ['faint', '흐린 점박이']])],
    { wild: palette('#8a8a6a', '#7a7a5a', '#3a3a2a') },
  ),
  // ---------------- 남미 민물 ----------------
  poecilia_reticulata: morphs(
    [
      locus('color', '색', 'body', [['wild', '야생'], ['red', '레드'], ['blue', '블루'], ['yellow', '옐로']]),
      locus('pattern', '무늬', 'pattern', [['none', '없음'], ['tuxedo', '턱시도'], ['mosaic', '모자이크'], ['cobra', '코브라']]),
      locus('fin', '지느러미', 'fin', [['round', '라운드'], ['delta', '델타'], ['sword', '소드']]),
    ],
    {
      wild: palette('#a8a890', '#d89a4a', '#2a2a2a'),
      red: palette('#e8c0b0', '#e0302a', '#1f1f1f'),
      blue: palette('#b8c8e0', '#3a6fd8', '#1f1f2a'),
      yellow: palette('#f0e0a0', '#f0c030', '#2a2a2a'),
    },
  ),
  paracheirodon_innesi: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['gold', '골드'], ['albino', '알비노']])],
    {
      wild: palette('#c8ccd8', '#d8dce4', '#2aa0e0'),
      gold: palette('#e8d8a0', '#f0e4b8', '#e0b040'),
      albino: palette('#f0e4e0', '#f4ece8', '#e0b0b0'),
    },
  ),
  corydoras_panda: morphs(
    [
      locus('color', '색', 'body', [['wild', '야생'], ['albino', '알비노']]),
      locus('fin', '지느러미', 'fin', [['normal', '일반'], ['longfin', '롱핀']]),
    ],
    { wild: palette('#ece4d8', '#e8e0d4', '#1f1f1f'), albino: palette('#f4e8e0', '#f4ece4', '#e8c0b0') },
  ),
  pterophyllum_scalare: morphs(
    [
      locus('color', '색', 'body', [['silver', '실버'], ['gold', '골드'], ['black', '블랙']]),
      locus('pattern', '무늬', 'pattern', [['stripe', '줄무늬'], ['marble', '마블'], ['zebra', '지브라']]),
      locus('fin', '지느러미', 'fin', [['normal', '일반'], ['veil', '베일']]),
    ],
    {
      silver: palette('#c8ccd0', '#d0d4d8', '#2a2a2a'),
      gold: palette('#e8c868', '#f0d888', '#c8902a'),
      black: palette('#2a2a30', '#33333a', '#55555f'),
    },
  ),
  astronotus_ocellatus: morphs(
    [locus('color', '색', 'body', [['tiger', '타이거'], ['red', '레드'], ['albino', '알비노']])],
    {
      tiger: palette('#4a4a40', '#3a3a32', '#e0602a'),
      red: palette('#d8402a', '#3a3a32', '#e86a3a'),
      albino: palette('#f0e8e0', '#f4ece4', '#e8803a'),
    },
  ),
  pygocentrus_nattereri: intensityMorphs('붉은 배', '#9aa0a0', '#8a9090', '#d8402a'),
  symphysodon_aequifasciatus: morphs(
    [
      locus('color', '색', 'body', [['wild', '야생'], ['blue', '블루'], ['red', '레드'], ['yellow', '옐로']]),
      locus('pattern', '무늬', 'pattern', [['stripe', '줄무늬'], ['turquoise', '터콰이즈'], ['leopard', '표범']]),
    ],
    {
      wild: palette('#a87a4a', '#9a6a3a', '#3a6fa0'),
      blue: palette('#3a7fc8', '#2a6ab8', '#c8603a'),
      red: palette('#d8402a', '#c8302a', '#f0c060'),
      yellow: palette('#f0c840', '#e8b830', '#d8602a'),
    },
  ),
  osteoglossum_bicirrhosum: morphs(
    [locus('color', '색', 'body', [['silver', '실버'], ['platinum', '플래티넘']])],
    { silver: palette('#b8c0c8', '#8a9aa8', '#c89a6a'), platinum: palette('#ecf0f2', '#e0e6ea', '#f4f4f0') },
  ),
  electrophorus_electricus: intensityMorphs('체색', '#5a4a3a', '#4a3a2a', '#e0a050'),
  arapaima_gigas: morphs(
    [patternLocus(['normal', '보통'], ['wide', '넓은 붉은 반점'], ['narrow', '좁은 붉은 반점'])],
    { wild: palette('#6a7060', '#5a6050', '#c8302a') },
  ),

  // ---------------- 북미 민물 ----------------
  lepomis_macrochirus: intensityMorphs('푸른 뺨', '#8a9a6a', '#7a8a5a', '#3a5aa0'),
  lepomis_gibbosus: morphs([patternLocus(['spot', '보통 반점'], ['faint', '흐린 반점'], ['bold', '선명한 반점'])], { wild: palette('#8aa070', '#7a9060', '#e8802a') }),
  poecilia_latipinna: morphs(
    [
      locus('color', '색', 'body', [['wild', '야생'], ['black', '블랙'], ['gold', '골드'], ['dalmatian', '달마시안']]),
      locus('fin', '지느러미', 'fin', [['normal', '일반'], ['sailfin', '세일핀']]),
    ],
    {
      wild: palette('#9aa088', '#a8a890', '#3a6a8a'),
      black: palette('#2a2a30', '#33333a', '#4a4a52'),
      gold: palette('#e8b84a', '#f0c860', '#c0902a'),
      dalmatian: palette('#ecece4', '#e4e4dc', '#1f1f1f'),
    },
  ),
  micropterus_salmoides: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['gold', '골드']])],
    { wild: palette('#7a8a5a', '#6a7a4a', '#2a3a2a'), gold: palette('#d8b850', '#c8a840', '#a07a2a') },
  ),
  oncorhynchus_mykiss: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['golden', '골든'], ['albino', '알비노']])],
    {
      wild: palette('#9aa890', '#8a9880', '#d86a7a'),
      golden: palette('#f0c850', '#e8b840', '#e8803a'),
      albino: palette('#f4ece8', '#f0e8e4', '#f0b8b8'),
    },
  ),
  ictalurus_punctatus: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['albino', '알비노']])],
    { wild: palette('#7a8a90', '#6a7a80', '#2a2a2a'), albino: palette('#f4e8e0', '#f0e4dc', '#e8c8c0') },
  ),
  polyodon_spathula: intensityMorphs('체색', '#7a8a90', '#6a7a80', '#4a5a60'),
  atractosteus_spatula: morphs([patternLocus(['normal', '보통 점박이'], ['dense', '진한 점박이'], ['faint', '흐린 점박이'])], { wild: palette('#7a7a5a', '#6a6a4a', '#2a2a1f') }),
  acipenser_fulvescens: intensityMorphs('체색', '#7a7060', '#6a6050', '#4a4038'),

  // ---------------- 태평양 ----------------
  paralichthys_olivaceus: intensityMorphs('체색', '#8a7a5a', '#7a6a4a', '#4a3a2a'),
  amphiprion_ocellaris: morphs(
    [
      locus('color', '색', 'body', [['orange', '오렌지'], ['black', '블랙']]),
      locus('pattern', '무늬', 'pattern', [['normal', '세 줄'], ['snowflake', '스노우플레이크'], ['picasso', '피카소']]),
    ],
    { orange: palette('#f0802a', '#f08a3a', '#f4f4f0'), black: palette('#2a2a2a', '#333333', '#f4f4f0') },
  ),
  pagrus_major: intensityMorphs('붉은 체색', '#e07a7a', '#d86a6a', '#3a8ad8'),
  zebrasoma_flavescens: intensityMorphs('노랑', '#f0d020', '#f0d020', '#f4f4f0'),
  paracanthurus_hepatus: morphs(
    [locus('color', '색', 'body', [['blue', '블루'], ['yellow_belly', '옐로 배']])],
    { blue: palette('#2a6ad8', '#f0d020', '#1a1a2a'), yellow_belly: palette('#4a8ae0', '#f0d020', '#1a1a2a') },
  ),
  synchiropus_splendidus: morphs(
    [locus('color', '색', 'body', [['green', '그린'], ['red', '레드']])],
    { green: palette('#3a9a7a', '#2a6ad0', '#f0902a'), red: palette('#d8402a', '#e05a3a', '#3a6ad0') },
  ),
  cheilinus_undulatus: morphs([patternLocus(['normal', '보통 머리 무늬'], ['faint', '흐린 머리 무늬'], ['bold', '선명한 머리 무늬'])], { wild: palette('#4a8a7a', '#3a7a6a', '#a0c860') }),
  mola_mola: intensityMorphs('체색', '#9aa4ac', '#8a949c', '#6a747c'),
  thunnus_orientalis: intensityMorphs('체색', '#4a5a80', '#3a4a70', '#c8ccd0'),
  makaira_nigricans: morphs([patternLocus(['normal', '보통 줄무늬'], ['faint', '흐린 줄무늬'], ['bold', '진한 줄무늬'])], { wild: palette('#2a4a8a', '#1f3a7a', '#6ab0e8') }),

  // ---------------- 아프리카 민물 ----------------
  labidochromis_caeruleus: morphs(
    [locus('color', '색', 'body', [['yellow', '옐로'], ['deep', '진한 옐로'], ['white', '화이트']])],
    { yellow: palette('#f0d040', '#1f1f1f', '#1f1f1f'), deep: palette('#f0b820', '#1f1f1f', '#1f1f1f'), white: palette('#f4f0e8', '#1f1f1f', '#1f1f1f') },
  ),
  neolamprologus_brichardi: morphs(
    [
      locus('color', '색', 'body', [['wild', '야생'], ['white', '백색']]),
      locus('fin', '지느러미', 'fin', [['normal', '일반'], ['longfin', '롱핀']]),
    ],
    { wild: palette('#d8c8a8', '#e8e0d0', '#3a5a8a'), white: palette('#f4f0ec', '#f4f2ee', '#c8c0b8') },
  ),
  oreochromis_niloticus: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['red', '레드']])],
    { wild: palette('#8a9080', '#a05a4a', '#3a3a30'), red: palette('#e86a5a', '#e05040', '#c03a2a') },
  ),
  pseudotropheus_demasoni: morphs([patternLocus(['normal', '보통 간격'], ['narrow', '좁은 간격'], ['wide', '넓은 간격'])], { wild: palette('#4a8ae0', '#3a7ad0', '#1a1a3a') }),
  cyrtocara_moorii: intensityMorphs('블루', '#5a9ae0', '#4a8ad0', '#3a6ab0'),
  pantodon_buchholzi: morphs([patternLocus(['normal', '보통 반점'], ['dense', '빽빽한 반점'], ['sparse', '듬성한 반점'])], { wild: palette('#a8a080', '#8a8268', '#3a3a2a') }),
  gnathonemus_petersii: intensityMorphs('체색', '#4a4040', '#3a3232', '#c8c0b0'),
  polypterus_senegalus: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['albino', '알비노']])],
    { wild: palette('#8a8a70', '#7a7a60', '#4a4a3a'), albino: palette('#f4ece4', '#f0e8e0', '#e8d0c8') },
  ),
  cyphotilapia_frontosa: morphs(
    [
      locus('color', '색', 'body', [['blue', '블루'], ['white', '화이트']]),
      locus('pattern', '무늬', 'pattern', [['six_bar', '줄 6개'], ['seven_bar', '줄 7개']]),
    ],
    { blue: palette('#6a9ad8', '#3a6ab8', '#1f2a4a'), white: palette('#f0f0f0', '#e0e4ec', '#2a2a3a') },
  ),
  lates_niloticus: intensityMorphs('체색', '#a8b0b0', '#98a0a0', '#5a6a6a'),

  // ---------------- 유럽 민물 ----------------
  tinca_tinca: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['golden', '골든']])],
    { wild: palette('#6a7a3a', '#5a6a2a', '#3a4a1f'), golden: palette('#f0b030', '#e8a020', '#1f1f1f') },
  ),
  perca_fluviatilis: morphs([patternLocus(['band', '보통 띠'], ['faint', '흐린 띠'], ['bold', '선명한 띠'])], { wild: palette('#8a9a5a', '#e0602a', '#2a3a1f') }),
  cyprinus_carpio: morphs([locus('scale', '비늘', 'scale', [['normal', '일반'], ['mirror', '미러'], ['leather', '가죽']])], { wild: palette('#8a7a4a', '#7a6a3a', '#5a4a2a') }),
  esox_lucius: morphs([locus('pattern', '무늬', 'pattern', [['spot', '반점'], ['stripe', '줄무늬']])], { wild: palette('#6a7a4a', '#5a6a3a', '#d8d0a0') }),
  salmo_trutta: morphs([patternLocus(['normal', '보통 반점'], ['dense', '빽빽한 반점'], ['sparse', '듬성한 반점'])], { wild: palette('#a89060', '#988050', '#c8302a') }),
  anguilla_anguilla: intensityMorphs('체색', '#5a5a3a', '#4a4a2a', '#c8c0a0'),
  silurus_glanis: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['albino', '알비노']])],
    { wild: palette('#5a5a4a', '#4a4a3a', '#2a2a20'), albino: palette('#f4ece4', '#f0e4dc', '#e8c8c0') },
  ),
  huso_huso: intensityMorphs('체색', '#7a8088', '#6a7078', '#4a5058'),

  // ---------------- 대서양 ----------------
  clupea_harengus: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['bright', '강한 은빛']])],
    { wild: palette('#a8b8c8', '#98a8b8', '#3a5a7a'), bright: palette('#dce8f0', '#c8d8e4', '#4a7a9a') },
  ),
  scomber_scombrus: morphs([patternLocus(['wave', '보통 물결'], ['fine', '촘촘한 물결'], ['bold', '굵은 물결'])], { wild: palette('#b8c8c8', '#5a7a8a', '#1f3a4a') }),
  gadus_morhua: intensityMorphs('체색', '#a09a70', '#908a60', '#5a5438'),
  salmo_salar: morphs([patternLocus(['normal', '보통 반점'], ['dense', '빽빽한 반점'], ['sparse', '듬성한 반점'])], { wild: palette('#b0b8c0', '#8a98a8', '#2a2a2a') }),
  holacanthus_ciliaris: intensityMorphs('블루·옐로', '#3a8ad8', '#f0c820', '#f0c820'),
  hippoglossus_hippoglossus: intensityMorphs('체색', '#6a6050', '#5a5040', '#3a3428'),
  thunnus_thynnus: intensityMorphs('체색', '#3a4a70', '#2a3a60', '#c8ccd0'),
  xiphias_gladius: intensityMorphs('체색', '#4a4a5a', '#3a3a4a', '#c0c4c8'),

  // ---------------- 인도양 ----------------
  acanthurus_leucosternon: intensityMorphs('블루', '#4aa0e0', '#f0d020', '#1a1a2a'),
  pterois_miles: morphs(
    [
      locus('color', '색', 'body', [['red', '레드'], ['black', '블랙']]),
      locus('fin', '지느러미', 'fin', [['normal', '보통 가시'], ['long', '긴 가시']]),
    ],
    { red: palette('#e8d8c8', '#d8b8a8', '#a0302a'), black: palette('#d8d4d0', '#c8c4c0', '#2a2a2a') },
  ),
  pomacanthus_imperator: morphs([patternLocus(['normal', '보통 줄무늬'], ['faint', '흐린 줄무늬'], ['bold', '선명한 줄무늬'])], { wild: palette('#2a4ab0', '#f0c820', '#f0d840') }),
  zanclus_cornutus: morphs([locus('fin', '지느러미', 'fin', [['normal', '보통 깃'], ['long', '긴 깃']])], { wild: palette('#f4f0e0', '#f4f0e0', '#1f1f1f') }),
  balistoides_conspicillum: morphs([patternLocus(['normal', '보통 점'], ['large', '큰 점'], ['small', '작은 점'])], { wild: palette('#1f1f2a', '#2a2a35', '#f4f4f0') }),
  istiophorus_platypterus: morphs(
    [
      patternLocus(['normal', '보통 돛 반점'], ['dense', '빽빽한 돛 반점'], ['faint', '흐린 돛 반점']),
      locus('fin', '지느러미', 'fin', [['normal', '보통 돛'], ['tall', '큰 돛']]),
    ],
    { wild: palette('#2a4a7a', '#1f3a8a', '#4a8ae0') },
  ),
  mobula_birostris: morphs([patternLocus(['normal', '보통 배 무늬'], ['heavy', '진한 배 무늬'], ['clean', '깨끗한 배'])], { wild: palette('#3a3a40', '#2a2a30', '#f0f0f0') }),
  latimeria_chalumnae: morphs([patternLocus(['normal', '보통 흰 반점'], ['dense', '빽빽한 흰 반점'], ['sparse', '듬성한 흰 반점'])], { wild: palette('#3a4a6a', '#2a3a5a', '#e8ecf0') }),
  rhincodon_typus: morphs([patternLocus(['normal', '보통 흰 점'], ['dense', '빽빽한 흰 점'], ['sparse', '듬성한 흰 점'])], { wild: palette('#4a5a6a', '#3a4a5a', '#e8ecf0') }),

  // ---------------- 북극해 ----------------
  boreogadus_saida: intensityMorphs('체색', '#9aa098', '#8a9088', '#5a6058'),
  mallotus_villosus: morphs(
    [locus('color', '색', 'body', [['wild', '야생'], ['bright', '강한 은빛']])],
    { wild: palette('#a0b0a8', '#7a9088', '#4a6058'), bright: palette('#d8e4e0', '#b8c8c4', '#5a7a70') },
  ),
  cyclopterus_lumpus: morphs(
    [locus('color', '색', 'body', [['green', '그린'], ['orange', '오렌지'], ['blue', '블루']])],
    { green: palette('#7a9a5a', '#6a8a4a', '#4a6a3a'), orange: palette('#e8803a', '#d8702a', '#a8501f'), blue: palette('#5a8ac8', '#4a7ab8', '#2a4a8a') },
  ),
  reinhardtius_hippoglossoides: intensityMorphs('체색', '#5a5048', '#4a4038', '#2a2420'),
  salvelinus_alpinus: intensityMorphs('붉은 배', '#7a8a7a', '#e0602a', '#e8e0c8'),
  anarhichas_lupus: morphs([patternLocus(['normal', '보통 줄무늬'], ['faint', '흐린 줄무늬'], ['bold', '선명한 줄무늬'])], { wild: palette('#8a9098', '#7a8088', '#3a4048') }),
  amblyraja_hyperborea: intensityMorphs('체색', '#5a5048', '#4a4038', '#2a2420'),
  somniosus_microcephalus: intensityMorphs('체색', '#5a6068', '#4a5058', '#3a4048'),
  // ---------------- 고대 (모프 유전자는 추후, 지금은 기본 팔레트만) ----------------
  cephalaspis: morphs([], { wild: palette('#8a7a5a', '#7a6a4a', '#5a4a3a') }),
  bothriolepis: morphs([], { wild: palette('#7a7060', '#6a6050', '#4a4038') }),
  eusthenopteron: morphs([], { wild: palette('#6a7a6a', '#5a6a5a', '#3a4a3a') }),
  stethacanthus: morphs([], { wild: palette('#5a6a7a', '#4a5a6a', '#2a3a4a') }),
  cladoselache: morphs([], { wild: palette('#6a7a8a', '#5a6a7a', '#3a4a5a') }),
  tiktaalik_roseae: morphs([], { wild: palette('#7a7a5a', '#6a6a4a', '#4a4a30') }),
  hyneria_lindae: morphs([], { wild: palette('#6a6a50', '#5a5a40', '#3a3a28') }),
  dunkleosteus_terrelli: morphs([], { wild: palette('#6a6a6a', '#5a5a5a', '#8a7a6a') }),
  enchodus: morphs([], { wild: palette('#8a9aa8', '#7a8a98', '#4a5a68') }),
  lepidotes: morphs([], { wild: palette('#8a8060', '#7a7050', '#5a5038') }),
  gillicus_arcuatus: morphs([], { wild: palette('#a0a8b0', '#9098a0', '#5a6068') }),
  protosphyraena: morphs([], { wild: palette('#7a8a9a', '#6a7a8a', '#3a4a5a') }),
  squalicorax: morphs([], { wild: palette('#6a7078', '#5a6068', '#3a4048') }),
  cretoxyrhina_mantelli: morphs([], { wild: palette('#5a6878', '#4a5868', '#e0e4e8') }),
  ptychodus: morphs([], { wild: palette('#7a7060', '#6a6050', '#4a4038') }),
  xiphactinus_audax: morphs([], { wild: palette('#8a98a8', '#7a8898', '#4a5868') }),

  // ---------------- 오리지널 (교배 불가, 모프 없음) ----------------
  orig_moonscale: morphs([], { wild: palette('#c8d0e8', '#b0bce0', '#f4f0d0') }),
  orig_crystalglass: morphs([], { wild: palette('#d8eef0', '#c8e4ec', '#e0a0b0') }),
  orig_goldspine: morphs([], { wild: palette('#e8b840', '#f0c850', '#a0601f') }),
  orig_mistsilver: morphs([], { wild: palette('#c8d0d4', '#b8c4cc', '#8a98a8') }),
  orig_flamecichlid: morphs([], { wild: palette('#d8402a', '#f08a2a', '#f0d040') }),
  orig_fairytrout: morphs([], { wild: palette('#a8d8c8', '#d0f0ec', '#f0b8d8') }),
  orig_starpuffer: morphs([], { wild: palette('#2a3a6a', '#3a4a7a', '#f0e080') }),
  orig_ghosteel: morphs([], { wild: palette('#d8dce0', '#c8ccd4', '#8a90a0') }),
  orig_pearldragon: morphs([], { wild: palette('#f0ece4', '#e8dcd0', '#c8a8d8') }),
  orig_aurorasmelt: morphs([], { wild: palette('#6ad8b0', '#8a7ae0', '#e070c0') }),
  orig_crystalarmor: morphs([], { wild: palette('#b8e0f0', '#a0d0e8', '#e8f8ff') }),
  orig_stormjaw: morphs([], { wild: palette('#3a4a5a', '#2a3a4a', '#f0e060') }),
  orig_chronofish: morphs([], { wild: palette('#6a5ac8', '#e0b040', '#40d0d0') }),
};
