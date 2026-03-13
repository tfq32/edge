import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import type { LoadingScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';
import { inferGatewayIp, fetchAppListWithFallback, healthCheck } from '../services/gateway';

const STEPS = [
  { key: 'parse',    label: '解析配置信息',   sub: 'Parse QR config' },
  { key: 'wifi',     label: '连接目标 WiFi',  sub: 'Connect to SSID' },
  { key: 'intranet', label: '校验内网可达性', sub: 'Verify intranet access' },
  { key: 'load',     label: '加载微服务列表', sub: 'Loading service list' },
];

export function LoadingScreen({ navigation }: LoadingScreenProps) {
  const { record, setApps } = useAppStore();
  const [stepIndex, setStepIndex] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;

  // 旋转动画
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1, duration: 900,
        easing: Easing.linear, useNativeDriver: true,
      }),
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // 主流程
  useEffect(() => {
    const run = async () => {
      if (!record) {
        navigation.replace('Error', { message: '连接记录丢失，请重新扫码', code: 'NO_RECORD' });
        return;
      }

      setStepIndex(2); // 校验内网
      const gatewayIp = record.gatewayIp || inferGatewayIp();
      const reachable = await healthCheck(gatewayIp);
      if (!reachable) {
        navigation.replace('Error', {
          message: `内网不可达 (${gatewayIp})，请检查 WiFi 连接`,
          code: 'INTRANET_UNREACHABLE',
        });
        return;
      }

      setStepIndex(3); // 加载列表
      try {
        const list = await fetchAppListWithFallback(gatewayIp);
        setApps(list);
        // replace：成功后不能从桌面返回到 Loading
        navigation.replace('Desktop');
      } catch (err) {
        navigation.replace('Error', {
          message: err instanceof Error ? err.message : '微服务列表加载失败',
          code: 'APP_LIST_FAILED',
        });
      }
    };

    void run();
  // navigation / setApps 是稳定引用，不会重复触发
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);
  const activeStep = STEPS[stepIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>正在连接</Text>

      {/* 环形进度（静态视觉，实际进度靠 stepIndex） */}
      <View style={styles.progressRing}>
        <Text style={styles.progressPercent}>{progress}%</Text>
        <Text style={styles.progressLabel}>进行中</Text>
      </View>

      <Text style={styles.activeLabel}>{activeStep?.label}</Text>
      <Text style={styles.activeSub}>{activeStep?.sub}...</Text>

      {/* 步骤列表 */}
      <View style={styles.stepsList}>
        {STEPS.map((step, i) => {
          const done    = i < stepIndex;
          const active  = i === stepIndex;
          const pending = i > stepIndex;
          return (
            <View key={step.key} style={[styles.stepRow, pending && styles.stepPending]}>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {done   ? <Text style={styles.check}>✓</Text>
                : active ? <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
                :          <Text style={styles.circle}>○</Text>}
              </View>
              <View>
                <Text style={[styles.stepLabel, done && styles.stepLabelDone, active && styles.stepLabelActive]}>
                  {step.label}
                </Text>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.bottomHint}>请保持设备连接 · 请勿锁屏</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingHorizontal: 28, paddingTop: 56, paddingBottom: 40 },
  header: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 40 },
  progressRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  progressPercent: { color: colors.text, fontSize: 22, fontWeight: '800' },
  progressLabel: { color: colors.mutedText, fontSize: 9, letterSpacing: 1 },
  activeLabel: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  activeSub: { color: colors.mutedText, fontSize: 11, letterSpacing: 0.5, marginBottom: 36 },
  stepsList: { width: '100%', gap: 18 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepPending: { opacity: 0.28 },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dotDone: { backgroundColor: colors.successSoft, borderColor: colors.successBorder },
  dotActive: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  check: { color: colors.success, fontSize: 13, fontWeight: '700' },
  circle: { color: colors.mutedText, fontSize: 12 },
  spinner: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.primary, borderTopColor: 'transparent' },
  stepLabel: { color: colors.mutedText, fontSize: 13, fontWeight: '500' },
  stepLabelDone: { color: colors.subText },
  stepLabelActive: { color: colors.text, fontWeight: '700' },
  stepSub: { color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 2 },
  bottomHint: { color: colors.mutedText, fontSize: 11, marginTop: 'auto' },
});
