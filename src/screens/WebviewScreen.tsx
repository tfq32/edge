import React, { useRef, useState, useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import type { WebviewScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { DraggableButton } from '../components/DraggableButton';
import { useFocusEffect } from '@react-navigation/native';

export function WebviewScreen({ navigation, route }: WebviewScreenProps) {
  const { url } = route.params;
  const webviewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

    // Android 物理返回键（RN 0.83+ 用 subscription.remove()）
  useFocusEffect(
    React.useCallback(() => {
      const handler = () => {
        if (canGoBack) { webviewRef.current?.goBack(); return true; }
        navigation.goBack(); return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', handler);
      return () => subscription.remove();
    }, [canGoBack, navigation])
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeView}>
        <WebView
          ref={webviewRef}
          source={{ uri: url }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          onNavigationStateChange={nav => setCanGoBack(nav.canGoBack)}
        />
        {/* 悬浮拖拽返回按钮 */}
        <DraggableButton onPress={() => {          
          navigation.goBack();
        }} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeView: { flex: 1 },
});
