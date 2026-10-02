import { useEffect } from 'react';
import { BOTTOM_TABS, BOTTOM_TAB_LABEL_KO, type BottomTab } from '@worldsea/shared';
import { fetchHealth } from '../api';
import { useGameStore } from '../store';

/** 탭별 안내 (뼈대 단계 자리 표시) */
const TAB_INFO: Record<Exclude<BottomTab, 'shop'>, { title: string; lines: string[] }> = {
  farm: { title: '사육', lines: ['수조 환경(수온·염도·수질)과 자동화 설비', '교배와 성장 관리'] },
  expedition: { title: '원정', lines: ['헌터를 보내 수색 (1회 / 반복 최대 100회)', '희귀어 입질 미니게임'] },
  dex: { title: '도감', lines: ['어종 122종과 모프 기록', '보전 상태(안정·취약·보호종·야생 멸종)'] },
  store: { title: '상점', lines: ['찌·미끼(3등급까지), 헌터 외형', '구독과 VIP'] },
};

export function App() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setTab = useGameStore((s) => s.setTab);
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
      <header className="topbar">
        <span className="res" title="골드">● 0</span>
        <span className="res premium" title="프리미엄 재화">◆ 0</span>
        <span className="res stamina" title="스태미너">⚡ 0/0</span>
        <span className={`server ${serverStatus}`} title={`서버: ${serverStatus}`} />
      </header>

      {activeTab !== 'shop' && (
        <section className="sheet" aria-label={TAB_INFO[activeTab].title}>
          <h2>{TAB_INFO[activeTab].title}</h2>
          {TAB_INFO[activeTab].lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
          <p className="soon">준비 중</p>
        </section>
      )}

      <nav className="tabbar">
        {BOTTOM_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? 'active' : ''}
            aria-pressed={tab === activeTab}
            onClick={() => setTab(tab)}
          >
            {BOTTOM_TAB_LABEL_KO[tab]}
          </button>
        ))}
      </nav>
    </div>
  );
}
