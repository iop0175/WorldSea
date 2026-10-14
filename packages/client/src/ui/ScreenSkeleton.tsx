import { GROUPS, SCREENS } from './screens';
import { useGameStore } from '../store';
import { assetUrl } from '../game/assets';

/** images/asset/asset_copy 시안(reference/)을 화면 머리 아이콘으로. 전용 아이콘(icon/*)이 생기면 교체 */
const GROUP_ICON: Record<string, string> = { 샵: '01_shop', 사육: '02_aquarium_tank', 원정: '04_map', 도감: '05_book_crown', 상점: '06_shopping_basket', 기타: '12_btn_settings' };
const ID_ICON: Record<string, string> = { settings: '12_btn_settings', mail: '13_btn_mail', profile: '02_profile_avatar', store_vip: '15_btn_crown', aquarium_exhibit: '14_btn_trophy', index: '16_btn_star' };

/** screens.ts 항목을 구성 요소 블록으로 그리는 임시 화면. 실제 화면이 생기면 해당 id를 빼고 교체한다. */
export function ScreenSkeleton({ id }: { id: string }) {
  const { openScreen, backScreen, screens, activeTab, setTab } = useGameStore();
  const s = SCREENS[id];
  if (!s) return null;
  const icon = assetUrl(`reference/${ID_ICON[id] ?? GROUP_ICON[s.group] ?? ''}`);
  const links = id === 'index' ? Object.keys(SCREENS).filter((k) => k !== 'index') : s.to ?? [];
  return (
    <section className="sheet skeleton" aria-label={s.title}>
      <header>
        {screens.length > 0 && <button type="button" className="back" onClick={backScreen} aria-label="뒤로">‹</button>}
        <div className={screens.length ? 'sk-title' : 'sk-title banner'}>
          {icon && <img src={icon} alt="" />}
          <h2>{s.title}</h2>
          {s.proposed && <span className="tag">제안</span>}
        </div>
        {screens.length > 0 && <button type="button" className="close" onClick={() => setTab(activeTab)} aria-label="닫기"><img src={assetUrl('reference/20_btn_close')} alt="" /></button>}
      </header>
      {s.blocks.map((b) => <div key={b} className="sk-block">{b}</div>)}
      {s.db && <p className="sk-db">{s.db}</p>}
      {id === 'index'
        ? GROUPS.map((g) => <div key={g}><h3>{g}</h3>{links.filter((k) => SCREENS[k].group === g).map((k) => <button type="button" key={k} className={s.group === '샵' ? 'sk-link wood' : 'sk-link'} onClick={() => openScreen(k)}>{SCREENS[k].title}</button>)}</div>)
        : links.map((k) => <button type="button" key={k} className={s.group === '샵' ? 'sk-link wood' : 'sk-link'} onClick={() => openScreen(k)}>{SCREENS[k].title} ›</button>)}
      <p className="soon">준비 중 (스켈레톤)</p>
    </section>
  );
}
