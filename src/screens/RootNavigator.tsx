import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './types';
import { InitScreen }    from '../screens/InitScreen';
import { ScanScreen }    from '../screens/ScanScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { WifiGuide }     from '../screens/WifiGuide';
import { ErrorScreen }   from '../screens/ErrorScreen';
import { DesktopScreen } from '../screens/DesktopScreen';
import { WebviewScreen } from '../screens/WebviewScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Init"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#f0f5ff' },
        }}
      >
        <Stack.Screen
          name="Init"
          component={InitScreen}
          options={{ animation: 'none' }}
        />
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Loading"
          component={LoadingScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="WifiGuide"
          component={WifiGuide}
          options={{ animation: 'slide_from_bottom' }}
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
            animation: 'fade',
            gestureEnabled: false,
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
