import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LoadingScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';
import { fetchAppList, healthCheck } from '../services/gateway';
import { getGatewayIpAddress } from '../utils/wifi';

const { width: SW, height: SH } = Dimensions.get('window');
const isTablet = Math.min(SW, SH) >= 768;

const STEPS = [
  { key: 'parse',    label: '解析配置信息' },
  { key: 'wifi',     label: '连接目标 WiFi' },
  { key: 'intranet', label: '校验内网可达性' },
  { key: 'load',     label: '加载微应用列表' },
];

export function LoadingScreen({ navigation }: LoadingScreenProps) {
  const insets = useSafeAreaInsets();
  const { record, setRecord, setApps } = useAppStore();

  // 禁用 Android 硬件返回键
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);
  const [stepIndex, setStepIndex] = useState(0);

  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })).start();
  }, [spinAnim]);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  useEffect(() => {
    const run = async () => {
      const startTime = Date.now();
      if (!record) { navigation.replace('Error', { message: '连接记录丢失，请重新扫码', code: 'NO_RECORD' }); return; }
      setStepIndex(2);
      let gatewayIp = record.gatewayIp, gatewayPort = record.gatewayPort;
      if (!gatewayIp || !gatewayPort) {
        gatewayIp = await getGatewayIpAddress();
        if (!gatewayIp) { navigation.replace('Error', { message: '无法获取内网 IP，请检查 WiFi 连接', code: 'NO_GATEWAY_IP' }); return; }
        gatewayPort = 80;
        setRecord({ ...record, gatewayIp, gatewayPort });
      }
      const reachable = await healthCheck(gatewayIp, gatewayPort);
      if (!reachable) { navigation.replace('Error', { message: `内网服务不可访问 (${gatewayIp})，请检查 WiFi 连接和服务状态`, code: 'INTRANET_UNREACHABLE' }); return; }
      setStepIndex(3);
      try {
        const list = await fetchAppList(gatewayIp, gatewayPort);
        setApps(list);
        const elapsed = Date.now() - startTime;
        if (elapsed < 2000) await new Promise<void>(r => setTimeout(r, 2000 - elapsed));
        navigation.replace('Desktop');
      } catch (err) {
        navigation.replace('Error', { message: err instanceof Error ? err.message : '微服务列表加载失败', code: 'APP_LIST_FAILED' });
      }
    };
    void run();
  }, []);

  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  return (
    <View style={[S.container, { paddingTop: insets.top + 8 }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={S.blobL} /><View style={S.blobR} />
      </View>

      {/* 顶栏 */}
      <View style={S.headerRow}>
        <View style={{ width: 40 }} />
        <Text style={S.header}>正在连接</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 圆形进度指示器 */}
      <View style={S.ringWrap}>
        <View style={S.ringBg} />
        <Animated.View style={[S.ringFg, { transform: [{ rotate: spin }] }]} />
        <View style={S.ringCenter}>
          <Text style={S.progressPct}>{progress}%</Text>
        </View>
      </View>

      {/* 当前步骤 */}
      <Text style={S.activeLabel}>{STEPS[stepIndex]?.label}</Text>
      <Text style={S.activeSub}>请稍候，勿锁屏...</Text>

      {/* 步骤列表 */}
      <View style={S.stepsCard}>
        {STEPS.map((step, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          const pending = i > stepIndex;
          return (
            <View key={step.key} style={[S.stepRow, i < STEPS.length - 1 && { marginBottom: 14 }, pending && { opacity: 0.3 }]}>
              <View style={[S.dot, done && S.dotDone, active && S.dotActive]}>
                {done ? <Text style={S.check}>✓</Text>
                  : active ? <Animated.View style={[S.spinner, { transform: [{ rotate: spin }] }]} />
                  : <View style={S.dotEmpty} />}
              </View>
              <Text style={[S.stepLabel, active && S.stepLabelActive]}>{step.label}</Text>
              {done && <Text style={S.okMark}>✓</Text>}
            </View>
          );
        })}
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
    paddingBottom: 40,
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
    marginBottom: 20,
    zIndex: 10,
  },
  header: { fontSize: isTablet ? 18 : 16, fontWeight: '700', color: colors.text },

  // 进度环
  ringWrap: {
    width: isTablet ? 130 : 100,
    height: isTablet ? 130 : 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    zIndex: 1,
  },
  ringBg: {
    position: 'absolute',
    width: isTablet ? 130 : 100,
    height: isTablet ? 130 : 100,
    borderRadius: isTablet ? 65 : 50,
    borderWidth: 6,
    borderColor: 'rgba(66,170,245,0.10)',
  },
  ringFg: {
    position: 'absolute',
    width: isTablet ? 130 : 100,
    height: isTablet ? 130 : 100,
    borderRadius: isTablet ? 65 : 50,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: colors.primary,
  },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  progressPct: { color: colors.text, fontSize: isTablet ? 30 : 22, fontWeight: '800' },

  activeLabel: { color: colors.text, fontSize: isTablet ? 20 : 17, fontWeight: '700', marginBottom: 4, zIndex: 1 },
  activeSub: { color: colors.mutedText, fontSize: isTablet ? 14 : 12, marginBottom: 24, zIndex: 1 },

  // 步骤卡片
  stepsCard: {
    width: '100%',
    backgroundColor: colors.bgWhite,
    borderRadius: 16,
    padding: 18,
    zIndex: 1,
    elevation: 4,
    shadowColor: 'rgba(66,170,245,0.10)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(66,170,245,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dotDone: { backgroundColor: colors.success },
  dotActive: { backgroundColor: colors.primary },
  check: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  dotEmpty: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(66,170,245,0.2)' },
  spinner: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#ffffff', borderTopColor: 'transparent' },
  stepLabel: { color: colors.mutedText, fontSize: isTablet ? 16 : 14, fontWeight: '500', flex: 1 },
  stepLabelActive: { color: colors.text, fontWeight: '700' },
  okMark: { color: colors.success, fontSize: 12, fontWeight: '600' },
});
