import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubScene } from './scenes/HubScene';

/**
 * 게임 기준 해상도 (세로형 9:16). 픽셀아트라 이 해상도로 그리고 화면에는 정수 배로 키운다.
 * 2026-10-02: 180x320 → 360x640 상향 (docs/ui-main.md). 에셋은 이 해상도 기준으로 그린다.
 */
export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 640;

export function startGame(parent: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#0b2a3a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, HubScene],
  });
}
