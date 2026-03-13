import type { WifiSecurity } from '../types';

function unescapeWifiValue(value: string): string {
  return value.replace(/\\([;,:\\"])/g, '$1');
}

export function parseWifiQr(raw: string) {
  const text = raw.trim();
  if (!text.startsWith('WIFI:')) {
    throw new Error('二维码不是有效的 WiFi 格式');
  }

  const body = text.slice(5);
  const result: Record<string, string> = {};
  let current = '';
  let escaped = false;
  const parts: string[] = [];

  for (const char of body) {
    if (escaped) { current += char; escaped = false; continue; }
    if (char === '\\') { current += char; escaped = true; continue; }
    if (char === ';') { parts.push(current); current = ''; continue; }
    current += char;
  }
  if (current) parts.push(current);

  for (const part of parts) {
    const idx = part.indexOf(':');
    if (idx > 0) result[part.slice(0, idx)] = unescapeWifiValue(part.slice(idx + 1));
  }

  if (!result.S) throw new Error('二维码缺少 SSID 信息');

  const rawSec = (result.T || 'WPA').toUpperCase();
  const security: WifiSecurity =
    rawSec === 'WEP' ? 'WEP' : rawSec === 'NOPASS' ? 'nopass' : 'WPA';

  return {
    ssid: result.S,
    password: result.P || '',
    security,
    hidden: result.H === 'true',
  };
}
