import { createMMKV } from 'react-native-mmkv';
import type { ConnectionRecord } from '../types';

const storage = createMMKV({ id: 'edge-app' });
const CONNECTION_KEY = 'connection-record';

export function saveConnection(record: ConnectionRecord) {
  storage.set(CONNECTION_KEY, JSON.stringify(record));
}

export function getConnection(): ConnectionRecord | null {
  const raw = storage.getString(CONNECTION_KEY);
  return raw ? (JSON.parse(raw) as ConnectionRecord) : null;
}
