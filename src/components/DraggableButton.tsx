import React, { useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const BUTTON_SIZE = 52;
const DRAG_THRESHOLD = 5;

interface Props {
    onPress: () => void;
}

export function DraggableButton({ onPress }: Props) {
    const insets = useSafeAreaInsets();
    const { width: SW, height: SH } = Dimensions.get('window');

    const minX = insets.left + 8;
    const maxX = SW - insets.right - BUTTON_SIZE - 8;
    const minY = insets.top + 8;
    const maxY = SH - insets.bottom - BUTTON_SIZE - 8;

    const initPos = { x: minX, y: maxY - 60 };
    const pan = useRef(new Animated.ValueXY(initPos)).current;
    const lastPos = useRef(initPos);
    const hasDragged = useRef(false);

    const clamp = (val: number, min: number, max: number) =>
        Math.min(max, Math.max(min, val));

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: () => {
                hasDragged.current = false;
                pan.stopAnimation((current) => {
                    lastPos.current = { x: current.x, y: current.y };
                    pan.setOffset({ x: current.x, y: current.y });
                    pan.setValue({ x: 0, y: 0 });
                });
            },

            onPanResponderMove: (_, gs) => {
                if (Math.abs(gs.dx) > DRAG_THRESHOLD || Math.abs(gs.dy) > DRAG_THRESHOLD) {
                    hasDragged.current = true;
                }
                pan.setValue({
                    x: clamp(gs.dx, minX - lastPos.current.x, maxX - lastPos.current.x),
                    y: clamp(gs.dy, minY - lastPos.current.y, maxY - lastPos.current.y),
                });
            },

            onPanResponderRelease: (_, gs) => {
                pan.flattenOffset();

                if (!hasDragged.current) {
                    pan.setValue(lastPos.current);
                    onPress();
                    return;
                }

                const nx = clamp(lastPos.current.x + gs.dx, minX, maxX);
                const ny = clamp(lastPos.current.y + gs.dy, minY, maxY);
                const snapX = nx + BUTTON_SIZE / 2 < SW / 2 ? minX : maxX;
                const snapPos = { x: snapX, y: ny };

                Animated.spring(pan, {
                    toValue: snapPos,
                    useNativeDriver: false,
                    bounciness: 4,
                }).start(() => {
                    lastPos.current = snapPos;
                });
            },
        })
    ).current;

    return (
        <Animated.View
            style={[styles.wrap, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
            {...panResponder.panHandlers}
        >
            <View style={styles.btn} pointerEvents="none">
                <Text style={styles.icon}>←</Text>
                <Text style={styles.label}>桌面</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        zIndex: 999,
    },
    btn: {
        flex: 1,
        borderRadius: BUTTON_SIZE / 2,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 8,
    },
    icon: { color: '#fff', fontSize: 14, lineHeight: 16 },
    label: { color: '#fff', fontSize: 9, fontWeight: '700' },
});