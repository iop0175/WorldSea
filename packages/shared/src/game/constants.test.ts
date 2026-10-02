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
