import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HubScene } from './scenes/HubScene';

/** 게임 기준 해상도 (세로형). 픽셀아트라 작은 해상도를 정수 배로 키운다. */
export const GAME_WIDTH = 180;
export const GAME_HEIGHT = 320;

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
