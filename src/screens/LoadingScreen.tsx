import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/appStore';

export function LoadingScreen({ text }: { text: string }) {
  const { notice, setNotice, setPhase } = useAppStore();
  const tags = ['✓ VSOA', '✓ MQTT', '✓ OPC UA', '✓ PLC', '✓ SCADA', '◌ Modbus', '◌ EtherCAT', 'S7', 'PROFINET', '告警', '时序DB'];

  useEffect(() => {
    const jumpTimer = setTimeout(() => setPhase('desktop'), 1600);
    return () => clearTimeout(jumpTimer);
  }, [setPhase]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = setTimeout(() => setNotice(null), 1200);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerText}>扫码连接</Text></View>
      {notice ? (
        <View style={styles.noticePill}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
      <View style={styles.successCircle}><Text style={styles.successMark}>✓</Text></View>
      <Text style={styles.title}>连接成功</Text>
      <Text style={styles.subtitle}>{text}</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}><Text style={styles.label}>边缘服务器</Text><Text style={styles.value}>Edge-Node-01</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>IP 地址</Text><Text style={styles.value}>192.168.100.50</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>系统版本</Text><Text style={styles.value}>SylixOS 3.6.5</Text></View>
        <View style={styles.infoRow}><Text style={styles.label}>连接状态</Text><Text style={[styles.value, styles.connected]}>● 已连接</Text></View>
      </View>

      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>
      <Text style={styles.progressText}>正在进入中转页面...</Text>
      <Text style={styles.progressSubText}>{text}</Text>

      <View style={styles.tagsWrap}>
        {tags.map(tag => {
          const isSuccess = tag.startsWith('✓');
          const isWarn = tag.includes('Modbus') || tag.includes('EtherCAT');
          return (
            <View key={tag} style={[styles.tag, isSuccess && styles.tagSuccess, isWarn && styles.tagWarn]}>
              <Text style={[styles.tagText, isSuccess && styles.tagSuccessText, isWarn && styles.tagWarnText]}>{tag}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 56, alignItems: 'center' },
  header: { marginBottom: 20 },
  headerText: { color: colors.text, fontSize: 18, fontWeight: '600' },
  noticePill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(34,211,123,0.16)', borderWidth: 1, borderColor: 'rgba(34,211,123,0.28)', marginBottom: 18 },
  noticeText: { color: '#3DDC84', fontSize: 14, fontWeight: '700' },
  successCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: '#16B364',
    backgroundColor: 'rgba(22,179,100,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#16B364',
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  successMark: { color: '#16B364', fontSize: 46, fontWeight: '700' },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 2, marginBottom: 26, textAlign: 'center' },
  infoCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  label: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
  value: { color: colors.text, fontSize: 15, fontWeight: '600' },
  connected: { color: '#22D37B' },
  progressTrack: { width: '100%', maxWidth: 360, height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 24, overflow: 'hidden' },
  progressFill: { width: '68%', height: '100%', backgroundColor: '#3DDC84', borderRadius: 999 },
  progressText: { color: colors.subText, marginTop: 14, fontSize: 18, fontWeight: '500' },
  progressSubText: { color: colors.mutedText, marginTop: 8, fontSize: 14 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 22, maxWidth: 420 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(90,108,255,0.45)', backgroundColor: 'rgba(74,86,212,0.12)' },
  tagSuccess: { borderColor: 'rgba(34,211,123,0.35)', backgroundColor: 'rgba(34,211,123,0.10)' },
  tagWarn: { borderColor: 'rgba(247,181,0,0.35)', backgroundColor: 'rgba(247,181,0,0.10)' },
  tagText: { color: '#9EA8FF', fontSize: 13, fontWeight: '500' },
  tagSuccessText: { color: '#3DDC84' },
  tagWarnText: { color: '#F7B500' },
});
