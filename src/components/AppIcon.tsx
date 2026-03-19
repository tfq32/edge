/**
 * AppIcon — src/components/AppIcon.tsx
 * 应用主图标（PNG 位图）。
 *
 * 用法：
 *   <AppIcon size={48} />
 *   <AppIcon size={32} />
 */
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appIconSource = require('../assets/app.png');

interface Props {
  source?: ImageSourcePropType
  size?: number;
}

export function AppIcon({ source = appIconSource, size = 48 }: Props) {
  return (
    <Image
      source={source}
      style={[styles.icon, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    // 默认尺寸，会被 size prop 覆盖
    width: 48,
    height: 48,
  },
});
