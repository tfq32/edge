/**
 * InitScreen — src/screens/InitScreen.tsx
 * 应用首页，点击「扫码连接」进入扫码页
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppIcon } from '../components/AppIcon';
import { HexGrid } from '../components/HexGrid';
import Svg, { Path, Rect, Line } from 'react-native-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Init'>;

const { width: SW, height: SH } = Dimensions.get('window');
const isTablet = Math.min(SW, SH) >= 768;


// 线性二维码扫描图标
function QrScanIcon({ size = 18, color = '#6063f9' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 左上角 */}
      <Path d="M3 9V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      {/* 右上角 */}
      <Path d="M21 9V5a2 2 0 0 0-2-2h-4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      {/* 左下角 */}
      <Path d="M3 15v4a2 2 0 0 0 2 2h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      {/* 右下角 */}
      <Path d="M21 15v4a2 2 0 0 1-2 2h-4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      {/* 扫描线 */}
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      {/* 中心小块 */}
      <Rect x="9" y="9" width="6" height="6" rx="1" stroke={color} strokeWidth="1.3" fill="none"/>
    </Svg>
  );
}

export function InitScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // 旋转外圈
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const btnPulse = useRef(new Animated.Value(1)).current;

  // 呼吸光
  const breathe = useRef(new Animated.Value(0)).current;



  // 淡入
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 按钮呼吸缩放提示
    Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1.0,  duration: 900, useNativeDriver: true }),
        Animated.delay(1200),
      ])
    ).start();

    // 淡入
    Animated.timing(fadeIn, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();

    // 三层旋转环
    [
      { anim: ring1, duration: 14000, reverse: false },
      { anim: ring2, duration: 9000,  reverse: true  },
      { anim: ring3, duration: 6000,  reverse: false },
    ].forEach(({ anim, duration, reverse }) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: reverse ? -1 : 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    });




  }, []);

  const mkRot = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-360deg', '0deg', '360deg'] });




  const handleStartScan = () => {
    navigation.replace('Scan');
  };



  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      {/* ── 蜂窝背景 ── */}
      <HexGrid color="#1e21f7" duration={3500} />

      {/* ── 顶部版本标注 ── */}
      <View style={styles.topBadge}>
        <View style={styles.topBadgeDot} />
        <Text style={styles.topBadgeText}>EDGE SERVER TERMINAL  v1.0</Text>
        <View style={styles.topBadgeDot} />
      </View>

      {/* ── 中心内容区 ── */}
      <Animated.View style={[styles.centerWrap, { opacity: fadeIn }]}>
        {/* 旋转环 + 图标 */}
        <View style={styles.iconArea}>
          {/* 外圈 + 亮点 */}
          <Animated.View style={[styles.ring, styles.ringLg, { transform: [{ rotate: mkRot(ring1) }] }]}>
            <View style={styles.dotLg} />
          </Animated.View>
          {/* 中圈 + 亮点 */}
          <Animated.View style={[styles.ring, styles.ringMd, { transform: [{ rotate: mkRot(ring2) }] }]}>
            <View style={styles.dotMd} />
          </Animated.View>
          {/* 内圈 + 亮点 */}
          <Animated.View style={[styles.ring, styles.ringSm, { transform: [{ rotate: mkRot(ring3) }] }]}>
            <View style={styles.dotSm} />
          </Animated.View>

          {/* App 图标圆形 */}
          <View style={styles.iconCircle}>
            <AppIcon size={isTablet ? 76 : 58} />
          </View>
        </View>

        {/* 标题 */}
        <Text style={styles.title}>微应用桌面</Text>
        <Text style={styles.titleSub}>MICRO-APP DESKTOP SYSTEM</Text>
      </Animated.View>

      {/* ── 底部区域 ── */}
      <Animated.View style={[styles.bottomWrap, { opacity: fadeIn }]}>
        {/* 主按钮：扫码连接（呼吸缩放提示可点击） */}
        <Animated.View style={{ width: '100%', transform: [{ scale: btnPulse }] }}>
        <Pressable
          style={({ pressed }) => [styles.mainBtn, pressed && styles.mainBtnPressed]}
          onPress={handleStartScan}
        >
          {/* 扫光效果用 opacity 呼吸替代 translateX，避免 Android 溢出 */}
          <QrScanIcon size={isTablet ? 22 : 18} color="#a0c4ff" />
          <Text style={styles.mainBtnText}>扫码连接</Text>
        </Pressable>
        </Animated.View>

        <Text style={styles.btnHint}>TAP TO INITIATE CONNECTION</Text>

        {/* 系统信息条 */}
        <View style={styles.sysBar}>
          <Text style={styles.sysText}>SYS: READY</Text>
          <Text style={styles.sysSep}>·</Text>
          <Text style={styles.sysText}>NET: STANDBY</Text>
          <Text style={styles.sysSep}>·</Text>
          <Text style={styles.sysText}>VER: 1.0.0</Text>
        </View>
      </Animated.View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 64 : 28,
  },

  // ── 背景光 ──



  // ── 顶部标注 ──
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(30,33,247,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(30,33,247,0.16)',
    zIndex: 1,
  },
  topBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 0,
  },
  topBadgeText: {
    color: colors.primaryLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // ── 中心区 ──
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconArea: {
    width: isTablet ? 320 : 240,
    height: isTablet ? 320 : 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isTablet ? 44 : 32,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  ringLg: {
    width: isTablet ? 318 : 238,
    height: isTablet ? 318 : 238,
    borderColor: 'rgba(30,33,247,0.30)',
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  ringMd: {
    width: isTablet ? 248 : 186,
    height: isTablet ? 248 : 186,
    borderColor: 'rgba(30,33,247,0.55)',
    borderWidth: 2,
  },
  ringSm: {
    width: isTablet ? 178 : 134,
    height: isTablet ? 178 : 134,
    borderColor: '#1e21f7',
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  // 旋转点：放在圆环顶部中心，随圆环一起旋转，表示旋转方向
  dotLg: {
    position: 'absolute',
    top: -5,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(30,33,247,0.6)',
  },
  dotMd: {
    position: 'absolute',
    top: -5,
    left: '50%',
    marginLeft: -5,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(30,33,247,0.85)',
  },
  dotSm: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e21f7',
  },
  iconCircle: {
    width: isTablet ? 128 : 96,
    height: isTablet ? 128 : 96,
    borderRadius: isTablet ? 64 : 48,
    backgroundColor: 'rgba(30,33,247,0.18)',
    borderWidth: 1.5,
    borderColor: '#1e21f7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },

  title: {
    color: colors.textBright,
    fontSize: isTablet ? 36 : 26,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  titleSub: {
    color: colors.mutedText,
    fontSize: isTablet ? 13 : 10,
    letterSpacing: 2.5,
    textAlign: 'center',
  },

  // ── 底部区 ──
  bottomWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },

  // 主按钮
  mainBtn: {
    width: '100%',
    height: isTablet ? 64 : 52,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(30,33,247,0.18)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    elevation: 6,
  },
  mainBtnPressed: {
    backgroundColor: 'rgba(30,33,247,0.22)',
    shadowOpacity: 0.6,
  },
  btnSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(30,33,247,0.13)',
  },

  mainBtnText: {
    color: colors.text,
    fontSize: isTablet ? 22 : 16,
    fontWeight: '700',
    letterSpacing: 2,
  },

  btnHint: {
    color: colors.primaryLight,
    fontSize: 9,
    letterSpacing: 2,
    marginTop: -4,
    marginBottom: 4,
  },

  // 系统信息条
  sysBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    width: '100%',
    justifyContent: 'center',
  },
  sysText: {
    color: colors.mutedText,
    fontSize: isTablet ? 11 : 9,
    letterSpacing: 0.8,
  },
  sysSep: {
    color: 'rgba(30,33,247,0.27)',
    fontSize: 10,
  },


});
