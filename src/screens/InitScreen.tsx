/**
 * InitScreen — src/screens/InitScreen.tsx
 * 应用首页（亮色主题）— 按 UI 设计图 v4.0 更新
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
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
import Svg, { Path, Rect, Line } from 'react-native-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Init'>;

const { width: SW, height: SH } = Dimensions.get('window');
const isTablet = Math.min(SW, SH) >= 768;

function QrScanIcon({ size = 20, color = 'white' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Path d="M21 9V5a2 2 0 0 0-2-2h-4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Path d="M3 15v4a2 2 0 0 0 2 2h4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Path d="M21 15v4a2 2 0 0 1-2 2h-4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Rect x="9" y="9" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" fill="none"/>
    </Svg>
  );
}

export function InitScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const btnPulse = useRef(new Animated.Value(1)).current;
  const fadeIn   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.025, duration: 1000, useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1.0,   duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 28 }]}>
      {/* Blob 装饰背景 */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.blobL} />
        <View style={styles.blobR} />
      </View>

      {/* Logo + 标题，居中 */}
      <Animated.View style={[styles.centerWrap, { opacity: fadeIn }]}>
        <View style={styles.iconBox}>
          <AppIcon size={isTablet ? 70 : 56} />
        </View>
        <Text style={styles.title}>微应用桌面</Text>
        <Text style={styles.titleSub}>点亮智慧连接</Text>
      </Animated.View>

      {/* 按钮区 */}
      <Animated.View style={[styles.bottomWrap, { opacity: fadeIn }]}>
        <Animated.View style={{ width: '100%', transform: [{ scale: btnPulse }] }}>
          <Pressable
            style={({ pressed }) => [styles.mainBtn, pressed && styles.mainBtnPressed]}
            onPress={() => navigation.navigate('Scan')}
          >
            <QrScanIcon size={isTablet ? 22 : 20} color="white" />
            <Text style={styles.mainBtnText}>扫码连接</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.versionText}>version 1.0.0</Text>
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
    paddingHorizontal: isTablet ? 64 : 24,
  },
  blobL: {
    position: 'absolute',
    bottom: '-18%',
    left: '-18%',
    width: SH * 0.52,
    height: SH * 0.52,
    borderRadius: SH * 0.26,
    backgroundColor: 'rgba(66,170,245,0.13)',
  },
  blobR: {
    position: 'absolute',
    bottom: '-22%',
    right: '-22%',
    width: SH * 0.46,
    height: SH * 0.46,
    borderRadius: SH * 0.23,
    backgroundColor: 'rgba(66,170,245,0.17)',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconBox: {
    width: isTablet ? 100 : 80,
    height: isTablet ? 100 : 80,
    borderRadius: isTablet ? 28 : 22,
    backgroundColor: colors.bgWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 6,
    shadowColor: 'rgba(66,170,245,0.20)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 28,
  },
  title: {
    color: colors.text,
    fontSize: isTablet ? 32 : 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleSub: {
    color: colors.subText,
    fontSize: isTablet ? 14 : 12,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 6,
  },
  bottomWrap: {
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  mainBtn: {
    width: '100%',
    height: isTablet ? 60 : 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    elevation: 8,
    shadowColor: 'rgba(66,170,245,0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
  },
  mainBtnPressed: { opacity: 0.88 },
  mainBtnText: {
    color: '#ffffff',
    fontSize: isTablet ? 18 : 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  versionText: {
    color: colors.mutedText,
    fontSize: 11,
    marginTop: 16,
    letterSpacing: 0.5,
  },
});
