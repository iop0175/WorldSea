import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  displayChance, RARITY_LABEL_KO, RELEASE_REASON_KO, stepNeedle,
  type BiteAttemptBody, type BiteAttemptResponse, type BiteView, type EncounterAttemptBody, type EncounterAttemptResponse,
  type EncounterView, type Needle, type Rarity,
} from '@worldsea/shared';
import { ApiRequestError, attemptBite, attemptEncounter, getBites, getEncounters, getRegion } from '../api';
import { refreshMe } from '../session';
import { useGameStore } from '../store';
import { mmss } from './viewModel';
import { REGION_NAME_KO } from './mock';
import { ICONS, PixelIcon, type PixelArt } from './PixelIcon';
import { assetUrl } from '../game/assets';

/** 장비 id(float_rare, bait_worm_common, bait_target_<어종>) → 등급 아이콘(item/*). 없으면 undefined */
const gearIcon = (id?: string) => id && assetUrl(id.startsWith('bait_target_') ? 'item/bait_legend_special' : `item/${id.startsWith('float') ? 'float' : 'bait'}_${id.split('_').pop()}`);

/** 어종 이름: 지역 상세 응답에서 공개된 것만 모아 둔다 (특별 개체는 서버 최초 포획 전까지 비공개) */
const speciesNames = new Map<string, string>();
const regionLoads = new Map<string, Promise<void>>();
function loadRegionNames(regionId: string): Promise<void> {
  let load = regionLoads.get(regionId);
  if (!load) {
    load = getRegion(regionId).then((r) => { for (const s of r.species) if (s.revealed) speciesNames.set(s.id, s.nameKo); })
      .catch(() => { regionLoads.delete(regionId); });
    regionLoads.set(regionId, load);
  }
  return load;
}

/** 지역 이름표를 새로 받아 방금 공개된 어종 이름을 찾는다 */
async function revealName(regionId: string, speciesId: string): Promise<string | undefined> {
  regionLoads.delete(regionId);
  await loadRegionNames(regionId);
  return speciesNames.get(speciesId);
}

interface Gear { id: string; kind: 'float' | 'bait'; count: number; chanceBonus: number }
/** 입질과 특별 맵을 같은 게이지로 다루기 위한 공통 모양 */
interface Round {
  kind: 'bite' | 'encounter';
  regionId?: string;
  id: string;
  title: string;
  rarity: Rarity;
  expiresAt: number;
  done: number;
  max: number;
  chances: number[];
  autoChance: number | null;
  gear: Gear[];
}
type Payload = (BiteAttemptBody | EncounterAttemptBody) & { attemptNo: number };
interface Outcome { text: string; tone: 'ok' | 'miss' | 'info'; finished: boolean }

const CLOSED_CODES = new Set(['bite_closed', 'encounter_closed']);
const pct = (n: number) => `${Math.round(n * 100)}%`;
const RARITY_COLOR: Record<Rarity, string> = { common: '#b9c4c9', uncommon: '#7cd989', rare: '#5aaeff', epic: '#b47cf0', legendary: '#ffb347' };
/** 확률 → 색: 낮으면 빨강, 높으면 초록 (게이지 칸·큰 숫자) */
const chanceColor = (c: number) => `hsl(${Math.round(Math.min(1, c / 0.95) * 115)} 70% 48%)`;
/** 물고기 실루엣은 등급색 윤곽으로 그린다 */
const fishArt = (rarity: Rarity): PixelArt => ({ ...ICONS.fish, pal: { ...ICONS.fish.pal, K: RARITY_COLOR[rarity] } });
const TOTAL_SEC = { bite: 1800, encounter: 86400 } as const;

function toRound(kind: 'bite', v: BiteView, title: string): Round;
function toRound(kind: 'encounter', v: EncounterView, title: string): Round;
function toRound(kind: 'bite' | 'encounter', v: BiteView | EncounterView, title: string): Round {
  if (kind === 'bite') {
    const b = v as BiteView;
    return { kind, id: b.id, title, rarity: b.rarity, expiresAt: Date.parse(b.expiresAt), done: b.attemptsUsed, max: b.attemptsMax, chances: b.chances, autoChance: b.autoChance, gear: b.gear };
  }
  const e = v as EncounterView;
  return { kind, regionId: e.regionId, id: e.id, title, rarity: e.rarity, expiresAt: Date.parse(e.expiresAt), done: e.chancesMax - e.chancesLeft, max: e.chancesMax, chances: e.chances, autoChance: null, gear: e.gear };
}

/** 직접 잡기: 가로 게이지 위에서 바늘이 왕복하고, 탭한 위치(가운데로부터의 거리)를 서버에 보내 판정받는다 (79~81번). */
function BiteGame({ initial, freshAuto, onClose, onChanged }: { initial: Round; freshAuto: number | null; onClose: () => void; onChanged: () => void }) {
  const [round, setRound] = useState(initial);
  const [floatId, setFloatId] = useState('');
  const [baitId, setBaitId] = useState('');
  const [phase, setPhase] = useState<'ready' | 'sending' | 'retry' | 'result'>('ready');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState('');
  const [clock, setClock] = useState(Date.now());
  const pending = useRef<Payload | null>(null);
  const needle = useRef<Needle>({ x: -1, dir: 1 });
  const markRef = useRef<HTMLDivElement>(null);
  const chanceRef = useRef<HTMLSpanElement>(null);

  const bonus = [round.gear.find((g) => g.id === floatId), round.gear.find((g) => g.id === baitId)].reduce((sum, g) => sum + (g?.chanceBonus ?? 0), 0);
  const live = useRef({ chances: round.chances, bonus });
  live.current = { chances: round.chances, bonus };
  // 자동 확률은 시도마다 내려가므로 계산하지 않고 서버가 다시 준 목록 값을 쓴다.
  const autoChance = freshAuto ?? round.autoChance;
  const finished = outcome?.finished ?? false;
  const expired = clock >= round.expiresAt;
  const remainingSec = Math.max(0, Math.ceil((round.expiresAt - clock) / 1000));

  useEffect(() => { const t = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(t); }, []);

  /** 바늘 위치 x의 확률을 큰 숫자에 쓴다. React가 다시 그리며 값을 덮어쓰지 않도록 숫자는 항상 이 함수로만 쓴다. */
  const paint = (x: number) => {
    if (markRef.current) markRef.current.style.left = `${(x + 1) * 50}%`;
    if (!chanceRef.current) return;
    const c = displayChance(live.current.chances, Math.abs(x), live.current.bonus);
    chanceRef.current.textContent = pct(c);
    chanceRef.current.style.color = chanceColor(c);
  };
  // 멈춰 있을 때(결과·전송 중)나 장비·확률 표가 바뀔 때도 바늘 위치의 확률로 맞춘다.
  useEffect(() => { paint(needle.current.x); }, [round.chances, bonus, phase]);

  // 바늘 애니메이션: DOM을 직접 갱신해 프레임마다 다시 그리지 않는다. 대기 상태에서만 움직인다.
  useEffect(() => {
    if (phase !== 'ready' || finished || expired) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      needle.current = stepNeedle(needle.current, (now - last) / 1000);
      last = now;
      const x = needle.current.x;
      paint(x);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase, finished, expired]);

  const send = async (payload: Payload) => {
    pending.current = payload;
    setPhase('sending');
    setError('');
    try {
      const res = round.kind === 'bite'
        ? await attemptBite(round.id, payload as BiteAttemptBody)
        : await attemptEncounter(round.id, payload as EncounterAttemptBody);
      pending.current = null;
      const a = res.attempt;
      const b = round.kind === 'bite' ? (res as BiteAttemptResponse).bite : (res as EncounterAttemptResponse).encounter;
      const end = round.kind === 'bite' ? (b as BiteAttemptResponse['bite']).status !== 'pending' : (b as EncounterAttemptResponse['encounter']).status === 'finished';
      const next = b.chances;
      const used = (payload.floatId ? 1 : 0) + (payload.baitId ? 1 : 0) > 0 && a.gearConsumed;
      setRound((r) => ({
        ...r,
        done: round.kind === 'bite' ? (b as BiteAttemptResponse['bite']).attemptsUsed : r.max - (b as EncounterAttemptResponse['encounter']).chancesLeft,
        chances: next ?? r.chances,
        gear: used ? r.gear.map((g) => (g.id === payload.floatId || g.id === payload.baitId ? { ...g, count: g.count - 1 } : g)).filter((g) => g.count > 0) : r.gear,
      }));
      if (used) { if (!round.gear.find((g) => g.id === floatId && g.count > 1)) setFloatId(''); if (!round.gear.find((g) => g.id === baitId && g.count > 1)) setBaitId(''); }
      const tail = payload.floatId || payload.baitId ? (a.gearConsumed ? ' · 찌·미끼를 사용했어요' : ' · 찌·미끼는 사용되지 않았어요') : '';
      // 특별 개체는 서버에서 처음 잡힌 순간 공개되므로, 잡았다면 이름을 다시 받아 제목을 바꾼다.
      const revealed = round.kind === 'encounter' ? (b as EncounterAttemptResponse['encounter']).speciesId : null;
      if (a.success && revealed && round.regionId) void revealName(round.regionId, revealed).then((n) => { if (n) setRound((r) => ({ ...r, title: n })); });
      if (a.success) setOutcome({ text: `잡았어요! 성공 확률 ${pct(a.chance)}${tail}`, tone: 'ok', finished: true });
      else if (a.releaseReason) setOutcome({ text: `놓아줬어요 · ${RELEASE_REASON_KO[a.releaseReason]}${tail}`, tone: 'info', finished: true });
      else if (end) setOutcome({ text: `놓쳤어요 (${pct(a.chance)}) · 물고기는 바다로 돌아갔어요${tail}`, tone: 'miss', finished: true });
      else setOutcome({ text: `놓쳤어요 (${pct(a.chance)}) · 다시 도전해 보세요${tail}`, tone: 'miss', finished: false });
      setPhase('result');
      onChanged();
    } catch (e) {
      if (e instanceof ApiRequestError && e.code !== 'network' && e.status >= 400 && e.status < 500) {
        pending.current = null;
        if (CLOSED_CODES.has(e.code)) { setOutcome({ text: '이미 끝났거나 사라진 입질이에요', tone: 'info', finished: true }); setPhase('result'); onChanged(); return; }
        setError(e.message);
        setPhase('ready');
        return;
      }
      // 응답을 못 받았을 수 있다. 같은 본문을 다시 보내면 서버가 저장된 결과를 돌려준다(장비 중복 차감 없음).
      setError('연결이 끊겼어요. 같은 시도를 다시 보내면 결과를 받을 수 있어요');
      setPhase('retry');
    }
  };

  const gearBody = { ...(floatId ? { floatId } : {}), ...(baitId ? { baitId } : {}) };
  const stop = () => {
    if (phase !== 'ready' || finished || expired) return;
    void send({ attemptNo: round.done + 1, position: Math.abs(needle.current.x), ...gearBody });
  };
  const auto = () => {
    if (phase !== 'ready' || finished || expired || round.kind !== 'bite') return;
    void send({ attemptNo: round.done + 1, auto: true, ...gearBody });
  };
  /** 슬롯을 누를 때마다 "없음 → 보유 장비들 → 없음"으로 바뀐다 */
  const cycle = (kind: 'float' | 'bait') => {
    if (phase !== 'ready') return;
    const options = ['', ...round.gear.filter((g) => g.kind === kind).map((g) => g.id)];
    const current = kind === 'float' ? floatId : baitId;
    const next = options[(options.indexOf(current) + 1) % options.length]!;
    if (kind === 'float') setFloatId(next); else setBaitId(next);
  };
  const slot = (kind: 'float' | 'bait') => {
    const g = round.gear.find((x) => x.id === (kind === 'float' ? floatId : baitId));
    const has = round.gear.some((x) => x.kind === kind);
    const name = kind === 'float' ? '찌' : '미끼';
    const iconUrl = gearIcon((g ?? round.gear.find((x) => x.kind === kind))?.id);
    return (
      <button type="button" className={`bs-slot${g ? ' on' : ''}`} onClick={() => cycle(kind)} disabled={phase !== 'ready' || !has} aria-label={`${name} 선택`}>
        {iconUrl ? <img src={iconUrl} alt="" style={{ width: 'calc(var(--px) * 18)', height: 'calc(var(--px) * 18)' }} /> : <PixelIcon art={kind === 'float' ? ICONS.bobber : ICONS.worm} size="calc(var(--px) * 18)" />}
        <span className="bs-slot-text">{g ? <><b>+{Math.round(g.chanceBonus * 100)}%p</b><small>{name} ×{g.count}</small></> : <small>{has ? `${name} 선택` : `${name} 없음`}</small>}</span>
      </button>
    );
  };
  const left = round.max - round.done;
  const fishClass = outcome ? (outcome.tone === 'ok' ? 'caught' : outcome.finished ? 'escaped' : 'shake') : '';

  return createPortal(
    <section className="bite-scene" role="dialog" aria-label={`${round.title} 직접 잡기`}>
      <header className="bs-title">
        <span className="bs-kind">{round.kind === 'bite' ? '입질' : '특별 맵'}</span>
        <strong style={{ color: RARITY_COLOR[round.rarity] }}>{round.title}</strong>
        <span className="bs-rarity" style={{ color: RARITY_COLOR[round.rarity] }}>{RARITY_LABEL_KO[round.rarity]}</span>
        <button type="button" className="bs-close" onClick={onClose} aria-label="닫기">×</button>
      </header>

      <div className="bs-water">
        <i className="bubble b1" /><i className="bubble b2" /><i className="bubble b3" />
        <div className={`bs-fish ${fishClass}`} key={`${round.done}-${fishClass}`}><PixelIcon art={fishArt(round.rarity)} size="calc(var(--px) * 112)" /></div>
        {outcome && <div className={`bs-banner ${outcome.tone}`} role="status">{outcome.tone === 'ok' ? '잡았다!' : outcome.tone === 'info' ? '놓아줬어요' : outcome.finished ? '놓쳤다…' : '아깝다!'}</div>}
      </div>
      <p className="bs-note" role={error ? 'alert' : undefined}>{error || (outcome ? outcome.text : expired ? '시간이 지나 바다로 돌아갔어요' : '바늘이 가운데에 올 때 "지금!"을 눌러요')}</p>

      <div className="bs-meta">
        <span className="bs-pips" aria-label={`남은 기회 ${left}번`}>
          <small>기회</small>{Array.from({ length: round.max }, (_, i) => <i key={i} className={i < left ? 'on' : ''} />)}
        </span>
        <span className="bs-time"><i style={{ width: `${Math.min(100, (remainingSec / TOTAL_SEC[round.kind]) * 100)}%` }} /><small>{round.kind === 'bite' ? mmss(remainingSec) : `${Math.floor(remainingSec / 3600)}시간 ${Math.floor((remainingSec % 3600) / 60)}분`}</small></span>
      </div>

      <div className="bs-chance"><small>성공 확률</small><strong ref={chanceRef} /></div>
      <div className="bs-gauge" role="img" aria-label="가로 게이지. 가운데에 가까울수록 성공 확률이 높습니다">
        <div className="bs-track">
          {Array.from({ length: 21 }, (_, k) => <i key={k} style={{ background: chanceColor(displayChance(round.chances, Math.abs(k / 10 - 1), bonus)) }} />)}
          <div className="bs-needle" ref={markRef} />
        </div>
        <div className="bs-scale"><small>가장자리 {pct(displayChance(round.chances, 1, bonus))}</small><small>가운데 {pct(displayChance(round.chances, 0, bonus))}</small><small>가장자리 {pct(displayChance(round.chances, 1, bonus))}</small></div>
      </div>

      <div className="bs-gear">{slot('float')}{slot('bait')}</div>

      <div className="bs-actions">
        {phase === 'retry' ? <button type="button" className="bs-go" onClick={() => pending.current && void send(pending.current)}>다시 보내기</button>
          : finished || expired ? <button type="button" className="bs-go" onClick={onClose}>돌아가기</button>
          : phase === 'result' ? <button type="button" className="bs-go" onClick={() => setPhase('ready')}>다음 시도</button>
          : <button type="button" className="bs-go" onClick={stop} disabled={phase !== 'ready'}>{phase === 'sending' ? '판정 중…' : '지금!'}</button>}
        {round.kind === 'bite' && !finished && !expired && phase !== 'retry' && phase !== 'result' &&
          <button type="button" className="bs-auto" onClick={auto} disabled={phase !== 'ready'}>자동으로 넘기기 {pct(displayChance([autoChance ?? 0], 0, bonus))}</button>}
      </div>
    </section>,
    document.querySelector('.hud') ?? document.body,
  );
}

/** 입질·특별 맵 목록과 직접 잡기 진입. 서버 응답만 보여 주고 확률 계산은 서버가 준 표를 쓴다. */
export function BitePanel({ preview }: { preview: boolean }) {
  const expeditions = useGameStore((s) => s.expeditions);
  const [bites, setBites] = useState<BiteView[]>([]);
  const [encounters, setEncounters] = useState<EncounterView[]>([]);
  const [, setNamesLoaded] = useState(0);
  const [open, setOpen] = useState<Round | null>(null);
  const [clock, setClock] = useState(Date.now());
  const seq = useRef(0);
  const regionOf = (expeditionId: string) => expeditions.find((e) => e.id === expeditionId)?.regionId;

  const load = useCallback(async () => {
    if (preview) return;
    const mine = ++seq.current;
    try {
      const [b, e] = await Promise.all([getBites(), getEncounters()]);
      if (mine !== seq.current) return;
      setBites(b.bites);
      setEncounters(e.encounters);
      const regions = new Set([...b.bites.map((x) => regionOf(x.expeditionId)), ...e.encounters.map((x) => x.regionId)].filter((r): r is string => !!r));
      await Promise.all([...regions].map(loadRegionNames));
      if (mine === seq.current) setNamesLoaded((n) => n + 1);
    } catch { /* 다음 갱신에서 다시 시도한다 */ }
  }, [preview, expeditions]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (preview) return;
    const poll = setInterval(() => void load(), 10000);
    const tick = setInterval(() => setClock(Date.now()), 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [preview, load]);

  const nameOf = (id: string | null) => (id && speciesNames.get(id)) || (id ? '물고기' : '???');
  const changed = useCallback(() => { void load(); void refreshMe(); }, [load]);
  const live = bites.filter((b) => Date.parse(b.expiresAt) > clock);
  if (preview || (!live.length && !encounters.length && !open)) return null;

  return (
    <div className="bite-panel" aria-label="입질과 특별 맵">
      <div className="bp-head"><h3>입질 · 특별 맵</h3><span className="bp-count">{live.length + encounters.length}</span></div>
      {open && <BiteGame key={open.id} initial={open} freshAuto={bites.find((b) => b.id === open.id)?.autoChance ?? null} onClose={() => { setOpen(null); void load(); }} onChanged={changed} />}
      {live.map((b) => <article key={b.id} className="bite-card" style={{ borderColor: RARITY_COLOR[b.rarity] }}>
        <PixelIcon art={fishArt(b.rarity)} size="calc(var(--px) * 40)" />
        <div className="bc-text">
          <strong style={{ color: RARITY_COLOR[b.rarity] }}>{nameOf(b.speciesId)} <small>{RARITY_LABEL_KO[b.rarity]}</small></strong>
          <small>{regionName(regionOf(b.expeditionId))} · {mmss(Math.max(0, Math.ceil((Date.parse(b.expiresAt) - clock) / 1000)))} 남음 · 시도 {b.attemptsUsed}/{b.attemptsMax}{b.paused ? ' · 수색 정지' : ''}</small>
        </div>
        <button type="button" className="claim bc-go" onClick={() => setOpen(toRound('bite', b, nameOf(b.speciesId)))}>잡기</button>
      </article>)}
      {encounters.map((e) => <article key={e.id} className="bite-card special" style={{ borderColor: RARITY_COLOR[e.rarity] }}>
        <PixelIcon art={fishArt(e.rarity)} size="calc(var(--px) * 40)" />
        <div className="bc-text">
          <strong style={{ color: RARITY_COLOR[e.rarity] }}>{e.speciesId ? nameOf(e.speciesId) : '???'} <small>특별 맵</small></strong>
          <small>{regionName(e.regionId)} · 기회 {e.chancesLeft}/{e.chancesMax} · {Math.max(0, Math.floor((Date.parse(e.expiresAt) - clock) / 3600000))}시간 남음</small>
        </div>
        <button type="button" className="claim bc-go" onClick={() => setOpen(toRound('encounter', e, e.speciesId ? nameOf(e.speciesId) : '??? (특별 개체)'))}>들어가기</button>
      </article>)}
    </div>
  );
}

const regionName = (id?: string) => (id && REGION_NAME_KO[id]) || '지역';
