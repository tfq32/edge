import type { WifiSecurity } from '../types';
import WifiManager from 'react-native-wifi-reborn';
import { NativeModules } from 'react-native';
const { WifiGateway } = NativeModules;

function unescapeWifiValue(value: string): string {
  return value.replace(/\\([;,:\\"])/g, '$1');
}

export function parseQr(raw: string) {
  const text = raw.trim()
  if (text.startsWith('WIFI:')) {
    // wifi二维码
    console.log('wifi二维码：', text)
    return {
      wifi: parseWifiQr(text)
    }
  } else {
    const {wifi, server} = JSON.parse(text)
    console.log('自定义二维码：', wifi, server)
    return {
      wifi: {
        security: "WPA",
        hidden: false,
        ...wifi,
      },
      server
    }
  }
}

function parseWifiQr(raw: string) {
  const body = raw.slice(5);
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

/** 根据当前 WiFi IP 推算网关 IP（取 .1） */
async function inferGatewayIp(): Promise<string> {
  console.warn('Using fallback gateway IP inference');
  const deviceIp = await WifiManager.getIP();
  if (deviceIp) {
    const parts = deviceIp.split('.');
    if (parts.length === 4) {
      parts[3] = '1';
      return parts.join('.');
    }
  }
  return '';
}

export async function getGatewayIpAddress(): Promise<string> {
  try {
    return await WifiGateway.getGatewayIpAddress();
  } catch (error) {
    console.error('Error fetching gateway IP:', error);
    return inferGatewayIp()
  }
}
