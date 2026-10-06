/**
 * 물고기 그림 규격과 합성 규칙 (디자인 결정 84~88번, docs/fish-art.md).
 * - 두 벌: 작은 그림(s, 16×10) / 큰 그림(l, 48×32). 줄여 쓰지 않는다.
 * - 겹: 어종별 몸 실루엣 + 어종별 모프 겹. 순서 고정.
 * - 색: 겹은 회색 5단계로만 그리고, 유전자가 정한 팔레트로 바꿔 칠한다.
 * - 움직임: 모든 겹 파일은 가로 2프레임(꼬리 흔들기). 떠다니기·뒤집기는 코드.
 * 이 파일은 순수 함수만 둔다(그리기는 클라이언트 src/game/fishCompose.ts).
 */
import type { Genotype, LocusDef } from '../db/types';

export const FISH_SIZES = {
  s: { w: 16, h: 10 },
  l: { w: 48, h: 32 },
} as const;
export type FishSize = keyof typeof FISH_SIZES;

/** 모든 겹 파일은 가로로 2프레임을 붙인다 (프레임 0 = 꼬리 왼쪽, 1 = 꼬리 오른쪽). 안 움직이는 겹은 같은 그림 두 번 */
export const FISH_FRAMES = 2;

/** 겹 파일에 쓸 수 있는 회색 5단계 (밝음 → 어두움). 팔레트 색 5개와 1:1로 바뀐다 */
export const FISH_GRAYS = ['#ffffff', '#cccccc', '#999999', '#666666', '#333333'] as const;

/** 겹 순서 (아래 → 위) */
export const FISH_SLOTS = ['fin_back', 'body', 'scale', 'pattern', 'fin_front', 'line'] as const;
export type FishSlot = (typeof FISH_SLOTS)[number];

/** 겹마다 쓰는 팔레트 줄. line(눈·윤곽선)은 고정색 그대로 */
export const SLOT_RAMP: Record<FishSlot, keyof FishPalette | null> = {
  fin_back: 'fin',
  body: 'body',
  scale: 'body',
  pattern: 'pattern',
  fin_front: 'fin',
  line: null,
};

/** 색 모프 하나 = 팔레트 하나 (각 줄 5색, 밝음 → 어두움) */
export interface FishPalette {
  body: string[];
  fin: string[];
  pattern: string[];
}

/** 어종의 모프 정의: 유전자 좌위 + 색 대립유전자별 팔레트 */
export interface SpeciesMorphs {
  loci: LocusDef[];
  /** 색 좌위 id (없으면 팔레트는 'wild' 하나) */
  colorLocus?: string;
  palettes: Record<string, FishPalette>;
}

// ---------------------------------------------------------------------------
// 팔레트 도우미: 기준색 하나로 5단계 명암 만들기
// ---------------------------------------------------------------------------
function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
}

/**
 * 기준색(가운데 단계)으로 5단계 명암을 만든다. 밝은 쪽은 색조를 살짝 노랗게, 어두운 쪽은 파랗게 돌려 도트답게.
 * 직접 고른 5색이 있으면 배열을 그대로 써도 된다.
 */
export function ramp(base: string): string[] {
  const [h, s, l] = hexToHsl(base);
  const steps = [0.3, 0.15, 0, -0.15, -0.28];
  const shifts = [-8, -4, 0, 6, 12];
  return steps.map((dl, i) => {
    let li = Math.max(0.04, Math.min(0.97, l + dl));
    // 가장 어두운 단계는 윤곽선이라 밝은 색 물고기(화이트 등)도 충분히 어둡게
    if (i === 4) li = Math.min(li, 0.32);
    return hslToHex((h + shifts[i]! + 360) % 360, Math.min(1, s * (i === 0 ? 0.85 : 1)), li);
  });
}

/** 몸·지느러미·무늬 기준색으로 팔레트 */
export const palette = (body: string, fin: string = body, pattern: string = fin): FishPalette => ({
  body: ramp(body),
  fin: ramp(fin),
  pattern: ramp(pattern),
});

// ---------------------------------------------------------------------------
// 유전 → 표현형 (임시 규칙: 우성 > 공우성 > 열성, 같은 등급끼리는 목록에서 앞선 대립유전자)
// ---------------------------------------------------------------------------
const DOMINANCE_RANK = { dominant: 2, codominant: 1, recessive: 0 } as const;

export function expressedAllele(locus: LocusDef, pair: [string, string] | undefined): string {
  if (!pair) return locus.wildTypeAlleleId;
  const [a, b] = pair;
  if (a === b) return a;
  const ia = locus.alleles.findIndex((x) => x.id === a);
  const ib = locus.alleles.findIndex((x) => x.id === b);
  const da = ia < 0 ? -1 : DOMINANCE_RANK[locus.alleles[ia]!.dominance];
  const db = ib < 0 ? -1 : DOMINANCE_RANK[locus.alleles[ib]!.dominance];
  if (da !== db) return da > db ? a : b;
  return ia <= ib ? a : b;
}

/** 좌위 id → 드러나는 대립유전자 id */
export function phenotype(loci: LocusDef[], genotype: Genotype): Record<string, string> {
  return Object.fromEntries(loci.map((l) => [l.id, expressedAllele(l, genotype[l.id])]));
}

/** 도감·세계 최초 모프 판정용 정규화 키 (야생형은 빼고 좌위 이름순). 전부 야생형이면 '' */
export function morphKey(loci: LocusDef[], pheno: Record<string, string>): string {
  return loci
    .filter((l) => pheno[l.id] && pheno[l.id] !== l.wildTypeAlleleId)
    .map((l) => `${l.id}:${pheno[l.id]}`)
    .sort()
    .join('|');
}

/** 야생형 유전자형 (모든 좌위가 야생형 동형접합) */
export function wildGenotype(loci: LocusDef[]): Genotype {
  return Object.fromEntries(loci.map((l) => [l.id, [l.wildTypeAlleleId, l.wildTypeAlleleId] as [string, string]]));
}

// ---------------------------------------------------------------------------
// 합성 계획: 어떤 파일을 어떤 팔레트 줄로 칠해서 어떤 순서로 겹칠지
// ---------------------------------------------------------------------------
/** 에셋 키: fish/<어종 id>/<s|l>/<겹>[.<대립유전자>] (src/assets 기준, 확장자 .png) */
export const fishAssetKey = (speciesId: string, size: FishSize, slot: FishSlot, allele?: string): string =>
  `fish/${speciesId}/${size}/${slot}${allele ? `.${allele}` : ''}`;

export interface FishLayer {
  key: string;
  slot: FishSlot;
  /** 칠할 팔레트 5색 (null이면 고정색 그대로) */
  colors: string[] | null;
}

export interface FishPlan {
  phenotype: Record<string, string>;
  morphKey: string;
  palette: FishPalette;
  layers: FishLayer[];
  /** 몸 파일이 없으면 그릴 수 없다 (임시 그림 사용) */
  missingBody: boolean;
}

/**
 * 규칙: 겹마다 드러난 대립유전자 이름의 파일(<겹>.<대립유전자>)이 있으면 그것을, 없으면 기본 파일(<겹>)을 쓴다.
 * 같은 겹에 여러 대립유전자 파일이 있으면 좌위 순서대로 모두 겹친다(예: 비늘 + 무늬).
 * 야생형 대립유전자는 기본 파일과 같은 뜻이라 따로 그리지 않아도 된다.
 */
export function fishLayerPlan(
  speciesId: string,
  size: FishSize,
  morphs: SpeciesMorphs | undefined,
  genotype: Genotype,
  has: (key: string) => boolean,
): FishPlan {
  const loci = morphs?.loci ?? [];
  const pheno = phenotype(loci, genotype);
  const colorAllele = morphs?.colorLocus ? pheno[morphs.colorLocus] : undefined;
  const pal = (colorAllele && morphs?.palettes[colorAllele]) || morphs?.palettes['wild'] || DEFAULT_PALETTE;
  const expressed = loci.map((l) => pheno[l.id]!).filter((a, i) => a !== loci[i]!.wildTypeAlleleId);

  const layers: FishLayer[] = [];
  for (const slot of FISH_SLOTS) {
    const r = SLOT_RAMP[slot];
    const colors = r ? pal[r] : null;
    const specific = expressed.map((a) => fishAssetKey(speciesId, size, slot, a)).filter(has);
    if (specific.length) specific.forEach((key) => layers.push({ key, slot, colors }));
    else {
      const key = fishAssetKey(speciesId, size, slot);
      if (has(key)) layers.push({ key, slot, colors });
    }
  }
  return {
    phenotype: pheno,
    morphKey: morphKey(loci, pheno),
    palette: pal,
    layers,
    missingBody: !layers.some((l) => l.slot === 'body'),
  };
}

/** 모프 정의가 없는 어종의 기본 팔레트 (회색 그대로가 아닌 은회색) */
export const DEFAULT_PALETTE: FishPalette = palette('#8fa3ad', '#7b8f99', '#4f5f68');

// ---------------------------------------------------------------------------
// 그려야 할 파일 목록 (문서·미리보기 공용)
// ---------------------------------------------------------------------------
/** 유전자 좌위 종류 → 그 모프가 바꾸는 겹 */
export const LAYER_SLOTS: Record<string, FishSlot[]> = {
  body: [], // 색은 팔레트로만 바뀐다 (그림 없음)
  pattern: ['pattern'],
  fin: ['fin_back', 'fin_front'],
  scale: ['scale'],
  form: ['line'],
};

export interface FishFileSpec {
  /** 파일 이름 (확장자 제외), 예: 'fin_back.halfmoon' */
  name: string;
  slot: FishSlot;
  required: boolean;
  /** 어떤 모프용인지 (기본 파일이면 null) */
  allele: { locusId: string; id: string; nameKo: string } | null;
}

/**
 * 어종 하나에 필요한 겹 파일. 크기(s/l)마다 같은 목록을 그린다.
 * - 필수: body(몸 실루엣, 몸에 붙은 꼬리 포함), line(눈·윤곽선)
 * - 선택 기본: fin_back, fin_front (야생형 지느러미가 몸과 따로 움직이면), pattern (야생형 무늬가 있으면)
 * - 모프: 야생형이 아닌 대립유전자마다 그 좌위가 바꾸는 겹 파일 (지느러미 모프의 fin_front는 선택)
 */
export function expectedFishFiles(morphs: SpeciesMorphs | undefined): FishFileSpec[] {
  const files: FishFileSpec[] = [
    { name: 'fin_back', slot: 'fin_back', required: false, allele: null },
    { name: 'body', slot: 'body', required: true, allele: null },
    { name: 'pattern', slot: 'pattern', required: false, allele: null },
    { name: 'fin_front', slot: 'fin_front', required: false, allele: null },
    { name: 'line', slot: 'line', required: true, allele: null },
  ];
  for (const l of morphs?.loci ?? []) {
    for (const a of l.alleles) {
      if (a.id === l.wildTypeAlleleId) continue;
      for (const slot of LAYER_SLOTS[l.layer] ?? []) {
        // 지느러미 모프의 앞쪽 지느러미(가슴·배)는 대개 기본과 같아서 없으면 기본 fin_front를 쓴다
        const required = !(l.layer === 'fin' && slot === 'fin_front');
        files.push({ name: `${slot}.${a.id}`, slot, required, allele: { locusId: l.id, id: a.id, nameKo: a.nameKo } });
      }
    }
  }
  return files;
}
