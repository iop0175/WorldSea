/**
 * 화면 스켈레톤 목록. 기준: docs/screens.md (확정/제안), 에셋: docs/assets-screens.md.
 * 실제 화면을 만들 때 해당 항목을 지우고 전용 컴포넌트로 바꾼다.
 * 이미 구현된 화면(로그인·닉네임·샵 허브·원정 3단계·입질)은 여기 넣지 않는다.
 */
export const GROUPS = ['공통', '시작', '샵', '사육', '원정', '도감', '상점', '기타'] as const;
export type Group = (typeof GROUPS)[number];

export interface ScreenDef {
  title: string;
  group: Group;
  /** 화면 구성 요소 (스켈레톤 블록으로 표시) */
  blocks: string[];
  /** 읽고 쓰는 DB 테이블 */
  db?: string;
  /** true면 기획 확정 전 제안 화면 */
  proposed?: boolean;
  /** 이 화면에서 들어가는 하위 화면 */
  to?: string[];
}

export const SCREENS: Record<string, ScreenDef> = {
  // ── 공통 팝업
  popup_confirm: { title: '확인/취소 팝업', group: '공통', proposed: true, blocks: ['제목', '본문', '취소 · 확인 버튼'] },
  popup_reward: { title: '보상 획득', group: '공통', proposed: true, blocks: ['보상 연출(물고기·재화·아이템)', '획득 목록', '확인 버튼'] },
  popup_error: { title: '오류/네트워크 끊김', group: '공통', proposed: true, blocks: ['오류 아이콘', '메시지', '다시 시도 버튼'] },
  popup_levelup: { title: '레벨 업', group: '공통', proposed: true, blocks: ['레벨 연출', '해금된 기능', '확인 버튼'] },
  bite_banner: { title: '입질 알림 배너', group: '공통', blocks: ['어종 실루엣 · 등급', '남은 시간(30분)', '지금 잡기 버튼'], db: 'rare_bites' },

  // ── 시작 흐름
  splash: { title: '스플래시/로딩', group: '시작', proposed: true, blocks: ['로고', '로딩 바', '팁 문구'] },
  story_intro: { title: '스토리 인트로', group: '시작', blocks: ['컷 이미지(동네 브리딩샵 물려받기)', '대사 상자', '넘기기 · 건너뛰기'] },
  tutorial: { title: '점진적 해금 튜토리얼', group: '시작', blocks: ['강조 영역(구멍 뚫린 어둠)', '안내 말풍선', '다음 단계 버튼'], db: 'players.tutorialStep' },

  // ── 샵 탭 (허브 안)
  market: { title: '시장', group: '샵', blocks: ['신규 계정 경매 제한 안내', 'NPC 판매 / 경매 전환 탭'], db: 'market_prices, auctions', to: ['market_npc', 'auction_list', 'auction_mine'] },
  market_npc: { title: '시장 · NPC 판매', group: '샵', blocks: ['어종별 시세 목록(야생 > 양식)', '판매할 개체 선택', '판매 버튼'], db: 'market_prices, fish' },
  auction_list: { title: '경매 목록', group: '샵', blocks: ['필터(어종/등급/모프/야생·양식)', '정렬(마감 임박/가격)', '경매 카드 목록'], db: 'auctions', to: ['auction_detail', 'auction_register'] },
  auction_detail: { title: '경매 상세', group: '샵', blocks: ['개체 외형(큰 그림)', '모프 · 건강 · 야생/양식', '현재가 · 남은 시간', '입찰 / 즉시 구매 버튼', '입찰 기록'], db: 'auctions, auction_bids, fish' },
  auction_register: { title: '경매 등록', group: '샵', blocks: ['개체 선택(경매 불가 표시)', '시작가 · 즉시 구매가 · 기간', '수수료 안내', '등록 버튼'], db: 'auctions' },
  auction_mine: { title: '내 경매', group: '샵', blocks: ['판매 중 / 입찰 중 / 낙찰 / 유찰 탭', '경매 카드 목록'], db: 'auctions, auction_bids' },
  guild_find: { title: '길드 찾기', group: '샵', blocks: ['검색창', '추천 길드 목록', '길드 만들기 버튼'], db: 'guilds', to: ['guild_create', 'guild_home'] },
  guild_create: { title: '길드 만들기', group: '샵', blocks: ['이름 · 소개 입력', '비용/조건 안내', '만들기 버튼'], db: 'guilds' },
  guild_home: { title: '길드 홈', group: '샵', blocks: ['이름 · 소개', '멤버 목록(길드장/부길드장/멤버)', '탈퇴 · 추방 버튼'], db: 'guild_members', to: ['guild_quest', 'restoration_event'] },
  guild_quest: { title: '길드 퀘스트', group: '샵', blocks: ['위험종 복원 목표(어종 · 방류 수)', '진행률 바', '내 기여도', '보상'], db: 'guild_quests, guild_quest_contributions' },
  restoration_event: { title: '서버 협동 복원 이벤트', group: '샵', blocks: ['이벤트 배너', '전체 진행률', '내 기여', '보상'], db: 'restoration_events, restoration_contributions' },
  shop_upgrade: { title: '샵 단계 업그레이드', group: '샵', proposed: true, blocks: ['현재 → 다음 단계 미리보기', '조건 목록(수치 미정)', '업그레이드 버튼'], db: 'players.shopStage' },
  aquarium_exhibit: { title: '수족관 전시', group: '샵', blocks: ['전시 배치/꾸미기', '다른 플레이어 수족관 방문', '평가 점수 · 평가하기'], db: 'aquarium_ratings' },

  // ── 사육 탭
  farm: { title: '수조 목록', group: '사육', blocks: ['수조 카드(용도 · 개체 수 · 환경 경고)', '수조 추가/확장 버튼'], db: 'tanks', to: ['tank_detail', 'holding', 'breeding'] },
  tank_detail: { title: '수조 상세', group: '사육', blocks: ['수온 · 염도 · 수질 게이지(적정 범위)', '여과기 · 히터 · 급여기 레벨/업그레이드', '안에 있는 개체 목록'], db: 'tanks, species', to: ['fish_detail'] },
  fish_detail: { title: '개체 상세', group: '사육', blocks: ['물고기 큰 그림(레이어 합성)', '어종 · 성별 · 야생/양식 · 크기 · 건강 · 성장도 · 근친도', '모프 · 유전자형 · 부모', '수조 이동 · 진열 · 교배 · 판매 · 방류 · 성장 아이템'], db: 'fish', to: ['breeding', 'auction_register'] },
  breeding: { title: '교배', group: '사육', blocks: ['부모 선택(같은 어종 성체 수컷·암컷)', '예상 모프 확률', '진행 타이머 · 촉진 아이템', '교배 불가 어종 표시'], db: 'breedings, fish', to: ['breeding_result'] },
  breeding_result: { title: '부화 결과', group: '사육', blocks: ['새끼 개체', '세계 최초 모프 발견 연출', '명명 입력'], db: 'morph_discoveries' },
  holding: { title: '보관함', group: '사육', blocks: ['수조 밖 보관 개체 목록'], db: 'fish(status=holding)' },

  // ── 원정 탭 (기존 화면 외)
  region_map: { title: '세계 지도 · 지역 정보', group: '원정', blocks: ['세계 지도(4단계, 레벨 잠금)', '시간 티켓 · 일일 입장 제한', '지역 정보(수색 시간 · 스태미너)', '출현 어종 + 보전 상태'], db: 'regions, species, wild_populations' },
  hunter_skin: { title: '헌터 외형', group: '원정', blocks: ['보유 외형 목록', '헌터별 외형 변경', '뽑기(상점) 이동 버튼'], db: 'player_hunter_skins, hunters.skinId', to: ['store_gacha'] },

  // ── 도감 탭
  dex: { title: '도감', group: '도감', blocks: ['단계/지역 탭', '어종 격자 120종(발견/미발견 · 희귀도 색)', '전설 목격 기록'], db: 'species, dex_entries', to: ['species_detail', 'original_dex'] },
  species_detail: { title: '어종 상세', group: '도감', blocks: ['큰 그림 · 이름 · 학명', '희귀도 · 서식 지역', '보전 상태 · 야생 개체수 비율', '발견한 모프 · 교배 가능 여부'], db: 'species, wild_populations, dex_entries', to: ['morph_log'] },
  morph_log: { title: '모프 발견 기록', group: '도감', blocks: ['모프 목록', '세계 최초 발견자 · 명명 이름'], db: 'morph_discoveries' },
  original_dex: { title: '오리지널 · 특별 개체', group: '도감', blocks: ['오리지널 격자(최초 포획 전 ???)', '전설 목격 기록'], db: 'species_discoveries' },

  // ── 상점 탭
  store: { title: '상점', group: '상점', blocks: ['카테고리 카드 목록'], to: ['store_gear', 'store_combine', 'store_gacha', 'store_premium', 'store_sub', 'store_vip', 'store_stamina', 'store_ads'] },
  store_gear: { title: '장비 (찌 · 미끼)', group: '상점', blocks: ['등급별 상품(rare까지)', '가격(골드) · 보유 수', '구매 버튼'], db: 'items, player_items' },
  store_combine: { title: '조합', group: '상점', blocks: ['같은 아이템 5개 → 한 등급 위 1개', '조합 미리보기', '전설 미끼 조합 불가 표시'], db: 'player_items' },
  store_gacha: { title: '헌터 외형 뽑기', group: '상점', blocks: ['뽑기 연출 영역', '뽑기 버튼', '등급별 확률표 링크'], db: 'hunter_skins', to: ['prob_disclosure'] },
  store_premium: { title: '프리미엄 재화 구매', group: '상점', blocks: ['상품 카드 목록', '결제 수단 안내(모바일 인앱 / 웹 Stripe)'], db: 'purchases' },
  store_sub: { title: '월 구독', group: '상점', blocks: ['혜택(광고 제거 · VIP 포인트 · 슬롯 +1 · 반복 200회)', '구독 버튼'], db: 'subscriptions' },
  store_vip: { title: 'VIP 티어', group: '상점', blocks: ['현재 등급(아이언~챌린저)', '포인트 · 다음 등급까지', '등급별 혜택 표'], db: 'players.vipPoints, vipTier' },
  store_stamina: { title: '스태미너 · 시간 티켓 구매', group: '상점', blocks: ['프리미엄 구매 상품', '일일 남은 횟수'], db: 'daily_counters' },
  store_ads: { title: '광고 보상', group: '상점', blocks: ['골드 / 프리미엄 / 스태미너 / 시간 티켓 카드', '일일 남은 횟수', '"광고는 모바일에서만 가능합니다" 안내(웹/PC)'], db: 'daily_counters' },

  // ── 기타
  profile: { title: '프로필', group: '기타', proposed: true, blocks: ['아바타 · 닉네임 · 레벨 · VIP 등급', '도감 달성률', '대표 물고기'] },
  inventory: { title: '가방', group: '기타', proposed: true, blocks: ['찌 · 미끼 · 성장 · 교배 촉진 아이템 격자', '등급별 정렬', '수량'], db: 'player_items' },
  attendance: { title: '출석 보상', group: '기타', blocks: ['출석 달력', '오늘 보상(VIP 포인트 · 장비)', '받기 버튼'], db: 'daily_counters' },
  friends: { title: '친구', group: '기타', blocks: ['친구 목록', '요청 보내기/받기', '친구 수족관 방문'], db: 'friendships', to: ['aquarium_exhibit'] },
  mail: { title: '우편함', group: '기타', proposed: true, blocks: ['우편 목록(길드·이벤트 보상)', '모두 받기 버튼'] },
  settings: { title: '설정', group: '기타', blocks: ['입질 미니게임 기준 등급', '미니게임 자동 진행 켜기/끄기', '높은 등급 기준 · 입질 시 자동/정지', '푸시 알림 종류별 켜기/끄기', '장면 라벨 표시'], db: 'players, push_tokens', to: ['account', 'prob_disclosure', 'terms'] },
  account: { title: '계정 · 로그아웃 · 탈퇴', group: '기타', proposed: true, blocks: ['연결된 로그인', '로그아웃 버튼', '탈퇴 버튼(확인 팝업)'] },
  prob_disclosure: { title: '확률 공개', group: '기타', blocks: ['수색 결과 확률표', '외형 뽑기 등급별 확률'] },
  terms: { title: '이용약관 · 개인정보 처리방침', group: '기타', proposed: true, blocks: ['약관 본문(스크롤)'] },
  index: { title: '전체 화면 목록', group: '기타', blocks: [] },
};

/** 탭 → 처음 보여줄 화면. 샵 탭은 허브 장면이라 없음 */
export const TAB_HOME: Record<string, string> = { farm: 'farm', dex: 'dex', store: 'store' };
