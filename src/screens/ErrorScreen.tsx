import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';

export function ErrorScreen() {
  const { error, resetToScan } = useAppStore();

  const handleRetry = async () => {
    try {
      await WifiManager.forceWifiUsageWithOptions(false, { noInternet: false });
    } catch {
      // ignore reset failure
    }
    resetToScan();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>扫码连接</Text>
      <View style={styles.iconWrap}><Text style={styles.icon}>×</Text></View>
      <Text style={styles.title}>连接失败</Text>
      <Text style={styles.desc}>{`无法连接到边缘服务器\n请确认设备已开机并处于同一网络`}</Text>
      <View style={styles.errorPill}>
        <Text style={styles.errorText}>Error: {error || 'EDGE_SERVER_TIMEOUT (10s)'}</Text>
      </View>
      <Pressable style={styles.button} onPress={handleRetry}>
        <Text style={styles.buttonText}>↻ 重新扫码</Text>
      </Pressable>
      <View style={styles.linksRow}>
        <Text style={styles.link}>手动输入地址</Text>
        <Text style={styles.link}>查看帮助</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 56, alignItems: 'center' },
  header: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 80 },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#B9384A',
    backgroundColor: 'rgba(185,56,74,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  icon: { color: '#111', fontSize: 54, lineHeight: 54 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700', marginBottom: 18 },
  desc: { color: colors.subText, fontSize: 16, textAlign: 'center', lineHeight: 26 },
  errorPill: { marginTop: 24, borderRadius: 12, backgroundColor: 'rgba(133,27,40,0.30)', paddingHorizontal: 16, paddingVertical: 10 },
  errorText: { color: '#FF5D6E', fontSize: 14, fontWeight: '600' },
  button: {
    marginTop: 26,
    minWidth: 210,
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 18,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  linksRow: { flexDirection: 'row', gap: 28, marginTop: 26 },
  link: { color: '#7E82FF', fontSize: 15 },
});
