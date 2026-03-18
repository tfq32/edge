import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';

import type { ErrorScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';

const { width: SW, height: SH } = Dimensions.get('window');
const isTablet = Math.min(SW, SH) >= 768;
import { HexGrid } from '../components/HexGrid';

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

const ERROR_CODES: Record<string, string> = {
  SCAN_FAILED: 'E-001',
  WIFI_NOT_CONNECTED: 'E-002',
  INTRANET_UNREACHABLE: 'E-003',
  APP_LIST_FAILED: 'E-004',
};

export function ErrorScreen({ navigation, route }: ErrorScreenProps) {
  const { message, code } = route.params;
  const { reset } = useAppStore();

  // 连续摆动动画：用 Animated.loop + sin 曲线实现无缝循环
  const shakeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 5,  duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5,  duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,  duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        // 停顿 2s，再重复
        Animated.delay(2000),
      ])
    ).start();
    return () => shakeAnim.stopAnimation();
  }, [shakeAnim]);



  const handleRetry = async () => {
    try {
      await WifiManager.forceWifiUsageWithOptions(false, { noInternet: false });
    } catch { /* ignore */ }
    reset();
    navigation.replace('Scan');
  };

  const isScanFail = code === 'SCAN_FAILED';
  const reasons = getReasons(code);
  const errorCode = ERROR_CODES[code ?? ''] ?? 'E-001';

  return (
    <View style={styles.container}>
      {/* 背景红色呼吸光（叠在蓝色背景上） */}
      {/* 红色蜂窝网格 */}
      <HexGrid color="rgba(239,68,68,0.6)" duration={2800} />

      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>连接失败</Text>
        <View style={styles.faultBadge}>
          <View style={styles.faultDot} />
          <Text style={styles.faultText}>FAULT</Text>
        </View>
      </View>

      {/* Error icon */}
      <Animated.View
        style={[styles.iconWrap, { transform: [{ translateX: shakeAnim }] }]}
      >
        <View style={styles.iconInner}>
          <Text style={styles.iconX}>✕</Text>
        </View>
        {/* 虚线外圈 */}
        <View style={styles.iconRingOuter} />
      </Animated.View>

      {/* Title */}
      <Text style={styles.title}>{isScanFail ? '扫码识别失败' : '连接失败'}</Text>
      <Text style={styles.titleEn}>
        {isScanFail ? 'QR CODE RECOGNITION FAILED' : 'CONNECTION FAILED'}
      </Text>

      {/* Error card */}
      <View style={styles.errorCard}>
        <View style={styles.errorCardTopLine} />
        <Text style={styles.errorCode}>[ {errorCode} ]  {code ?? 'UNKNOWN_ERROR'}</Text>
        <Text style={styles.errorMsg}>{message}</Text>
      </View>

      {/* Reasons */}
      <View style={styles.reasonsWrap}>
        <Text style={styles.reasonsTitle}>─  POSSIBLE CAUSES  ─</Text>
        {reasons.map((r, i) => (
          <View key={i} style={styles.reasonRow}>
            <View style={styles.reasonCodeBadge}>
              <Text style={styles.reasonCodeText}>E{String(i + 1).padStart(2, '0')}</Text>
            </View>
            <Text style={styles.reasonText}>{r}</Text>
          </View>
        ))}
      </View>

      {/* Retry button */}
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={handleRetry}
        android_ripple={{ color: 'rgba(239,68,68,0.25)', borderless: false }}
      >
        <Text style={styles.buttonText}>↺  重新扫码</Text>
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
    paddingBottom: 40,
  },



  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    zIndex: 1,
  },
  header: { color: colors.text, fontSize: 18, fontWeight: '700' },
  faultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  faultDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  faultText: { color: colors.danger, fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  iconWrap: {
    marginBottom: 20,
    width: isTablet ? 120 : 88,
    height: isTablet ? 120 : 88,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconRingOuter: {
    position: 'absolute',
    width: isTablet ? 120 : 88,
    height: isTablet ? 120 : 88,
    borderRadius: isTablet ? 60 : 44,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
    borderStyle: 'dashed',
  },
  iconInner: {
    width: isTablet ? 92 : 68,
    height: isTablet ? 92 : 68,
    borderRadius: isTablet ? 46 : 34,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1.5,
    borderColor: colors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // shadow removed from iconInner — Android elevation causes glow artifact
  iconX: { color: colors.danger, fontSize: isTablet ? 38 : 28, fontWeight: '800', lineHeight: isTablet ? 44 : 32 },

  title: {
    color: colors.textBright,
    fontSize: isTablet ? 28 : 20,
    fontWeight: '900',
    marginBottom: 5,
    zIndex: 1,
    textAlign: 'center',
  },
  titleEn: {
    color: 'rgba(239,68,68,0.4)',
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 24,
    zIndex: 1,
  },

  errorCard: {
    width: '100%',
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
    zIndex: 1,
  },
  errorCardTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.danger,
    opacity: 0.6,
  },
  errorCode: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  errorMsg: { color: colors.subText, fontSize: 13, lineHeight: 20 },

  reasonsWrap: { width: '100%', marginBottom: 28, zIndex: 1 },
  reasonsTitle: {
    color: 'rgba(239,68,68,0.55)',
    fontSize: 9,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 14,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  reasonCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 3,
    flexShrink: 0,
    marginTop: 2,
  },
  reasonCodeText: { color: colors.danger, fontSize: 8, fontWeight: '700' },
  reasonText: { color: colors.subText, fontSize: 12, flex: 1, lineHeight: 18 },

  button: {
    width: '100%',
    height: isTablet ? 64 : 50,
    borderRadius: 6,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    // No elevation/overflow — these cause the black box on Android press
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: {
    color: '#ffaaaa',
    fontSize: isTablet ? 18 : 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
