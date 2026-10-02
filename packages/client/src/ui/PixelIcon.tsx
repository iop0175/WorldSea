/**
 * 문자열 도트 그림을 SVG로 그리는 임시 아이콘. 실제 픽셀아트 에셋이 나오면 이미지로 교체한다.
 * 같은 색이 가로로 이어지면 한 rect로 묶는다.
 */
export interface PixelArt {
  rows: string[];
  pal: Record<string, string>;
}

export function PixelIcon({ art, size, className }: { art: PixelArt; size: string; className?: string }) {
  const w = art.rows[0].length;
  const h = art.rows.length;
  const rects: { x: number; y: number; w: number; c: string }[] = [];
  art.rows.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      const c = art.pal[row[x]];
      if (!c) { x++; continue; }
      let run = 1;
      while (x + run < w && row[x + run] === row[x]) run++;
      rects.push({ x, y, w: run, c });
      x += run;
    }
  });
  return (
    <svg className={className} style={{ width: size, height: size, flex: 'none' }} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden="true">
      {rects.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />)}
    </svg>
  );
}

const K = '#000000';

export const ICONS = {
  shop: { rows: ['............', 'RRWWRRWWRRWW', 'RRWWRRWWRRWW', '.RW.RW.RW.R.', '.BBBBBBBBBB.', '.BccBBBBccB.', '.BccBBBBccB.', '.BBBBddBBBB.', '.BBBBddBBBB.', '.BBBBddBBBB.', 'kkkkkkkkkkkk', '............'], pal: { R: '#e5484d', W: '#f4f1e8', B: '#2a8fb4', c: '#bfeaf5', d: '#5a3822', k: K } },
  farm: { rows: ['............', 'kkkkkkkkkkkk', 'kwwwwwwwwwwk', 'kwwwOOOwwOwk', 'kwwOkOOOOOwk', 'kwwwOOOwwOwk', 'kwwwwwwwwwwk', 'kgwwwwwwwgwk', 'kgSSSSSSSgSk', 'kkkkkkkkkkkk', '............', '............'], pal: { k: K, w: '#2a8fb4', O: '#ff7a59', g: '#4caf6a', S: '#e0c48a' } },
  expedition: { rows: ['............', '.pppp.pppp..', 'pppppppppppp', 'ppgppppprppp', 'pgggpppprppp', 'ppgpppprpppp', 'pppppprrpppp', 'pppprrpppXpp', 'pppprppppppp', 'pppppppppppp', '..pppp.pppp.', '............'], pal: { p: '#e8d3a0', g: '#4caf6a', r: '#b07a3a', X: '#e5484d' } },
  dex: { rows: ['............', '.kkkkkkkkkk.', '.kRRRRRRRRk.', '.kRRYYYYRRk.', '.kRRRYYRRRk.', '.kRRRRRRRRk.', '.kRRRRRRRRk.', '.kRRRRRRRRk.', '.kRRRRRRRRk.', '.kWWWWWWWWk.', '.kkkkkkkkkk.', '............'], pal: { k: K, R: '#a8432a', Y: '#f2c14e', W: '#f4f1e8' } },
  store: { rows: ['............', '............', '...kkkkkk...', '..k......k..', '.k........k.', 'kkkkkkkkkkkk', 'kBBBBBBBBBBk', '.kBkBkBkBkk.', '.kBBBBBBBBk.', '.kBkBkBkBkk.', '..kkkkkkkk..', '............'], pal: { k: K, B: '#6ec6ff' } },
  attend: { rows: ['..k.....k...', 'kkkkkkkkkkkk', 'kYYYYYYYYYYk', 'kkkkkkkkkkkk', 'kDDDDDDDDDDk', 'kDDDDDDDDGDk', 'kDDDDDDDGDDk', 'kDGDDDDGDDDk', 'kDDGDDGDDDDk', 'kDDDGGDDDDDk', 'kkkkkkkkkkkk', '............'], pal: { k: K, Y: '#e8b248', D: '#1f3d36', G: '#7ee08a' } },
  restore: { rows: ['............', '.gg....gg...', 'gggg..gggg..', '.ggg..ggg...', '...g..g.....', '....gg......', '.....g......', '..rrrrrrr...', '..rrrrrrr...', '...rrrrr....', '...rrrrr....', '............'], pal: { g: '#7ee08a', r: '#c0703a' } },
  bag: { rows: ['............', '....WWWW....', '...W....W...', '...W....W...', '.WWWWWWWWWW.', '.W........W.', '.W........W.', '.WWWWWWWWWW.', '.W........W.', '.W........W.', '.WWWWWWWWWW.', '............'], pal: { W: '#e9f1f4' } },
  friends: { rows: ['............', '.WWWW..WWWW.', '.W..W..W..W.', '.W..W..W..W.', '.WWWW..WWWW.', '............', 'WWWWWWWWWWWW', 'W....WW....W', 'W....WW....W', 'W....WW....W', '............', '............'], pal: { W: '#e9f1f4' } },
  gem: { rows: ['...KK...', '..KPPK..', '.KPWPPK.', 'KPPPPPPK', 'KPPPPPPK', '.KPPPPK.', '..KPPK..', '...KK...'], pal: { K: '#3b1f52', P: '#b47cf0', W: '#f0dcff' } },
  coin: { rows: ['..KKKK..', '.KYYYYK.', 'KYWYYDYK', 'KYYDDYYK', 'KYYDDYYK', 'KYYYYYYK', '.KYYYYK.', '..KKKK..'], pal: { K: '#7a4e10', Y: '#e8b248', D: '#b8862a', W: '#fff3c4' } },
  bolt: { rows: ['....GG..', '...GG...', '..GG....', '.GGGGGG.', '....GG..', '...GG...', '..GG....', '.GG.....'], pal: { G: '#57c469' } },
  hourglass: { rows: ['BBBBBBBB', '.BccccB.', '..BccB..', '...BB...', '...BB...', '..BccB..', '.BccccB.', 'BBBBBBBB'], pal: { B: '#4c95b5', c: '#bfeaf5' } },
  menu: { rows: ['........', 'WWWWWWWW', '........', 'WWWWWWWW', '........', 'WWWWWWWW', '........', '........'], pal: { W: '#e9f1f4' } },
  lock: { rows: ['..WWWW..', '.W....W.', '.W....W.', 'WWWWWWWW', 'WWWKKWWW', 'WWWKKWWW', 'WWWWWWWW', '........'], pal: { W: '#c7d3d8', K: '#2b3a44' } },
  face: { rows: ['..HHHHHHHH..', '.HHHHHHHHHH.', 'HHHHHHHHHHHH', '..ffffffff..', '..fkffffkf..', '..ffffffff..', '..ffmmmmff..', '...ffffff...', '..BBBWWBBB..', '.BBBBWWBBBB.', 'BBBBBWWBBBBB', 'BBBBBWWBBBBB'], pal: { H: '#7a4a24', f: '#f1c27d', k: '#111111', m: '#b3714a', B: '#2a8fb4', W: '#f4f1e8' } },
} satisfies Record<string, PixelArt>;
