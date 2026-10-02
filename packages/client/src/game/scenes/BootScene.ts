import Phaser from 'phaser';

/**
 * 에셋이 아직 없으므로 임시 도트 텍스처를 코드로 만든다.
 * 실제 물고기 도트는 유전자 → 레이어(몸 팔레트/무늬/지느러미) 합성으로 그릴 예정.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    this.makeFish('fish_a', 0xff7a59, 0xffd166);
    this.makeFish('fish_b', 0x6ec6ff, 0xffffff);
    this.makeFish('fish_c', 0xc77dff, 0xff4d8d);
    this.scene.start('hub');
  }

  /** 9x5 도트 물고기: 몸, 꼬리, 눈 */
  private makeFish(key: string, body: number, fin: number) {
    const rows = [
      '..bbbb...',
      '.bbbbbb.f',
      'bbbbbebff',
      '.bbbbbb.f',
      '..bbbb...',
    ];
    const g = this.make.graphics({}, false);
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const color = ch === 'b' ? body : ch === 'f' ? fin : ch === 'e' ? 0x111111 : null;
        if (color === null) return;
        g.fillStyle(color).fillRect(8 - x, y, 1, 1); // 왼쪽을 보도록 좌우 반전
      }),
    );
    g.generateTexture(key, 9, 5);
    g.destroy();
  }
}
