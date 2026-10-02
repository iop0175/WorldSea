import Phaser from 'phaser';
import { useGameStore } from '../../store';
import { PAL } from '../palette';

/**
 * 허브: 작은 동네 브리딩샵 (shopStage 1). 단계가 오르면 공공 수족관으로 커진다.
 * 위쪽 상단바(TOP_UI)와 아래쪽 탭바는 React가 그린다.
 */
/**
 * 임시 허브: 180x320 기준으로 그린 자리 표시 장면을 카메라 2배 확대로 보여 준다.
 * docs/ui-main.md(탑다운 3/4, 360x640) 기준 장면으로 교체 예정.
 */
const GAME_WIDTH = 180;
const GAME_HEIGHT = 320;
const TOP_UI = 24;

export class HubScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private dim!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('hub');
  }

  create() {
    this.cameras.main.setZoom(2).centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    const floorY = 200;
    const g = this.add.graphics();

    // 벽과 바닥
    g.fillStyle(PAL.wall).fillRect(0, 0, GAME_WIDTH, floorY);
    for (let x = 0; x < GAME_WIDTH; x += 12) g.fillStyle(PAL.wallDark).fillRect(x, TOP_UI, 1, floorY - TOP_UI);
    g.fillStyle(PAL.floor).fillRect(0, floorY, GAME_WIDTH, GAME_HEIGHT - floorY);
    for (let y = floorY; y < GAME_HEIGHT; y += 8) g.fillStyle(PAL.floorDark).fillRect(0, y, GAME_WIDTH, 1);

    // 간판 (작은 캔버스에서 한글이 깨지므로 글자 대신 물고기 아이콘. 상호명은 UI 레이어에서 표시)
    g.fillStyle(PAL.counterDark).fillRect(49, TOP_UI + 7, 82, 16);
    g.fillStyle(PAL.sign).fillRect(50, TOP_UI + 8, 80, 14);
    this.add.image(90, TOP_UI + 15, 'fish_a').setScale(2);

    // 벽면 수조 3개 + 카운터
    const tanks = [
      { x: 14, y: 70, w: 46, h: 34 },
      { x: 67, y: 62, w: 46, h: 42 },
      { x: 120, y: 70, w: 46, h: 34 },
    ];
    const fishKeys = ['fish_a', 'fish_b', 'fish_c'];
    tanks.forEach((t, i) => {
      this.drawTank(g, t.x, t.y, t.w, t.h);
      for (let n = 0; n < 2; n++) this.spawnFish(fishKeys[(i + n) % 3], t.x + 3, t.y + 5, t.w - 6, t.h - 12);
    });
    this.drawTank(g, 30, 150, 120, 44); // 진열용 큰 수조
    for (let n = 0; n < 5; n++) this.spawnFish(fishKeys[n % 3], 33, 155, 114, 32);

    g.fillStyle(PAL.counterDark).fillRect(10, 236, 70, 22);
    g.fillStyle(PAL.counter).fillRect(10, 232, 70, 6);

    // 다른 탭을 열면 허브를 어둡게
    this.dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.45).setOrigin(0).setVisible(false);
    this.applyTab(useGameStore.getState().activeTab);
    this.unsubscribe = useGameStore.subscribe((s) => this.applyTab(s.activeTab));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
  }

  private applyTab(tab: string) {
    this.dim.setVisible(tab !== 'shop');
  }

  private drawTank(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    g.fillStyle(PAL.counterDark).fillRect(x - 2, y + h, w + 4, 4); // 받침
    g.fillStyle(PAL.glass).fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(PAL.water).fillRect(x, y + 2, w, h - 2);
    g.fillStyle(PAL.waterDark).fillRect(x, y + h - 8, w, 2);
    g.fillStyle(PAL.sand).fillRect(x, y + h - 6, w, 6);
    g.fillStyle(PAL.plant).fillRect(x + 4, y + h - 14, 2, 9).fillRect(x + w - 8, y + h - 18, 2, 13);
    g.fillStyle(PAL.white, 0.5).fillRect(x + 2, y + 4, 1, 6);
  }

  /** 수조 안에서 좌우로 헤엄치는 임시 물고기 */
  private spawnFish(key: string, x: number, y: number, w: number, h: number) {
    const fish = this.add.image(
      Phaser.Math.Between(x + 5, x + w - 5),
      Phaser.Math.Between(y + 3, y + h - 3),
      key,
    );
    const swim = () => {
      const tx = Phaser.Math.Between(x + 5, x + w - 5);
      const ty = Phaser.Math.Between(y + 3, y + h - 3);
      fish.setFlipX(tx > fish.x);
      this.tweens.add({
        targets: fish,
        x: tx,
        y: ty,
        duration: Phaser.Math.Between(1800, 4200),
        ease: 'Sine.easeInOut',
        onComplete: swim,
      });
    };
    swim();
  }
}
