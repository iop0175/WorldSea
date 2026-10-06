/**
 * 어종별 모프 정의 (유전자 좌위 + 색 팔레트). 기획서 "어종 목록"의 모프 유전자 예시를 옮겼다.
 * 1단계 지역(아시아·중미 민물) 19종부터. 나머지 지역은 그림 작업 순서에 맞춰 추가한다 (docs/fish-art.md).
 *
 * 임시 규칙(교배 기능 때 다시 정함):
 * - 야생형이 우성, 돌연변이(모프)는 열성. 예외는 dominance를 따로 적었다.
 * - 색·무늬 '농도'처럼 연속형인 특징도 그림 작업을 위해 몇 단계 대립유전자로 나눴다.
 * - 팔레트 기준색은 그림이 나온 뒤 미리보기 페이지에서 보며 조정한다.
 */
import type { Dominance, GeneLayer, LocusDef } from '../db/types';
import { palette, type FishPalette, type SpeciesMorphs } from './fishArt';

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
};
