import { create } from 'zustand';
import type { BottomTab, ExpeditionsResponse, MeResponse } from '@worldsea/shared';

/**
 * React UI와 Phaser 씬이 함께 보는 상태.
 * Phaser 쪽은 useGameStore.subscribe(...)로 변화를 받는다.
 * 재화·스태미너 등 게임 값은 서버 응답(me)으로만 갱신한다 (클라이언트에서 계산해 쓰지 않음).
 */
export type ServerStatus = 'checking' | 'online' | 'offline';

/** 화면 흐름: 확인 중 → (미리보기 | 로그인 → 닉네임 → 게임) */
export type Phase = 'loading' | 'preview' | 'login' | 'signup' | 'ready' | 'error';

interface GameState {
  phase: Phase;
  me: MeResponse | null;
  expeditions: ExpeditionsResponse['expeditions'];
  claimStatus: { busy: boolean; message: string | null; error: string | null };
  errorMessage: string | null;
  activeTab: BottomTab;
  serverStatus: ServerStatus;
  setPhase: (phase: Phase, errorMessage?: string | null) => void;
  setMe: (me: MeResponse) => void;
  setTab: (tab: BottomTab) => void;
  setServerStatus: (status: ServerStatus) => void;
  setExpeditions: (expeditions: ExpeditionsResponse['expeditions']) => void;
  setClaimStatus: (status: GameState['claimStatus']) => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'loading',
  me: null,
  expeditions: [],
  claimStatus: { busy: false, message: null, error: null },
  errorMessage: null,
  activeTab: 'shop',
  serverStatus: 'checking',
  setPhase: (phase, errorMessage = null) => set({ phase, errorMessage, ...(phase === 'login' || phase === 'preview' ? { me: null, expeditions: [], claimStatus: { busy: false, message: null, error: null } } : {}) }),
  setMe: (me) => set({ me, phase: 'ready', errorMessage: null }),
  setTab: (activeTab) => set({ activeTab }),
  setServerStatus: (serverStatus) => set({ serverStatus }),
  setExpeditions: (expeditions) => set({ expeditions }),
  setClaimStatus: (claimStatus) => set({ claimStatus }),
}));
