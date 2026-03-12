import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Camera, CameraType, type OnReadCodeData } from 'react-native-camera-kit';
import { colors } from '../theme/colors';
import { parseWifiQr } from '../utils/wifi';
import { useAppStore } from '../store/appStore';
import { saveConnection } from '../services/storage';
import WifiManager from 'react-native-wifi-reborn';
import { getDeviceLayout } from '../utils/device';

async function ensureWifiPermissions() {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permissions = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ];

  const result = await PermissionsAndroid.requestMultiple(permissions);
  return permissions.every(permission => result[permission] === PermissionsAndroid.RESULTS.GRANTED);
}

async function ensureCameraPermission() {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
    title: '需要相机权限',
    message: '扫码接入需要使用相机读取设备二维码。',
    buttonNegative: '拒绝',
    buttonPositive: '允许',
  });

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function ScanScreen() {
  const { isTablet } = getDeviceLayout();
  const { setPhase, setRecord, setError, setNotice } = useAppStore();
  const [cameraReady, setCameraReady] = useState(Platform.OS !== 'android');
  const [isProcessing, setIsProcessing] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const lastScannedRef = useRef('');

  useEffect(() => {
    const run = async () => {
      const granted = await ensureCameraPermission();
      if (!granted) {
        setError('未授予相机权限，无法扫码');
        return;
      }
      setCameraReady(true);
    };

    run();
  }, [setError]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.linear),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scanAnim]);

  const connectByWifi = useCallback(async (code: string) => {
    setError(null);
    setIsProcessing(true);

    try {
      const payload = parseWifiQr(code);
      const granted = await ensureWifiPermissions();
      if (!granted) {
        throw new Error('未授予定位权限，Android 需要 ACCESS_FINE_LOCATION 才能连接 WiFi');
      }

      const wifiEnabled = await WifiManager.isEnabled();
      if (!wifiEnabled) {
        await WifiManager.setEnabled(true);
        await new Promise(resolve => setTimeout(resolve, 1800));
      }

      const password = payload.security === 'nopass' ? null : payload.password || null;
      await WifiManager.connectToProtectedSSID(
        payload.ssid,
        password,
        payload.security === 'WEP',
        payload.hidden,
      );

      const record = { ...payload, updatedAt: Date.now() };
      saveConnection(record);
      setRecord(record);
      setNotice(`WiFi 已连接成功：${payload.ssid}`);
      setPhase('connecting');
    } catch (error) {
      setError(error instanceof Error ? error.message : '连接失败');
      setPhase('connect-failed');
      setIsProcessing(false);
      lastScannedRef.current = '';
    }
  }, [setError, setNotice, setPhase, setRecord]);

  const handleReadCode = (event: OnReadCodeData) => {
    if (isProcessing) {
      return;
    }

    const code = event.nativeEvent.codeStringValue?.trim();
    if (!code || code === lastScannedRef.current) {
      return;
    }

    lastScannedRef.current = code;
    void connectByWifi(code);
  };

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, isTablet ? 280 : 218],
  });

  return (
    <ScrollView contentContainerStyle={[styles.container, isTablet && styles.containerTablet]}>
      <Text style={styles.header}>扫码连接</Text>
      <Text style={styles.logo}>⚡</Text>
      <Text style={styles.title}>连接边缘服务器</Text>
      <Text style={styles.subtitle}>Scan to Connect Edge Server</Text>

      <View style={[styles.scanFrame, isTablet && styles.scanFrameTablet]}>
        {cameraReady ? (
          <Camera
            style={StyleSheet.absoluteFillObject}
            cameraType={CameraType.Back}
            scanBarcode={!isProcessing}
            showFrame={false}
            onReadCode={handleReadCode}
            scanThrottleDelay={1500}
            onError={event => setError(event.nativeEvent.errorMessage)}
          />
        ) : null}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <View pointerEvents="none" style={styles.scanMask} />
        <Animated.View pointerEvents="none" style={[styles.scanLine, { transform: [{ translateY: scanTranslateY }] }]} />
      </View>

      <Text style={styles.tip}>将边缘服务器二维码放入框内，自动识别</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 54, paddingBottom: 40, alignItems: 'center' },
  containerTablet: { justifyContent: 'flex-start', paddingTop: 48 },
  header: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 42 },
  logo: { fontSize: 42, marginBottom: 18 },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.subText, fontSize: 16, marginTop: 8, marginBottom: 22 },
  scanFrame: { width: 258, height: 258, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 32, backgroundColor: '#080B22' },
  scanFrameTablet: { width: 320, height: 320 },
  scanMask: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(104,113,255,0.12)',
    backgroundColor: 'rgba(10,16,50,0.18)',
  },
  scanLine: {
    position: 'absolute',
    left: '11%',
    width: '78%',
    height: 2,
    backgroundColor: '#7D80FF',
    shadowColor: '#7D80FF',
    shadowOpacity: 0.85,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#6F74FF', borderWidth: 0, zIndex: 2 },
  cornerTL: { left: 10, top: 10, borderLeftWidth: 4, borderTopWidth: 4 },
  cornerTR: { right: 10, top: 10, borderRightWidth: 4, borderTopWidth: 4 },
  cornerBL: { left: 10, bottom: 10, borderLeftWidth: 4, borderBottomWidth: 4 },
  cornerBR: { right: 10, bottom: 10, borderRightWidth: 4, borderBottomWidth: 4 },
  tip: { color: colors.subText, fontSize: 15, marginBottom: 36 },
});
