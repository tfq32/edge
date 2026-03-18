import React, { useMemo, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { DesktopScreenProps } from '../navigation/types';
import { Dimensions } from 'react-native';
import { colors } from '../theme/colors';

const { width: _SW, height: _SH } = Dimensions.get('window');
const isTablet = Math.min(_SW, _SH) >= 768;
import { AppIcon } from '../components/AppIcon';
import { useAppStore } from '../store/appStore';
import { getDeviceLayout } from '../utils/device';
import type { AppItem } from '../types';
import { fetchAppList } from '../services/gateway';

const STATUS_COLOR: Record<string, string> = {
  running: colors.success,
  stopped: colors.danger,
  warning: colors.warning,
};

export function DesktopScreen({ navigation }: DesktopScreenProps) {
  const { apps, record, setApps } = useAppStore();
  const { isTablet, columns } = getDeviceLayout();
  const [keyword, setKeyword] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const list = await fetchAppList(record?.gatewayIp!, record?.gatewayPort!);
      setApps(list);
    } catch (err) {
      console.warn('刷新失败:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(
    () => apps.filter(a => a.name.toLowerCase().includes(keyword.toLowerCase())),
    [apps, keyword],
  );

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handlePressApp = (item: AppItem) => {
    if (item.status === 'stopped') {
      showToast('服务未启动，请联系管理员');
      return;
    }
    navigation.navigate('Webview', { url: item.url, title: item.name });
  };

  const renderItem = ({ item, index }: { item: AppItem; index: number }) => {
    const isStopped = item.status === 'stopped';
    const showDot = item.status === 'warning';
    const dotColor = STATUS_COLOR[item.status ?? 'running'] ?? colors.success;
    const scaleAnim = new Animated.Value(1);

    const onPressIn = () => Animated.spring(scaleAnim, {
      toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 0,
    }).start();

    const onPressOut = () => Animated.spring(scaleAnim, {
      toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10,
    }).start();

    return (
      <Pressable
        style={[styles.cell, isTablet && styles.cellTablet, isStopped && styles.cellStopped]}
        onPress={() => handlePressApp(item)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {showDot && (
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        )}

        <Animated.View style={[styles.iconWrap, isTablet && styles.iconWrapTablet, { transform: [{ scale: scaleAnim }] }]}>
          {/* 立体底层阴影 */}
          <View style={[styles.iconShadow, isTablet && styles.iconShadowTablet]} />
          {/* 主体圆角背景 */}
          <View style={[styles.iconBg, isTablet && styles.iconBgTablet]}>
            {/* 顶部高光 */}
            <View style={styles.iconHighlight} />
            {(item.icon?.startsWith('http') || item.icon?.startsWith('data:')) ? (
              <Image
                source={{ uri: item.icon }}
                style={[styles.iconImg, isTablet && styles.iconImgTablet]}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.iconInner, isTablet && styles.iconInnerTablet]}>
                <Text style={[styles.iconEmoji, isTablet && styles.iconEmojiTablet]}>
                  {item.icon || '🧩'}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Text numberOfLines={2} style={[styles.appName, isStopped && styles.appNameStopped]}>
          {item.name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* 顶部 Toast 提示 */}
      {!!toastMsg && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}
      {/* 柔和多色渐变背景层 */}
      {/* 渐变色背景层 */}
      <View style={styles.gradLayer1} />
      <View style={styles.gradLayer2} />
      <View style={styles.gradLayer3} />
      {/* Top bar */}
      <View style={[styles.topBar, isTablet && styles.topBarTablet]}>
        <View style={styles.topBarLeft}>
          {/* App icon placeholder (replace with actual icon if available) */}
          <View style={styles.appIconWrap}>
            <AppIcon size={26} />
          </View>
          <View>
            <Text style={styles.title}>微应用桌面</Text>
            <Text style={styles.subtitle}>
              {record?.ssid ?? '--'}  ·  {record?.gatewayIp ?? '--'}  ·  ONLINE
            </Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <View style={styles.onlineDot} />
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchWrap, isTablet && styles.searchWrapTablet]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="搜索微应用..."
          placeholderTextColor={colors.placeholder}
          style={styles.searchInput}
        />
      </View>

      {/* App grid — 无 tab 标签，直接宫格 */}
      <FlatList
        data={filtered}
        key={`grid-${columns}`}
        numColumns={columns}
        contentContainerStyle={[styles.grid, isTablet && styles.gridTablet]}
        columnWrapperStyle={styles.row}
        keyExtractor={(item, i) => `${item.type}-${item.name}-${i}`}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {keyword ? '未找到匹配的微应用' : '正在加载微应用...'}
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // 渐变背景层：三个斜向柔和色带叠加，形成非单一背景色
  toast: {
    position: 'absolute',
    top: 64,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(40,28,8,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.55)',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 999,
  },
  toastText: {
    color: '#fcd34d',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  // 顶部暗、底部蓝的渐变层
  gradLayer1: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
    backgroundColor: 'rgba(6,9,42,0.45)',   // 顶部深暗遮罩（稍浅）
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    transform: [{ scaleX: 1.6 }],
    zIndex: 0,
  },
  gradLayer2: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '55%',
    backgroundColor: 'rgba(14,20,100,0.45)', // 底部蓝色光晕
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    transform: [{ scaleX: 1.4 }],
    zIndex: 0,
  },
  gradLayer3: {
    position: 'absolute',
    bottom: '-10%',
    alignSelf: 'center',
    left: '10%',
    right: '10%',
    height: '35%',
    backgroundColor: 'rgba(30,33,247,0.12)', // 底部主色蓝强化
    borderRadius: 999,
    zIndex: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#04072a',
  },

  // Top bar
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: 'rgba(8,12,60,0.85)',
  },
  topBarTablet: { paddingHorizontal: 48, paddingTop: 28 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appIconWrap: {
    width: isTablet ? 44 : 34,
    height: isTablet ? 44 : 34,
    borderRadius: isTablet ? 10 : 8,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: isTablet ? 20 : 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: colors.primaryLight,
    fontSize: isTablet ? 11 : 9,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
    // elevation alone won't glow, but keeps Android consistent
    elevation: 2,
  },
  avatar: {
    width: isTablet ? 44 : 34,
    height: isTablet ? 44 : 34,
    borderRadius: isTablet ? 10 : 8,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: 14 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 14,
    height: isTablet ? 44 : 36,
    borderRadius: 6,
    backgroundColor: 'rgba(30,33,247,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(30,33,247,0.45)',
    paddingHorizontal: 12,
    gap: 7,
  },
  searchWrapTablet: { marginHorizontal: 32 },
  searchIcon: { fontSize: 13, opacity: 0.8 },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    padding: 0,
  },

  // Grid
  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  gridTablet: { paddingHorizontal: 28 },
  row: { marginBottom: 24 },

  // Cell — iOS launcher style: no box, pure icon + label
  cell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  cellTablet: {
    // tablet 8列，保持紧凑
  },
  cellStopped: { opacity: 0.55 },  // 停止状态更可见，点击时提示

  // Status dot badge
  statusDot: {
    position: 'absolute',
    top: 0,
    right: '12%',
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.bg,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },

  // 停止状态遮罩
  unavailableMask: {
    position: 'absolute',
    inset: 0,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(3,5,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableIcon: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 26,
  },
  // 图标容器：圆角裁剪，直接填充图标，无背景层
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapTablet: {
    width: 72,
    height: 72,
    borderRadius: 22,
  },
  iconEmoji: { fontSize: 34, lineHeight: 38 },
  iconEmojiTablet: { fontSize: 46 },
  iconImg: { width: 54, height: 54 },
  iconImgTablet: { width: 64, height: 64 },

  // App name
  appName: {
    color: colors.subText,
    fontSize: isTablet ? 13 : 11,
    textAlign: 'center',
    lineHeight: isTablet ? 18 : 15,
  },
  appNameStopped: { color: 'rgba(184,186,253,0.4)' },

  empty: {
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 60,
    fontSize: 14,
  },
});
