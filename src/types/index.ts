export type HttpResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type AppListResponse = HttpResponse<{ list: AppItem[] }>;

export type AppItem = {
  icon: string;
  name: string;
  type: 'system' | 'user';
  url: string;
  status?: 'running' | 'stopped' | 'warning';
};

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

export type ConnectionRecord = {
  ssid: string;
  password?: string;
  security?: WifiSecurity;
  hidden?: boolean;
  gatewayIp?: string;
  updatedAt: number;
};

export type ScanResult = {
  raw: string;
  parsed: {
    ssid: string;
    password: string;
    security: WifiSecurity;
    hidden: boolean;
  };
};

// 状态机：按产品文档流程图定义
// scan → connecting → (wifi-guide?) → desktop → webview
// 任意步骤失败 → connect-failed
export type AppPhase =
  | 'scan'          // ① 扫码界面（含启动检查历史配置）
  | 'connecting'    // ④ 连接中（WiFi连接 + 内网校验）
  | 'wifi-guide'   // ③ WiFi手动引导（降级兜底）
  | 'connect-failed' // ② 失败重试
  | 'desktop'       // ⑤ 微服务桌面
  | 'webview';      // 内嵌浏览器
