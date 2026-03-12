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

export type AppPhase =
  | 'scan'
  | 'connecting'
  | 'connect-failed'
  | 'desktop'
  | 'webview';
