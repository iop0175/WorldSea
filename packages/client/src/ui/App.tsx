import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { BOTTOM_TABS, BOTTOM_TAB_LABEL_KO, type BottomTab } from '@worldsea/shared';
import { ApiRequestError, createPlayer, fetchHealth } from '../api';
import { signInWithEmail, signInWithProvider, signOut } from '../auth/supabase';
import { refreshMe } from '../session';
import { toView, type MainView } from './viewModel';
import { useGameStore } from '../store';
import { LAYOUT, STAGE1_SPOTS } from '../game/layout';
import { ICONS, PixelIcon, type PixelArt } from './PixelIcon';
import { assetUrl, hasAsset, SLICES } from '../game/assets';
import { MOCK_BADGES } from './mock';
import { ExpeditionPanel } from './ExpeditionPanel';

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

/** 에셋(icon/...)이 있으면 이미지, 없으면 임시 도트 아이콘 */
function Icon({ k, fb, size }: { k: string; fb: PixelArt; size: string }) {
  const url = assetUrl(k);
  if (url) return <img src={url} alt="" style={{ width: size, height: size, imageRendering: 'pixelated', flex: 'none' }} />;
  return <PixelIcon art={fb} size={size} />;
}

/** 카드 배경 이미지 (있을 때만) */
const bgImage = (key: string): CSSProperties | undefined => {
  const url = assetUrl(key);
  return url ? { backgroundImage: `url(${url})`, backgroundSize: '100% 100%', imageRendering: 'pixelated' } : undefined;
};

function Badge({ value }: { value?: string }) {
  if (!value) return null;
  return <span className="badge">{value}</span>;
}

function TopBar({ v: P, onMenu }: { v: MainView; onMenu: () => void }) {
  return (
    <header className="topbar" style={box(0, LAYOUT.topBar.y, 360, LAYOUT.topBar.h)}>
      <button type="button" className="panel profile" aria-label={`프로필, ${P.nickname}, 레벨 ${P.level}`}>
        <span className="avatar"><Icon k="icon/avatar_default" fb={ICONS.face} size={g(24)} /></span>
        <span className="profile-text">
          <span className="name">{P.nickname} <b>LV.{P.level}</b></span>
          <span className="bar"><span style={{ width: `${P.expRatio * 100}%` }} /></span>
        </span>
      </button>
      <button type="button" className="panel res premium" aria-label={`프리미엄 ${P.premium}, 충전`}>
        <Icon k="icon/res_premium" fb={ICONS.gem} size={g(12)} /><span className="num">{P.premium}</span><span className="plus">+</span>
      </button>
      <button type="button" className="panel res gold" aria-label={`골드 ${P.gold.toLocaleString()}, 충전`}>
        <Icon k="icon/res_gold" fb={ICONS.coin} size={g(12)} /><span className="num">{P.gold.toLocaleString()}</span><span className="plus">+</span>
      </button>
      <button type="button" className="panel res stamina" aria-label={`스태미너 ${P.stamina}/${P.staminaMax}`}>
        <Icon k="icon/res_stamina" fb={ICONS.bolt} size={g(12)} />
        <span className="stack"><span className="num">{P.stamina}/{P.staminaMax}</span><span className="sub">{P.staminaNext ? `+1 ${P.staminaNext}` : 'MAX'}</span></span>
      </button>
      <button type="button" className="panel res ticket" aria-label={`시간 티켓 ${P.timeTickets}장`}>
        <Icon k="icon/res_ticket" fb={ICONS.hourglass} size={g(12)} /><span className="num">{P.timeTickets}</span>
      </button>
      <button type="button" className="panel menu" aria-label={`메뉴, 새 소식 ${P.unread}개`} onClick={onMenu}>
        <Icon k="icon/menu" fb={ICONS.menu} size={g(14)} />
        <Badge value={P.unread ? String(P.unread) : undefined} />
      </button>
    </header>
  );
}

function SceneOverlay({ v: P }: { v: MainView }) {
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
        <button type="button" aria-label="출석"><Icon k="icon/side_attend" fb={ICONS.attend} size={g(22)} /><span>출석</span><Badge value={MOCK_BADGES.attend} /></button>
        <button type="button" aria-label="복원 이벤트"><Icon k="icon/side_restore" fb={ICONS.restore} size={g(22)} /><span>복원</span></button>
      </nav>
      <nav className="side right" style={box(320, 90, 40)} aria-label="빠른 메뉴 오른쪽">
        <button type="button" aria-label="가방"><Icon k="icon/side_bag" fb={ICONS.bag} size={g(22)} /><span>가방</span></button>
        <button type="button" aria-label="친구"><Icon k="icon/side_friends" fb={ICONS.friends} size={g(22)} /><span>친구</span></button>
      </nav>
    </div>
  );
}

function HunterBand({ v }: { v: MainView }) {
  const setTab = useGameStore((s) => s.setTab);
  const MOCK_HUNTERS = v.hunters;
  const hunting = MOCK_HUNTERS.filter((h) => h.kind === 'hunting').length;
  const done = MOCK_HUNTERS.filter((h) => h.kind === 'complete').length;
  return (
    <section className="hunter" style={box(0, LAYOUT.hunter.y, 360, LAYOUT.hunter.h)} aria-label="헌터 현황">
      <div className="hunter-head">
        <span className="title">헌터</span>
        <span className="sub">{hunting}명 수색중 · {done}명 완료</span>
        <button type="button" className="claim" disabled title="수령 기능 준비 중">모두 수령</button>
      </div>
      <div className="cards">
        {MOCK_HUNTERS.map((h, i) => {
          if (h.kind === 'hunting')
            return (
              <button key={i} type="button" className="card hunting" onClick={() => setTab('expedition')} style={bgImage(`ui/region/${h.regionId}`)} aria-label={`헌터 ${i + 1}, ${h.region}, ${h.done}/${h.total}, ${h.remain} 남음`}>
                <span className="region">{h.region}</span>
                <span className="meta"><span>{h.done}/{h.total}</span><span>{h.remain}</span></span>
                <span className="bar"><span style={{ width: `${(h.done / h.total) * 100}%` }} /></span>
              </button>
            );
          if (h.kind === 'idle')
            return (
              <button key={i} type="button" className="card idle" onClick={() => setTab('expedition')} aria-label={`${h.name}, 대기 중, 원정 보내기`}>
                <span className="region">{h.name}</span><span className="done">대기 중</span>
              </button>
            );
          if (h.kind === 'complete')
            return (
              <button key={i} type="button" className="card complete" style={bgImage('ui/card_complete_bg')} aria-label={`헌터 ${i + 1}, ${h.region}, 완료, 수령 가능`}>
                <span className="region">{h.region}</span><span className="done">완료 · 수령</span>
              </button>
            );
          return (
            <button key={i} type="button" className="card locked" style={bgImage('ui/card_locked_bg')} aria-label={`헌터 슬롯 ${i + 1}, ${h.condition}`}>
              <Icon k="icon/lock" fb={ICONS.lock} size={g(14)} /><span>{h.condition}</span>
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
          <span className="icon"><Icon k={`icon/tab_${tab}`} fb={ICONS[tab]} size={g(30)} /><Badge value={MOCK_BADGES[tab]} /></span>
          <span className="label">{BOTTOM_TAB_LABEL_KO[tab]}</span>
        </button>
      ))}
    </nav>
  );
}

/** 메인 게임 화면 (로그인 후, 또는 미리보기) */
function MainScreen({ preview }: { preview: boolean }) {
  const activeTab = useGameStore((s) => s.activeTab);
  const me = useGameStore((s) => s.me);
  const [menuOpen, setMenuOpen] = useState(false);
  const v = toView(preview ? null : me);

  // 서버 값 주기적 갱신 (스태미너 등은 서버가 계산)
  useEffect(() => {
    if (preview) return;
    const id = setInterval(() => void refreshMe(), 60_000);
    return () => clearInterval(id);
  }, [preview]);

  return (
    <>
      <TopBar v={v} onMenu={() => setMenuOpen((o) => !o)} />
      {activeTab === 'shop' ? <SceneOverlay v={v} /> : activeTab === 'expedition' ? <ExpeditionPanel preview={preview} /> : (
        <section className="sheet" style={box(12, 120, 336)} aria-label={TAB_INFO[activeTab].title}>
          <h2>{TAB_INFO[activeTab].title}</h2>
          {TAB_INFO[activeTab].lines.map((l) => <p key={l}>{l}</p>)}
          <p className="soon">준비 중</p>
        </section>
      )}
      <HunterBand v={v} />
      <TabBar />
      {preview && <div className="preview-note" style={box(60, 486, 240, 12)}>미리보기 (서버 미연결 · 예시 데이터)</div>}
      {menuOpen && (
        <div className="menu-pop" style={box(232, 36, 124)} role="menu">
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); void refreshMe(); }} disabled={preview}>새로고침</button>
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); void signOut(); }} disabled={preview}>로그아웃</button>
        </div>
      )}
    </>
  );
}

/** 로그인 화면 (최소 구성) */
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const social = async (p: 'google' | 'apple') => {
    setBusy(true);
    const { error } = await signInWithProvider(p);
    if (error) { setMsg(error.message); setBusy(false); }
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signInWithEmail(email.trim());
    setBusy(false);
    setMsg(error ? error.message : '메일함에서 로그인 링크를 눌러 주세요');
  };
  return (
    <section className="gate" style={box(30, 120, 300)} aria-label="로그인">
      <h1>월드씨</h1>
      <p className="sub">세계의 바다를 모으는 브리딩샵</p>
      <button type="button" className="gate-btn" disabled={busy} onClick={() => social('google')}>Google로 시작</button>
      <button type="button" className="gate-btn" disabled={busy} onClick={() => social('apple')}>Apple로 시작</button>
      <form onSubmit={submit} className="gate-form">
        <label htmlFor="email">이메일로 시작 (개발용)</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        <button type="submit" className="gate-btn gold" disabled={busy}>로그인 링크 받기</button>
      </form>
      {msg && <p className="gate-msg" role="status">{msg}</p>}
    </section>
  );
}

/** 닉네임 정하기 (첫 로그인) */
function SignupScreen() {
  const setMe = useGameStore((s) => s.setMe);
  const [nickname, setNickname] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      setMe(await createPlayer(nickname.trim()));
    } catch (err) {
      setMsg(err instanceof ApiRequestError ? err.message : '가입에 실패했습니다');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="gate" style={box(30, 140, 300)} aria-label="닉네임 정하기">
      <h1>브리딩샵 주인 등록</h1>
      <p className="sub">손님들이 부를 이름을 정해 주세요</p>
      <form onSubmit={submit} className="gate-form">
        <label htmlFor="nick">닉네임 (2~12자, 한글·영문·숫자)</label>
        <input id="nick" required minLength={2} maxLength={12} value={nickname} onChange={(e) => setNickname(e.target.value)} />
        <button type="submit" className="gate-btn gold" disabled={busy}>시작하기</button>
      </form>
      {msg && <p className="gate-msg" role="alert">{msg}</p>}
      <button type="button" className="gate-link" onClick={() => void signOut()}>다른 계정으로 로그인</button>
    </section>
  );
}

export function App() {
  const phase = useGameStore((s) => s.phase);
  const errorMessage = useGameStore((s) => s.errorMessage);
  const serverStatus = useGameStore((s) => s.serverStatus);
  const setServerStatus = useGameStore((s) => s.setServerStatus);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchHealth(ctrl.signal)
      .then(() => setServerStatus('online'))
      .catch(() => !ctrl.signal.aborted && setServerStatus('offline'));
    return () => ctrl.abort();
  }, [setServerStatus]);

  // UI 틀 에셋(9-slice)이 있으면 skin-<이름> 클래스와 CSS 변수로 적용
  const skins = Object.keys(SLICES).filter(hasAsset);
  const skinClass = skins.map((k) => `skin-${k.split('/')[1]}`).join(' ');
  const skinVars = Object.fromEntries(skins.map((k) => [`--${k.split('/')[1]}`, `url(${assetUrl(k)})`])) as CSSProperties;

  return (
    <div className={`hud phase-${phase} ${skinClass}`} style={skinVars}>
      {(phase === 'ready' || phase === 'preview') && <MainScreen preview={phase === 'preview'} />}
      {phase === 'login' && <LoginScreen />}
      {phase === 'signup' && <SignupScreen />}
      {phase === 'loading' && <div className="gate-center">불러오는 중…</div>}
      {phase === 'error' && (
        <section className="gate" style={box(30, 200, 300)} role="alert">
          <h1>연결 오류</h1>
          <p className="sub">{errorMessage}</p>
          <button type="button" className="gate-btn gold" onClick={() => void refreshMe()}>다시 시도</button>
        </section>
      )}
      {import.meta.env.DEV && <span className={`server ${serverStatus}`} title={`서버: ${serverStatus}`} />}
    </div>
  );
}
