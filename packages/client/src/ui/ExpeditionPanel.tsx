import { useEffect, useRef, useState, type FormEvent } from 'react';
import { REPEAT_MAX_PREMIUM, startExpeditionBody, type RegionView } from '@worldsea/shared';
import { ApiRequestError, getMe, getRegions, startExpedition } from '../api';
import { useGameStore } from '../store';
import { mmss } from './viewModel';

const PREVIEW_REGIONS: RegionView[] = [
  { id: 'asia_fresh', nameKo: '아시아 민물', kind: 'freshwater', unlockStage: 1, requiredLevel: 1, requiresTimeTicket: false, specialMapChance: 0.01, huntSeconds: 300, huntStaminaCost: 1, unlocked: true },
  { id: 'devonian', nameKo: '데본기', kind: 'ancient', unlockStage: 4, requiredLevel: 35, requiresTimeTicket: true, specialMapChance: 0.01, huntSeconds: 1800, huntStaminaCost: 5, unlocked: false },
];

/** 수색 시작까지만 연결한 원정 화면. 게임 값은 서버 응답으로만 갱신한다. */
export function ExpeditionPanel({ preview }: { preview: boolean }) {
  const me = useGameStore((s) => s.me);
  const [regions, setRegions] = useState<RegionView[]>(preview ? PREVIEW_REGIONS : []);
  const [loading, setLoading] = useState(!preview);
  const [busy, setBusy] = useState(false);
  const [regionId, setRegionId] = useState('');
  const [hunterId, setHunterId] = useState('');
  const [repeat, setRepeat] = useState('1');
  const [recovery, setRecovery] = useState<'none' | 'wait_regen'>('none');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [acceptedHunter, setAcceptedHunter] = useState('');
  const submitting = useRef(false);
  const hunters = me?.hunters.slice(0, me.hunterSlots) ?? [];
  const selectedRegion = regions.find((r) => r.id === regionId) ?? regions.find((r) => r.unlocked);
  const selectedHunter = hunters.find((h) => h.id === hunterId) ?? hunters.find((h) => !h.expedition) ?? hunters[0];
  const selectedBusy = selectedHunter?.expedition?.status === 'active' || acceptedHunter === selectedHunter?.id;

  useEffect(() => {
    if (preview) return;
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([getRegions(), getMe()]).then(([world, player]) => {
      if (!active) return;
      setRegions(world.regions);
      useGameStore.getState().setMe(player);
      setAcceptedHunter('');
    }).catch((e: unknown) => {
      if (active) setError(e instanceof Error ? e.message : '지역을 불러오지 못했습니다');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [preview, reload]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (preview || submitting.current || !selectedRegion || !selectedHunter || selectedBusy) return;
    const parsed = startExpeditionBody.safeParse({ hunterId: selectedHunter.id, regionId: selectedRegion.id, repeatTotal: Number(repeat), options: { recovery } });
    if (!parsed.success) { setError('반복 횟수는 1~200 사이의 정수로 입력해 주세요'); return; }
    submitting.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    // 응답 유실 후 탭 이동·새로고침에도 동일 요청 키를 재사용한다.
    const storageKey = `worldsea:expedition-start:${me!.player.id}`;
    let started = false;
    try {
      const signature = JSON.stringify(parsed.data);
      const stored = sessionStorage.getItem(storageKey);
      const previous = stored ? JSON.parse(stored) as { signature: string; key: string } : null;
      const key = previous?.signature === signature ? previous.key : crypto.randomUUID();
      sessionStorage.setItem(storageKey, JSON.stringify({ signature, key }));
      await startExpedition(parsed.data, key);
      started = true;
      setAcceptedHunter(selectedHunter.id);
      setMessage(`${selectedHunter.name} 수색을 시작했습니다`);
      sessionStorage.removeItem(storageKey);
      useGameStore.getState().setMe(await getMe());
      setAcceptedHunter('');
    } catch (e) {
      if (!started && e instanceof ApiRequestError && e.status >= 400 && e.status < 500) sessionStorage.removeItem(storageKey);
      setError(started ? '수색은 시작됐습니다. 상태 새로고침을 눌러 주세요' : e instanceof Error ? e.message : '수색을 시작하지 못했습니다');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="sheet expedition-sheet" aria-label="원정">
      <div className="expedition-heading"><h2>원정 · 수색</h2><button type="button" onClick={() => setReload((n) => n + 1)} disabled={preview || busy || loading}>상태 새로고침</button></div>
      {preview && <p>미리보기입니다. 로그인 후 수색을 시작할 수 있습니다.</p>}
      {loading ? <p role="status">지역과 헌터를 불러오는 중…</p> : <form className="expedition-form" onSubmit={(event) => void submit(event)}>
        <label>지역<select aria-label="지역" value={selectedRegion?.id ?? ''} onChange={(e) => setRegionId(e.target.value)} disabled={busy || !regions.length}>
          {!regions.length && <option value="">지역 없음</option>}
          {regions.map((r) => <option key={r.id} value={r.id} disabled={!r.unlocked}>{r.nameKo}{!r.unlocked ? ` · LV.${r.requiredLevel} 해금` : ''}</option>)}
        </select></label>
        {selectedRegion && <p>1회 {mmss(selectedRegion.huntSeconds)} · 스태미너 {selectedRegion.huntStaminaCost}{selectedRegion.requiresTimeTicket ? ' · 입장 티켓 1장' : ''}</p>}
        <label>헌터<select aria-label="헌터" value={selectedHunter?.id ?? ''} onChange={(e) => setHunterId(e.target.value)} disabled={preview || busy || !hunters.length}>
          {preview ? <option value="">헌터 1 · 예시</option> : !hunters.length ? <option value="">사용 가능한 헌터 없음</option> : hunters.map((h) => <option key={h.id} value={h.id}>{h.name}{h.expedition?.status === 'active' ? ' · 수색 중' : ' · 대기'}</option>)}
        </select></label>
        <div className="expedition-fields">
          <label>반복 횟수<input aria-label="반복 횟수" type="number" min="1" max={REPEAT_MAX_PREMIUM} step="1" value={repeat} onChange={(e) => setRepeat(e.target.value)} disabled={busy} required /></label>
          <label>스태미너 부족 시<select aria-label="스태미너 부족 시" value={recovery} onChange={(e) => setRecovery(e.target.value as typeof recovery)} disabled={busy}>
            <option value="none">중단</option><option value="wait_regen">자연 회복 대기</option>
          </select></label>
        </div>
        <p>기본 최대 100회 · 구독/높은 VIP 최대 200회</p>
        <button className="gate-btn gold" type="submit" disabled={preview || busy || !!error && !regions.length || !selectedRegion?.unlocked || !selectedHunter || selectedBusy}>{busy ? '시작 요청 중…' : selectedBusy ? '선택한 헌터 수색 중' : '수색 시작'}</button>
      </form>}
      {message && <p className="expedition-success" role="status">{message}</p>}
      {error && <p className="expedition-error" role="alert">{error}</p>}
      <div className="expedition-status" aria-label="수색 현황">
        <h3>수색 현황</h3>
        {!hunters.length ? <p>{preview ? '로그인 후 헌터 현황을 표시합니다' : '사용 가능한 헌터가 없습니다'}</p> : hunters.map((h) => <p key={h.id}>
          <strong>{h.name}</strong> · {h.expedition ? `${regions.find((r) => r.id === h.expedition!.regionId)?.nameKo ?? h.expedition.regionId} · ${h.expedition.repeatDone}/${h.expedition.repeatTotal}회 · ${h.expedition.status === 'active' ? '수색 중' : '완료 · 수령 대기'}` : '대기 중'}
          {h.expedition?.status === 'active' && <small>다음 회차 종료 {new Date(h.expedition.endsAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</small>}
        </p>)}
      </div>
      <p className="expedition-note">현재 수색 시작까지 지원합니다. 반복 진행·수령·입질은 준비 중입니다.</p>
    </section>
  );
}
