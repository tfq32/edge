import { create } from 'zustand';
import type { AppItem, ConnectionRecord } from '../types';

/**
 * Store 只负责存共享数据，页面跳转完全交给 React Navigation。
 * 不再有 phase / goToXxx 之类的方法。
 */
interface AppState {
  apps: AppItem[];
  record: ConnectionRecord | null;
  notice: string | null;

  setApps: (apps: AppItem[]) => void;
  setRecord: (record: ConnectionRecord | null) => void;
  setNotice: (notice: string | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>(set => ({
  apps: [],
  record: null,
  notice: null,

  setApps: apps => set({ apps }),
  setRecord: record => set({ record }),
  setNotice: notice => set({ notice }),

  // 重置到初始状态（重新扫码时调用）
  reset: () => set({ apps: [], record: null, notice: null }),
}));
