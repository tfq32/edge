import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import type { WebviewScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { DraggableButton } from '../components/DraggableButton';

export function WebviewScreen({ navigation, route }: WebviewScreenProps) {
  const { url } = route.params;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeView}>
        <WebView
          source={{ uri: url }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
        />
        {/* 悬浮拖拽返回按钮，goBack() 回到 Desktop */}
        <DraggableButton onPress={() => navigation.goBack()} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeView: { flex: 1 },
});
