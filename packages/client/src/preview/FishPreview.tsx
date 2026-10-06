/**
 * 물고기 합성 미리보기 (개발용). http://localhost:5173/fish-preview.html
 * - src/assets/fish/<어종 id>/<s|l>/<겹>[.<대립유전자>].png 를 읽어 유전자 조합대로 합성한다.
 * - 그려야 할 파일 목록과 규격 검사(크기, 회색 5단계, 반투명)를 보여 준다.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FISH_FRAMES,
  FISH_GRAYS,
  FISH_MORPHS,
  FISH_SIZES,
  RARITY_LABEL_KO,
  expectedFishFiles,
  fishAssetKey,
  fishLayerPlan,
  wildGenotype,
  type FishPlan,
  type FishSize,
  type Genotype,
} from '@worldsea/shared';
import { ALL_SPECIES, REGIONS } from '@worldsea/shared/seed/world';
import { hasAsset } from '../game/assets';
import { checkFishFile, composeFish, type FishFileCheck } from '../game/fishCompose';

const BACKGROUNDS = { water: '#1d4f6b', dark: '#101d26', light: '#e8e4dc', check: 'check' } as const;
type Bg = keyof typeof BACKGROUNDS;

export function FishPreview() {
  const [speciesId, setSpeciesId] = useState('betta_splendens');
  const [size, setSize] = useState<FishSize>('l');
  const [zoom, setZoom] = useState(6);
  const [animate, setAnimate] = useState(true);
  const [bg, setBg] = useState<Bg>('water');
  const morphs = FISH_MORPHS[speciesId];
  const loci = morphs?.loci ?? [];
  const [genotype, setGenotype] = useState<Genotype>(() => wildGenotype(loci));
  useEffect(() => setGenotype(wildGenotype(FISH_MORPHS[speciesId]?.loci ?? [])), [speciesId]);

  const plan = useMemo(() => fishLayerPlan(speciesId, size, morphs, genotype, hasAsset), [speciesId, size, morphs, genotype]);
  const species = ALL_SPECIES.find((s) => s.id === speciesId);
  const drawnCount = (id: string) => (['s', 'l'] as const).filter((sz) => hasAsset(fishAssetKey(id, sz, 'body'))).length;

  return (
    <div className="fp">
      <header>
        <h1>물고기 합성 미리보기</h1>
        <p>
          파일 위치 <code>packages/client/src/assets/fish/&lt;어종 id&gt;/&lt;s|l&gt;/&lt;겹&gt;[.&lt;모프&gt;].png</code> · 규격은{' '}
          <code>docs/fish-art.md</code>. 파일을 넣으면 개발 서버가 자동으로 다시 읽는다.
        </p>
      </header>

      <div className="fp-body">
        <aside className="fp-list">
          {REGIONS.map((r) => (
            <section key={r.id}>
              <h3>{r.nameKo}</h3>
              {ALL_SPECIES.filter((s) => s.regionId === r.id).map((s) => (
                <button key={s.id} className={s.id === speciesId ? 'on' : ''} onClick={() => setSpeciesId(s.id)}>
                  <span>{s.nameKo}</span>
                  <small>
                    {FISH_MORPHS[s.id] ? '모프' : ''} {drawnCount(s.id) ? `그림 ${drawnCount(s.id)}/2` : ''}
                  </small>
                </button>
              ))}
            </section>
          ))}
        </aside>

        <main>
          <div className="fp-title">
            <h2>{species?.nameKo ?? speciesId}</h2>
            <span>
              {species?.scientificName ? <i>{species.scientificName}</i> : '오리지널'} · {species ? RARITY_LABEL_KO[species.rarity] : ''} · <code>{speciesId}</code>
            </span>
          </div>

          <div className="fp-controls">
            <label>
              크기
              <select value={size} onChange={(e) => setSize(e.target.value as FishSize)}>
                <option value="l">큰 그림 48×32</option>
                <option value="s">작은 그림 16×10</option>
              </select>
            </label>
            <label>
              확대
              <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
                {[2, 3, 4, 6, 8, 12].map((z) => (
                  <option key={z} value={z}>
                    {z}배
                  </option>
                ))}
              </select>
            </label>
            <label>
              배경
              <select value={bg} onChange={(e) => setBg(e.target.value as Bg)}>
                <option value="water">물</option>
                <option value="dark">어두움</option>
                <option value="light">밝음</option>
                <option value="check">투명 격자</option>
              </select>
            </label>
            <label className="chk">
              <input type="checkbox" checked={animate} onChange={(e) => setAnimate(e.target.checked)} /> 꼬리 움직임
            </label>
          </div>

          {loci.length > 0 ? (
            <div className="fp-genes">
              {loci.map((l) => {
                const pair = genotype[l.id] ?? [l.wildTypeAlleleId, l.wildTypeAlleleId];
                const set = (i: 0 | 1, v: string) => setGenotype({ ...genotype, [l.id]: (i === 0 ? [v, pair[1]] : [pair[0], v]) as [string, string] });
                return (
                  <div key={l.id} className="gene">
                    <b>{l.nameKo}</b>
                    {([0, 1] as const).map((i) => (
                      <select key={i} value={pair[i]} onChange={(e) => set(i, e.target.value)}>
                        {l.alleles.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nameKo}
                            {a.id === l.wildTypeAlleleId ? ' (야생)' : ''}
                          </option>
                        ))}
                      </select>
                    ))}
                    <span className="expr">→ {l.alleles.find((a) => a.id === plan.phenotype[l.id])?.nameKo}</span>
                  </div>
                );
              })}
              <div className="morph-key">
                모프 키 <code>{plan.morphKey || '(야생형)'}</code>
              </div>
            </div>
          ) : (
            <p className="note">이 어종은 아직 모프 정의가 없다 (packages/shared/src/game/morphs.ts). 기본 팔레트로 합성한다.</p>
          )}

          <Stage plan={plan} size={size} zoom={zoom} animate={animate} bg={bg} />
          <PaletteView plan={plan} />
          <FileTable speciesId={speciesId} size={size} />
        </main>
      </div>
    </div>
  );
}

function Stage({ plan, size, zoom, animate, bg }: { plan: FishPlan; size: FishSize; zoom: number; animate: boolean; bg: Bg }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sheet, setSheet] = useState<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const { w, h } = FISH_SIZES[size];

  useEffect(() => {
    let alive = true;
    setError(null);
    if (plan.missingBody) {
      setSheet(null);
      return;
    }
    composeFish(plan, size)
      .then((c) => alive && setSheet(c))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [plan, size]);

  useEffect(() => {
    if (!animate) return setFrame(0);
    const t = setInterval(() => setFrame((f) => (f + 1) % FISH_FRAMES), 260);
    return () => clearInterval(t);
  }, [animate]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    if (sheet) ctx.drawImage(sheet, frame * w, 0, w, h, 0, 0, w * zoom, h * zoom);
  }, [sheet, frame, zoom, w, h]);

  const bgStyle = bg === 'check' ? undefined : { background: BACKGROUNDS[bg] };
  return (
    <div className={`fp-stage ${bg === 'check' ? 'check' : ''}`} style={bgStyle}>
      {plan.missingBody ? (
        <div className="empty">
          몸 파일이 아직 없다 · <code>{fishAssetKey('...', size, 'body').replace('fish/.../', `fish/<어종>/`)}.png</code>
        </div>
      ) : error ? (
        <div className="empty">{error}</div>
      ) : (
        <canvas ref={ref} width={w * zoom} height={h * zoom} />
      )}
      <div className="layers">
        겹: {plan.layers.length ? plan.layers.map((l) => l.key.split('/').pop()).join(' → ') : '없음'}
      </div>
    </div>
  );
}

function PaletteView({ plan }: { plan: FishPlan }) {
  return (
    <div className="fp-palette">
      {(['body', 'fin', 'pattern'] as const).map((k) => (
        <div key={k}>
          <b>{{ body: '몸', fin: '지느러미', pattern: '무늬' }[k]}</b>
          {plan.palette[k].map((c, i) => (
            <span key={i} title={`${FISH_GRAYS[i]} → ${c}`} style={{ background: c }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function FileTable({ speciesId, size }: { speciesId: string; size: FishSize }) {
  const files = useMemo(() => expectedFishFiles(FISH_MORPHS[speciesId]), [speciesId]);
  const [checks, setChecks] = useState<Record<string, FishFileCheck | 'error'>>({});
  const { w, h } = FISH_SIZES[size];

  useEffect(() => {
    let alive = true;
    setChecks({});
    for (const f of files) {
      const key = fishAssetKey(speciesId, size, f.slot, f.allele?.id);
      if (!hasAsset(key)) continue;
      checkFishFile(key, size, f.slot === 'line')
        .then((r) => alive && setChecks((c) => ({ ...c, [f.name]: r })))
        .catch(() => alive && setChecks((c) => ({ ...c, [f.name]: 'error' })));
    }
    return () => {
      alive = false;
    };
  }, [files, speciesId, size]);

  return (
    <table className="fp-files">
      <caption>
        그려야 할 파일 ({size === 'l' ? '큰 그림' : '작은 그림'}, 한 장 {w}×{h} 또는 2프레임 {w * FISH_FRAMES}×{h})
      </caption>
      <thead>
        <tr>
          <th>파일</th>
          <th>용도</th>
          <th>상태</th>
        </tr>
      </thead>
      <tbody>
        {files.map((f) => {
          const key = fishAssetKey(speciesId, size, f.slot, f.allele?.id);
          const exists = hasAsset(key);
          const c = checks[f.name];
          let status: string;
          let cls: string;
          if (!exists) {
            status = f.required ? '없음' : '없음 (선택)';
            cls = f.required ? 'miss' : 'opt';
          } else if (!c) {
            status = '검사 중';
            cls = '';
          } else if (c === 'error') {
            status = '읽기 실패';
            cls = 'bad';
          } else {
            const problems = [
              !c.sizeOk && `크기 ${c.width}×${c.height}`,
              c.offGray > 0 && `회색 단계 아님 ${c.offGray}px`,
              c.semiAlpha > 0 && `반투명 ${c.semiAlpha}px`,
            ].filter(Boolean);
            status = problems.length ? problems.join(', ') : c.width === w ? '정상 (1프레임: 꼬리 고정)' : '정상';
            cls = problems.length ? 'bad' : 'ok';
          }
          return (
            <tr key={f.name}>
              <td>
                <code>{f.name}.png</code>
              </td>
              <td>{f.allele ? `${f.allele.nameKo} 모프` : SLOT_DESC[f.slot]}</td>
              <td className={cls}>{status}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const SLOT_DESC: Record<string, string> = {
  fin_back: '뒤쪽 지느러미 (몸 뒤에 겹침)',
  body: '몸 실루엣 (필수)',
  scale: '비늘',
  pattern: '야생형 무늬',
  fin_front: '앞쪽 지느러미·꼬리',
  line: '눈·고정색 선 (필수, 팔레트 안 바뀜)',
};
