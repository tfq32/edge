import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, BackHandler, Dimensions, FlatList, Image, Modal, Pressable,
  RefreshControl, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DesktopScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { AppIcon } from '../components/AppIcon';
import { useAppStore } from '../store/appStore';
import { getDeviceLayout } from '../utils/device';
import type { AppItem } from '../types';
import { fetchAppList } from '../services/gateway';

const yihuiPng = require('../assets/yihui.png')

const { width: _SW, height: _SH } = Dimensions.get('window');
const isTablet = Math.min(_SW, _SH) >= 768;
const APP_VERSION = '1.0.0';

const STATUS_COLOR: Record<string, string> = {
  running: colors.success,
  stopped: colors.danger,
  warning: colors.warning,
};

/** 独立的 App 网格项组件 */
function AppGridItem({ item, isTabletLayout, onPress }: {
  item: AppItem;
  isTabletLayout: boolean;
  onPress: (item: AppItem) => void;
}) {
  const isStopped = item.status === 'stopped';
  const showDot   = item.status === 'warning';
  const dotColor  = STATUS_COLOR[item.status ?? 'running'] ?? colors.success;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 10 }).start();

  return (
    <Pressable
      style={[S.cell, isTabletLayout && S.cellTablet, isStopped && S.cellStopped]}
      onPress={() => onPress(item)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      {showDot && <View style={[S.statusDot, { backgroundColor: dotColor }]} />}
      <Animated.View style={[S.iconWrap, isTabletLayout && S.iconWrapTablet, { transform: [{ scale: scaleAnim }] }]}>
        {(item.icon?.startsWith('http') || item.icon?.startsWith('data:')) ? (
          <Image source={{ uri: item.icon }} style={[S.iconImg, isTabletLayout && S.iconImgTablet]} resizeMode="cover"/>
        ) : (
          <Text style={[S.iconEmoji, isTabletLayout && S.iconEmojiTablet]}>{item.icon || '🧩'}</Text>
        )}
        {isStopped && (
          <View style={S.unavailMask}>
            <Text style={S.unavailIcon}>⊘</Text>
          </View>
        )}
      </Animated.View>
      <Text numberOfLines={2} style={[S.appName, isStopped && S.appNameStopped]}>{item.name}</Text>
    </Pressable>
  );
}

/** 下拉菜单项 */
type MenuItem = { icon: string; label: string; value?: string; onPress?: () => void };

export function DesktopScreen({ navigation }: DesktopScreenProps) {
  const insets = useSafeAreaInsets();
  const { apps, record, setApps } = useAppStore();

  // 禁用 Android 硬件返回键
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);
  const { isTablet: IT, columns } = getDeviceLayout();
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg]     = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortAZ, setSortAZ] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const list = await fetchAppList(record?.gatewayIp!, record?.gatewayPort!);
      setApps(list);
    } catch (err) { console.warn('刷新失败:', err); }
    finally { setRefreshing(false); }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handlePressApp = (item: AppItem) => {
    if (item.status === 'stopped') { showToast('服务未启动，请联系管理员'); return; }
    navigation.navigate('Webview', { url: item.url, title: item.name });
  };

  const handleToggleSort = useCallback(() => {
    setSortAZ(prev => !prev);
    setMenuVisible(false);
  }, [sortAZ]);

  // 状态排序权重：running/warning 在前，stopped 在后
  const statusOrder = (s?: string) => s === 'stopped' ? 1 : 0;

  // 排序后的 apps：默认按状态排（运行中在前），可切换为名称排序
  const sortedApps = sortAZ
    ? [...apps].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans'))
    : [...apps].sort((a, b) => statusOrder(a.status) - statusOrder(b.status));

  const menuItems: MenuItem[] = [
    {
      icon: '',
      label: '网络连接',
      value: record?.ssid ?? '未连接',
    },
    {
      icon: '',
      label: '服务地址',
      value: record?.gatewayIp ?? '未知',
    },
    {
      icon: '',
      label: '排序方式',
      value: sortAZ ? '名称' : '默认',
      onPress: handleToggleSort,
    },
    {
      icon: '',
      label: '版本',
      value: `v${APP_VERSION}`,
    },
  ];

  const renderItem = ({ item }: { item: AppItem }) => (
    <AppGridItem item={item} isTabletLayout={IT} onPress={handlePressApp} />
  );

  return (
    <View style={S.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={S.blobL} /><View style={S.blobR} />
      </View>

      {/* Toast */}
      {!!toastMsg && (
        <View style={S.toast} pointerEvents="none">
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text style={S.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* 安全区占位 */}
      <View style={{ height: insets.top, backgroundColor: colors.bg }} />

      {/* 顶栏 */}
      <View style={[S.topBar, IT && S.topBarTablet]}>
        <View style={S.topBarLeft}>
          <View style={S.appIconWrap}>
            <AppIcon source={yihuiPng} size={IT ? 30 : 26} />
          </View>
          <View>
            <Text style={S.title}>微应用桌面</Text>
            <Text style={S.subtitle}>IEC2000</Text>
          </View>
        </View>
        {/* ··· 更多按钮 */}
        <Pressable
          style={S.moreBtn}
          onPress={() => setMenuVisible(true)}
          hitSlop={14}
        >
          <Text style={S.moreDots}>···</Text>
        </Pressable>
      </View>

      {/* 下拉菜单 */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={S.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[S.menuCard, { top: insets.top + 56, right: 16 }, IT && { right: 24 }]}>
            {menuItems.map((item, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  S.menuItem,
                  i < menuItems.length - 1 && S.menuItemBorder,
                  pressed && item.onPress ? { backgroundColor: 'rgba(66,170,245,0.06)' } : {},
                ]}
                onPress={item.onPress}
                disabled={!item.onPress}
              >
                <Text style={S.menuLabel}>{item.label}</Text>
                {item.value ? (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={S.menuValue}>{item.value}</Text>
                    {item.onPress && <Text style={[S.menuArrow, { lineHeight: isTablet ? 16 : 14 }]}>›</Text>}
                  </View>
                ) : (
                  <Text style={S.menuArrow}>›</Text>
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* 宫格 */}
      <FlatList
        data={sortedApps}
        key={`grid-${columns}`}
        numColumns={columns}
        contentContainerStyle={[S.grid, IT && S.gridTablet]}
        columnWrapperStyle={S.row}
        keyExtractor={(item, i) => `${item.type}-${item.name}-${i}`}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={S.empty}>正在加载微应用...</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary}/>
        }
      />
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  blobL: { position: 'absolute', bottom: '-18%', left: '-18%', width: _SH * 0.52, height: _SH * 0.52, borderRadius: _SH * 0.26, backgroundColor: 'rgba(66,170,245,0.12)' },
  blobR: { position: 'absolute', bottom: '-22%', right: '-22%', width: _SH * 0.46, height: _SH * 0.46, borderRadius: _SH * 0.23, backgroundColor: 'rgba(66,170,245,0.16)' },

  toast: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,251,235,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
    elevation: 8,
    shadowColor: 'rgba(245,158,11,0.12)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  toastText: { color: '#92400e', fontSize: 14, fontWeight: '600', flex: 1 },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 5,
  },
  topBarTablet: { paddingHorizontal: 24 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appIconWrap: {
    width: isTablet ? 44 : 38,
    height: isTablet ? 44 : 38,
    borderRadius: isTablet ? 12 : 10,
    backgroundColor: colors.bgWhite,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: 'rgba(66,170,245,0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  title: { color: colors.text, fontSize: isTablet ? 20 : 16, fontWeight: '800' },
  subtitle: { color: colors.mutedText, fontSize: isTablet ? 12 : 10, marginTop: 1 },

  // ··· 按钮（无白底，紧凑）
  moreBtn: {
    width: isTablet ? 36 : 30,
    height: isTablet ? 36 : 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreDots: {
    fontSize: isTablet ? 18 : 15,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
    marginTop: -3,
  },

  // 下拉菜单
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menuCard: {
    position: 'absolute',
    width: isTablet ? 280 : 240,
    backgroundColor: colors.bgWhite,
    borderRadius: 16,
    paddingVertical: 6,
    elevation: 12,
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 0,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(66,170,245,0.08)',
  },
  menuLabel: { color: colors.text, fontSize: isTablet ? 15 : 14, fontWeight: '500', flex: 1 },
  menuValue: { color: colors.mutedText, fontSize: isTablet ? 13 : 12 },
  menuArrow: { color: colors.mutedText, fontSize: 18, fontWeight: '600' },

  grid: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 120 },
  gridTablet: { paddingHorizontal: 24 },
  row: { marginBottom: 20 },
  cell: { width: '25%', alignItems: 'center', paddingVertical: 5, position: 'relative' },
  cellTablet: {},
  cellStopped: { opacity: 0.4 },
  statusDot: {
    position: 'absolute',
    top: -2,
    right: '10%',
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.bg,
    zIndex: 2,
  },
  iconWrap: { width: 54, height: 54, borderRadius: 16, overflow: 'hidden', marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
  iconWrapTablet: { width: 60, height: 60, borderRadius: 18 },
  iconEmoji: { fontSize: 32, lineHeight: 36 },
  iconEmojiTablet: { fontSize: 36 },
  iconImg: { width: 54, height: 54 },
  iconImgTablet: { width: 60, height: 60 },
  unavailMask: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.70)', alignItems: 'center', justifyContent: 'center' },
  unavailIcon: { fontSize: 20, color: 'rgba(0,0,0,0.30)' },
  appName: { color: colors.text, fontSize: isTablet ? 12 : 10, fontWeight: '500', textAlign: 'center', lineHeight: isTablet ? 16 : 14 },
  appNameStopped: { color: colors.mutedText },
  empty: { color: colors.mutedText, textAlign: 'center', marginTop: 60, fontSize: 15 },
});
