import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { Camera, CameraType, type OnReadCodeData } from 'react-native-camera-kit';
import WifiManager from 'react-native-wifi-reborn';

import type { ScanScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { parseWifiQr } from '../utils/wifi';
import { useAppStore } from '../store/appStore';
import { getConnection, saveConnection } from '../services/storage';
import { getDeviceLayout } from '../utils/device';
import type { ConnectionRecord } from '../types';

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

export function ScanScreen({ navigation }: ScanScreenProps) {
  const { isTablet } = getDeviceLayout();
  const { setRecord, setNotice } = useAppStore();

  const [cameraReady, setCameraReady] = useState(Platform.OS !== 'android');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('正在识别...');
  const [lastRecord, setLastRecord] = useState<ConnectionRecord | null>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const lastScannedRef = useRef('');

  // ── 启动时只读取历史，不自动跳转 ──────────────────────────
  useEffect(() => {
    const historic = getConnection();
    if (historic) setLastRecord(historic);
  }, []);

  // ── 相机权限 ────────────────────────────────────────────────
  useEffect(() => {
    requestCameraPermission().then(ok => { if (ok) setCameraReady(true); });
  }, []);

  // ── 扫码线动画 ──────────────────────────────────────────────
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

  const scanLineY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, isTablet ? 290 : 220],
  });

  // ── 公共 WiFi 连接逻辑 ──────────────────────────────────────
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
        await new Promise(r => setTimeout(r, 1800));
      } catch {
        navigation.navigate('WifiGuide', { ssid, password });
        return false;
      }
    }

    setProcessingText(`正在连接 ${ssid}...`);
    const pwd = security === 'nopass' ? null : password || null;
    try {
      await WifiManager.connectToProtectedSSID(ssid, pwd, security === 'WEP', hidden);
    } catch {
      navigation.navigate('WifiGuide', { ssid, password });
      return false;
    }

    return true;
  }, [navigation]);

  // ── 扫码后连接 ──────────────────────────────────────────────
  const connectByWifi = useCallback(async (code: string) => {
    setProcessingText('正在识别...');
    setIsProcessing(true);
    try {
      const payload = parseWifiQr(code);
      const ok = await connectToWifi(payload.ssid, payload.password, payload.security, payload.hidden);
      if (!ok) { setIsProcessing(false); return; }

      const record = { ...payload, updatedAt: Date.now() };
      saveConnection(record);
      setRecord(record);
      setNotice(`已连接 ${payload.ssid}`);
      navigation.replace('Loading');
    } catch (err) {
      setIsProcessing(false);
      lastScannedRef.current = '';
      navigation.navigate('Error', {
        message: err instanceof Error ? err.message : '连接失败',
        code: 'SCAN_FAILED',
      });
    }
  }, [connectToWifi, navigation, setRecord, setNotice]);

  // ── 点击历史记录连接 ────────────────────────────────────────
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
      setNotice(`已连接 ${lastRecord.ssid}`);
      navigation.replace('Loading');
    } catch (err) {
      setIsProcessing(false);
      navigation.navigate('Error', {
        message: err instanceof Error ? err.message : '连接失败',
        code: 'RESUME_FAILED',
      });
    }
  }, [lastRecord, isProcessing, connectToWifi, navigation, setRecord, setNotice]);

  const handleReadCode = (event: OnReadCodeData) => {
    if (isProcessing) return;
    const code = event.nativeEvent.codeStringValue?.trim();
    if (!code || code === lastScannedRef.current) return;
    lastScannedRef.current = code;
    void connectByWifi(code);
  };

  return (
    <>
      {/* ── 全屏 Loading 弹框 ────────────────────────────────── */}
      <Modal visible={isProcessing} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.modalText}>{processingText}</Text>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}
        bounces={false}
      >
        <Text style={styles.header}>扫码连接</Text>

        <View style={styles.heroWrap}>
          <View style={styles.heroCircle}>
            <Text style={styles.heroIcon}>⚡</Text>
          </View>
        </View>

        <Text style={styles.title}>连接边缘服务器</Text>
        <Text style={styles.subtitle}>Scan to Connect Edge Server</Text>

        <View style={[styles.scanFrame, isTablet && styles.scanFrameTablet]}>
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
          <View style={styles.gridOverlay} pointerEvents="none" />
          <Animated.View
            pointerEvents="none"
            style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}
          />
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={styles.tip}>
          将边缘服务器二维码放入框内，
          <Text style={styles.tipHighlight}>自动识别</Text>
        </Text>
        <Text style={styles.hint}>请向管理员获取二维码</Text>

        {/* 历史连接卡片 */}
        {lastRecord && (
          <Pressable
            style={({ pressed }) => [styles.historyCard, pressed && styles.historyCardPressed]}
            onPress={handleResumeLastRecord}
            disabled={isProcessing}
          >
            <View style={styles.historyLeft}>
              <Text style={styles.historyIcon}>📶</Text>
              <View>
                <Text style={styles.historyTitle}>上次连接</Text>
                <Text style={styles.historySSID}>{lastRecord.ssid}</Text>
                {lastRecord.gatewayIp && (
                  <Text style={styles.historyMeta}>{lastRecord.gatewayIp}</Text>
                )}
              </View>
            </View>
            <View style={styles.historyArrow}>
              <Text style={styles.historyArrowText}>连接 →</Text>
            </View>
          </Pressable>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  containerTablet: { paddingTop: 48 },
  header: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 32 },
  heroWrap: { marginBottom: 16 },
  heroCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: 'rgba(245,166,35,0.3)', alignItems: 'center', justifyContent: 'center' },
  heroIcon: { fontSize: 28 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: colors.mutedText, fontSize: 11, letterSpacing: 1, marginBottom: 24 },
  scanFrame: { width: 220, height: 220, overflow: 'hidden', backgroundColor: 'rgba(20,35,70,0.4)', marginBottom: 20, position: 'relative' },
  scanFrameTablet: { width: 300, height: 300 },
  gridOverlay: { ...StyleSheet.absoluteFillObject, borderWidth: 0.5, borderColor: 'rgba(61,111,255,0.06)' },
  scanLine: { position: 'absolute', left: '8%', width: '84%', height: 2, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  corner: { position: 'absolute', width: 22, height: 22, borderColor: colors.primary, borderWidth: 0, zIndex: 2 },
  cornerTL: { left: 8, top: 8, borderLeftWidth: 3, borderTopWidth: 3 },
  cornerTR: { right: 8, top: 8, borderRightWidth: 3, borderTopWidth: 3 },
  cornerBL: { left: 8, bottom: 8, borderLeftWidth: 3, borderBottomWidth: 3 },
  cornerBR: { right: 8, bottom: 8, borderRightWidth: 3, borderBottomWidth: 3 },
  tip: { color: colors.subText, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  tipHighlight: { color: colors.primary, fontWeight: '700' },
  hint: { color: colors.mutedText, fontSize: 11, marginTop: 8 },
  historyCard: { width: '100%', marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bgCardStrong, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 },
  historyCardPressed: { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIcon: { fontSize: 22 },
  historyTitle: { color: colors.mutedText, fontSize: 10, marginBottom: 2 },
  historySSID: { color: colors.text, fontSize: 14, fontWeight: '700' },
  historyMeta: { color: colors.mutedText, fontSize: 11, marginTop: 2 },
  historyArrow: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primarySoft, borderRadius: 20, borderWidth: 1, borderColor: colors.primaryBorder },
  historyArrowText: { color: colors.primary, fontSize: 12, fontWeight: '600' },

  // ── Modal ──
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: colors.bgCardStrong, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 32, paddingHorizontal: 40, alignItems: 'center', gap: 16, minWidth: 180 },
  modalText: { color: colors.text, fontSize: 14, fontWeight: '600' },
});
