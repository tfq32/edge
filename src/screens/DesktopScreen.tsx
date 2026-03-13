import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { DesktopScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';
import { getDeviceLayout } from '../utils/device';
import type { AppItem } from '../types';

const NAV_ITEMS = [
  { key: 'home', icon: '🏠', label: '首页' },
  { key: 'connect', icon: '🔗', label: '连接' },
  { key: 'data', icon: '📊', label: '数据' },
  { key: 'mine', icon: '👤', label: '我的' },
];

const ICON_COLORS = [
  '#5B5CFF', '#8B5CF6', '#14B8FF', '#F59E0B',
  '#EF4444', '#22C55E', '#EC4899', '#F97316',
  '#3B82F6', '#10B981', '#06B6D4', '#A855F7',
];

const STATUS_COLOR: Record<string, string> = {
  running: colors.success,
  stopped: colors.danger,
  warning: colors.warning,
};

export function DesktopScreen({ navigation }: DesktopScreenProps) {
  const { apps, record } = useAppStore();
  const { isTablet, columns } = getDeviceLayout();
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(
    () => apps.filter(a => a.name.toLowerCase().includes(keyword.toLowerCase())),
    [apps, keyword],
  );

  const statusCounts = useMemo(() => ({
    running: apps.filter(a => !a.status || a.status === 'running').length,
    warning: apps.filter(a => a.status === 'warning').length,
    stopped: apps.filter(a => a.status === 'stopped').length,
  }), [apps]);

  const handlePressApp = (item: AppItem) => {
    if (item.status === 'stopped') return;
    // push 到 Webview，保留桌面在栈里，DraggableButton 可以 goBack()
    navigation.navigate('Webview', { url: item.url, title: item.name });
  };

  const renderItem = ({ item, index }: { item: AppItem; index: number }) => {
    const isStopped = item.status === 'stopped';
    const showDot   = item.status === 'warning' || item.status === 'stopped';
    const dotColor  = STATUS_COLOR[item.status ?? 'running'] ?? colors.success;

    return (
      <Pressable
        style={[styles.cell, isTablet && styles.cellTablet, isStopped && styles.cellStopped]}
        onPress={() => handlePressApp(item)}
      >
        <View style={[styles.iconWrap, { backgroundColor: ICON_COLORS[index % ICON_COLORS.length] }]}>
          {(item.icon?.startsWith('http') || item.icon?.startsWith('data:')) ? (
            <Image source={{ uri: item.icon }} style={styles.iconImg} resizeMode="contain" />
          ) : (
            <Text style={styles.iconEmoji}>{item.icon || '🧩'}</Text>
          )}
          {showDot && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
        </View>
        <Text numberOfLines={2} style={[styles.appName, isStopped && styles.appNameStopped]}>
          {item.name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={[styles.topBar, isTablet && styles.topBarTablet]}>
        <View>
          <Text style={styles.title}>微应用桌面</Text>
          <Text style={styles.subtitle}>{record?.ssid ?? '-'} · {record?.gatewayIp ?? '-'}</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarIcon}>👤</Text></View>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, isTablet && styles.searchWrapTablet]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="搜索微应用..."
          placeholderTextColor={colors.mutedText}
          style={styles.searchInput}
        />
      </View>

      {/* Status summary */}
      <View style={[styles.statusBar, isTablet && styles.statusBarTablet]}>
        {[
          { color: colors.success, label: '运行中', count: statusCounts.running },
          { color: colors.warning, label: '异常',   count: statusCounts.warning },
          { color: colors.danger,  label: '停止',   count: statusCounts.stopped },
        ].map(({ color, label, count }) => (
          <View key={label} style={[styles.chip, { borderColor: `${color}30`, backgroundColor: `${color}0f` }]}>
            <View style={[styles.chipDot, { backgroundColor: color }]} />
            <Text style={[styles.chipLabel, { color }]}>{label}</Text>
            <Text style={[styles.chipCount, { color }]}>{count}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
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
            {keyword ? '未找到匹配的微应用' : '正在加载微服务...'}
          </Text>
        }
      />

      {/* Bottom nav */}
      <View style={[styles.bottomNav, isTablet && styles.bottomNavTablet]}>
        {NAV_ITEMS.map((item, i) => (
          <View key={item.key} style={styles.navItem}>
            <View style={[styles.navIconWrap, i === 0 && styles.navIconActive]}>
              <Text style={styles.navIcon}>{item.icon}</Text>
            </View>
            <Text style={[styles.navLabel, i === 0 && styles.navLabelActive]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarTablet: { paddingHorizontal: 36, paddingTop: 28 },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.primary, fontSize: 11, marginTop: 2 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  avatarIcon: { fontSize: 14 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, height: 36, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, gap: 6 },
  searchWrapTablet: { marginHorizontal: 36 },
  searchIcon: { fontSize: 13, color: colors.mutedText },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  statusBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  statusBarTablet: { paddingHorizontal: 36 },
  chip: { flex: 1, height: 28, borderRadius: 6, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  chipDot: { width: 5, height: 5, borderRadius: 3 },
  chipLabel: { fontSize: 10, fontWeight: '700' },
  chipCount: { fontSize: 10, opacity: 0.7 },
  grid: { paddingHorizontal: 14, paddingBottom: 110 },
  gridTablet: { paddingHorizontal: 28 },
  row: { marginBottom: 20 },
  cell: { width: '25%', alignItems: 'center', paddingVertical: 4 },
  cellTablet: { maxWidth: 100 },
  cellStopped: { opacity: 0.35 },
  iconWrap: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6, position: 'relative' },
  iconEmoji: { fontSize: 26 },
  iconImg: { width: 34, height: 34 },
  dot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.bg },
  appName: { color: colors.subText, fontSize: 11, textAlign: 'center', lineHeight: 15 },
  appNameStopped: { color: colors.mutedText },
  empty: { color: colors.mutedText, textAlign: 'center', marginTop: 60, fontSize: 14 },
  bottomNav: { position: 'absolute', left: 20, right: 20, bottom: 20, height: 68, borderRadius: 20, backgroundColor: colors.bgCardStrong, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  bottomNavTablet: { left: 48, right: 48 },
  navItem: { alignItems: 'center', gap: 2 },
  navIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: colors.primary },
  navIcon: { fontSize: 18 },
  navLabel: { color: colors.mutedText, fontSize: 11 },
  navLabelActive: { color: colors.text },
});
