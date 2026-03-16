import { create } from 'zustand';
import type { AppItem, ConnectionRecord, QrCodeData } from '../types';

interface AppState {
  apps: AppItem[];
  qrData: QrCodeData | null;
  record: ConnectionRecord | null;

  setApps: (apps: AppItem[]) => void;
  setQrData: (qrData: QrCodeData) => void;
  setRecord: (record: ConnectionRecord | null) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>(set => ({
  apps: [],
  record: null,
  qrData: null,

  setApps: apps => set({ apps }),
  setQrData: qrData => set({ qrData }),
  setRecord: record => set({ record }),

  // 重置到初始状态（重新扫码时调用）
  reset: () => set({ apps: [], qrData: null, record: null }),
}));
