import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { BOTTOM_TABS, BOTTOM_TAB_LABEL_KO, type BottomTab } from '@worldsea/shared';
import { ApiRequestError, createPlayer, fetchHealth } from '../api';
import { signInWithEmail, signInWithProvider, signOut } from '../auth/supabase';
import { collectResults, refreshMe } from '../session';
import { toView, type MainView } from './viewModel';
import { shopStageNow, useGameStore } from '../store';
import { LAYOUT, STAGE1_SPOTS } from '../game/layout';
import { ICONS, PixelIcon, type PixelArt } from './PixelIcon';
import { assetUrl, hasAsset, SLICES } from '../game/assets';
import { MOCK_BADGES } from './mock';
import { ExpeditionPanel } from './ExpeditionPanel';
import { ScreenSkeleton } from './ScreenSkeleton';
import { TAB_HOME } from './screens';

/** 게임 좌표(360x640 기준 px)를 화면 CSS 길이로 */
const g = (n: number) => `calc(var(--px) * ${n})`;
const box = (x: number, y: number, w?: number, h?: number): CSSProperties => ({
  left: g(x), top: g(y), ...(w !== undefined ? { width: g(w) } : {}), ...(h !== undefined ? { height: g(h) } : {}),
});

/** 에셋(icon/...)이 있으면 이미지, 없으면 임시 도트 아이콘 */
function Icon({ k, fb, size }: { k: string; fb: PixelArt; size: string }) {
  const reference: Record<string, string> = {"avatar_default":"02_profile_avatar","res_premium":"premium","res_gold":"gold","res_stamina":"stamina","res_ticket":"ticket","menu":"menu","tab_shop":"01_shop","tab_farm":"02_aquarium_tank","tab_expedition":"04_map","tab_dex":"05_book_crown","tab_store":"06_shopping_basket","lock":"lock"};
  const url = assetUrl(reference[k.replace("icon/", "")] ? `reference/${reference[k.replace("icon/", "")]}` : k);
  if (url) return <img src={url} alt="" style={{ width: size, height: size, imageRendering: 'pixelated', flex: 'none' }} />;
  return <PixelIcon art={fb} size={size} />;
}

/** 카드 배경 이미지 (있을 때만) */
const bgImage = (key: string): CSSProperties | undefined => {
  const reference: Record<string, string> = { "ui/card_complete_bg": "09_card_gold_map", "ui/card_locked_bg": "10_card_blue_dragon", "ui/card_locked_red_bg": "11_card_dark_dragon" };
  const url = assetUrl(reference[key] ? `reference/${reference[key]}` : key);
  return url ? { backgroundImage: `url(${url})`, backgroundSize: '100% 100%', imageRendering: 'pixelated' } : undefined;
};

function Badge({ value }: { value?: string }) {
  if (!value) return null;
  return <span className="badge">{value}</span>;
}

function TopBar({ v: P, onMenu, onInfo }: { v: MainView; onMenu: () => void; onInfo: (title: string, detail: string) => void }) {
  return (
    <header className="topbar" style={box(0, LAYOUT.topBar.y, 360, LAYOUT.topBar.h)}>
      <button type="button" className="panel profile" onClick={() => useGameStore.getState().openScreen('profile')} aria-label={`프로필, ${P.nickname}, 레벨 ${P.level}`}>
        <span className="avatar"><Icon k="icon/avatar_default" fb={ICONS.face} size={g(24)} /></span>
        <span className="profile-text">
          <span className="name">{P.nickname} <b>LV.{P.level}</b></span>
          <span className="bar"><span style={{ width: `${P.expRatio * 100}%` }} /></span>
        </span>
      </button>
      <button type="button" className="panel res premium" onClick={() => useGameStore.getState().openScreen('store_premium')} aria-label={`프리미엄 ${P.premium}, 충전`}>
        <Icon k="icon/res_premium" fb={ICONS.gem} size={g(12)} /><span className="num">{P.premium}</span><span className="plus">+</span>
      </button>
      <button type="button" className="panel res gold" onClick={() => onInfo('골드', `보유 ${P.gold.toLocaleString()}개 · 충전 기능은 준비 중입니다.`)} aria-label={`골드 ${P.gold.toLocaleString()}, 충전`}>
        <Icon k="icon/res_gold" fb={ICONS.coin} size={g(12)} /><span className="num">{P.gold.toLocaleString()}</span><span className="plus">+</span>
      </button>
      <button type="button" className="panel res stamina" onClick={() => onInfo('스태미너', `${P.stamina}/${P.staminaMax} · ${P.staminaNext ? `다음 회복까지 ${P.staminaNext}` : "최대 스태미너입니다."}`)} aria-label={`스태미너 ${P.stamina}/${P.staminaMax}`}>
        <Icon k="icon/res_stamina" fb={ICONS.bolt} size={g(12)} />
        <span className="stack"><span className="num">{P.stamina}/{P.staminaMax}</span><span className="sub">{P.staminaNext ? `+1 ${P.staminaNext}` : 'MAX'}</span></span>
      </button>
      <button type="button" className="panel res ticket" onClick={() => onInfo('시간 티켓', `보유 ${P.timeTickets}장 · 고대 지역 입장에 사용합니다.`)} aria-label={`시간 티켓 ${P.timeTickets}장`}>
        <Icon k="icon/res_ticket" fb={ICONS.hourglass} size={g(12)} /><span className="num">{P.timeTickets}</span>
      </button>
      <button type="button" className="panel menu" aria-label={`메뉴, 새 소식 ${P.unread}개`} onClick={onMenu}>
        <Icon k="icon/menu" fb={ICONS.menu} size={g(14)} />
        <Badge value={P.unread ? String(P.unread) : undefined} />
      </button>
    </header>
  );
}

function SceneOverlay({ v: P, onInfo }: { v: MainView; onInfo: (title: string, detail: string) => void }) {
  // 2~4단계 장면은 객체 배치(간판·라벨·터치 영역)가 아직 없어 1단계 전용 오버레이는 숨긴다
  const stage1 = useGameStore((st) => st.me?.player.shopStage ?? shopStageNow()) === 1;
  return (
    <div className="scene-ui">
      {/* 간판 글자 + 샵 단계 */}
      {stage1 && <div className="sign" style={box(120, 46, 120, 26)}>WORLDSEA</div>}
      <button type="button" className="stage-bar" onClick={() => useGameStore.getState().openScreen('shop_upgrade')} style={box(105, 78, 150, 14)} aria-label={`${P.shopStageName}, 다음 단계까지 ${Math.round(P.shopStageProgress * 100)}%`}>
        <span className="gem" /><span>{P.shopStageName}</span>
        <span className="bar"><span style={{ width: `${P.shopStageProgress * 100}%` }} /></span>
        <span className="pct">{Math.round(P.shopStageProgress * 100)}%</span><span className="gem" />
      </button>

      {/* 장면 터치 영역과 라벨 */}
      {stage1 && Object.entries(STAGE1_SPOTS).map(([key, s]) => {
        const isDoor = key === 'market' || key === 'guild';
        return (
          <button key={key} type="button" onClick={() => isDoor ? useGameStore.getState().openScreen(key === 'market' ? 'market' : 'guild_find') : useGameStore.getState().setTab(key === "counter" ? "store" : "farm")} className={'labelTop' in s ? 'spot label-top' : 'spot'} style={box(s.x, s.y, s.w, s.h)} aria-label={s.label}>
            <span className={isDoor ? 'plate' : 'label'}>{s.label}</span>
          </button>
        );
      })}

      {/* 양옆 패널 */}
      <nav className="side left" style={box(0, 90, 40)} aria-label="빠른 메뉴 왼쪽">
        <button type="button" onClick={() => useGameStore.getState().openScreen('attendance')} aria-label="출석"><Icon k="icon/side_attend" fb={ICONS.attend} size={g(22)} /><span>출석</span><Badge value={MOCK_BADGES.attend} /></button>
        <button type="button" onClick={() => useGameStore.getState().openScreen('restoration_event')} aria-label="복원 이벤트"><Icon k="icon/side_restore" fb={ICONS.restore} size={g(22)} /><span>복원</span></button>
      </nav>
      <nav className="side right" style={box(320, 90, 40)} aria-label="빠른 메뉴 오른쪽">
        <button type="button" onClick={() => useGameStore.getState().openScreen('inventory')} aria-label="가방"><Icon k="icon/side_bag" fb={ICONS.bag} size={g(22)} /><span>가방</span></button>
        <button type="button" onClick={() => useGameStore.getState().openScreen('friends')} aria-label="친구"><Icon k="icon/side_friends" fb={ICONS.friends} size={g(22)} /><span>친구</span></button>
      </nav>
    </div>
  );
}

function HunterBand({ v, onOpen, onInfo }: { v: MainView; onOpen: (screen: "setup" | "progress" | "results") => void; onInfo: (title: string, detail: string) => void }) {
  const claimStatus = useGameStore((s) => s.claimStatus);
  const claimable = useGameStore((s) => s.expeditions.some((e) => e.claimable));
  const MOCK_HUNTERS = v.hunters;
  const hunting = MOCK_HUNTERS.filter((h) => h.kind === 'hunting').length;
  const done = MOCK_HUNTERS.filter((h) => h.kind === 'complete').length;
  return (
    <section className="hunter" style={box(0, LAYOUT.hunter.y, 360, LAYOUT.hunter.h)} aria-label="헌터 현황">
      <div className="hunter-head">
        <span className="title">헌터</span>
        <span className="sub">{hunting}명 수색중 · {done}명 완료</span>
        <button type="button" className="claim" disabled={!claimable || claimStatus.busy} onClick={() => { onOpen('results'); void collectResults(); }}>{claimStatus.busy ? '수령 중…' : '모두 수령'}</button>
      </div>
      <div className="cards">
        {MOCK_HUNTERS.map((h, i) => {
          if (h.kind === 'hunting')
            return (
              <button key={i} type="button" className="card hunting" onClick={() => onOpen('progress')} style={bgImage(`ui/region/${h.regionId}`)} aria-label={`헌터 ${i + 1}, ${h.region}, ${h.done}/${h.total}, ${h.remain} 남음`}>
                <span className="region">{h.region}</span>
                <span className="meta"><span>{h.done}/{h.total}</span><span>{h.remain}</span></span>
                <span className="bar"><span style={{ width: `${(h.done / h.total) * 100}%` }} /></span>
              </button>
            );
          if (h.kind === 'idle')
            return (
              <button key={i} type="button" className="card idle" onClick={() => onOpen('setup')} aria-label={`${h.name}, 대기 중, 원정 보내기`}>
                <span className="region">{h.name}</span><span className="done">대기 중</span>
              </button>
            );
          if (h.kind === 'complete')
            return (
              <button key={i} type="button" className="card complete" onClick={() => onOpen('results')} style={bgImage('ui/card_complete_bg')} aria-label={`헌터 ${i + 1}, ${h.region}, 완료, 수령 가능`}>
                <span className="region">{h.region}</span><span className="done">완료 · 수령</span>
              </button>
            );
          return (
            <button key={i} type="button" className="card locked" onClick={() => onInfo("헌터 해금", h.condition)} style={bgImage(h.condition.includes('구독') ? 'ui/card_locked_red_bg' : 'ui/card_locked_bg')} aria-label={`헌터 슬롯 ${i + 1}, ${h.condition}`}>
              <Icon k="icon/lock" fb={ICONS.lock} size={g(20)} /><span>{h.condition}</span>
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
          <span className="icon"><Icon k={`icon/tab_${tab}`} fb={ICONS[tab]} size={g(35)} /><Badge value={MOCK_BADGES[tab]} /></span>
          <span className="label">{BOTTOM_TAB_LABEL_KO[tab]}</span>
        </button>
      ))}
    </nav>
  );
}

/** 메인 게임 화면 (로그인 후, 또는 미리보기) */
function MainScreen({ preview }: { preview: boolean }) {
  const activeTab = useGameStore((s) => s.activeTab);
  const top = useGameStore((s) => s.screens.at(-1) ?? TAB_HOME[activeTab]);
  const me = useGameStore((s) => s.me);
  const [menuOpen, setMenuOpen] = useState(false);
  const [info, setInfo] = useState<{title: string; detail: string} | null>(null);
  const [expeditionScreen, setExpeditionScreen] = useState<'setup' | 'progress' | 'results'>('setup');
  const onInfo = (title: string, detail: string) => setInfo({title, detail});
  const openExpedition = (screen: 'setup' | 'progress' | 'results') => { setExpeditionScreen(screen); useGameStore.getState().setTab('expedition'); };
  useEffect(() => { setMenuOpen(false); setInfo(null); }, [activeTab]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); setInfo(null); } };
    const outside = (event: PointerEvent) => { if (event.target instanceof Element && !event.target.closest('.menu-pop, .topbar .menu')) setMenuOpen(false); };
    document.addEventListener('keydown', keydown);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', outside); };
  }, []);
  const v = toView(preview ? null : me);

  // 서버 값 주기적 갱신 (스태미너 등은 서버가 계산)
  useEffect(() => {
    if (preview) return;
    const id = setInterval(() => void refreshMe(), 60_000);
    return () => clearInterval(id);
  }, [preview]);

  return (
    <>
      <TopBar v={v} onInfo={onInfo} onMenu={() => setMenuOpen((o) => !o)} />
      {top ? <ScreenSkeleton id={top} /> : activeTab === 'shop' ? <SceneOverlay v={v} onInfo={onInfo} /> : <ExpeditionPanel preview={preview} initialScreen={expeditionScreen} />}
      {activeTab !== 'expedition' && <HunterBand v={v} onOpen={openExpedition} onInfo={onInfo} />}
      <TabBar />
      {preview && activeTab !== 'expedition' && <div className="preview-note" style={box(60, 486, 240, 12)}>미리보기 (서버 미연결 · 예시 데이터)</div>}
      {info && <div className="info-backdrop" onClick={() => setInfo(null)}><section className="info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title" onClick={(event) => event.stopPropagation()}><h2 id="info-title">{info.title}</h2><p>{info.detail}</p><button autoFocus type="button" className="gate-btn gold" onClick={() => setInfo(null)}>확인</button></section></div>}
      {menuOpen && (
        <div className="menu-pop" style={box(232, 36, 124)} role="menu">
          {([['mail', '우편함', '13_btn_mail'], ['settings', '설정', '12_btn_settings'], ['hunter_skin', '헌터 외형', '16_btn_star'], ['index', '전체 화면', '14_btn_trophy']] as const).map(([id, label, ico]) => <button key={id} type="button" role="menuitem" onClick={() => { setMenuOpen(false); useGameStore.getState().openScreen(id); }}><img src={assetUrl(`reference/${ico}`)} alt="" />{label}</button>)}
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
      {phase !== 'ready' && phase !== 'preview' && <><img className="splash" src={assetUrl('bg/splash')} alt="" /><img className="logo" src={assetUrl('ui/logo_emblem')} alt="" style={box(148, 40, 64, 64)} /></>}
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
