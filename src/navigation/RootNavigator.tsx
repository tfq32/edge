import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './types';
import { ScanScreen } from '../screens/ScanScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { WifiGuide } from '../screens/WifiGuide';
import { ErrorScreen } from '../screens/ErrorScreen';
import { DesktopScreen } from '../screens/DesktopScreen';
import { WebviewScreen } from '../screens/WebviewScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Scan"
        screenOptions={{
          headerShown: false,         // 全部自定义 header
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#070b14' },
        }}
      >
        <Stack.Screen name="Scan" component={ScanScreen} />
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen
          name="WifiGuide"
          component={WifiGuide}
          options={{ animation: 'slide_from_bottom' }}  // 从底部弹出，像抽屉
        />
        <Stack.Screen
          name="Error"
          component={ErrorScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="Desktop"
          component={DesktopScreen}
          options={{
            // animation: 'fade',
            gestureEnabled: false,  // 桌面页禁止右滑返回
          }}
        />
        <Stack.Screen
          name="Webview"
          component={WebviewScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
