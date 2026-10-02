import Phaser from 'phaser';
import { ASSET_URLS, SHEETS } from '../assets';

/**
 * 에셋이 아직 없으므로 임시 도트 텍스처를 코드로 만든다.
 * 물고기는 유전자 레이어 합성(몸 색 / 등 그늘 / 배 / 지느러미 / 무늬)을 흉내 낸 14x8 도트.
 */
type Pattern = 'plain' | 'band' | 'half' | 'spot';
interface FishColors { body: number; shade: number; belly: number; fin: number; pattern: number }

const FISH_BASE = [
  '.....dd.......',
  '....dddd......',
  '..ssssssss..t.',
  '.bbbbbbbbbb.tt',
  'bebbbbbbbbbttt',
  '.bbbbbbbbbb.tt',
  '..llllllll..t.',
  '.....dd.......',
];

export const FISH_KEYS = ['fish_betta', 'fish_guppy', 'fish_tetra', 'fish_koi', 'fish_angel', 'fish_clown'] as const;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  /** src/assets 에 있는 PNG만 불러온다 (없는 것은 아래 임시 텍스처나 도형으로 대신) */
  preload() {
    for (const [key, url] of Object.entries(ASSET_URLS)) {
      const sheet = SHEETS[key];
      if (sheet) this.load.spritesheet(key, url, sheet);
      else this.load.image(key, url);
    }
  }

  create() {
    this.makeFish('fish_betta', { body: 0x9b59d0, shade: 0x6d3a9c, belly: 0xc99ae8, fin: 0xff4d8d, pattern: 0xff4d8d }, 'half');
    this.makeFish('fish_guppy', { body: 0xff7a59, shade: 0xc9553a, belly: 0xffc2a8, fin: 0xffd166, pattern: 0xffd166 }, 'plain');
    this.makeFish('fish_tetra', { body: 0x6ec6ff, shade: 0x3b8ac0, belly: 0xe9f6ff, fin: 0xe5484d, pattern: 0xe5484d }, 'band');
    this.makeFish('fish_koi', { body: 0xf4f1e8, shade: 0xcfc8b8, belly: 0xffffff, fin: 0xf4f1e8, pattern: 0xe5484d }, 'spot');
    this.makeFish('fish_angel', { body: 0xe0c48a, shade: 0xb8995e, belly: 0xfff3d6, fin: 0x2b2b2b, pattern: 0x2b2b2b }, 'band');
    this.makeFish('fish_clown', { body: 0xff8a3d, shade: 0xc9622a, belly: 0xffc08a, fin: 0x2b2b2b, pattern: 0xffffff }, 'band');
    this.makeFry('fry_a', 0xffd166);
    this.makeFry('fry_b', 0x6ec6ff);
    this.makePerson('npc_staff', 0x5b3a1e, 0xc0392b);
    this.makePerson('npc_guest_a', 0x2b2b2b, 0x4caf6a);
    this.makePerson('npc_guest_b', 0x8a5a3b, 0x6ec6ff);
    this.makePerson('player', 0x7a4a24, 0x2a8fb4, true);
    this.scene.start('hub');
  }

  private makeFish(key: string, c: FishColors, pattern: Pattern) {
    const g = this.make.graphics({}, false);
    FISH_BASE.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        let color: number | null = null;
        if ('bsl'.includes(ch)) {
          const patterned =
            (pattern === 'band' && (x === 5 || x === 6 || x === 9)) ||
            (pattern === 'half' && x >= 7) ||
            (pattern === 'spot' && ((x === 4 && y === 3) || (x === 7 && y === 4) || (x === 9 && y === 2) || (x === 6 && y === 5)));
          color = patterned ? c.pattern : ch === 's' ? c.shade : ch === 'l' ? c.belly : c.body;
        } else if (ch === 'd' || ch === 't') color = c.fin;
        else if (ch === 'e') color = 0x111111;
        if (color !== null) g.fillStyle(color).fillRect(x, y, 1, 1);
      }),
    );
    g.generateTexture(key, 14, 8);
    g.destroy();
  }

  private makeFry(key: string, color: number) {
    const g = this.make.graphics({}, false);
    ['.cc.t', 'cecct', '.cc.t'].forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        g.fillStyle(ch === 'e' ? 0x111111 : color).fillRect(x, y, 1, 1);
      }),
    );
    g.generateTexture(key, 5, 3);
    g.destroy();
  }

  /** 10x16 위에서 내려다본 사람 (탑다운 3/4) */
  private makePerson(key: string, hair: number, shirt: number, hat = false) {
    const rows = [
      hat ? '..HHHHHH..' : '...hhhh...',
      hat ? '.HHHHHHHH.' : '..hhhhhh..',
      '..hffffh..',
      '..fkffkf..',
      '..ffffff..',
      '...ffff...',
      '..ssssss..',
      '.ssssssss.',
      'fssssssssf',
      'fssssssssf',
      '..ssssss..',
      '..pppppp..',
      '..pp..pp..',
      '..pp..pp..',
      '..kk..kk..',
      '..........',
    ];
    const pal: Record<string, number> = { h: hair, H: 0x7a4a24, f: 0xf1c27d, k: 0x111111, s: shirt, p: 0x2e4a7a };
    const g = this.make.graphics({}, false);
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch] !== undefined) g.fillStyle(pal[ch]).fillRect(x, y, 1, 1); }));
    g.generateTexture(key, 10, 16);
    g.destroy();
  }
}
