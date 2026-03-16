import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * 路由参数表
 * - Scan       扫码页（入口，无参数）
 * - Loading    连接中（从 Scan / WifiGuide 跳入）
 * - WifiGuide  WiFi 手动引导（降级兜底）
 * - Error      失败/重试
 * - Desktop    微服务桌面
 * - Webview    内嵌浏览器（需要传 url）
 */
export type RootStackParamList = {
  Scan: undefined;
  Loading: undefined;
  WifiGuide: undefined;
  Error: { message: string; code?: string };
  Desktop: undefined;
  Webview: { url: string; title?: string };
};

// 每个 Screen 的 Props 类型
export type ScanScreenProps    = NativeStackScreenProps<RootStackParamList, 'Scan'>;
export type LoadingScreenProps = NativeStackScreenProps<RootStackParamList, 'Loading'>;
export type WifiGuideScreenProps = NativeStackScreenProps<RootStackParamList, 'WifiGuide'>;
export type ErrorScreenProps   = NativeStackScreenProps<RootStackParamList, 'Error'>;
export type DesktopScreenProps = NativeStackScreenProps<RootStackParamList, 'Desktop'>;
export type WebviewScreenProps = NativeStackScreenProps<RootStackParamList, 'Webview'>;

// 通用 navigation hook 类型
export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
