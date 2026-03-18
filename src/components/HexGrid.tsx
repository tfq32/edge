/**
 * HexGrid — src/components/HexGrid.tsx
 * 蜂窝网格 + 由中心向四周扩散的心跳动画（流畅版）。
 *
 * 优化点：
 * - 用单一 Animated.Value 驱动整个心跳周期，每圈用 interpolate
 *   精确映射到各自的 [亮起, 衰减] 时间窗口，避免多个 loop 时序漂移
 * - inputRange 连续无缝，动画曲线用 Easing.bezier 更柔和
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('screen');

interface Props {
  color?: string;
  /** 一次心跳总时长 ms，默认 4800 */
  duration?: number;
}

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

const RING_COUNT = 10;
// 每圈脉冲宽度（占整体周期的比例）
const PULSE_WIDTH = 0.28;
// 相邻圈的延迟（占整体周期的比例）
const RING_STEP = 0.08;
// 静息 opacity
const REST_OP = 0.08;
// 峰值 opacity
const PEAK_OP = 0.50;

export function HexGrid({ color = '#1e21f7', duration = 4800 }: Props) {
  const isTablet = Math.min(SW, SH) >= 768;
  const r = isTablet ? 62 : 42;
  const drawR = r - (isTablet ? 7 : 5);

  // 单一时间轴：0 → 1 循环，代表一个完整心跳周期
  const clock = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(clock, {
        toValue: 1,
        duration,
        easing: Easing.linear,   // 线性时钟，由 interpolate 塑形
        useNativeDriver: true,
      })
    ).start();
    return () => clock.stopAnimation();
  }, []);

  // 为每个 ring 生成 interpolate —— 映射到该圈的亮起/衰减时间窗口
  const ringOpacities = Array.from({ length: RING_COUNT }, (_, i) => {
    const t0 = i * RING_STEP;              // 脉冲开始时刻（归一化）
    const tPeak = t0 + PULSE_WIDTH * 0.3;  // 到达峰值
    const t1 = t0 + PULSE_WIDTH;           // 脉冲结束，回到静息

    // clamp to [0,1]
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    return clock.interpolate({
      inputRange: [
        0,
        clamp(t0 - 0.001),
        clamp(t0),
        clamp(tPeak),
        clamp(t1),
        1,
      ],
      outputRange: [REST_OP, REST_OP, PEAK_OP * 0.6, PEAK_OP, REST_OP, REST_OP],
      extrapolate: 'clamp',
    });
  });

  // 六边形布局 + 按 ring 分组
  const cx0 = SW / 2, cy0 = SH / 2;
  const maxDist = Math.sqrt(cx0 * cx0 + cy0 * cy0);
  const colW = Math.sqrt(3) * r;
  const rowH = 1.5 * r;
  const cols = Math.ceil(SW / colW) + 2;
  const rows = Math.ceil(SH / rowH) + 3;

  const groups: { cx: number; cy: number; key: string }[][] =
    Array.from({ length: RING_COUNT }, () => []);

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const hx = col * colW + (row % 2 !== 0 ? colW / 2 : 0);
      const hy = row * rowH;
      const dist = Math.sqrt((hx - cx0) ** 2 + (hy - cy0) ** 2);
      const ring = Math.min(
        Math.floor((dist / maxDist) * RING_COUNT),
        RING_COUNT - 1
      );
      groups[ring].push({ cx: hx, cy: hy, key: `${row}-${col}` });
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {groups.map((group, ringIdx) => (
        <Animated.View
          key={ringIdx}
          style={[StyleSheet.absoluteFill, { opacity: ringOpacities[ringIdx] }]}
        >
          <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
            {group.map(({ cx, cy, key }) => (
              <Polygon
                key={key}
                points={hexPoints(cx, cy, drawR)}
                fill="none"
                stroke={color}
                strokeWidth={isTablet ? 1.1 : 1}
              />
            ))}
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}
