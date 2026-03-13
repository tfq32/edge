import { createMMKV } from 'react-native-mmkv';
import type { ConnectionRecord } from '../types';

const storage = createMMKV({ id: 'edge-app' });
const KEY = 'connection_record';

export function saveConnection(record: ConnectionRecord): void {
  try {
    storage.set(KEY, JSON.stringify(record));
  } catch (e) {
    console.warn('[storage] saveConnection failed', e);
  }
}

export function getConnection(): ConnectionRecord | null {
  try {
    const raw = storage.getString(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConnectionRecord;
  } catch (e) {
    console.warn('[storage] getConnection failed, clearing bad data', e);
    storage.remove(KEY);
    return null;
  }
}

export function clearConnection(): void {
  try {
    storage.remove(KEY);
  } catch (e) {
    console.warn('[storage] clearConnection failed', e);
  }
}