import { describe, expect, it } from 'vitest';
import { gamePopulation, statusFromPercent } from './population';

describe('statusFromPercent', () => {
  it('기준: 30% 이상 안정, 30% 미만 취약, 10% 미만 보호종, 야생 멸종은 유지', () => {
    expect(statusFromPercent(30)).toBe('stable');
    expect(statusFromPercent(29)).toBe('vulnerable');
    expect(statusFromPercent(9)).toBe('protected');
    expect(statusFromPercent(80, 'extinct_wild')).toBe('extinct_wild');
  });
});

describe('gamePopulation', () => {
  it('흔한 LC 종은 많고 100%에서 안정으로 시작', () => {
    const p = gamePopulation({ origin: 'extant', rarity: 'common', iucn: 'LC', tier: 'very_common' });
    expect(p.capacity).toBe(50_000);
    expect(p.startCount).toBe(50_000);
    expect(p.startStatus).toBe('stable');
  });
  it('실제 위급(CR) 종은 적고 취약 상태로 시작 (보호종에서 시작하지 않음)', () => {
    const p = gamePopulation({ origin: 'extant', rarity: 'legendary', iucn: 'CR', tier: 'very_scarce', trend: 'decreasing' });
    expect(p.capacity).toBe(400);
    expect(p.startCount).toBe(48);
    expect(p.startStatus).toBe('vulnerable');
    expect(p.hiddenReserve).toBe(20);
    expect(p.regenRatePerDay).toBeLessThan(0.008);
  });
  it('희귀도 상한이 실제 규모보다 우선한다 (흔한 종이라도 전설이면 적게)', () => {
    expect(gamePopulation({ origin: 'extant', rarity: 'legendary', iucn: 'VU', tier: 'uncommon' }).capacity).toBe(400);
  });
  it('위협 등급이 높을수록 시작 비율이 낮다', () => {
    const pct = (iucn: 'LC' | 'NT' | 'VU' | 'EN' | 'CR') => {
      const p = gamePopulation({ origin: 'extant', rarity: 'rare', iucn, tier: 'uncommon' });
      return p.startCount / p.capacity;
    };
    expect(pct('LC')).toBeGreaterThan(pct('NT'));
    expect(pct('NT')).toBeGreaterThan(pct('VU'));
    expect(pct('VU')).toBeGreaterThan(pct('EN'));
    expect(pct('EN')).toBeGreaterThan(pct('CR'));
  });
  it('고대·오리지널', () => {
    expect(gamePopulation({ origin: 'fossil', rarity: 'legendary' }).capacity).toBe(400);
    expect(gamePopulation({ origin: 'original_legend', rarity: 'legendary' })).toMatchObject({ capacity: 5, regenRatePerDay: 0 });
  });
  it('배율로 전체 규모를 조절한다', () => {
    expect(gamePopulation({ origin: 'extant', rarity: 'common', iucn: 'LC', tier: 'common' }, 0.5).capacity).toBe(10_000);
  });
});
