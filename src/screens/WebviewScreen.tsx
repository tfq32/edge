import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAppStore } from '../store/appStore';
import { colors } from '../theme/colors';
import { DraggableButton } from '../components/DraggableButton';

export function WebviewScreen() {
  const { currentUrl, closeWebview } = useAppStore();
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeView}>
        {currentUrl ? <WebView source={{ uri: currentUrl }} startInLoadingState /> : null}
        <DraggableButton onPress={closeWebview} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  safeView: { flex: 1 }
});
