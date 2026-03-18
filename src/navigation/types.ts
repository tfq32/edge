import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Init: undefined;        // 首页（新增）
  Scan: undefined;
  Loading: undefined;
  WifiGuide: undefined;
  Error: { message: string; code?: string };
  Desktop: undefined;
  Webview: { url: string; title?: string };
};

export type InitScreenProps    = NativeStackScreenProps<RootStackParamList, 'Init'>;
export type ScanScreenProps    = NativeStackScreenProps<RootStackParamList, 'Scan'>;
export type LoadingScreenProps = NativeStackScreenProps<RootStackParamList, 'Loading'>;
export type WifiGuideScreenProps = NativeStackScreenProps<RootStackParamList, 'WifiGuide'>;
export type ErrorScreenProps   = NativeStackScreenProps<RootStackParamList, 'Error'>;
export type DesktopScreenProps = NativeStackScreenProps<RootStackParamList, 'Desktop'>;
export type WebviewScreenProps = NativeStackScreenProps<RootStackParamList, 'Webview'>;

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
