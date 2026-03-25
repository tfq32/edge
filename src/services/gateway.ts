import axios from 'axios';
import type { AppItem, AppListResponse } from '../types';

/** 请求微服务列表 */
export async function fetchAppList(gatewayIp: string, gatewayPort: number): Promise<AppItem[]> {
  const url = `http://${gatewayIp}:${gatewayPort}/api/v1/app/list`;
  const res = await axios.get(url, { timeout: 5000 });
  if (res.status !== 200) throw new Error('接口状态返回错误:' + res.status);
  const resp = res.data as AppListResponse;
  if (resp.code !== 0) throw new Error(resp.message || '接口返回错误');
  if (!Array.isArray(resp.data?.list)) throw new Error('接口返回格式错误');
  return resp.data.list
}

/** 内网健康检查 */
export async function healthCheck(gatewayIp: string, gatewayPort: number): Promise<boolean> {
  try {
    const res = await axios.get(`http://${gatewayIp}:${gatewayPort}/api/v1/health`, { timeout: 5000 });
    if (res.status !== 200) throw new Error('接口状态返回错误:' + res.status);
    return res.data.code === 0;
  } catch {
    return false;
  }
}
