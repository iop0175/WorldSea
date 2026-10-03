import { describe, expect, it } from 'vitest';
import { needsMinigame, rarityAtLeast } from './constants';

describe('입질 미니게임 대상 (기획 69번)', () => {
  it('기본 기준(희귀): 일반·고급은 바로 포획, 희귀 이상은 미니게임', () => {
    expect(needsMinigame('common')).toBe(false);
    expect(needsMinigame('uncommon')).toBe(false);
    expect(needsMinigame('rare')).toBe(true);
    expect(needsMinigame('legendary')).toBe(true);
  });
  it('플레이어가 기준을 바꿀 수 있다', () => {
    expect(needsMinigame('uncommon', 'uncommon')).toBe(true);
    expect(needsMinigame('rare', 'epic')).toBe(false);
    expect(rarityAtLeast('epic', 'epic')).toBe(true);
  });
});

import { releaseReward } from './constants';
describe('놓아줌 보상 (기획 72번)', () => {
  it('골드 소액 + 보전 포인트 + 샵 평판, 등급이 높을수록 많다', () => {
    const c = releaseReward('common', 100);
    const l = releaseReward('legendary', 20000);
    expect(c).toEqual({ gold: 10, conservationPoints: 1, shopExp: 1 });
    expect(l.gold).toBe(2000);
    expect(l.conservationPoints).toBeGreaterThan(c.conservationPoints);
    expect(l.shopExp).toBeGreaterThan(c.shopExp);
  });
});

import { gameDay, nextDailyReset } from './constants';
describe('하루 기준 (기획 75번: UTC 자정 = 한국 오전 9시)', () => {
  it('한국 오전 8시 59분은 전날, 9시는 새 날', () => {
    expect(gameDay(new Date('2026-10-03T08:59:00+09:00'))).toBe('2026-10-02');
    expect(gameDay(new Date('2026-10-03T09:00:00+09:00'))).toBe('2026-10-03');
  });
  it('다음 초기화 시각', () => {
    expect(nextDailyReset(new Date('2026-10-03T10:00:00+09:00')).toISOString()).toBe('2026-10-04T00:00:00.000Z');
  });
});
