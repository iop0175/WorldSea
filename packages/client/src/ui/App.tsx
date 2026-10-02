import { useEffect, type CSSProperties } from 'react';
import { BOTTOM_TABS, BOTTOM_TAB_LABEL_KO, type BottomTab } from '@worldsea/shared';
import { fetchHealth } from '../api';
import { useGameStore } from '../store';
import { LAYOUT, STAGE1_SPOTS } from '../game/layout';
import { ICONS, PixelIcon } from './PixelIcon';
import { MOCK_BADGES, MOCK_HUNTERS, MOCK_PLAYER as P } from './mock';

/** 게임 좌표(360x640 기준 px)를 화면 CSS 길이로 */
const g = (n: number) => `calc(var(--px) * ${n})`;
const box = (x: number, y: number, w?: number, h?: number): CSSProperties => ({
  left: g(x), top: g(y), ...(w !== undefined ? { width: g(w) } : {}), ...(h !== undefined ? { height: g(h) } : {}),
});

const TAB_INFO: Record<Exclude<BottomTab, 'shop'>, { title: string; lines: string[] }> = {
  farm: { title: '사육', lines: ['수조 환경(수온·염도·수질)과 자동화 설비', '교배와 성장 관리'] },
  expedition: { title: '원정', lines: ['헌터를 보내 수색 (1회 / 반복 최대 100회)', '희귀어 입질 미니게임'] },
  dex: { title: '도감', lines: ['어종 122종과 모프 기록', '보전 상태(안정·취약·보호종·야생 멸종)'] },
  store: { title: '상점', lines: ['찌·미끼(3등급까지), 헌터 외형', '구독과 VIP'] },
};

function Badge({ value }: { value?: string }) {
  if (!value) return null;
  return <span className="badge">{value}</span>;
}

function TopBar() {
  return (
    <header className="topbar" style={box(0, LAYOUT.topBar.y, 360, LAYOUT.topBar.h)}>
      <button type="button" className="panel profile" aria-label={`프로필, ${P.nickname}, 레벨 ${P.level}`}>
        <span className="avatar"><PixelIcon art={ICONS.face} size={g(24)} /></span>
        <span className="profile-text">
          <span className="name">{P.nickname} <b>LV.{P.level}</b></span>
          <span className="bar"><span style={{ width: `${P.expRatio * 100}%` }} /></span>
        </span>
      </button>
      <button type="button" className="panel res premium" aria-label={`프리미엄 ${P.premium}, 충전`}>
        <PixelIcon art={ICONS.gem} size={g(12)} /><span className="num">{P.premium}</span><span className="plus">+</span>
      </button>
      <button type="button" className="panel res gold" aria-label={`골드 ${P.gold.toLocaleString()}, 충전`}>
        <PixelIcon art={ICONS.coin} size={g(12)} /><span className="num">{P.gold.toLocaleString()}</span><span className="plus">+</span>
      </button>
      <button type="button" className="panel res stamina" aria-label={`스태미너 ${P.stamina}/${P.staminaMax}, ${P.staminaNext} 후 1 회복`}>
        <PixelIcon art={ICONS.bolt} size={g(12)} />
        <span className="stack"><span className="num">{P.stamina}/{P.staminaMax}</span><span className="sub">+1 {P.staminaNext}</span></span>
      </button>
      <button type="button" className="panel res ticket" aria-label={`시간 티켓 ${P.timeTickets}장`}>
        <PixelIcon art={ICONS.hourglass} size={g(12)} /><span className="num">{P.timeTickets}</span>
      </button>
      <button type="button" className="panel menu" aria-label={`메뉴, 새 소식 ${P.unread}개`}>
        <PixelIcon art={ICONS.menu} size={g(14)} />
        <Badge value={String(P.unread)} />
      </button>
    </header>
  );
}

function SceneOverlay() {
  return (
    <div className="scene-ui">
      {/* 간판 글자 + 샵 단계 */}
      <div className="sign" style={box(120, 46, 120, 26)}>월드씨 브리딩샵</div>
      <button type="button" className="stage-bar" style={box(105, 78, 150, 14)} aria-label={`${P.shopStageName}, 다음 단계까지 ${Math.round(P.shopStageProgress * 100)}%`}>
        <span className="gem" /><span>{P.shopStageName}</span>
        <span className="bar"><span style={{ width: `${P.shopStageProgress * 100}%` }} /></span>
        <span className="pct">{Math.round(P.shopStageProgress * 100)}%</span><span className="gem" />
      </button>

      {/* 장면 터치 영역과 라벨 */}
      {Object.entries(STAGE1_SPOTS).map(([key, s]) => {
        const isDoor = key === 'market' || key === 'guild';
        return (
          <button key={key} type="button" className={'labelTop' in s ? 'spot label-top' : 'spot'} style={box(s.x, s.y, s.w, s.h)} aria-label={s.label}>
            <span className={isDoor ? 'plate' : 'label'}>{s.label}</span>
          </button>
        );
      })}

      {/* 양옆 패널 */}
      <nav className="side left" style={box(0, 90, 40)} aria-label="빠른 메뉴 왼쪽">
        <button type="button" aria-label="출석"><PixelIcon art={ICONS.attend} size={g(22)} /><span>출석</span><Badge value={MOCK_BADGES.attend} /></button>
        <button type="button" aria-label="복원 이벤트"><PixelIcon art={ICONS.restore} size={g(22)} /><span>복원</span></button>
      </nav>
      <nav className="side right" style={box(320, 90, 40)} aria-label="빠른 메뉴 오른쪽">
        <button type="button" aria-label="가방"><PixelIcon art={ICONS.bag} size={g(22)} /><span>가방</span></button>
        <button type="button" aria-label="친구"><PixelIcon art={ICONS.friends} size={g(22)} /><span>친구</span></button>
      </nav>
    </div>
  );
}

function HunterBand() {
  const hunting = MOCK_HUNTERS.filter((h) => h.kind === 'hunting').length;
  const done = MOCK_HUNTERS.filter((h) => h.kind === 'complete').length;
  return (
    <section className="hunter" style={box(0, LAYOUT.hunter.y, 360, LAYOUT.hunter.h)} aria-label="헌터 현황">
      <div className="hunter-head">
        <span className="title">헌터</span>
        <span className="sub">{hunting}명 수색중 · {done}명 완료</span>
        <button type="button" className="claim">모두 수령</button>
      </div>
      <div className="cards">
        {MOCK_HUNTERS.map((h, i) => {
          if (h.kind === 'hunting')
            return (
              <button key={i} type="button" className="card hunting" aria-label={`헌터 ${i + 1}, ${h.region}, ${h.done}/${h.total}, ${h.remain} 남음`}>
                <span className="region">{h.region}</span>
                <span className="meta"><span>{h.done}/{h.total}</span><span>{h.remain}</span></span>
                <span className="bar"><span style={{ width: `${(h.done / h.total) * 100}%` }} /></span>
              </button>
            );
          if (h.kind === 'complete')
            return (
              <button key={i} type="button" className="card complete" aria-label={`헌터 ${i + 1}, ${h.region}, 완료, 수령 가능`}>
                <span className="region">{h.region}</span><span className="done">완료 · 수령</span>
              </button>
            );
          return (
            <button key={i} type="button" className="card locked" aria-label={`헌터 슬롯 ${i + 1}, ${h.condition}`}>
              <PixelIcon art={ICONS.lock} size={g(14)} /><span>{h.condition}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TabBar() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setTab = useGameStore((s) => s.setTab);
  return (
    <nav className="tabbar" style={box(0, LAYOUT.tabBar.y, 360, LAYOUT.tabBar.h)} aria-label="주 메뉴">
      {BOTTOM_TABS.map((tab) => (
        <button key={tab} type="button" className={tab === activeTab ? 'active' : ''} aria-pressed={tab === activeTab} onClick={() => setTab(tab)}>
          <span className="icon"><PixelIcon art={ICONS[tab]} size={g(30)} /><Badge value={MOCK_BADGES[tab]} /></span>
          <span className="label">{BOTTOM_TAB_LABEL_KO[tab]}</span>
        </button>
      ))}
    </nav>
  );
}

export function App() {
  const activeTab = useGameStore((s) => s.activeTab);
  const serverStatus = useGameStore((s) => s.serverStatus);
  const setServerStatus = useGameStore((s) => s.setServerStatus);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchHealth(ctrl.signal)
      .then(() => setServerStatus('online'))
      .catch(() => !ctrl.signal.aborted && setServerStatus('offline'));
    return () => ctrl.abort();
  }, [setServerStatus]);

  return (
    <div className="hud">
      <TopBar />
      {activeTab === 'shop' ? <SceneOverlay /> : (
        <section className="sheet" style={box(12, 120, 336)} aria-label={TAB_INFO[activeTab].title}>
          <h2>{TAB_INFO[activeTab].title}</h2>
          {TAB_INFO[activeTab].lines.map((l) => <p key={l}>{l}</p>)}
          <p className="soon">준비 중</p>
        </section>
      )}
      <HunterBand />
      <TabBar />
      {import.meta.env.DEV && <span className={`server ${serverStatus}`} title={`서버: ${serverStatus}`} />}
    </div>
  );
}
