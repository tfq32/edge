import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from './src/store/appStore';
import { ScanScreen } from './src/screens/ScanScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { ErrorScreen } from './src/screens/ErrorScreen';
import { DesktopScreen } from './src/screens/DesktopScreen';
import { WebviewScreen } from './src/screens/WebviewScreen';

const client = new QueryClient();

function Root() {
  const phase = useAppStore(state => state.phase);
  switch (phase) {
    case 'connecting':
      return <LoadingScreen text="正在连接边缘服务器..." />;
    case 'connect-failed':
      return <ErrorScreen />;
    case 'desktop':
      return <DesktopScreen />;
    case 'webview':
      return <WebviewScreen />;
    case 'scan':
    default:
      return <ScanScreen />;
  }
}

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Root />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
