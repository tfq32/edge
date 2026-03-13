import React from 'react';
import {
  Clipboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import WifiManager from 'react-native-wifi-reborn';

import type { WifiGuideScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';
import { saveConnection } from '../services/storage';

const STEPS = [
  '点击上方「复制密码」按钮',
  '前往系统 设置 → WiFi',
  '选择目标网络，粘贴密码连接',
  '连接成功后返回本应用',
];

export function WifiScreen({ navigation, route }: WifiGuideScreenProps) {
  const { ssid, password } = route.params;   // 参数由 ScanScreen 传入
  const { setRecord } = useAppStore();

  const handleCopyPassword = () => {
    Clipboard.setString(password);
  };

  const handleContinue = async () => {
    try {
      const currentSSID = await WifiManager.getCurrentWifiSSID();
      const connected = currentSSID === ssid || currentSSID === `"${ssid}"`;
      if (!connected) {
        navigation.navigate('Error', {
          message: `尚未连接到 ${ssid}，请按步骤操作后再点继续`,
          code: 'WIFI_NOT_CONNECTED',
        });
        return;
      }
    } catch {
      // 部分机型无法获取 SSID，放行
    }

    const record = { ssid, password, security: 'WPA' as const, updatedAt: Date.now() };
    saveConnection(record);
    setRecord(record);
    // replace：用 Loading 替换 WifiGuide，用户不能从 Loading 返回到引导页
    navigation.replace('Loading');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>连接 WiFi</Text>

      <View style={styles.bgGlow} />

      <View style={styles.iconWrap}>
        <Text style={styles.wifiIcon}>📶</Text>
      </View>

      <Text style={styles.title}>需要手动连接 WiFi</Text>
      <Text style={styles.titleEn}>Manual WiFi Connection Required</Text>

      {/* SSID 卡片 */}
      <View style={styles.ssidCard}>
        <Text style={styles.ssidLabel}>目标网络 TARGET SSID</Text>
        <View style={styles.ssidRow}>
          <View>
            <Text style={styles.ssidName}>{ssid}</Text>
            <Text style={styles.ssidMeta}>WPA2 · 企业内网</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.7 }]}
            onPress={handleCopyPassword}
          >
            <Text style={styles.copyBtnText}>复制密码</Text>
          </Pressable>
        </View>
      </View>

      {/* 操作步骤 */}
      <ScrollView style={styles.stepsWrap} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepsTitle}>操作步骤</Text>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}

        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>⚠️</Text>
          <Text style={styles.noteText}>
            部分 Android 设备因系统限制无法自动切换 WiFi，需手动操作。
          </Text>
        </View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>已连接，继续</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  header: { color: colors.text, fontSize: 18, fontWeight: '600' },
  bgGlow: { position: 'absolute', top: '20%', width: 280, height: 280, borderRadius: 140, backgroundColor: colors.primarySoft },
  iconWrap: { marginTop: 44, width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  wifiIcon: { fontSize: 30 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  titleEn: { color: colors.mutedText, fontSize: 10, letterSpacing: 1, marginBottom: 24 },
  ssidCard: { width: '100%', backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder, borderRadius: 14, padding: 16, marginBottom: 20 },
  ssidLabel: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  ssidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ssidName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  ssidMeta: { color: colors.mutedText, fontSize: 11, marginTop: 2 },
  copyBtn: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: 'rgba(61,111,255,0.2)', borderRadius: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  copyBtnText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  stepsWrap: { flex: 1, width: '100%' },
  stepsTitle: { color: colors.mutedText, fontSize: 11, marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  stepNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepNumText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  stepText: { color: colors.subText, fontSize: 13, flex: 1, lineHeight: 20 },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warningBorder, borderRadius: 10, padding: 12, marginTop: 8, marginBottom: 16 },
  noteIcon: { fontSize: 14 },
  noteText: { color: colors.subText, fontSize: 12, flex: 1, lineHeight: 18 },
  button: { width: '100%', height: 50, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: '700' },
});
