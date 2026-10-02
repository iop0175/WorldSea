import Phaser from 'phaser';
import { useGameStore } from '../../store';
import { GAME_HEIGHT, GAME_WIDTH, LAYOUT, STAGE1_SPOTS as S } from '../layout';
import { FISH_KEYS } from './BootScene';

/**
 * 샵 허브 1단계 (탑다운 3/4 시점, 360x640). docs/ui-main.md 4장 배치 기준.
 * 실제 픽셀아트 에셋이 나오기 전까지 도형으로 그린 임시 장면이다. 위치·크기는 STAGE1_SPOTS를 따른다.
 * 글자(간판, 라벨)는 React UI 레이어가 그린다.
 */
const C = {
  void: 0x101d26,
  wall: 0x5a3822, wallDark: 0x46291a, wallTrim: 0x8f6237,
  floor: 0x22364a, floorAlt: 0x1e3142, floorLine: 0x18283a,
  wood: 0x8f6237, woodTop: 0xc28b55, woodDark: 0x5a3822,
  metal: 0x2e3b44, metalLight: 0x6b7b86,
  glass: 0x8fdee5, water: 0x2a8fb4, waterTop: 0x5fc0dd, waterDeep: 0x1f6e8c,
  sand: 0xe0c48a, plant: 0x4caf6a, plantDark: 0x3d9459, coral: 0xff7a8a, rock: 0x4a5560,
  gold: 0xe8b248, lamp: 0xffd98a, mat: 0x2d6a3e, matBorder: 0xc99a2e,
};

const ROOM = { x: 14, y: LAYOUT.scene.y, w: GAME_WIDTH - 28, bottom: LAYOUT.scene.y + LAYOUT.scene.h - 8 };
const WALL_BOTTOM = 134;

export class HubScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private dim!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('hub');
  }

  create() {
    const g = this.add.graphics().setDepth(0);
    this.drawRoom(g);
    this.drawBackWall(g);

    // 수조들
    this.drawTank(g, S.wallTankA, 4, 3);
    this.drawTank(g, S.wallTankB, 4, 3);
    this.drawPainting(g, 168, 94, 26, 20);
    this.drawTank(g, S.longTank, 8, 4);
    this.drawTank(g, S.tallTank, 8, 5);
    this.drawTank(g, S.mainTank, 10, 7, true);
    this.drawBreeding(g);
    this.drawFryTank(g, S.fryA);
    this.drawFryTank(g, S.fryB);

    this.drawCounter(g);
    this.drawDoors(g);
    this.drawPlants(g);

    // 사람 (y 기준 깊이 정렬)
    this.addPerson('npc_staff', S.counter.x + 56, S.counter.y + 6);
    // 통로: 왼쪽 세로 통로 x86, 위 가로 통로 y214, 아래 가로 통로 y380, 입구 통로 x206
    this.walker('player', [[140, 212], [86, 212], [86, 380], [196, 380], [86, 380], [86, 212]]);
    this.walker('npc_guest_a', [[290, 476], [206, 476], [206, 380], [86, 380], [86, 214], [330, 214], [330, 350], [330, 214], [86, 214], [86, 380], [206, 380], [206, 476]]);
    this.walker('npc_guest_b', [[56, 300], [56, 378], [180, 378], [56, 378]]);

    // 다른 탭을 열면 장면을 어둡게
    this.dim = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5).setOrigin(0).setDepth(10000).setVisible(false);
    this.applyTab(useGameStore.getState().activeTab);
    this.unsubscribe = useGameStore.subscribe((s) => this.applyTab(s.activeTab));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsubscribe?.());
  }

  private applyTab(tab: string) {
    this.dim.setVisible(tab !== 'shop');
  }

  private drawRoom(g: Phaser.GameObjects.Graphics) {
    g.fillStyle(C.void).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // 바닥 타일
    g.fillStyle(C.floor).fillRect(ROOM.x, WALL_BOTTOM, ROOM.w, ROOM.bottom - WALL_BOTTOM);
    for (let y = WALL_BOTTOM; y < ROOM.bottom; y += 16)
      for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += 16) {
        if (((x - ROOM.x) / 16 + (y - WALL_BOTTOM) / 16) % 2 === 0) g.fillStyle(C.floorAlt).fillRect(x, y, 16, 16);
        g.fillStyle(C.floorLine).fillRect(x, y, 16, 1).fillRect(x, y, 1, 16);
      }
    // 입구 쪽 나무 바닥
    g.fillStyle(0x6a4a33).fillRect(ROOM.x, 430, 220, ROOM.bottom - 430);
    for (let y = 430; y < ROOM.bottom; y += 8) g.fillStyle(0x5a3e2b).fillRect(ROOM.x, y, 220, 1);
    // 좌우 벽, 아래 벽
    g.fillStyle(C.wallDark).fillRect(0, LAYOUT.scene.y, ROOM.x, LAYOUT.scene.h).fillRect(GAME_WIDTH - ROOM.x, LAYOUT.scene.y, ROOM.x, LAYOUT.scene.h);
    g.fillStyle(C.wallTrim).fillRect(ROOM.x - 2, WALL_BOTTOM, 2, ROOM.bottom - WALL_BOTTOM).fillRect(GAME_WIDTH - ROOM.x, WALL_BOTTOM, 2, ROOM.bottom - WALL_BOTTOM);
    g.fillStyle(C.wall).fillRect(0, ROOM.bottom, GAME_WIDTH, LAYOUT.scene.y + LAYOUT.scene.h - ROOM.bottom);
    g.fillStyle(C.wallTrim).fillRect(0, ROOM.bottom, GAME_WIDTH, 2);
  }

  private drawBackWall(g: Phaser.GameObjects.Graphics) {
    g.fillStyle(C.wall).fillRect(ROOM.x, LAYOUT.scene.y, ROOM.w, WALL_BOTTOM - LAYOUT.scene.y);
    for (let x = ROOM.x + 10; x < ROOM.x + ROOM.w; x += 12) g.fillStyle(C.wallDark).fillRect(x, LAYOUT.scene.y, 1, WALL_BOTTOM - LAYOUT.scene.y);
    g.fillStyle(C.wallTrim).fillRect(ROOM.x, WALL_BOTTOM - 4, ROOM.w, 4);
    g.fillStyle(0x2e1c10).fillRect(ROOM.x, WALL_BOTTOM, ROOM.w, 2);
    // 간판 명판 (글자는 React) + 물결/산호 장식
    g.fillStyle(0x000000).fillRect(118, 44, 124, 30);
    g.fillStyle(C.woodTop).fillRect(120, 46, 120, 26);
    g.fillStyle(0xe6b877).fillRect(122, 48, 116, 2);
    g.fillStyle(C.woodDark).fillRect(120, 68, 120, 4);
    [[106, 52], [244, 52]].forEach(([x, y]) => {
      g.fillStyle(0x2f6fb0).fillRect(x, y + 10, 12, 6);
      g.fillStyle(0x7fd3e6).fillRect(x + 1, y + 6, 4, 4).fillRect(x + 6, y + 4, 4, 6);
      g.fillStyle(0xff7a8a).fillRect(x + 3, y, 2, 8).fillRect(x + 7, y - 2, 2, 6).fillRect(x + 1, y + 2, 2, 3);
    });
    // 액자와 벽등
    this.drawPainting(g, 24, 54, 30, 24);
    this.drawPainting(g, 306, 54, 30, 24);
    [[70, 58], [96, 76], [264, 76], [290, 58]].forEach(([x, y]) => {
      g.fillStyle(0x2e1c10).fillRect(x, y, 6, 2);
      g.fillStyle(C.lamp).fillRect(x + 1, y + 2, 4, 6);
      g.fillStyle(C.lamp, 0.18).fillRect(x - 4, y + 2, 14, 14);
    });
  }

  private drawPainting(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    g.fillStyle(0x000000).fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(C.gold).fillRect(x, y, w, h);
    g.fillStyle(C.waterDeep).fillRect(x + 2, y + 2, w - 4, h - 4);
    g.fillStyle(C.water).fillRect(x + 2, y + 2, w - 4, (h - 4) / 2);
    g.fillStyle(0xff7a59).fillRect(x + w / 2 - 3, y + h / 2, 6, 3).fillRect(x + w / 2 + 3, y + h / 2 - 1, 2, 5);
  }

  /** 탑다운 3/4 수조: 위쪽은 물 표면(윗면), 아래는 앞 유리. 물고기는 앞 유리 안에서 옆모습으로 헤엄친다 */
  private drawTank(g: Phaser.GameObjects.Graphics, r: { x: number; y: number; w: number; h: number }, topFace: number, fishCount: number, big = false) {
    const { x, y, w, h } = r;
    g.fillStyle(0x000000, 0.35).fillRect(x + 2, y + h + 1, w, 4); // 그림자
    g.fillStyle(0x000000).fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(C.metal).fillRect(x, y, w, h);
    g.fillStyle(C.waterTop).fillRect(x + 2, y + 2, w - 4, topFace); // 윗면
    g.fillStyle(0xbfeaf5).fillRect(x + 4, y + 3, Math.floor(w / 3), 1);
    const fy = y + 2 + topFace;
    const fh = h - 4 - topFace - 3;
    g.fillStyle(C.glass).fillRect(x + 1, fy, w - 2, 1);
    g.fillStyle(C.water).fillRect(x + 2, fy + 1, w - 4, fh);
    g.fillStyle(C.waterDeep).fillRect(x + 2, fy + fh - 9, w - 4, 2);
    g.fillStyle(C.sand).fillRect(x + 2, fy + fh - 7, w - 4, 7);
    // 수초, 바위, 산호
    const plants = Math.max(2, Math.floor(w / 26));
    for (let i = 0; i < plants; i++) {
      const px = x + 5 + Math.floor(((w - 12) / plants) * i + (i % 2) * 6);
      const ph = Math.min(fh - 10, (big ? 26 : 12) + ((i * 7) % 10));
      g.fillStyle(i % 2 ? C.plantDark : C.plant).fillRect(px, fy + fh - 7 - ph, 2, ph).fillRect(px + 3, fy + fh - 7 - ph + 4, 2, ph - 4);
    }
    if (big) {
      g.fillStyle(C.rock).fillRect(x + w / 2 - 22, fy + fh - 26, 30, 20).fillRect(x + w / 2 - 14, fy + fh - 36, 16, 12);
      g.fillStyle(C.coral).fillRect(x + w / 2 + 14, fy + fh - 18, 3, 12).fillRect(x + w / 2 + 18, fy + fh - 14, 3, 8);
      g.fillStyle(0xc77dff).fillRect(x + 20, fy + fh - 16, 4, 10).fillRect(x + 25, fy + fh - 12, 3, 6);
    }
    g.fillStyle(0xd6f4fa, 0.6).fillRect(x + 3, fy + 3, 1, Math.min(14, fh - 10)); // 유리 반사
    g.fillStyle(C.metalLight).fillRect(x, y + h - 3, w, 1);
    // 위 조명
    g.fillStyle(C.lamp, 0.15).fillRect(x + 4, fy + 1, w - 8, 6);
    // 물고기
    for (let i = 0; i < fishCount; i++) {
      this.swimFish(FISH_KEYS[(i + x) % FISH_KEYS.length], x + 4, fy + 3, w - 8, fh - 14);
    }
  }

  private drawBreeding(g: Phaser.GameObjects.Graphics) {
    const { x, y, w, h } = S.breeding;
    g.fillStyle(0x000000).fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(C.metal).fillRect(x, y, w, h);
    g.fillStyle(0x3a9cc0).fillRect(x + 2, y + 2, w - 4, h - 4);
    g.fillStyle(C.sand).fillRect(x + 2, y + h - 10, w - 4, 8);
    [y + 16, y + 74].forEach((py) => {
      const cx = x + w / 2;
      // 장치 받침
      g.fillStyle(0x3e4a52).fillRect(cx - 18, py + 30, 36, 12);
      g.fillStyle(C.metalLight).fillRect(cx - 18, py + 30, 36, 2);
      g.fillStyle(0x7ee08a).fillRect(cx - 5, py + 35, 10, 4);
      // 유리 돔
      g.fillStyle(0x000000).fillRect(cx - 15, py + 4, 30, 27).fillRect(cx - 11, py, 22, 4);
      g.fillStyle(C.glass).fillRect(cx - 14, py + 5, 28, 25).fillRect(cx - 10, py + 1, 20, 4);
      g.fillStyle(C.water).fillRect(cx - 12, py + 7, 24, 22);
      g.fillStyle(0xd6f4fa).fillRect(cx - 10, py + 8, 2, 6);
    });
    this.add.image(x + w / 2 - 4, y + 34, 'fish_betta').setDepth(1);
    this.add.image(x + w / 2 + 5, y + 38, 'fish_betta').setFlipX(true).setDepth(1);
    this.add.image(x + w / 2 - 3, y + 92, 'fish_guppy').setDepth(1);
    this.add.image(x + w / 2 + 6, y + 96, 'fish_guppy').setFlipX(true).setDepth(1);
  }

  /** 치어 수조: 낮은 수조라 윗면이 넓게 보인다 */
  private drawFryTank(g: Phaser.GameObjects.Graphics, r: { x: number; y: number; w: number; h: number }) {
    const { x, y, w, h } = r;
    g.fillStyle(0x000000, 0.35).fillRect(x + 2, y + h + 1, w, 4);
    g.fillStyle(0x000000).fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle(C.metal).fillRect(x, y, w, h);
    g.fillStyle(C.water).fillRect(x + 3, y + 3, w - 6, h - 20);
    g.fillStyle(C.sand).fillRect(x + 3, y + h - 30, w - 6, 13);
    g.fillStyle(C.plant).fillRect(x + 8, y + 10, 4, 12).fillRect(x + w - 14, y + 18, 4, 14);
    g.fillStyle(C.rock).fillRect(x + w - 26, y + h - 30, 10, 6);
    g.fillStyle(C.glass).fillRect(x + 1, y + h - 17, w - 2, 1);
    g.fillStyle(0x3e4a52).fillRect(x + 1, y + h - 16, w - 2, 14);
    g.fillStyle(C.metalLight).fillRect(x + 1, y + h - 16, w - 2, 1);
    for (let i = 0; i < 6; i++) this.swimFish(i % 2 ? 'fry_a' : 'fry_b', x + 6, y + 6, w - 12, h - 40);
  }

  private drawCounter(g: Phaser.GameObjects.Graphics) {
    const { x, y, w, h } = S.counter;
    // 뒤쪽 진열장
    g.fillStyle(C.woodDark).fillRect(x + 50, y - 6, 34, 10);
    // L자 카운터 (윗면 + 앞면)
    g.fillStyle(0x000000).fillRect(x - 1, y + 20, w + 2, 30).fillRect(x - 1, y + 20, 26, h - 20);
    g.fillStyle(C.woodTop).fillRect(x, y + 21, w, 12).fillRect(x, y + 21, 24, h - 34);
    g.fillStyle(C.wood).fillRect(x + 24, y + 33, w - 24, 16).fillRect(x, y + h - 14, 24, 13);
    g.fillStyle(0x7a4e2c).fillRect(x + 30, y + 37, 22, 8).fillRect(x + 58, y + 37, 22, 8);
    // 계산대 단말기
    g.fillStyle(0x2b2b2b).fillRect(x + 62, y + 14, 14, 10);
    g.fillStyle(0x7fd3e6).fillRect(x + 64, y + 15, 10, 6);
  }

  private drawDoors(g: Phaser.GameObjects.Graphics) {
    // 문이 달린 칸막이 벽
    g.fillStyle(C.wall).fillRect(S.market.x - 6, S.market.y - 8, 110, S.market.h + 8);
    g.fillStyle(C.wallTrim).fillRect(S.market.x - 6, S.market.y - 8, 110, 3);
    [S.market, S.guild].forEach((d) => {
      g.fillStyle(0x000000).fillRect(d.x + 3, d.y + 2, d.w - 6, d.h - 2);
      g.fillStyle(0x6a4428).fillRect(d.x + 4, d.y + 3, d.w - 8, d.h - 3);
      g.fillStyle(0x4a2e1b).fillRect(d.x + d.w / 2 - 1, d.y + 3, 2, d.h - 3);
      g.fillStyle(0x3e4a52).fillRect(d.x + 4, d.y + 10, d.w - 8, 2).fillRect(d.x + 4, d.y + d.h - 14, d.w - 8, 2);
      // 둥근 창 (현창)
      [d.x + 13, d.x + d.w - 13].forEach((cx) => {
        g.fillStyle(C.gold).fillRect(cx - 4, d.y + 20, 8, 8);
        g.fillStyle(0x7fd3e6).fillRect(cx - 3, d.y + 21, 6, 6);
      });
    });
    // 입구 매트
    g.fillStyle(C.matBorder).fillRect(242, 438, 96, 44);
    g.fillStyle(C.mat).fillRect(244, 440, 92, 40);
  }

  private drawPlants(g: Phaser.GameObjects.Graphics) {
    [[22, 128], [208, 128], [206, 196], [222, 368], [326, 368], [200, 392], [316, 300]].forEach(([x, y]) => {
      g.fillStyle(0x8a4a2a).fillRect(x, y + 8, 10, 8);
      g.fillStyle(C.plantDark).fillRect(x - 2, y + 2, 14, 7);
      g.fillStyle(C.plant).fillRect(x + 1, y - 2, 8, 6).fillRect(x - 3, y + 3, 4, 3).fillRect(x + 9, y + 1, 4, 3);
    });
  }

  private swimFish(key: string, x: number, y: number, w: number, h: number) {
    const fish = this.add.image(Phaser.Math.Between(x + 7, x + w - 7), Phaser.Math.Between(y + 4, y + Math.max(5, h)), key).setDepth(1);
    const swim = () => {
      const tx = Phaser.Math.Between(x + 7, x + w - 7);
      const ty = Phaser.Math.Between(y + 4, y + Math.max(5, h));
      fish.setFlipX(tx > fish.x);
      this.tweens.add({ targets: fish, x: tx, y: ty, duration: Phaser.Math.Between(2200, 5200), ease: 'Sine.easeInOut', onComplete: swim });
    };
    swim();
  }

  private addPerson(key: string, x: number, y: number) {
    return this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
  }

  /** 정해진 지점을 순서대로 걸어 다니는 사람 */
  private walker(key: string, points: [number, number][]) {
    const p = this.addPerson(key, points[0][0], points[0][1]);
    let i = 0;
    const step = () => {
      i = (i + 1) % points.length;
      const [tx, ty] = points[i];
      const dist = Phaser.Math.Distance.Between(p.x, p.y, tx, ty);
      this.tweens.add({
        targets: p, x: tx, y: ty, duration: dist * 45, delay: Phaser.Math.Between(400, 1800),
        onUpdate: () => p.setDepth(p.y), onComplete: step,
      });
    };
    step();
  }
}
