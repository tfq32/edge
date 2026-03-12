import type { WifiSecurity } from '../types';

function unescapeWifiValue(value: string) {
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
  const parts: string[] = [];
  let escaped = false;

  for (const char of body) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      current += char;
      escaped = true;
      continue;
    }

    if (char === ';') {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current) {
    parts.push(current);
  }

  for (const part of parts) {
    const idx = part.indexOf(':');
    if (idx > 0) {
      const key = part.slice(0, idx);
      const value = part.slice(idx + 1);
      result[key] = unescapeWifiValue(value);
    }
  }

  if (!result.S) {
    throw new Error('缺少 SSID');
  }

  const security = ((result.T || 'WPA').toUpperCase() as WifiSecurity);
  return {
    ssid: result.S,
    password: result.P || '',
    security: security === 'WEP' || security === 'NOPASS' ? (security === 'NOPASS' ? 'nopass' : 'WEP') : 'WPA',
    hidden: result.H === 'true',
  };
}

export function isWepSecurity(security?: string) {
  return (security || '').toUpperCase() === 'WEP';
}

export function isOpenSecurity(security?: string) {
  return (security || '').toLowerCase() === 'nopass';
}
