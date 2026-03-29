/**
 * CoreConvertedToast
 * 重複モンスターを捕獲した際に表示するトースト通知。
 * 「ナノコアに変換されました」を伝える。
 */

import { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";

interface Props {
  monsterName: string;
  coreQty: number;
  visible: boolean;
  onHide: () => void;
}

export function CoreConvertedToast({ monsterName, coreQty, visible, onHide }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -10, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        translateY.setValue(20);
        onHide();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 100,
        left: 20,
        right: 20,
        opacity,
        transform: [{ translateY }],
        zIndex: 999,
      }}
    >
      <View
        style={{
          backgroundColor: "#1A1A2E",
          borderRadius: 20,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderWidth: 1,
          borderColor: "#FF8C0060",
          shadowColor: "#FF8C00",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#FF8C0020",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22 }}>💎</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#FF8C00", fontWeight: "900", fontSize: 13 }}>
            ナノコアに変換！
          </Text>
          <Text style={{ color: "#9090AA", fontSize: 12, marginTop: 2 }}>
            {monsterName}のコア ×{coreQty} を獲得
          </Text>
          <Text style={{ color: "#606080", fontSize: 11, marginTop: 1 }}>
            強化素材として使えます
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
