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

export type QrCodeData = {
  wifi: {
    ssid: string;
    password?: string;
    security?: WifiSecurity;
    hidden?: boolean;
  },
  server?: {
    ip: string;
    port: number;
  }
}

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass';

export type ConnectionRecord = {
  ssid: string;
  password?: string;
  security?: WifiSecurity;
  hidden?: boolean;
  gatewayIp?: string;
  gatewayPort?: number;
  updatedAt: number;
};
