import React, { useEffect, useRef } from 'react';
import { Animated, BackHandler, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import WifiManager from 'react-native-wifi-reborn';
import type { ErrorScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';

const { width: SW, height: SH } = Dimensions.get('window');
const isTablet = Math.min(SW, SH) >= 768;

function getReasons(code?: string): string[] {
  if (code === 'SCAN_FAILED') return ['二维码已过期或格式不正确', '光线不足或图像模糊', '扫描的不是服务器配置码'];
  if (code === 'WIFI_NOT_CONNECTED') return ['请确认已在系统 WiFi 设置中连接目标网络', '连接后请立即返回本应用继续'];
  return ['WiFi 网络配置有误，请重新扫码', '边缘服务器未开机或不在同一内网', '设备系统限制了 WiFi 自动切换'];
}

export function ErrorScreen({ navigation, route }: ErrorScreenProps) {
  const insets = useSafeAreaInsets();
  const { message, code } = route.params;
  const { reset } = useAppStore();

  // 禁用 Android 硬件返回键
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(3000),
      Animated.timing(shakeAnim, { toValue: -4,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4,   duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4,  duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4,   duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4,  duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
      Animated.delay(2000),
    ])).start();
    return () => shakeAnim.stopAnimation();
  }, [shakeAnim]);

  const handleRetry = () => {
    reset();
    WifiManager.forceWifiUsageWithOptions(false, { noInternet: false }).catch(() => {});
    // 重建栈 [Init, Scan]，index=1 停在 Scan，用户按返回可回 Init
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'Init' }, { name: 'Scan' }],
      })
    );
  };

  const reasons = getReasons(code);

  return (
    <View style={[S.container, { paddingTop: insets.top + 8 }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={S.blobL} /><View style={S.blobR} />
      </View>

      {/* 顶栏标题 */}
      <Text style={S.header}>连接失败</Text>

      {/* 错误图标 */}
      <Animated.View style={[S.iconWrap, { transform: [{ translateX: shakeAnim }] }]}>
        <View style={S.iconCircle}>
          <Text style={S.iconX}>✕</Text>
        </View>
      </Animated.View>

      <Text style={S.title}>连接失败</Text>
      <Text style={S.subtitle}>无法访问内网服务</Text>

      {/* 可能原因卡片 */}
      <View style={S.card}>
        <Text style={S.cardTitle}>可能原因</Text>
        {reasons.map((r, i) => (
          <View key={i} style={S.reasonRow}>
            <View style={S.reasonNum}><Text style={S.reasonNumText}>{i + 1}</Text></View>
            <Text style={S.reasonText}>{r}</Text>
          </View>
        ))}
      </View>

      {/* 重新扫码按钮 */}
      <View style={S.btnWrap}>
        <Pressable
          style={({ pressed }) => [S.btn, pressed && S.btnPressed]}
          onPress={handleRetry}
          android_ripple={{ color: 'rgba(66,170,245,0.15)' }}
        >
          <Text style={S.btnText}>↺ 重新扫码</Text>
        </Pressable>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    paddingHorizontal: isTablet ? 80 : 16,
    paddingBottom: 24,
  },
  blobL: { position: 'absolute', bottom: '-18%', left: '-18%', width: SH * 0.52, height: SH * 0.52, borderRadius: SH * 0.26, backgroundColor: 'rgba(66,170,245,0.12)' },
  blobR: { position: 'absolute', bottom: '-22%', right: '-22%', width: SH * 0.46, height: SH * 0.46, borderRadius: SH * 0.23, backgroundColor: 'rgba(66,170,245,0.16)' },

  // 顶栏
  header: { fontSize: isTablet ? 18 : 16, fontWeight: '700', color: colors.text, marginBottom: 20, zIndex: 10 },

  // 错误图标
  iconWrap: { marginBottom: 14, zIndex: 1 },
  iconCircle: {
    width: isTablet ? 96 : 80,
    height: isTablet ? 96 : 80,
    borderRadius: isTablet ? 48 : 40,
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconX: { color: colors.danger, fontSize: isTablet ? 38 : 32, fontWeight: '800' },

  title: { color: colors.text, fontSize: isTablet ? 26 : 20, fontWeight: '800', marginBottom: 4, textAlign: 'center', zIndex: 1 },
  subtitle: { color: colors.subText, fontSize: isTablet ? 15 : 13, textAlign: 'center', marginBottom: 16, zIndex: 1 },

  // 可能原因卡片
  card: {
    width: '100%',
    backgroundColor: colors.bgWhite,
    borderRadius: 16,
    padding: 18,
    zIndex: 1,
    elevation: 3,
    shadowColor: 'rgba(239,68,68,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
  },
  cardTitle: { color: colors.danger, fontSize: isTablet ? 13 : 11, fontWeight: '600', marginBottom: 10 },
  reasonRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  reasonNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  reasonNumText: { color: colors.danger, fontSize: 10, fontWeight: '700' },
  reasonText: { color: colors.subText, fontSize: isTablet ? 14 : 13, flex: 1, lineHeight: 20 },

  // 按钮
  btnWrap: { width: '100%', marginTop: 'auto', zIndex: 1 },
  btn: {
    width: '100%',
    height: isTablet ? 58 : 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: 'rgba(66,170,245,0.30)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  btnPressed: { opacity: 0.88 },
  btnText: { color: '#ffffff', fontSize: isTablet ? 18 : 16, fontWeight: '700' },
});
