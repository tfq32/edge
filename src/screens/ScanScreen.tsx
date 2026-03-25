import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, Easing, Modal, ActivityIndicator,
  PermissionsAndroid, Platform, Pressable,
  StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, CameraType } from 'react-native-camera-kit';
import WifiManager from 'react-native-wifi-reborn';
import { CommonActions } from '@react-navigation/native';
import type { ScanScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { parseQr } from '../utils/wifi';
import { useAppStore } from '../store/appStore';
import { getConnection, saveConnection } from '../services/storage';
import { getDeviceLayout } from '../utils/device';
import type { ConnectionRecord } from '../types';
import Svg, { Path, Rect, Polyline } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const isTablet = Math.min(SW, SH) >= 768;

async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA,
    { title: '需要相机权限', message: '扫码接入需要使用相机读取设备二维码', buttonNegative: '拒绝', buttonPositive: '允许' });
  return r === PermissionsAndroid.RESULTS.GRANTED;
}
async function requestWifiPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const perms = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];
  const r = await PermissionsAndroid.requestMultiple(perms);
  return perms.every(p => r[p] === PermissionsAndroid.RESULTS.GRANTED);
}
function DesktopSvgIcon({ size = 22, color = '#2196e8' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="3" width="20" height="13" rx="2" stroke={color} strokeWidth="1.6" fill="none"/>
      <Path d="M8 21h8M12 17v4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <Path d="M6 8h4M6 11h3" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.5"/>
      <Rect x="14" y="7" width="4" height="4" rx="0.5" stroke={color} strokeWidth="1.3" fill="none" opacity="0.5"/>
    </Svg>
  );
}

export function ScanScreen({ navigation }: ScanScreenProps) {
  const insets = useSafeAreaInsets();
  const { isTablet: IT } = getDeviceLayout();
  const { setQrData, setRecord } = useAppStore();
  const [cameraReady, setCameraReady]       = useState(Platform.OS !== 'android');
  const [isProcessing, setIsProcessing]     = useState(false);
  const [processingText, setProcessingText] = useState('正在识别...');
  const [lastRecord, setLastRecord]         = useState<ConnectionRecord | null>(null);
  const scanAnim      = useRef(new Animated.Value(0)).current;
  const lastScannedRef = useRef('');
  const [cameraKey, setCameraKey] = useState(0);

  // 页面每次获得焦点时重置扫码状态 + 强制重新挂载 Camera
  useFocusEffect(
    useCallback(() => {
      setIsProcessing(false);
      setProcessingText('正在识别...');
      lastScannedRef.current = '';
      // 递增 key 强制 Camera 重新挂载，解决扫码回调不恢复的问题
      setCameraKey(prev => prev + 1);
    }, [])
  );

  useEffect(() => { const h = getConnection(); if (h) setLastRecord(h); }, []);
  useEffect(() => { requestCameraPermission().then(ok => { if (ok) setCameraReady(true); }); }, []);
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
      Animated.timing(scanAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.linear), useNativeDriver: true }),
    ])).start();
  }, [scanAnim]);

  const frameSize = IT ? 300 : 220;
  const scanLineY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, frameSize - 2] });

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'Init' }] })
      );
    }
  };

  const connectToWifi = useCallback(async (ssid: string, password: string, security: string, hidden: boolean): Promise<boolean> => {
    const wifiOk = await requestWifiPermissions();
    if (!wifiOk) throw new Error('未获取定位权限，无法操作 WiFi');
    const isEnabled = await WifiManager.isEnabled();
    if (!isEnabled) {
      setProcessingText('正在开启 WiFi...');
      try { await WifiManager.setEnabled(true); await new Promise<void>(r => setTimeout(r, 1800)); }
      catch { navigation.navigate('WifiGuide'); return false; }
    }
    setProcessingText(`正在连接 ${ssid}...`);
    const pwd = security === 'nopass' ? null : password || null;
    try { await WifiManager.connectToProtectedSSID(ssid, pwd, security === 'WEP', hidden); }
    catch { navigation.navigate('WifiGuide'); return false; }
    return true;
  }, [navigation]);

  const connectByWifi = useCallback(async (code: string) => {
    setProcessingText('正在识别...'); setIsProcessing(true);
    try {
      const { wifi, server } = parseQr(code);
      setQrData({ wifi, server });
      const ok = await connectToWifi(wifi.ssid, wifi.password, wifi.security, wifi.hidden);
      if (!ok) { setIsProcessing(false); return; }
      const record: ConnectionRecord = { ...wifi, gatewayIp: server?.ip, gatewayPort: server?.port, updatedAt: Date.now() };
      saveConnection(record); setRecord(record);
      navigation.replace('Loading');
    } catch (err) {
      setIsProcessing(false); lastScannedRef.current = '';
      navigation.navigate('Error', { message: err instanceof Error ? err.message : '连接失败', code: 'SCAN_FAILED' });
    }
  }, [connectToWifi, navigation, setRecord]);

  const handleResumeLastRecord = useCallback(async () => {
    if (!lastRecord || isProcessing) return;
    setProcessingText('正在连接...'); setIsProcessing(true);
    try {
      const ok = await connectToWifi(lastRecord.ssid, lastRecord.password ?? '', lastRecord.security ?? 'WPA', lastRecord.hidden ?? false);
      if (!ok) { setIsProcessing(false); return; }
      setRecord(lastRecord); navigation.replace('Loading');
    } catch (err) {
      setIsProcessing(false);
      navigation.navigate('Error', { message: err instanceof Error ? err.message : '连接失败', code: 'RESUME_FAILED' });
    }
  }, [lastRecord, isProcessing, connectToWifi, navigation, setRecord]);

  const handleReadCode = (e: { nativeEvent: { codeStringValue: string } }) => {
    if (isProcessing) return;
    const code = e.nativeEvent.codeStringValue?.trim();
    if (!code || code === lastScannedRef.current) return;
    lastScannedRef.current = code;
    void connectByWifi(code);
  };

  return (
    <>
      <Modal visible={isProcessing} transparent animationType="fade" statusBarTranslucent>
        <View style={S.modalBg}>
          <View style={S.modalCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={S.modalText}>{processingText}</Text>
            <Text style={S.modalSub}>请稍候...</Text>
          </View>
        </View>
      </Modal>

      <View style={[S.container, IT && S.containerTablet, { paddingTop: insets.top + 8 }]}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={S.blobL} /><View style={S.blobR} />
        </View>

        {/* 顶栏 */}
        <View style={S.headerRow}>
          <Pressable style={S.backBtn} onPress={handleGoBack} hitSlop={12}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18l-6-6 6-6" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </Pressable>
          <Text style={S.header}>扫码连接</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* 提示文字 */}
        <Text style={S.subtitle}>将二维码放入框内，自动识别</Text>

        {/* 扫码框 — 自适应居中 */}
        <View style={S.frameWrap}>
          <View style={[S.frame, { width: frameSize, height: frameSize }]}>
            {cameraReady && (
              <Camera key={cameraKey} style={StyleSheet.absoluteFillObject} cameraType={CameraType.Back}
                scanBarcode={!isProcessing} showFrame={false} onReadCode={handleReadCode} scanThrottleDelay={1500}/>
            )}
            <Animated.View pointerEvents="none" style={[S.scanLine, { transform: [{ translateY: scanLineY }] }]} />
            <View style={[S.corner, S.cTL]} /><View style={[S.corner, S.cTR]} />
            <View style={[S.corner, S.cBL]} /><View style={[S.corner, S.cBR]} />
          </View>
          <Text style={S.hint}>请向管理员获取二维码</Text>
        </View>

        {/* 上次连接卡片 — 底部 */}
        {lastRecord && (
          <Pressable style={({ pressed }) => [S.card, pressed && S.cardPressed]}
            onPress={handleResumeLastRecord} disabled={isProcessing}>
            <View style={S.cardLeft}>
              <View style={S.cardIconWrap}>
                <DesktopSvgIcon size={IT ? 28 : 24} color={colors.primaryLight} />
              </View>
              <View>
                <Text style={S.cardLabel}>上次连接</Text>
                <Text style={S.cardSSID}>{lastRecord.ssid}</Text>
              </View>
            </View>
            <View style={S.cardBtn}><Text style={S.cardBtnText}>连接</Text></View>
          </Pressable>
        )}
      </View>
    </>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  containerTablet: { paddingHorizontal: 64 },
  blobL: { position: 'absolute', bottom: '-18%', left: '-18%', width: SH * 0.52, height: SH * 0.52, borderRadius: SH * 0.26, backgroundColor: 'rgba(66,170,245,0.12)' },
  blobR: { position: 'absolute', bottom: '-22%', right: '-22%', width: SH * 0.46, height: SH * 0.46, borderRadius: SH * 0.23, backgroundColor: 'rgba(66,170,245,0.16)' },

  // 顶栏
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { fontSize: isTablet ? 18 : 16, fontWeight: '700', color: colors.text },

  subtitle: {
    color: colors.subText,
    fontSize: isTablet ? 16 : 14,
    marginBottom: 16,
    textAlign: 'center',
    zIndex: 1,
  },

  // 扫码框容器 — flex:1 让它占据中间可用空间，自适应长屏
  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  frame: {
    overflow: 'hidden',
    backgroundColor: 'rgba(66,170,245,0.03)',
    borderRadius: 14,
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    left: '5%',
    width: '90%',
    height: 2,
    backgroundColor: colors.primary,
    zIndex: 3,
  },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: colors.primary, borderWidth: 0, zIndex: 4 },
  cTL: { left: -1, top: -1, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 14 },
  cTR: { right: -1, top: -1, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 14 },
  cBL: { left: -1, bottom: -1, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 14 },
  cBR: { right: -1, bottom: -1, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 14 },

  hint: { color: colors.mutedText, fontSize: isTablet ? 13 : 12, textAlign: 'center', marginTop: 12 },

  // 上次连接卡片
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgWhite,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    zIndex: 1,
    elevation: 4,
    shadowColor: 'rgba(66,170,245,0.10)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  cardPressed: { backgroundColor: 'rgba(66,170,245,0.04)' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardIconWrap: {
    width: isTablet ? 52 : 46,
    height: isTablet ? 52 : 46,
    borderRadius: isTablet ? 14 : 12,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { color: colors.mutedText, fontSize: isTablet ? 11 : 10, marginBottom: 2 },
  cardSSID: { color: colors.text, fontSize: isTablet ? 18 : 16, fontWeight: '700' },
  cardBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: 22 },
  cardBtnText: { color: '#ffffff', fontSize: isTablet ? 14 : 13, fontWeight: '600' },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(26,28,58,0.55)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: colors.bgWhite, borderRadius: 16, paddingVertical: 32, paddingHorizontal: 40, alignItems: 'center', gap: 14, minWidth: 180, elevation: 10 },
  modalText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  modalSub: { color: colors.mutedText, fontSize: 13 },
});
