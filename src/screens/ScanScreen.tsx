import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import WifiManager from 'react-native-wifi-reborn';

import type { ScanScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { parseQr } from '../utils/wifi';
import { useAppStore } from '../store/appStore';
import { getConnection, saveConnection } from '../services/storage';
import { getDeviceLayout } from '../utils/device';
import type { ConnectionRecord } from '../types';
import { GlowBackground } from '../components/GlowBackground';
import { AppIcon } from '../components/AppIcon';
import Svg, { Path, Rect } from 'react-native-svg';

// 模块级 tablet 检测，StyleSheet.create() 可访问
const { width: SW, height: SH } = Dimensions.get('window');
const isTablet = Math.min(SW, SH) >= 768;

async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: '需要相机权限',
      message: '扫码接入需要使用相机读取设备二维码',
      buttonNegative: '拒绝',
      buttonPositive: '允许',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

async function requestWifiPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const perms = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ];
  const result = await PermissionsAndroid.requestMultiple(perms);
  return perms.every(p => result[p] === PermissionsAndroid.RESULTS.GRANTED);
}


// 白色/主题色电脑图标
function DesktopSvgIcon({ size = 24, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="3" width="20" height="13" rx="2" stroke={color} strokeWidth="1.6" fill="none"/>
      <Path d="M8 21h8M12 17v4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <Path d="M6 8h4M6 11h3" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
      <Rect x="14" y="7" width="4" height="4" rx="0.5" stroke={color} strokeWidth="1.3" fill="none" opacity="0.6"/>
    </Svg>
  );
}

export function ScanScreen({ navigation }: ScanScreenProps) {
  const { isTablet } = getDeviceLayout();
  const { setQrData, setRecord } = useAppStore();

  const [cameraReady, setCameraReady] = useState(Platform.OS !== 'android');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('正在识别...');
  const [lastRecord, setLastRecord] = useState<ConnectionRecord | null>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const lastScannedRef = useRef('');

  useEffect(() => {
    const historic = getConnection();
    if (historic) setLastRecord(historic);
  }, []);

  useEffect(() => {
    requestCameraPermission().then(ok => { if (ok) setCameraReady(true); });
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.linear),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, [scanAnim]);

  const frameSize = isTablet ? 280 : 210;
  const scanLineY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, frameSize - 2],
  });

  const connectToWifi = useCallback(async (
    ssid: string,
    password: string,
    security: string,
    hidden: boolean,
  ): Promise<boolean> => {
    const wifiOk = await requestWifiPermissions();
    if (!wifiOk) throw new Error('未获取定位权限，无法操作 WiFi');

    const isEnabled = await WifiManager.isEnabled();
    if (!isEnabled) {
      setProcessingText('正在开启 WiFi...');
      try {
        await WifiManager.setEnabled(true);
        await new Promise<void>(r => setTimeout(r, 1800));
      } catch {
        navigation.navigate('WifiGuide');
        return false;
      }
    }

    setProcessingText(`正在连接 ${ssid}...`);
    const pwd = security === 'nopass' ? null : password || null;
    try {
      await WifiManager.connectToProtectedSSID(ssid, pwd, security === 'WEP', hidden);
    } catch {
      navigation.navigate('WifiGuide');
      return false;
    }
    return true;
  }, [navigation]);

  const connectByWifi = useCallback(async (code: string) => {
    setProcessingText('正在识别...');
    setIsProcessing(true);
    try {
      const { wifi, server } = parseQr(code);
      setQrData({ wifi, server });
      const ok = await connectToWifi(wifi.ssid, wifi.password, wifi.security, wifi.hidden);
      if (!ok) { setIsProcessing(false); return; }
      const record: ConnectionRecord = { ...wifi, gatewayIp: server?.ip, gatewayPort: server?.port, updatedAt: Date.now() };
      saveConnection(record);
      setRecord(record);
      navigation.replace('Loading');
    } catch (err) {
      setIsProcessing(false);
      lastScannedRef.current = '';
      navigation.navigate('Error', {
        message: err instanceof Error ? err.message : '连接失败',
        code: 'SCAN_FAILED',
      });
    }
  }, [connectToWifi, navigation, setRecord]);

  const handleResumeLastRecord = useCallback(async () => {
    if (!lastRecord || isProcessing) return;
    setProcessingText('正在连接...');
    setIsProcessing(true);
    try {
      const ok = await connectToWifi(
        lastRecord.ssid,
        lastRecord.password ?? '',
        lastRecord.security ?? 'WPA',
        lastRecord.hidden ?? false,
      );
      if (!ok) { setIsProcessing(false); return; }
      setRecord(lastRecord);
      navigation.replace('Loading');
    } catch (err) {
      setIsProcessing(false);
      navigation.navigate('Error', {
        message: err instanceof Error ? err.message : '连接失败',
        code: 'RESUME_FAILED',
      });
    }
  }, [lastRecord, isProcessing, connectToWifi, navigation, setRecord]);

  const handleReadCode = (event: { nativeEvent: { codeStringValue: string } }) => {
    if (isProcessing) return;
    const code = event.nativeEvent.codeStringValue?.trim();
    if (!code || code === lastScannedRef.current) return;
    lastScannedRef.current = code;
    void connectByWifi(code);
  };

  return (
    <>
      {/* ── 全屏 Loading 弹框 */}
      <Modal visible={isProcessing} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* 卡片顶部光条 */}
            <View style={styles.modalTopLine} />
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.modalText}>{processingText}</Text>
            <Text style={styles.modalSub}>PROCESSING...</Text>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* 背景呼吸光 */}
        <GlowBackground />

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>扫码连接</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>READY</Text>
          </View>
        </View>

        {/* Hero icon */}
        <View style={styles.heroWrap}>
          <View style={styles.heroGlow} />
          <View style={styles.heroCircle}>
            <AppIcon size={isTablet ? 58 : 42} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>连接边缘服务器</Text>
        <Text style={styles.subtitle}>Scan to Connect Edge Server</Text>

        {/* Scan frame */}
        <View style={[
          styles.scanFrame,
          { width: frameSize, height: frameSize },
          isTablet && styles.scanFrameTablet,
        ]}>
          {/* 相机 — 透明背景实现"镂空"效果 */}
          {cameraReady && (
            <Camera
              style={StyleSheet.absoluteFillObject}
              cameraType={CameraType.Back}
              scanBarcode={!isProcessing}
              showFrame={false}
              onReadCode={handleReadCode}
              scanThrottleDelay={1500}
            />
          )}

          {/* 雷达扫描线 */}
          <Animated.View
            pointerEvents="none"
            style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
          />

          {/* 四角 bracket */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* 中心准星点 */}
          <View style={styles.centerDot} />
        </View>

        {/* Hint */}
        <Text style={styles.tip}>
          将二维码放入框内，
          <Text style={styles.tipHighlight}>自动识别</Text>
        </Text>
        <Text style={styles.hint}>请向管理员获取二维码</Text>

        {/* 历史连接卡片 */}
        {lastRecord && (
          <Pressable
            style={({ pressed }) => [
              styles.historyCard,
              pressed && styles.historyCardPressed,
            ]}
            onPress={handleResumeLastRecord}
            disabled={isProcessing}
          >
            <View style={styles.historyTopLine} />
            <View style={styles.historyLeft}>
              <View style={styles.historyIconWrap}>
                <DesktopSvgIcon size={isTablet ? 28 : 22} color={colors.primaryLightest} />
              </View>
              <View>
                <Text style={styles.historyLabel}>上次连接</Text>
                <Text style={styles.historySSID}>{lastRecord.ssid}</Text>
              </View>
            </View>
            <View style={styles.historyBtn}>
              <Text style={styles.historyBtnText}>连接 →</Text>
            </View>
          </Pressable>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  containerTablet: { paddingTop: 56, paddingHorizontal: 64 },

  // Header
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    zIndex: 1,
  },
  header: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.success,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Hero
  heroWrap: {
    marginBottom: isTablet ? 24 : 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  heroGlow: {}, // removed
  heroCircle: {
    width: isTablet ? 110 : 80,
    height: isTablet ? 110 : 80,
    borderRadius: isTablet ? 55 : 40,
    backgroundColor: 'rgba(30,33,247,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(30,33,247,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Title
  title: {
    color: colors.textBright,
    fontSize: isTablet ? 28 : 21,
    fontWeight: '900',
    marginBottom: isTablet ? 6 : 3,
    textAlign: 'center',
    zIndex: 1,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: isTablet ? 13 : 10,
    letterSpacing: 1.5,
    marginBottom: isTablet ? 28 : 20,
    textAlign: 'center',
    zIndex: 1,
  },

  // Scan frame
  scanFrame: {
    overflow: 'hidden',
    backgroundColor: 'rgba(3,5,26,0.15)', // 接近透明，露出相机
    marginBottom: 18,
    position: 'relative',
    zIndex: 1,
  },
  scanFrameTablet: { marginBottom: 24 },

  scanLine: {
    position: 'absolute',
    left: '5%',
    width: '90%',
    height: 2,
    backgroundColor: colors.primary,
    elevation: 4,   // Android shadow approximation
    zIndex: 3,
  },

  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary,
    borderWidth: 0,
    zIndex: 4,
  },
  cornerTL: { left: 0, top: 0, borderLeftWidth: 2.5, borderTopWidth: 2.5 },
  cornerTR: { right: 0, top: 0, borderRightWidth: 2.5, borderTopWidth: 2.5 },
  cornerBL: { left: 0, bottom: 0, borderLeftWidth: 2.5, borderBottomWidth: 2.5 },
  cornerBR: { right: 0, bottom: 0, borderRightWidth: 2.5, borderBottomWidth: 2.5 },

  centerDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -4,
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(30,33,247,0.53)',
    zIndex: 3,
  },

  // Hints
  tip: {
    color: colors.subText,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  tipHighlight: { color: colors.primary, fontWeight: '700' },
  hint: {
    color: colors.mutedText,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.3,
    zIndex: 1,
  },

  // History card
  historyCard: {
    width: '100%',
    marginTop: isTablet ? 28 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    overflow: 'hidden',
    zIndex: 1,
  },
  historyCardPressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  historyTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  historyIconWrap: {
    width: isTablet ? 56 : 44,
    height: isTablet ? 56 : 44,
    borderRadius: isTablet ? 12 : 10,
    backgroundColor: 'rgba(30,33,247,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(30,33,247,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconEmoji: { fontSize: 22 },
  historyLabel: { color: colors.mutedText, fontSize: 9, letterSpacing: 0.5, marginBottom: 3 },
  historySSID: { color: colors.textBright, fontSize: isTablet ? 17 : 14, fontWeight: '700' },
  historyMeta: { color: colors.mutedText, fontSize: 11, marginTop: 2 },
  historyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  historyBtnText: { color: colors.primaryLightest, fontSize: 12, fontWeight: '600' },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3,5,26,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.bgCardStrong,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 14,
    minWidth: 180,
    overflow: 'hidden',
  },
  modalTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  modalText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  modalSub: {
    color: colors.mutedText,
    fontSize: 9,
    letterSpacing: 2,
  },
});
