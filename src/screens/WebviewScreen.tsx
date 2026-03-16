import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import type { WebviewScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { DraggableButton } from '../components/DraggableButton';

export function WebviewScreen({ navigation, route }: WebviewScreenProps) {
  const { url } = route.params;
  const webviewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // 拦截物理返回和手势
  useEffect(() => {
    const handler = (e: any) => {
      if (canGoBack && webviewRef.current) {
        e.preventDefault();
        // @ts-ignore
        webviewRef.current.goBack();
      }
    };
    navigation.addListener('beforeRemove', handler);
    return () => {
      navigation.removeListener('beforeRemove', handler);
    };
  }, [canGoBack, navigation]);

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
        {/* 悬浮拖拽返回按钮，goBack() 回到 Desktop */}
        <DraggableButton onPress={() => {
          // setCanGoBack(false); // 确保可以返回
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
