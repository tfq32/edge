import type { AppItem, AppListResponse } from '../types';

/** 根据当前 WiFi IP 推算网关 IP（取 .1） */
export function inferGatewayIp(deviceIp?: string): string {
  if (deviceIp) {
    const parts = deviceIp.split('.');
    if (parts.length === 4) {
      parts[3] = '1';
      return parts.join('.');
    }
  }
  return '192.168.0.106';
}

/** 请求微服务列表 */
export async function fetchAppList(gatewayIp: string): Promise<AppItem[]> {
  const url = `http://${gatewayIp}/api/app/list`;
  const res = await fetch(url, { });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const resp = (await res.json()) as AppListResponse;
  if (resp.code !== 0) throw new Error(resp.message || '接口返回错误');
  return Array.isArray(resp.data?.list) ? resp.data.list : [];
}

/** 内网健康检查 */
export async function healthCheck(gatewayIp: string): Promise<boolean> {
  try {
    const res = await fetch(`http://${gatewayIp}/api/health-check`, {});
    return res.ok;
  } catch {
    return false;
  }
}

/** 带兜底数据的列表请求（开发/网关未就绪时使用） */
export async function fetchAppListWithFallback(gatewayIp: string): Promise<AppItem[]> {
  try {
    return await fetchAppList(gatewayIp);
  } catch {
    // 兜底：返回两个内置系统微服务（产品文档 9.1 & 9.2）
    return [
      {
        icon: '⚙️',
        name: '系统设置',
        type: 'system',
        url: `http://${gatewayIp}:8080/system`,
        status: 'running',
      },
      {
        icon: '📡',
        name: '设备管理',
        type: 'system',
        url: `http://${gatewayIp}:8080/device`,
        status: 'running',
      },
    ];
  }
}
