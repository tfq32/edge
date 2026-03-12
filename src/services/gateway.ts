import type { AppItem, AppListResponse } from '../types';

function toHostCandidate(ip: string) {
  if (ip.startsWith('192.168.') || ip.startsWith('172.') || ip.startsWith('10.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      parts[3] = '1';
      return parts.join('.');
    }
  }
  return ip;
}

export async function fetchGatewayIp(currentWifiIp?: string): Promise<string> {
  if (currentWifiIp) {
    return toHostCandidate(currentWifiIp);
  }
  return '192.168.0.106';
}

export async function fetchAppList(gatewayIp: string): Promise<AppItem[]> {
  const url = `http://${gatewayIp}:80/api/app/list`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`桌面数据加载失败: ${res.status}`);
  }
  const resp = (await res.json()) as AppListResponse;
  if (resp.code !== 0) {
    throw new Error(`桌面数据加载失败: ${resp.message}`);
  }
  return Array.isArray(resp.data.list) ? resp.data.list : [];
}

export async function fetchAppListWithFallback(gatewayIp: string): Promise<AppItem[]> {
  try {
    return await fetchAppList(gatewayIp);
  } catch {
    return [
      { icon: '⚙️', name: '系统设置', type: 'system', url: `http://${gatewayIp}:8080/system` },
      { icon: '📷', name: '设备中心', type: 'system', url: `http://${gatewayIp}:8080/device` },
      { icon: '📊', name: '巡检看板', type: 'user', url: `http://${gatewayIp}:8080/dashboard` },
      { icon: '📝', name: '工单系统', type: 'user', url: `http://${gatewayIp}:8080/ticket` },
    ];
  }
}
