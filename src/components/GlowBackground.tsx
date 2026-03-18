/**
 * GlowBackground — src/components/GlowBackground.tsx
 * 蜂窝网格背景 + 极淡的顶部渐变，无可见实心圆。
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HexGrid } from './HexGrid';

interface Props {
  visible?: boolean;
  hexColor?: string;
  duration?: number;
}

export function GlowBackground({
  visible = true,
  hexColor = '#1e21f7',
  duration = 3500,
}: Props) {
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <HexGrid color={hexColor} duration={duration} />
    </View>
  );
}
