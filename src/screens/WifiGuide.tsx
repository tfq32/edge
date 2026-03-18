import React from 'react';
import {
  Clipboard,
  Dimensions,
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
import type { ConnectionRecord } from '../types';
import { GlowBackground } from '../components/GlowBackground';

const { width: SW, height: SH } = Dimensions.get('window');
const isTablet = Math.min(SW, SH) >= 768;

const STEPS = [
  '点击上方「复制密码」按钮',
  '前往系统 设置 → WiFi',
  '选择目标网络，粘贴密码连接',
  '连接成功后返回本应用',
];

export function WifiGuide({ navigation }: WifiGuideScreenProps) {
  const { qrData, setRecord } = useAppStore();

  if (!qrData || !qrData.wifi) {
    navigation.navigate('Error', { message: '二维码数据错误', code: 'QR_DATA_ERROR' });
    return null;
  }
  const { ssid, password } = qrData.wifi;

  const handleCopyPassword = () => {
    Clipboard.setString(password || '');
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
    const record: ConnectionRecord = {
      ...qrData.wifi,
      gatewayIp: qrData.server?.ip,
      gatewayPort: qrData.server?.port,
      updatedAt: Date.now(),
    };
    saveConnection(record);
    setRecord(record);
    navigation.replace('Loading');
  };

  return (
    <View style={styles.container}>
      <GlowBackground />

      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>连接 WiFi</Text>
        <View style={styles.manualBadge}>
          <View style={styles.manualDot} />
          <Text style={styles.manualText}>MANUAL</Text>
        </View>
      </View>

      {/* WiFi icon with rings */}
      <View style={styles.wifiIconWrap}>
        <View style={[styles.wifiRing, styles.wifiRing3]} />
        <View style={[styles.wifiRing, styles.wifiRing2]} />
        <View style={[styles.wifiRing, styles.wifiRing1]} />
        <View style={styles.wifiCircle}>
          <Text style={styles.wifiEmoji}>📶</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>需要手动连接 WiFi</Text>
      <Text style={styles.titleEn}>MANUAL WIFI CONNECTION REQUIRED</Text>

      {/* SSID card */}
      <View style={styles.ssidCard}>
        <View style={styles.ssidCardTopLine} />
        <Text style={styles.ssidLabel}>─  TARGET NETWORK  ─</Text>
        <View style={styles.ssidRow}>
          <View>
            <Text style={styles.ssidName}>{ssid}</Text>
            <Text style={styles.ssidMeta}>WPA2  ·  企业内网  ·  AUTO-DETECT</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.copyBtn, pressed && styles.copyBtnPressed]}
            onPress={handleCopyPassword}
          >
            <Text style={styles.copyBtnText}>复制密码</Text>
          </Pressable>
        </View>
      </View>

      {/* Steps */}
      <ScrollView
        style={styles.stepsWrap}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.stepsContent}
      >
        <Text style={styles.stepsTitle}>─  OPERATION STEPS  ─</Text>
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

      {/* Continue button */}
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>已连接，继续  ▸</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    paddingHorizontal: isTablet ? 80 : 24,
    paddingTop: isTablet ? 72 : 56,
    paddingBottom: 32,
  },

  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    zIndex: 1,
  },
  header: { color: colors.text, fontSize: 18, fontWeight: '700' },
  manualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  manualDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.warning },
  manualText: { color: colors.warning, fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  // WiFi icon
  wifiIconWrap: {
    width: isTablet ? 120 : 90,
    height: isTablet ? 120 : 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    zIndex: 1,
    position: 'relative',
  },
  wifiRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(30,33,247,0.4)',
    // Center each ring explicitly
    alignSelf: 'center',
    top: undefined,
    left: undefined,
  },
  wifiRing1: { width: isTablet ? 82 : 62, height: isTablet ? 82 : 62, top: isTablet ? 19 : 14, left: isTablet ? 19 : 14 },
  wifiRing2: { width: isTablet ? 100 : 76, height: isTablet ? 100 : 76, top: isTablet ? 10 : 7, left: isTablet ? 10 : 7, opacity: 0.5 },
  wifiRing3: { width: isTablet ? 120 : 90, height: isTablet ? 120 : 90, top: 0, left: 0, opacity: 0.25 },
  wifiCircle: {
    width: isTablet ? 76 : 56,
    height: isTablet ? 76 : 56,
    borderRadius: isTablet ? 38 : 28,
    backgroundColor: 'rgba(30,33,247,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(30,33,247,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  wifiEmoji: { fontSize: 24 },

  title: {
    color: colors.textBright,
    fontSize: isTablet ? 28 : 20,
    fontWeight: '900',
    marginBottom: 5,
    textAlign: 'center',
    zIndex: 1,
  },
  titleEn: {
    color: colors.mutedText,
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 22,
    textAlign: 'center',
    zIndex: 1,
  },

  // SSID card
  ssidCard: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    zIndex: 1,
  },
  ssidCardTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  ssidLabel: {
    color: colors.mutedText,
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  ssidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ssidName: { color: colors.textBright, fontSize: 16, fontWeight: '700' },
  ssidMeta: { color: colors.mutedText, fontSize: 10, marginTop: 3, letterSpacing: 0.5 },
  copyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.primarySoft,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  copyBtnPressed: { opacity: 0.7 },
  copyBtnText: { color: colors.primaryLightest, fontSize: 12, fontWeight: '600' },

  // Steps
  stepsWrap: { flex: 1, width: '100%', zIndex: 1 },
  stepsContent: { paddingBottom: 8 },
  stepsTitle: {
    color: colors.mutedText,
    fontSize: 9,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { color: colors.primaryLightest, fontSize: 10, fontWeight: '700' },
  stepText: { color: colors.subText, fontSize: 13, flex: 1, lineHeight: 20 },

  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    marginBottom: 16,
  },
  noteIcon: { fontSize: 14 },
  noteText: { color: colors.subText, fontSize: 12, flex: 1, lineHeight: 18 },

  button: {
    width: '100%',
    height: isTablet ? 64 : 50,
    borderRadius: 6,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 1,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: colors.text, fontSize: isTablet ? 18 : 15, fontWeight: '700', letterSpacing: 1 },
});
