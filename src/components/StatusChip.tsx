import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export function StatusChip({ type }: { type: 'system' | 'user' }) {
  const bg = type === 'system' ? '#F3E8FF' : '#E0F2FE';
  const fg = type === 'system' ? colors.system : colors.user;
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{type === 'system' ? '系统' : '用户'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  text: { fontSize: 12, fontWeight: '600' },
});
