/**
 * 시드 데이터 → DB 행/SQL.
 * - 지역·어종 정적 필드는 upsert (다시 돌려도 최신 기획값으로 갱신)
 * - 야생 개체수(wild_populations)는 없을 때만 넣는다. 운영 중 개체수는 절대 초기화하지 않는다.
 */
import { gamePopulation, POPULATION_TEMP, type GamePopulation, type GameRarity } from '../game/population';
import { ALL_SPECIES, NON_BREEDABLE_FOSSILS, REGIONS, type SpeciesSeed } from './world';
import { FISH_MORPHS } from '../game/morphs';

/** 기준 가격 (임시, 밸런싱 전). 실제 시세는 희소성으로 따로 계산한다 */
export const BASE_PRICE_TEMP: Record<GameRarity, number> = {
  common: 100, uncommon: 300, rare: 1000, epic: 4000, legendary: 20000,
};

/** 최대 크기(cm) → 필요한 최소 수조 크기 등급 1~5 */
export function minTankSizeFor(maxSizeCm: number): number {
  if (maxSizeCm <= 10) return 1;
  if (maxSizeCm <= 30) return 2;
  if (maxSizeCm <= 100) return 3;
  if (maxSizeCm <= 300) return 4;
  return 5;
}

export interface SpeciesRow {
  id: string;
  nameKo: string;
  scientificName: string | null;
  regionId: string;
  rarity: GameRarity;
  isOriginal: boolean;
  isSpecialMapOnly: boolean;
  breedable: boolean;
  auctionable: boolean;
  tempMin: number;
  tempMax: number;
  salinity: string;
  maxSizeCm: number;
  minTankSize: number;
  basePrice: number;
  initialPopulation: number;
  regenRatePerDay: number;
  iucnCategory: string | null;
  iucnYear: number | null;
  populationTier: string | null;
  populationTrend: string | null;
  realPopulationNote: string | null;
  dataSource: string | null;
}

export interface SeedSpecies {
  row: SpeciesRow;
  population: GamePopulation;
}

const fishbaseUrl = (sci: string) => `https://www.fishbase.se/summary/${sci.replace(/ /g, '-')}.html`;

export function populationFor(s: SpeciesSeed, scale: number = POPULATION_TEMP.scale): GamePopulation {
  if (s.origin === 'extant') return gamePopulation({ origin: 'extant', rarity: s.rarity, iucn: s.iucn, tier: s.tier, trend: s.trend }, scale);
  return gamePopulation({ origin: s.origin, rarity: s.rarity }, scale);
}

export function buildSpecies(scale: number = POPULATION_TEMP.scale): SeedSpecies[] {
  return ALL_SPECIES.map((s) => {
    const population = populationFor(s, scale);
    const isOriginal = s.origin === 'original' || s.origin === 'original_legend';
    const row: SpeciesRow = {
      id: s.id,
      nameKo: s.nameKo,
      scientificName: s.scientificName,
      regionId: s.regionId,
      rarity: s.rarity,
      isOriginal,
      isSpecialMapOnly: s.origin === 'original',
      breedable: !isOriginal && !NON_BREEDABLE_FOSSILS.has(s.id),
      auctionable: true,
      tempMin: s.tempMin,
      tempMax: s.tempMax,
      salinity: s.salinity,
      maxSizeCm: s.maxSizeCm,
      minTankSize: minTankSizeFor(s.maxSizeCm),
      basePrice: BASE_PRICE_TEMP[s.rarity],
      initialPopulation: population.capacity,
      regenRatePerDay: Number(population.regenRatePerDay.toFixed(5)),
      iucnCategory: s.origin === 'extant' ? s.iucn : null,
      iucnYear: s.origin === 'extant' ? s.iucnYear : null,
      populationTier: s.origin === 'extant' ? s.tier : null,
      populationTrend: s.origin === 'extant' ? s.trend : null,
      realPopulationNote: s.origin === 'extant' ? s.note : s.origin === 'fossil' ? '화석 종: 실제 개체수 없음, 희귀도로 규모 결정' : s.concept,
      dataSource: s.origin === 'extant' && s.scientificName ? `FishBase 요약(IUCN 등급 인용) ${fishbaseUrl(s.scientificName)}` : null,
    };
    return { row, population };
  });
}

// --- SQL 생성 (PGlite·postgres-js 공용, 정적 데이터라 리터럴로 만든다) ---
const lit = (v: string | number | boolean | null): string => {
  if (v === null) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error(`숫자 오류: ${v}`);
    return String(v);
  }
  return `'${v.replace(/'/g, "''")}'`;
};

export function buildSeedSql(scale: number = POPULATION_TEMP.scale): string {
  const out: string[] = [];
  const regionCols = ['id', 'name_ko', 'kind', 'unlock_stage', 'required_level', 'requires_time_ticket', 'special_map_chance', 'hunt_seconds', 'hunt_stamina_cost', 'sort_order'];
  const regionVals = REGIONS.map((g) => `(${[g.id, g.nameKo, g.kind, g.unlockStage, g.requiredLevel, g.requiresTimeTicket, g.specialMapChance, g.huntSeconds, g.huntStaminaCost, g.sortOrder].map(lit).join(',')})`);
  out.push(`insert into regions (${regionCols.join(',')}) values\n${regionVals.join(',\n')}\non conflict (id) do update set ${regionCols.slice(1).map((c) => `${c} = excluded.${c}`).join(', ')};`);

  const species = buildSpecies(scale);
  const spCols = ['id', 'name_ko', 'scientific_name', 'region_id', 'rarity', 'is_original', 'is_special_map_only', 'breedable', 'auctionable', 'temp_min', 'temp_max', 'salinity', 'max_size_cm', 'min_tank_size', 'base_price', 'initial_population', 'regen_rate_per_day', 'iucn_category', 'iucn_year', 'population_tier', 'population_trend', 'real_population_note', 'data_source'];
  const spVals = species.map(({ row: s }) => `(${[s.id, s.nameKo, s.scientificName, s.regionId, s.rarity, s.isOriginal, s.isSpecialMapOnly, s.breedable, s.auctionable, s.tempMin, s.tempMax, s.salinity, s.maxSizeCm, s.minTankSize, s.basePrice, s.initialPopulation, s.regenRatePerDay, s.iucnCategory, s.iucnYear, s.populationTier, s.populationTrend, s.realPopulationNote, s.dataSource].map(lit).join(',')})`);
  out.push(`insert into species (${spCols.join(',')}) values\n${spVals.join(',\n')}\non conflict (id) do update set ${spCols.slice(1).map((c) => `${c} = excluded.${c}`).join(', ')};`);
  // 모프 유전자 좌위 (game/morphs.ts에 정의된 어종만 갱신, 나머지는 그대로)
  for (const [id, m] of Object.entries(FISH_MORPHS)) {
    out.push(`update species set gene_loci = ${lit(JSON.stringify(m.loci))}::jsonb where id = ${lit(id)};`);
  }

  const wildVals = species.map(({ row, population: p }) => `(${[row.id, p.startCount, p.hiddenReserve, p.startStatus].map(lit).join(',')})`);
  out.push(`insert into wild_populations (species_id, count, hidden_reserve, status) values\n${wildVals.join(',\n')}\non conflict (species_id) do nothing;`);
  return out.join('\n\n');
}
