import React, { useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const isTablet = Math.min(SW, SH) >= 768;
const BUTTON_SIZE = isTablet ? 64 : 54;
const DRAG_THRESHOLD = 5;

function DesktopIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" fill="none">
      <Path
        d="M387.1 202.7c13.1 0 24.3 4.5 33.6 13.6 9.3 9 14 20.1 14 33.2V438c0 13.1-4.7 24.3-14 33.6s-20.5 13.9-33.6 14H198.6c-13.1 0-24.1-4.6-33.2-14-9-9.3-13.6-20.5-13.6-33.6V249.5c0-13.1 4.5-24.1 13.6-33.2 9-9.1 20.1-13.6 33.2-13.6h188.5z m0 377.1c13.1 0 24.3 4.5 33.6 13.6 9.3 9 14 20.1 14 33.2v189.3c0 13.1-4.7 24.1-14 33.2-9.3 9-20.5 13.6-33.6 13.6H198.6c-13.1 0-24.1-4.5-33.2-13.6-9-9-13.6-20.1-13.6-33.2V626.5c0-13.1 4.5-24.1 13.6-33.2 9-9.1 20.1-13.6 33.2-13.6h188.5z m377.8 0c13.1 0 24.1 4.5 33.2 13.6 9 9 13.6 20.1 13.6 33.2v189.3c0 13.1-4.5 24.1-13.6 33.2-9 9-20.1 13.6-33.2 13.6H576.4c-13.1 0-24.3-4.5-33.6-13.6-9.3-9-14-20.1-14-33.2V626.5c0-13.1 4.6-24.1 14-33.2 9.3-9.1 20.5-13.6 33.6-13.6h188.5z m78.2-265.6c10.1 10.1 15.1 21.9 15.1 35.4 0 13.6-5 25.1-15.1 34.7L702.8 524.6c-10.1 10.1-21.7 15.1-35.1 15.1s-25-5-35.1-15.1L492.5 384.3c-9.6-9.6-14.3-21.1-14.3-34.7 0-13.6 4.8-25.4 14.3-35.4l140.3-140.3c10.1-9.5 21.7-14.3 35.1-14.3s25 4.8 35.1 14.3l140.1 140.3z"
        fill="rgba(255,255,255,0.95)"
      />
    </Svg>
  );
}

interface Props { onPress: () => void; }

export function DraggableButton({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = Dimensions.get('window');
  const minX = insets.left + 12, maxX = W - insets.right - BUTTON_SIZE - 12;
  const minY = insets.top + 12,  maxY = H - insets.bottom - BUTTON_SIZE - 12;
  const initPos = { x: maxX, y: maxY - 20 };

  const pan         = useRef(new Animated.ValueXY(initPos)).current;
  const lastPos     = useRef(initPos);
  const hasDragged  = useRef(false);
  const pressScale  = useRef(new Animated.Value(1)).current;

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        hasDragged.current = false;
        Animated.spring(pressScale, { toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
        pan.stopAnimation(cur => {
          lastPos.current = { x: cur.x, y: cur.y };
          pan.setOffset({ x: cur.x, y: cur.y });
          pan.setValue({ x: 0, y: 0 });
        });
      },
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > DRAG_THRESHOLD || Math.abs(gs.dy) > DRAG_THRESHOLD) hasDragged.current = true;
        pan.setValue({
          x: clamp(gs.dx, minX - lastPos.current.x, maxX - lastPos.current.x),
          y: clamp(gs.dy, minY - lastPos.current.y, maxY - lastPos.current.y),
        });
      },
      onPanResponderRelease: (_, gs) => {
        Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
        pan.flattenOffset();
        if (!hasDragged.current) { pan.setValue(lastPos.current); onPress(); return; }
        const nx = clamp(lastPos.current.x + gs.dx, minX, maxX);
        const ny = clamp(lastPos.current.y + gs.dy, minY, maxY);
        const snapX  = nx + BUTTON_SIZE / 2 < W / 2 ? minX : maxX;
        const snapPos = { x: snapX, y: ny };
        Animated.spring(pan, { toValue: snapPos, useNativeDriver: false, bounciness: 6, speed: 14 }).start(() => { lastPos.current = snapPos; });
      },
    }),
  ).current;

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]} {...panResponder.panHandlers}>
      <Animated.View style={[styles.btn, { transform: [{ scale: pressScale }] }]} pointerEvents="none">
        <View style={styles.highlight} />
        <DesktopIcon size={isTablet ? 30 : 24} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', width: BUTTON_SIZE, height: BUTTON_SIZE, zIndex: 999 },
  btn: {
    position: 'absolute', top: 0, left: 0, width: BUTTON_SIZE, height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#42aaf5',
    borderTopWidth: 1.5, borderLeftWidth: 1.5, borderBottomWidth: 3, borderRightWidth: 2,
    borderTopColor: 'rgba(168,216,248,0.8)', borderLeftColor: 'rgba(140,200,245,0.7)',
    borderBottomColor: 'rgba(20,100,160,0.5)', borderRightColor: 'rgba(30,120,180,0.45)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', elevation: 10,
    shadowColor: 'rgba(66,170,245,0.45)', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 10,
  },
  highlight: { position: 'absolute', top: 0, left: 0, right: 0, height: BUTTON_SIZE * 0.45, borderRadius: BUTTON_SIZE / 2, backgroundColor: 'rgba(255,255,255,0.20)' },
});