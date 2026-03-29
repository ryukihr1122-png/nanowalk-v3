import { Tabs } from "expo-router";
import { View, Text } from "react-native";

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 4 }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10,
        marginTop: 2,
        color: focused ? "#00C9A7" : "#606080",
        fontWeight: focused ? "700" : "400",
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#161628",
          borderTopColor: "#1F1F38",
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          height: 56,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="ホーム" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗺" label="マップ" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="monsters"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👾" label="モンスター" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bag"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎒" label="バッグ" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="プロフィール" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
