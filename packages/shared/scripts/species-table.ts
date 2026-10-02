/**
 * docs/species-population.md 의 어종 표를 시드 데이터에서 다시 만든다.
 *   pnpm --filter @worldsea/shared exec tsx scripts/species-table.ts > /tmp/table.md
 */
import { buildSpecies } from '../src/seed/build';
import { REGIONS } from '../src/seed/world';

const RARITY = { common: '일반', uncommon: '고급', rare: '희귀', epic: '영웅', legendary: '전설' } as const;
const TREND = { increasing: '증가', stable: '안정', decreasing: '감소', unknown: '-' } as const;
const STATUS = { stable: '안정', vulnerable: '취약', protected: '보호', extinct_wild: '야생 멸종' } as const;
const TIER = { very_common: '매우 많음', common: '많음', uncommon: '보통', scarce: '적음', very_scarce: '매우 적음' } as const;

const all = buildSpecies();
for (const region of REGIONS) {
  const rows = all.filter((s) => s.row.regionId === region.id);
  console.log(`\n### ${region.nameKo} (Lv.${region.requiredLevel})\n`);
  const extant = rows.filter((s) => s.row.iucnCategory);
  if (extant.length) {
    console.log('| 어종 | 학명 | 희귀도 | IUCN (연도) | 추세 | 실제 규모 | 수용량 | 시작 수 | 시작 상태 | r/일 | 메모 | 출처 |');
    console.log('|---|---|---|---|---|---|---:|---:|---|---:|---|---|');
    for (const { row: s, population: p } of extant) {
      const year = s.iucnYear ? ` (${s.iucnYear})` : '';
      const url = s.dataSource?.split(' ').pop();
      console.log(`| ${s.nameKo} | *${s.scientificName}* | ${RARITY[s.rarity]} | ${s.iucnCategory}${year} | ${TREND[s.populationTrend as keyof typeof TREND]} | ${TIER[s.populationTier as keyof typeof TIER]} | ${p.capacity.toLocaleString()} | ${p.startCount.toLocaleString()} | ${STATUS[p.startStatus]} | ${p.regenRatePerDay.toFixed(4)} | ${s.realPopulationNote ?? ''} | [FishBase](${url}) |`);
    }
  }
  const other = rows.filter((s) => !s.row.iucnCategory);
  if (other.length) {
    console.log(`\n| ${extant.length ? '고대·오리지널' : '어종'} | 학명 | 희귀도 | 수용량 | 시작 수 | r/일 | 교배 | 비고 |`);
    console.log('|---|---|---|---:|---:|---:|---|---|');
    for (const { row: s, population: p } of other) {
      console.log(`| ${s.nameKo} | ${s.scientificName ? `*${s.scientificName}*` : '오리지널'} | ${RARITY[s.rarity]} | ${p.capacity.toLocaleString()} | ${p.startCount.toLocaleString()} | ${p.regenRatePerDay.toFixed(4)} | ${s.breedable ? '가능' : '불가'} | ${s.isOriginal ? (s.realPopulationNote ?? '') : ''} |`);
    }
  }
}
