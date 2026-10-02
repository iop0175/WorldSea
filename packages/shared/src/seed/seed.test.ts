import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildSeedSql, buildSpecies } from './build';
import { ALL_SPECIES, EXTANT, FOSSIL, ORIGINAL, REGIONS } from './world';

describe('시드 데이터 원본', () => {
  it('어종 수: 실존 91 + 고대 16 + 오리지널 13, id 중복 없음', () => {
    expect(EXTANT).toHaveLength(91);
    expect(FOSSIL).toHaveLength(16);
    expect(ORIGINAL).toHaveLength(13);
    expect(new Set(ALL_SPECIES.map((s) => s.id)).size).toBe(ALL_SPECIES.length);
  });

  it('모든 어종의 지역이 존재하고, 지역별 특별 개체는 1종씩', () => {
    const ids = new Set(REGIONS.map((r) => r.id));
    for (const s of ALL_SPECIES) expect(ids.has(s.regionId), s.id).toBe(true);
    for (const r of REGIONS) expect(ORIGINAL.filter((o) => o.origin === 'original' && o.regionId === r.id)).toHaveLength(1);
  });

  it('교배 불가: 오리지널 전부와 고대 전설급 2종', () => {
    const rows = buildSpecies().map((s) => s.row);
    const nonBreedable = rows.filter((s) => !s.breedable).map((s) => s.id).sort();
    expect(nonBreedable).toEqual([...ORIGINAL.map((o) => o.id), 'dunkleosteus_terrelli', 'xiphactinus_audax'].sort());
  });

  it('IUCN 위급(CR) 종은 취약 상태로 시작하고, LC 종은 안정', () => {
    const byId = new Map(buildSpecies().map((s) => [s.row.id, s]));
    expect(byId.get('anguilla_anguilla')!.population.startStatus).toBe('vulnerable');
    expect(byId.get('latimeria_chalumnae')!.population.startStatus).toBe('vulnerable');
    expect(byId.get('poecilia_reticulata')!.population.startStatus).toBe('stable');
  });
});

describe('시드 SQL 적용 (PGlite + 실제 마이그레이션)', () => {
  let pg: PGlite;
  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(`create schema auth; create table auth.users (id uuid primary key, email varchar);
      do $$ begin create role anon; create role authenticated; create role service_role; exception when others then null; end $$;`);
    const dir = join(import.meta.dirname, '../../migrations/main');
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.sql')).sort()) {
      for (const s of readFileSync(join(dir, f), 'utf8').split('--> statement-breakpoint')) if (s.trim()) await pg.exec(s);
    }
  });

  it('지역 12 · 어종 120 · 야생 개체수 120 행이 들어간다', async () => {
    await pg.exec(buildSeedSql());
    const { rows } = await pg.query<{ r: number; s: number; w: number }>(
      `select (select count(*)::int from regions) r, (select count(*)::int from species) s, (select count(*)::int from wild_populations) w`,
    );
    expect(rows[0]).toEqual({ r: 12, s: 120, w: 120 });
  });

  it('다시 실행해도 운영 중 야생 개체수는 초기화하지 않는다', async () => {
    await pg.exec(`update wild_populations set count = 7 where species_id = 'betta_splendens'`);
    await pg.exec(`update species set name_ko = '옛 이름' where id = 'betta_splendens'`);
    await pg.exec(buildSeedSql());
    const { rows } = await pg.query<{ count: number; name_ko: string }>(
      `select w.count, s.name_ko from wild_populations w join species s on s.id = w.species_id where s.id = 'betta_splendens'`,
    );
    expect(rows[0]).toEqual({ count: 7, name_ko: '베타' });
  });
});
