import { create } from 'zustand';
import type { BottomTab } from '@worldsea/shared';

/**
 * React UI와 Phaser 씬이 함께 보는 상태.
 * Phaser 쪽은 useGameStore.subscribe(...)로 변화를 받는다.
 * 서버가 기준이므로 재화·스태미너는 서버 응답으로만 갱신한다 (클라이언트에서 계산해 쓰지 않음).
 */
export type ServerStatus = 'checking' | 'online' | 'offline';

interface GameState {
  activeTab: BottomTab;
  shopStage: 1 | 2 | 3 | 4;
  serverStatus: ServerStatus;
  setTab: (tab: BottomTab) => void;
  setServerStatus: (status: ServerStatus) => void;
}

export const useGameStore = create<GameState>((set) => ({
  activeTab: 'shop',
  shopStage: 1,
  serverStatus: 'checking',
  setTab: (activeTab) => set({ activeTab }),
  setServerStatus: (serverStatus) => set({ serverStatus }),
}));
