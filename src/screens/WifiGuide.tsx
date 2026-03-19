import React, { useEffect, useRef } from 'react';
import { Animated, Clipboard, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WifiManager from 'react-native-wifi-reborn';
import { CommonActions } from '@react-navigation/native';
import type { WifiGuideScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';
import { saveConnection } from '../services/storage';
import type { ConnectionRecord } from '../types';
import Svg, { Circle, Path } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const isTablet = Math.min(SW, SH) >= 768;
const STEPS = ['点击「复制密码」', '前往系统设置 → WiFi', '选择网络并粘贴密码', '返回本应用继续'];

function WifiSvgIcon({ size = 26, color = colors.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size - 6} viewBox="0 0 26 20" fill="none">
      <Circle cx={13} cy={17} r={2.2} fill={color} />
      <Path d="M7,11C9,9 11,8 13,8s6,1,6,3" stroke={colors.primaryLight} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M2,6C5.5,2.5 9,1 13,1s7.5,1.5 11,5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

export function WifiGuide({ navigation }: WifiGuideScreenProps) {
  const insets = useSafeAreaInsets();
  const { qrData, setRecord } = useAppStore();
  if (!qrData || !qrData.wifi) {
    navigation.navigate('Error', { message: '二维码数据错误', code: 'QR_DATA_ERROR' });
    return null;
  }
  const { ssid, password } = qrData.wifi;

  // 涟漪动画
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.5)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const makeRing = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, { toValue: 2.8, duration: 2400, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 2400, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    makeRing(ring1Scale, ring1Opacity, 0);
    makeRing(ring2Scale, ring2Opacity, 1200);
  }, []);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Init' }] })
      );
    }
  };

  const handleCopyPassword = () => { Clipboard.setString(password || ''); };

  const handleContinue = async () => {
    try {
      const cur = await WifiManager.getCurrentWifiSSID();
      if (cur !== ssid && cur !== `"${ssid}"`) {
        navigation.navigate('Error', { message: `尚未连接到 ${ssid}，请按步骤操作后再点继续`, code: 'WIFI_NOT_CONNECTED' });
        return;
      }
    } catch {}
    const record: ConnectionRecord = { ...qrData.wifi, gatewayIp: qrData.server?.ip, gatewayPort: qrData.server?.port, updatedAt: Date.now() };
    saveConnection(record); setRecord(record);
    navigation.replace('Loading');
  };

  return (
    <View style={[S.container, { paddingTop: insets.top + 8 }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={S.blobL} /><View style={S.blobR} />
      </View>

      {/* 顶栏 */}
      <View style={S.headerRow}>
        <Pressable style={S.backBtn} onPress={handleGoBack} hitSlop={12}>
          <Text style={S.backArrow}>‹</Text>
        </Pressable>
        <Text style={S.header}>连接 WiFi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* WiFi 涟漪图标 */}
      <View style={S.wifiWrap}>
        <Animated.View style={[S.ringAnim, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
        <Animated.View style={[S.ringAnim, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
        <View style={S.wifiCircle}>
          <WifiSvgIcon size={isTablet ? 30 : 26} />
        </View>
      </View>

      <Text style={S.title}>需要手动连接 WiFi</Text>
      <Text style={S.subtitle}>当前设备不支持自动切换</Text>

      {/* 目标网络卡片 */}
      <View style={S.ssidCard}>
        <Text style={S.ssidLabel}>目标网络</Text>
        <View style={S.ssidRow}>
          <View>
            <Text style={S.ssidName}>{ssid}</Text>
            <Text style={S.ssidMeta}>WPA2 · 5GHz</Text>
          </View>
          <Pressable style={({ pressed }) => [S.copyBtn, pressed && { opacity: 0.7 }]} onPress={handleCopyPassword}>
            <Text style={S.copyBtnText}>复制密码</Text>
          </Pressable>
        </View>
      </View>

      {/* 步骤卡片 */}
      <ScrollView style={S.stepsWrap} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={S.stepsCard}>
          {STEPS.map((step, i) => (
            <View key={i} style={[S.stepRow, i < STEPS.length - 1 && { marginBottom: 12 }]}>
              <View style={S.stepNum}><Text style={S.stepNumText}>{i + 1}</Text></View>
              <Text style={S.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <Pressable style={({ pressed }) => [S.btn, pressed && { opacity: 0.88 }]} onPress={handleContinue}>
        <Text style={S.btnText}>已连接，继续 ▸</Text>
      </Pressable>
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
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    marginBottom: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgWhite,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: 'rgba(66,170,245,0.10)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  backArrow: { fontSize: 26, color: colors.text, lineHeight: 30, marginTop: -2 },
  header: { fontSize: isTablet ? 18 : 16, fontWeight: '700', color: colors.text },

  // WiFi 涟漪
  wifiWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    zIndex: 1,
  },
  ringAnim: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(66,170,245,0.25)',
  },
  wifiCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: { color: colors.text, fontSize: isTablet ? 24 : 19, fontWeight: '800', marginBottom: 4, textAlign: 'center', zIndex: 1 },
  subtitle: { color: colors.subText, fontSize: isTablet ? 15 : 13, marginBottom: 16, textAlign: 'center', zIndex: 1 },

  // SSID 卡片
  ssidCard: {
    width: '100%',
    backgroundColor: colors.bgWhite,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    zIndex: 1,
    elevation: 4,
    shadowColor: 'rgba(66,170,245,0.10)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  ssidLabel: { color: colors.mutedText, fontSize: isTablet ? 12 : 11, marginBottom: 8 },
  ssidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ssidName: { color: colors.text, fontSize: isTablet ? 18 : 16, fontWeight: '700' },
  ssidMeta: { color: colors.mutedText, fontSize: isTablet ? 12 : 11, marginTop: 2 },
  copyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  copyBtnText: { color: colors.primary, fontSize: isTablet ? 14 : 13, fontWeight: '600' },

  // 步骤
  stepsWrap: { flex: 1, width: '100%', zIndex: 1 },
  stepsCard: {
    backgroundColor: colors.bgWhite,
    borderRadius: 16,
    padding: 18,
    elevation: 4,
    shadowColor: 'rgba(66,170,245,0.10)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
  stepText: { color: colors.subText, fontSize: isTablet ? 15 : 13, flex: 1 },

  // 底部按钮
  btn: {
    width: '100%',
    height: isTablet ? 58 : 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    elevation: 6,
    shadowColor: 'rgba(66,170,245,0.30)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  btnText: { color: '#ffffff', fontSize: isTablet ? 18 : 16, fontWeight: '700' },
});
