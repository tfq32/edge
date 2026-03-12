import { create } from 'zustand';
import type { AppItem, AppPhase, ConnectionRecord, ScanResult } from '../types';

interface AppState {
  phase: AppPhase;
  currentUrl: string | null;
  scanResult: ScanResult | null;
  apps: AppItem[];
  record: ConnectionRecord | null;
  error: string | null;
  notice: string | null;
  setPhase: (phase: AppPhase) => void;
  setApps: (apps: AppItem[]) => void;
  setRecord: (record: ConnectionRecord | null) => void;
  setScanResult: (value: ScanResult | null) => void;
  setError: (error: string | null) => void;
  setNotice: (notice: string | null) => void;
  openWebview: (url: string) => void;
  closeWebview: () => void;
  resetToScan: () => void;
}

export const useAppStore = create<AppState>(set => ({
  phase: 'scan',
  currentUrl: null,
  scanResult: null,
  apps: [],
  record: null,
  error: null,
  notice: null,
  setPhase: phase => set({ phase }),
  setApps: apps => set({ apps }),
  setRecord: record => set({ record }),
  setScanResult: scanResult => set({ scanResult }),
  setError: error => set({ error }),
  setNotice: notice => set({ notice }),
  openWebview: url => set({ currentUrl: url, phase: 'webview' }),
  closeWebview: () => set({ currentUrl: null, phase: 'desktop' }),
  resetToScan: () => set({ phase: 'scan', currentUrl: null, scanResult: null, error: null, notice: null }),
}));
