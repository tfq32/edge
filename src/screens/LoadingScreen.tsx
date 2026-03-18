import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import type { LoadingScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';
import { fetchAppList, healthCheck } from '../services/gateway';
import { getGatewayIpAddress } from '../utils/wifi';
import { GlowBackground } from '../components/GlowBackground';

const { width: SW, height: SH } = Dimensions.get('window');
const isTablet = Math.min(SW, SH) >= 768;

const STEPS = [
  { key: 'parse',    label: '解析配置信息',     sub: 'PARSE QR CONFIG'    },
  { key: 'wifi',     label: '连接目标 WiFi',    sub: 'CONNECT TO SSID'    },
  { key: 'intranet', label: '校验内网可达性',   sub: 'VERIFY INTRANET'    },
  { key: 'load',     label: '加载微应用列表',   sub: 'FETCH APP LIST'     },
];

export function LoadingScreen({ navigation }: LoadingScreenProps) {
  const { record, setRecord, setApps } = useAppStore();
  const [stepIndex, setStepIndex] = useState(0);

  // 旋转 spinner
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1, duration: 900,
        easing: Easing.linear, useNativeDriver: true,
      }),
    ).start();
  }, [spinAnim]);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // 外圈慢转
  const outerSpin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(outerSpin, {
        toValue: 1, duration: 12000,
        easing: Easing.linear, useNativeDriver: true,
      }),
    ).start();
  }, [outerSpin]);
  const outerRot = outerSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // 内圈反转
  const innerSpin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(innerSpin, {
        toValue: 1, duration: 4000,
        easing: Easing.linear, useNativeDriver: true,
      }),
    ).start();
  }, [innerSpin]);
  const innerRot = innerSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  // 主流程（逻辑不变）
  useEffect(() => {
    const run = async () => {
      const startTime = Date.now();
      if (!record) {
        navigation.replace('Error', { message: '连接记录丢失，请重新扫码', code: 'NO_RECORD' });
        return;
      }

      setStepIndex(2);
      let gatewayIp = record.gatewayIp;
      let gatewayPort = record.gatewayPort;
      if (!gatewayIp || !gatewayPort) {
        gatewayIp = await getGatewayIpAddress();
        if (!gatewayIp) {
          navigation.replace('Error', {
            message: '无法获取内网 IP，请检查 WiFi 连接',
            code: 'NO_GATEWAY_IP',
          });
          return;
        }
        gatewayPort = 80;
        setRecord({ ...record, gatewayIp, gatewayPort });
      }

      const reachable = await healthCheck(gatewayIp, gatewayPort);
      if (!reachable) {
        navigation.replace('Error', {
          message: `内网服务不可访问 (${gatewayIp})，请检查 WiFi 连接和服务状态`,
          code: 'INTRANET_UNREACHABLE',
        });
        return;
      }

      setStepIndex(3);
      try {
        const list = await fetchAppList(gatewayIp, gatewayPort);
        setApps(list);
        const elapsed = Date.now() - startTime;
        if (elapsed < 2000) await new Promise<void>(r => setTimeout(r, 2000 - elapsed));
        navigation.replace('Desktop');
      } catch (err) {
        navigation.replace('Error', {
          message: err instanceof Error ? err.message : '微服务列表加载失败',
          code: 'APP_LIST_FAILED',
        });
      }
    };
    void run();
  }, []);

  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  return (
    <View style={styles.container}>
      <GlowBackground />

      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>正在连接</Text>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>CONNECTING</Text>
        </View>
      </View>

      {/* Circular progress */}
      <View style={styles.ringWrap}>
        {/* 外圈虚线 */}
        <Animated.View style={[styles.ringOuter, { transform: [{ rotate: outerRot }] }]} />
        {/* 主进度圆 */}
        <View style={styles.ringMain} />
        {/* 内圈反转虚线 */}
        <Animated.View style={[styles.ringInner, { transform: [{ rotate: innerRot }] }]} />
        {/* 进度文字 */}
        <View style={styles.ringCenter}>
          <Text style={styles.progressPercent}>{progress}%</Text>
          <Text style={styles.progressLabel}>IN PROGRESS</Text>
        </View>
      </View>

      {/* Active step label */}
      <Text style={styles.activeLabel}>{STEPS[stepIndex]?.label}</Text>
      <Text style={styles.activeSub}>{STEPS[stepIndex]?.sub}...</Text>

      {/* Steps list */}
      <View style={styles.stepsList}>
        {STEPS.map((step, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          const pending = i > stepIndex;
          return (
            <View key={step.key} style={[styles.stepRow, pending && styles.stepPending]}>
              {/* Status dot */}
              <View style={[
                styles.dotWrap,
                done && styles.dotDone,
                active && styles.dotActive,
              ]}>
                {done ? (
                  <Text style={styles.checkMark}>✓</Text>
                ) : active ? (
                  <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
                ) : (
                  <View style={styles.dotEmpty} />
                )}
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={[
                  styles.stepLabel,
                  done && styles.stepLabelDone,
                  active && styles.stepLabelActive,
                ]}>
                  {step.label}
                </Text>
                <Text style={styles.stepSub}>{step.sub}</Text>
              </View>
              {done && <Text style={styles.okText}>OK</Text>}
              {active && <Text style={styles.dotsText}>···</Text>}
            </View>
          );
        })}
      </View>

      {/* Bottom hint */}
      <View style={styles.bottomHintWrap}>
        <Text style={styles.bottomHint}>保持连接  ·  勿锁屏  ·  PLEASE WAIT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    paddingHorizontal: isTablet ? 80 : 28,
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary },
  badgeText: { color: colors.primaryLightest, fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  // Ring progress
  ringWrap: {
    width: isTablet ? 150 : 110,
    height: isTablet ? 150 : 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isTablet ? 32 : 24,
    zIndex: 1,
  },
  ringOuter: {
    position: 'absolute',
    width: isTablet ? 148 : 108,
    height: isTablet ? 148 : 108,
    borderRadius: isTablet ? 74 : 54,
    borderWidth: 1,
    borderColor: 'rgba(30,33,247,0.19)',
    borderStyle: 'dashed',
  },
  ringMain: {
    position: 'absolute',
    width: isTablet ? 130 : 94,
    height: isTablet ? 130 : 94,
    borderRadius: isTablet ? 65 : 47,
    borderWidth: 5,
    borderColor: colors.primary,
    borderTopColor: colors.primaryLight,   // spinner trick — keeps the gradient look via rotation
    opacity: 0.9,
    elevation: 4,
  },
  ringInner: {
    position: 'absolute',
    width: isTablet ? 106 : 76,
    height: isTablet ? 106 : 76,
    borderRadius: isTablet ? 53 : 38,
    borderWidth: 1,
    borderColor: 'rgba(30,33,247,0.16)',
    borderStyle: 'dashed',
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    color: colors.textBright,
    fontSize: isTablet ? 32 : 24,
    fontWeight: '900',
  },
  progressLabel: {
    color: colors.mutedText,
    fontSize: 7,
    letterSpacing: 1.5,
    marginTop: 1,
  },

  activeLabel: {
    color: colors.textBright,
    fontSize: isTablet ? 22 : 17,
    fontWeight: '700',
    marginBottom: 5,
    zIndex: 1,
  },
  activeSub: {
    color: colors.mutedText,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 32,
    zIndex: 1,
  },

  // Steps
  stepsList: { width: '100%', gap: 14, zIndex: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepPending: { opacity: 0.28 },

  dotWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dotDone: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successBorder,
  },
  dotActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  checkMark: { color: colors.success, fontSize: 13, fontWeight: '700' },
  dotEmpty: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.primary,
    borderTopColor: 'transparent',
  },

  stepTextWrap: { flex: 1 },
  stepLabel: {
    color: 'rgba(184,186,253,0.6)',
    fontSize: isTablet ? 16 : 13,
    fontWeight: '500',
  },
  stepLabelDone: { color: '#7880cc' },
  stepLabelActive: { color: colors.textBright, fontWeight: '700' },
  stepSub: {
    color: colors.mutedText,
    fontSize: 9,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  okText: { color: colors.success, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  dotsText: { color: colors.primary, fontSize: 12 },

  // Bottom hint
  bottomHintWrap: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    zIndex: 1,
  },
  bottomHint: {
    color: colors.mutedText,
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
