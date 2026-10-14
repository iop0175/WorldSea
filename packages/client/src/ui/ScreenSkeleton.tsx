import { GROUPS, SCREENS } from './screens';
import { useGameStore } from '../store';
import { assetUrl } from '../game/assets';

/** 화면 머리 아이콘 폴백: 그룹별 시안(images/asset/asset_copy → reference/). 전용 아이콘(ART의 icon)이 있으면 그쪽이 우선 */
const GROUP_ICON: Record<string, string> = { 샵: '01_shop', 사육: '02_aquarium_tank', 원정: '04_map', 도감: '05_book_crown', 상점: '06_shopping_basket', 기타: '12_btn_settings' };
const REF_ICON: Record<string, string> = { profile: '02_profile_avatar', aquarium_exhibit: '14_btn_trophy', index: '16_btn_star', hunter_skin: '16_btn_star' };

/** 화면별 도착 에셋(docs/assets-screens.md §0). hdr=제목 배너 336×56 · icon=제목/링크 아이콘 · pics=가로 꽉 찬 그림 · row=작은 아이콘 줄 · thumbs=섬네일 줄 */
interface Art { hdr?: string; icon?: string; pics?: string[]; row?: string[]; thumbs?: string[] }
const range = (prefix: string, names: string[]) => names.map((n) => `${prefix}${n}`);
const GRADES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const ART: Record<string, Art> = {
  popup_error: { icon: 'icon/popup_error', thumbs: ['icon/popup_error'] },
  splash: { thumbs: ['ui/logo_emblem'] },
  story_intro: { thumbs: range('story/intro_0', ['1', '2', '3', '4']) },
  market: { hdr: 'bg/hdr_market' }, market_npc: { hdr: 'bg/hdr_market' },
  auction_list: { hdr: 'bg/hdr_auction', icon: 'icon/gavel' }, auction_detail: { hdr: 'bg/hdr_auction', icon: 'icon/gavel' },
  auction_register: { hdr: 'bg/hdr_auction', icon: 'icon/gavel' }, auction_mine: { hdr: 'bg/hdr_auction', icon: 'icon/gavel' },
  guild_find: { hdr: 'bg/hdr_guild', icon: 'icon/search', row: range('guild/emblem_0', ['1', '2', '3', '4', '5', '6', '7', '8']) },
  guild_create: { hdr: 'bg/hdr_guild', icon: 'icon/plus' }, guild_home: { hdr: 'bg/hdr_guild', icon: 'icon/role_leader' },
  guild_quest: { hdr: 'bg/hdr_guild', icon: 'icon/release' },
  restoration_event: { icon: 'icon/release', pics: ['bg/restoration_event'] },
  shop_upgrade: { icon: 'icon/res_conservation' },
  farm: { hdr: 'bg/hdr_farm', icon: 'icon/tank_display' },
  tank_detail: { icon: 'icon/tank_display', pics: ['bg/tank_interior_fresh'], row: ['icon/env_temp', 'icon/env_salt', 'icon/env_quality', 'icon/equip_filter', 'icon/equip_heater', 'icon/equip_feeder'] },
  fish_detail: { icon: 'icon/info', row: ['icon/sex_male', 'icon/sex_female', 'icon/health', 'icon/growth', 'icon/inbreed', 'icon/origin_wild', 'icon/origin_farm'] },
  breeding: { icon: 'icon/tank_breed', row: ['item/breed_boost'] },
  breeding_result: { icon: 'icon/dex_new' },
  holding: { icon: 'icon/tank_hold' },
  region_map: { icon: 'icon/search', pics: ['bg/world_map'] },
  dex: { hdr: 'bg/hdr_dex', row: ['icon/region_freshwater', 'icon/region_sea', 'icon/region_ancient'] },
  species_detail: { icon: 'icon/info', row: ['icon/status_stable', 'icon/status_vulnerable', 'icon/status_protected', 'icon/status_extinct'] },
  morph_log: { icon: 'icon/dex_new' }, original_dex: { icon: 'icon/legend_seen' },
  store: { hdr: 'bg/hdr_store' },
  store_gear: { icon: 'icon/store_gear', row: GRADES.map((g) => `item/float_${g}`).concat(GRADES.map((g) => `item/bait_${g}`)) },
  store_combine: { icon: 'icon/store_combine' },
  store_gacha: { icon: 'icon/store_gacha', thumbs: ['bg/gacha_machine'] },
  store_premium: { icon: 'icon/store_premium' }, store_sub: { icon: 'icon/store_sub' },
  store_vip: { icon: 'icon/store_vip', row: ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'master', 'grandmaster', 'challenger'].map((n) => `icon/vip_${n}`) },
  store_stamina: { icon: 'icon/store_stamina' }, store_ads: { icon: 'icon/store_ads' },
  hunter_skin: { thumbs: ['bg/gacha_machine'] },
  inventory: { icon: 'item/growth', row: ['item/float_common', 'item/bait_common', 'item/growth', 'item/breed_boost', 'item/bait_legend_special'] },
  attendance: { icon: 'icon/attend_check' }, friends: { icon: 'icon/friend_add' }, mail: { icon: 'icon/mail' }, settings: { icon: 'icon/settings' },
  popup_confirm: { icon: 'icon/check' }, popup_reward: { icon: 'icon/res_vip' }, popup_levelup: { icon: 'icon/res_vip' },
};

/** screens.ts 항목을 구성 요소 블록으로 그리는 임시 화면. 실제 화면이 생기면 해당 id를 빼고 교체한다. */
export function ScreenSkeleton({ id }: { id: string }) {
  const { openScreen, backScreen, screens, activeTab, setTab } = useGameStore();
  const s = SCREENS[id];
  if (!s) return null;
  const art = ART[id] ?? {};
  const titleIcon = (art.icon && assetUrl(art.icon)) || assetUrl(`reference/${REF_ICON[id] ?? GROUP_ICON[s.group] ?? ''}`);
  const hdr = art.hdr && assetUrl(art.hdr);
  const links = id === 'index' ? Object.keys(SCREENS).filter((k) => k !== 'index') : s.to ?? [];
  const link = (k: string, arrow: boolean) => {
    const ico = ART[k]?.icon && assetUrl(ART[k].icon!);
    return (
      <button type="button" key={k} className={s.group === '샵' ? 'sk-link wood' : 'sk-link'} onClick={() => openScreen(k)}>
        {ico && <img src={ico} alt="" />}{SCREENS[k].title}{arrow && ' ›'}
      </button>
    );
  };
  return (
    <section className="sheet skeleton" aria-label={s.title}>
      <header>
        {screens.length > 0 && <button type="button" className="back" onClick={backScreen} aria-label="뒤로"><img src={assetUrl('icon/back')} alt="" /></button>}
        <div className={hdr ? 'sk-title hdr' : screens.length ? 'sk-title' : 'sk-title banner'} style={hdr ? { backgroundImage: `url(${hdr})` } : undefined}>
          {titleIcon && <img src={titleIcon} alt="" />}
          <h2>{s.title}</h2>
          {s.proposed && <span className="tag">제안</span>}
        </div>
        {screens.length > 0 && <button type="button" className="close" onClick={() => setTab(activeTab)} aria-label="닫기"><img src={assetUrl('icon/close')} alt="" /></button>}
      </header>
      {art.pics?.map((k) => <img key={k} className="sk-pic" src={assetUrl(k)} alt="" />)}
      {art.row && <div className="sk-row">{art.row.map((k) => <img key={k} src={assetUrl(k)} alt="" />)}</div>}
      {art.thumbs && <div className="sk-row thumbs">{art.thumbs.map((k) => <img key={k} src={assetUrl(k)} alt="" />)}</div>}
      {s.blocks.map((b) => <div key={b} className="sk-block">{b}</div>)}
      {s.db && <p className="sk-db">{s.db}</p>}
      {id === 'index'
        ? GROUPS.map((g) => <div key={g}><h3>{g}</h3>{links.filter((k) => SCREENS[k].group === g).map((k) => link(k, false))}</div>)
        : links.map((k) => link(k, true))}
      <p className="soon">준비 중 (스켈레톤)</p>
    </section>
  );
}
