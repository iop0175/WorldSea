import { describe, expect, it } from 'vitest';
import { expressedAllele, fishAssetKey, fishLayerPlan, morphKey, phenotype, ramp, wildGenotype } from './fishArt';
import { FISH_MORPHS } from './morphs';
import { ALL_SPECIES } from '../seed/world';

const betta = FISH_MORPHS.betta_splendens!;

describe('물고기 그림 규칙 (디자인 결정 84~88번)', () => {
  it('ramp는 밝음→어두움 5색', () => {
    const r = ramp('#c8323a');
    expect(r).toHaveLength(5);
    r.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/));
    const lum = (h: string) => parseInt(h.slice(1, 3), 16) + parseInt(h.slice(3, 5), 16) + parseInt(h.slice(5, 7), 16);
    expect(lum(r[0]!)).toBeGreaterThan(lum(r[4]!));
  });

  it('야생형 우성, 모프 열성 (임시 규칙)', () => {
    const fin = betta.loci.find((l) => l.id === 'fin')!;
    expect(expressedAllele(fin, ['plakat', 'halfmoon'])).toBe('plakat');
    expect(expressedAllele(fin, ['halfmoon', 'halfmoon'])).toBe('halfmoon');
    expect(expressedAllele(fin, undefined)).toBe('plakat');
  });

  it('모프 키: 야생형은 빼고 좌위 이름순', () => {
    const pheno = phenotype(betta.loci, { color: ['blue', 'blue'], fin: ['halfmoon', 'halfmoon'], pattern: ['solid', 'marble'] });
    expect(morphKey(betta.loci, pheno)).toBe('color:blue|fin:halfmoon');
    expect(morphKey(betta.loci, phenotype(betta.loci, wildGenotype(betta.loci)))).toBe('');
  });

  it('합성 계획: 모프 파일이 있으면 기본 파일 대신, 순서는 뒷지느러미→몸→무늬→앞지느러미→윤곽선', () => {
    const files = new Set(
      ['fin_back', 'fin_back.halfmoon', 'body', 'pattern.marble', 'fin_front', 'fin_front.halfmoon', 'line'].map((s) => {
        const [slot, allele] = s.split('.');
        return fishAssetKey('betta_splendens', 'l', slot as never, allele);
      }),
    );
    const plan = fishLayerPlan('betta_splendens', 'l', betta, { color: ['red', 'red'], fin: ['halfmoon', 'halfmoon'], pattern: ['marble', 'marble'] }, (k) => files.has(k));
    expect(plan.layers.map((l) => l.key.split('/').pop())).toEqual(['fin_back.halfmoon', 'body', 'pattern.marble', 'fin_front.halfmoon', 'line']);
    expect(plan.palette).toBe(betta.palettes.red);
    expect(plan.layers.at(-1)!.colors).toBeNull();
    expect(plan.missingBody).toBe(false);
  });

  it('120종 모두 모프 정의(팔레트)가 있고, 색 대립유전자마다 팔레트가 있다', () => {
    expect(ALL_SPECIES).toHaveLength(120);
    for (const s of ALL_SPECIES) {
      const m = FISH_MORPHS[s.id];
      expect(m, s.id).toBeDefined();
      const color = m!.loci.find((l) => l.id === m!.colorLocus);
      if (color) for (const a of color.alleles) expect(m!.palettes[a.id], `${s.id}:${a.id}`).toBeDefined();
      else expect(m!.palettes.wild, s.id).toBeDefined();
    }
  });
});

import { expectedFishFiles } from './fishArt';
describe('그려야 할 파일 목록', () => {
  it('베타: 필수 body·line + 지느러미 모프(fin_back) + 무늬 모프, 색 모프는 그림 없음', () => {
    const names = expectedFishFiles(betta).filter((f) => f.required).map((f) => f.name);
    expect(names).toEqual(['body', 'line', 'pattern.marble', 'pattern.butterfly', 'fin_back.veil', 'fin_back.halfmoon']);
  });
});
