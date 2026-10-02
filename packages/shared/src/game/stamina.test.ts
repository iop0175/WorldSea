import { describe, expect, it } from 'vitest';
import { computeStamina, staminaMax, STAMINA_TEMP } from './stamina';
import { hunterSlots } from './hunters';

const t0 = new Date('2026-10-02T00:00:00Z');
const after = (sec: number) => new Date(t0.getTime() + sec * 1000);
const R = STAMINA_TEMP.regenSec;

describe('computeStamina', () => {
  it('경과 시간만큼 회복하고 남은 조각 시간을 보존한다', () => {
    const s = computeStamina(10, t0, after(R * 2 + 30), 1);
    expect(s.stamina).toBe(12);
    expect(s.nextSec).toBe(R - 30);
    expect(s.updatedAt.getTime()).toBe(after(R * 2).getTime());
  });
  it('최대치에서 멈춘다', () => {
    const s = computeStamina(10, t0, after(R * 1000), 1);
    expect(s.stamina).toBe(staminaMax(1));
    expect(s.nextSec).toBeNull();
  });
  it('최대치를 넘긴 값은 줄이지 않는다', () => {
    expect(computeStamina(staminaMax(1) + 20, t0, after(R * 5), 1).stamina).toBe(staminaMax(1) + 20);
  });
  it('시계가 거꾸로 가도 줄지 않는다', () => {
    expect(computeStamina(10, t0, after(-100), 1).stamina).toBe(10);
  });
});

describe('hunterSlots', () => {
  it('조건별 슬롯', () => {
    expect(hunterSlots(1, false, 0)).toBe(1);
    expect(hunterSlots(10, false, 0)).toBe(2);
    expect(hunterSlots(10, true, 0)).toBe(3);
    expect(hunterSlots(10, true, 9)).toBe(4);
    expect(hunterSlots(1, true, 9)).toBe(3);
  });
});
