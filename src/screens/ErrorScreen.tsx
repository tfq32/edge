import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';

import type { ErrorScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';

function getReasons(code?: string): string[] {
  if (code === 'SCAN_FAILED') {
    return ['二维码已过期或格式不正确', '光线不足或图像模糊', '扫描的不是服务器配置码'];
  }
  if (code === 'WIFI_NOT_CONNECTED') {
    return ['请确认已在系统 WiFi 设置中连接目标网络', '连接后请立即返回本应用继续'];
  }
  return [
    'WiFi 网络配置有误，请重新扫码',
    '边缘服务器未开机或不在同一内网',
    '设备系统限制了 WiFi 自动切换',
  ];
}

export function ErrorScreen({ navigation, route }: ErrorScreenProps) {
  const { message, code } = route.params;
  const { reset } = useAppStore();

  const handleRetry = async () => {
    try {
      await WifiManager.forceWifiUsageWithOptions(false, { noInternet: false });
    } catch { /* ignore */ }
    reset();
    // replace 到 Scan，清空错误页历史
    navigation.replace('Scan');
  };

  const isScanFail = code === 'SCAN_FAILED';
  const reasons = getReasons(code);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>扫码连接</Text>

      <View style={styles.bgGlow} />

      <View style={styles.iconWrap}>
        <Text style={styles.iconX}>✕</Text>
      </View>

      <Text style={styles.title}>{isScanFail ? '扫码识别失败' : '连接失败'}</Text>
      <Text style={styles.titleEn}>{isScanFail ? 'QR Code Recognition Failed' : 'Connection Failed'}</Text>

      <View style={styles.errorCard}>
        <Text style={styles.errorCode}>ERROR · {code ?? 'E-001'}</Text>
        <Text style={styles.errorMsg}>{message}</Text>
      </View>

      <View style={styles.reasonsWrap}>
        <Text style={styles.reasonsTitle}>可能的原因</Text>
        {reasons.map((r, i) => (
          <View key={i} style={styles.reasonRow}>
            <Text style={styles.reasonDot}>·</Text>
            <Text style={styles.reasonText}>{r}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
        onPress={handleRetry}
      >
        <Text style={styles.buttonText}>重新扫码</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  header: { color: colors.text, fontSize: 18, fontWeight: '600' },
  bgGlow: { position: 'absolute', top: '28%', width: 260, height: 260, borderRadius: 130, backgroundColor: colors.dangerSoft },
  iconWrap: { marginTop: 52, width: 80, height: 80, borderRadius: 40, backgroundColor: colors.dangerSoft, borderWidth: 1.5, borderColor: colors.dangerBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconX: { color: colors.danger, fontSize: 32, fontWeight: '700', lineHeight: 36 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  titleEn: { color: colors.mutedText, fontSize: 10, letterSpacing: 1, marginBottom: 24 },
  errorCard: { width: '100%', backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.dangerBorder, borderRadius: 12, padding: 16, marginBottom: 16 },
  errorCode: { color: colors.danger, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  errorMsg: { color: colors.subText, fontSize: 13, lineHeight: 20 },
  reasonsWrap: { width: '100%', marginBottom: 32 },
  reasonsTitle: { color: colors.mutedText, fontSize: 11, marginBottom: 10 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  reasonDot: { color: colors.danger, fontSize: 12, marginTop: 1 },
  reasonText: { color: colors.subText, fontSize: 12, flex: 1, lineHeight: 18 },
  button: { width: '100%', height: 50, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8, marginTop: 'auto' },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
