import { describe, expect, it } from 'vitest';
import { chanceAt, displayChance, needleSpeed, stepNeedle, type Needle } from './biteGauge';

describe('바늘 움직임', () => {
  it('가운데에서 가장 빠르고 가장자리에서 가장 느리다', () => {
    expect(needleSpeed(0)).toBeGreaterThan(needleSpeed(0.5));
    expect(needleSpeed(0.5)).toBeGreaterThan(needleSpeed(1));
    expect(needleSpeed(-0.5)).toBe(needleSpeed(0.5));
    expect(needleSpeed(5)).toBe(needleSpeed(1));
  });
  it('끝에 닿으면 튕기고 범위를 벗어나지 않는다', () => {
    let n: Needle = { x: 0, dir: 1 };
    let bounced = 0;
    for (let i = 0; i < 2000; i++) {
      const before = n.dir;
      n = stepNeedle(n, 1 / 60);
      expect(Math.abs(n.x)).toBeLessThanOrEqual(1);
      if (n.dir !== before) bounced++;
    }
    expect(bounced).toBeGreaterThan(5);
  });
  it('긴 시간(탭 전환 후 복귀)도 범위를 지키고, 같은 시간을 나눠 돌려도 결과가 거의 같다', () => {
    const big = stepNeedle({ x: 0.2, dir: 1 }, 100);
    expect(Math.abs(big.x)).toBeLessThanOrEqual(1);
    let n: Needle = { x: 0.2, dir: 1 };
    for (let i = 0; i < 30; i++) n = stepNeedle(n, 1 / 30);
    const once = stepNeedle({ x: 0.2, dir: 1 }, 1);
    expect(Math.abs(n.x - once.x)).toBeLessThan(0.05);
  });
  it('dt가 0이거나 음수여도 움직이지 않는다', () => {
    expect(stepNeedle({ x: 0.3, dir: -1 }, 0)).toEqual({ x: 0.3, dir: -1 });
    expect(stepNeedle({ x: 0.3, dir: -1 }, -5)).toEqual({ x: 0.3, dir: -1 });
  });
});

describe('확률 표시', () => {
  const table = [0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25];
  it('표의 칸 사이를 직선으로 보간하고 범위 밖 거리는 끝값을 쓴다', () => {
    expect(chanceAt(table, 0)).toBe(0.75);
    expect(chanceAt(table, 1)).toBe(0.25);
    expect(chanceAt(table, 0.05)).toBeCloseTo(0.725);
    expect(chanceAt(table, -3)).toBe(0.75);
    expect(chanceAt(table, 9)).toBe(0.25);
    expect(chanceAt([], 0.5)).toBe(0);
  });
  it('장비 보정을 더하고 최대 확률에서 자르며 음수가 되지 않는다', () => {
    expect(displayChance(table, 0, 0.1)).toBeCloseTo(0.85);
    expect(displayChance(table, 0, 0.5)).toBe(0.95);
    expect(displayChance(table, 1, -1)).toBe(0);
  });
});
