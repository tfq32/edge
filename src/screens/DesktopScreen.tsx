import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppStore } from '../store/appStore';
import { colors } from '../theme/colors';
import { getDeviceLayout } from '../utils/device';
import { fetchAppListWithFallback, fetchGatewayIp } from '../services/gateway';

const navItems = [
  { key: 'home', icon: '🏠', label: '首页' },
  { key: 'connect', icon: '🔗', label: '连接' },
  { key: 'data', icon: '📊', label: '数据' },
  { key: 'mine', icon: '👤', label: '我的' },
];

export function DesktopScreen() {
  const [keyword, setKeyword] = useState('');
  const { apps, record, openWebview, setApps, setError, setPhase } = useAppStore();
  const { isTablet, columns } = getDeviceLayout();

  useEffect(() => {
    const run = async () => {
      if (!record) {
        return;
      }
      try {
        const gatewayIp = record.gatewayIp || (await fetchGatewayIp());
        Alert.alert('连接成功', `已连接到网关: ${gatewayIp}`, [{ text: '确定' }]);
        const list = await fetchAppListWithFallback(gatewayIp);
        setApps(list);
      } catch (error) {
        setError(error instanceof Error ? error.message : '桌面数据加载失败');
        setPhase('connect-failed');
      }
    };

    run();
  }, [record, setApps, setError, setPhase]);

  const data = useMemo(() => apps.filter(item => item.name.toLowerCase().includes(keyword.toLowerCase())), [apps, keyword]);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, isTablet && styles.topBarTablet]}>
        <View>
          <Text style={styles.title}>微应用桌面</Text>
          <Text style={styles.subtitle}>SSID: {record?.ssid || '-'} · 网关: {record?.gatewayIp || '-'}</Text>
        </View>
      </View>

      <View style={[styles.searchWrap, isTablet && styles.searchWrapTablet]}>
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="搜索微应用..."
          placeholderTextColor={colors.mutedText}
          style={styles.search}
        />
      </View>

      <FlatList
        data={data}
        key={columns}
        numColumns={columns}
        contentContainerStyle={[styles.list, isTablet && styles.listTablet]}
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        keyExtractor={item => `${item.type}-${item.name}-${item.url}`}
        renderItem={({ item, index }) => (
          <Pressable style={[styles.card, isTablet && styles.cardTablet]} onPress={() => openWebview(item.url)}>
            <View style={[styles.iconWrap, { backgroundColor: iconColors[index % iconColors.length] }]}>
              {/* <Text style={styles.iconText}>{item.icon || '🧩'}</Text> */}
              <Image source={{ uri: item.icon }} style={{ width: 36, height: 36 }} resizeMode="contain" />
              <View style={styles.statusDot} />
            </View>
            <Text numberOfLines={2} style={styles.name}>{item.name}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>正在加载微服务...</Text>}
      />

      <View style={[styles.bottomNav, isTablet && styles.bottomNavTablet]}>
        {navItems.map((item, index) => (
          <View key={item.key} style={styles.navItem}>
            <View style={[styles.navIconWrap, index === 0 && styles.navIconWrapActive]}>
              <Text style={styles.navIcon}>{item.icon}</Text>
            </View>
            <Text style={[styles.navLabel, index === 0 && styles.navLabelActive]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const iconColors = ['#5B5CFF', '#8B5CF6', '#14B8FF', '#F59E0B', '#EF4444', '#22C55E', '#EC4899', '#F97316', '#3B82F6', '#10B981'];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 14 },
  topBarTablet: { paddingHorizontal: 40, paddingTop: 26 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  subtitle: { marginTop: 6, color: colors.mutedText, fontSize: 13 },
  searchWrap: { paddingHorizontal: 24, marginBottom: 16 },
  searchWrapTablet: { paddingHorizontal: 40, marginBottom: 28 },
  search: {
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    color: colors.text,
  },
  list: { paddingHorizontal: 12, paddingBottom: 140 },
  listTablet: { paddingHorizontal: 32, paddingBottom: 120 },
  row: { marginBottom: 12, justifyContent: 'flex-start' },
  card: { width: '25%', alignItems: 'center', marginBottom: 12, position: 'relative' },
  cardTablet: { maxWidth: 120 },
  iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  iconText: { fontSize: 28 },
  statusDot: { position: 'absolute', right: -2, top: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22D37B', borderWidth: 2, borderColor: colors.bg },
  name: { color: colors.text, fontSize: 12, textAlign: 'center' },
  empty: { textAlign: 'center', color: colors.subText, marginTop: 60 },
  bottomNav: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 18,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bottomNavTablet: { left: 56, right: 56 },
  navItem: { alignItems: 'center' },
  navIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navIconWrapActive: { backgroundColor: colors.primary },
  navIcon: { fontSize: 20 },
  navLabel: { color: colors.mutedText, fontSize: 12, marginTop: 4 },
  navLabelActive: { color: colors.text },
});
