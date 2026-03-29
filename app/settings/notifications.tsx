/**
 * 通知設定画面
 * profile.tsx の「通知設定」から遷移する
 */
import { View, Text, Switch, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
  requestNotificationPermission,
  cancelAllNotifications,
  scheduleDailyReminderNotification,
  getScheduledNotifications,
} from "@/services/notificationService";
import {
  registerBackgroundTask,
  unregisterBackgroundTask,
} from "@/services/backgroundTaskService";
import { useNotificationStore } from "@/store/notificationStore";

interface SettingRow {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

const SETTINGS: SettingRow[] = [
  {
    id: "encounter",
    label: "エンカウント通知",
    description: "モンスターが現れたときに通知",
    emoji: "👾",
  },
  {
    id: "daily",
    label: "デイリーリマインダー",
    description: "毎朝6:00に今日の目標を通知",
    emoji: "🌅",
  },
  {
    id: "milestone",
    label: "歩数マイルストーン",
    description: "3,000 / 7,000 / 10,000 歩達成時",
    emoji: "🏆",
  },
  {
    id: "mission",
    label: "ミッション完了",
    description: "デイリーミッション達成時",
    emoji: "✅",
  },
  {
    id: "evolution",
    label: "進化・絆レベルアップ",
    description: "モンスターの進化条件を満たしたとき",
    emoji: "✨",
  },
  {
    id: "background",
    label: "バックグラウンド検知",
    description: "アプリを閉じていてもエンカウントを検知（バッテリー消費増）",
    emoji: "🔄",
  },
];

export default function NotificationSettingsScreen() {
  const { setDailyReminderScheduled } = useNotificationStore();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    encounter:  true,
    daily:      true,
    milestone:  true,
    mission:    true,
    evolution:  true,
    background: false,
  });
  const [scheduledCount, setScheduledCount] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      const list = await getScheduledNotifications();
      setScheduledCount(list.length);
    })();
  }, []);

  const handleToggle = async (id: string, value: boolean) => {
    if (!permissionGranted && value) {
      Alert.alert(
        "通知が無効です",
        "設定アプリ › NanoWalk › 通知 から許可してください。",
        [{ text: "OK" }]
      );
      return;
    }

    setEnabled((prev) => ({ ...prev, [id]: value }));

    if (id === "background") {
      if (value) {
        await registerBackgroundTask();
      } else {
        await unregisterBackgroundTask();
      }
    }

    if (id === "daily") {
      if (value) {
        await scheduleDailyReminderNotification();
        setDailyReminderScheduled(true);
      } else {
        // デイリー通知のみキャンセルは expo-notifications ではIDが必要
        // ここでは全キャンセル後に有効なものだけ再スケジュールする簡易実装
        setDailyReminderScheduled(false);
      }
      const list = await getScheduledNotifications();
      setScheduledCount(list.length);
    }
  };

  const handleCancelAll = () => {
    Alert.alert(
      "全通知をキャンセル",
      "スケジュール済みの通知をすべて削除します。よろしいですか？",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            await cancelAllNotifications();
            setScheduledCount(0);
            setDailyReminderScheduled(false);
            setEnabled({
              encounter:  false,
              daily:      false,
              milestone:  false,
              mission:    false,
              evolution:  false,
              background: false,
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-2 pb-4 gap-3">
        <Pressable onPress={() => router.back()} className="active:opacity-60">
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="text-text text-xl font-nunito-black">通知設定</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission status */}
        <View
          className="p-3 rounded-xl mb-5 flex-row items-center gap-3"
          style={{
            backgroundColor: permissionGranted ? "#00C9A720" : "#FF6B6B20",
            borderWidth: 1,
            borderColor: permissionGranted ? "#00C9A740" : "#FF6B6B40",
          }}
        >
          <Text style={{ fontSize: 20 }}>{permissionGranted ? "🔔" : "🔕"}</Text>
          <Text
            className="flex-1 text-sm font-nunito"
            style={{ color: permissionGranted ? "#00C9A7" : "#FF6B6B" }}
          >
            {permissionGranted
              ? `通知が許可されています（${scheduledCount}件スケジュール中）`
              : "通知が許可されていません。設定アプリから許可してください。"}
          </Text>
        </View>

        {/* Settings list */}
        <View className="bg-bg-card rounded-2xl overflow-hidden mb-4">
          {SETTINGS.map((s, i) => (
            <View
              key={s.id}
              className="flex-row items-center px-4 py-4"
              style={{
                borderBottomWidth: i < SETTINGS.length - 1 ? 1 : 0,
                borderBottomColor: "#1F1F38",
              }}
            >
              <Text className="mr-3 text-xl">{s.emoji}</Text>
              <View className="flex-1 mr-3">
                <Text className="text-text font-nunito-bold text-sm">{s.label}</Text>
                <Text className="text-text-dim text-xs font-nunito mt-0.5">
                  {s.description}
                </Text>
              </View>
              <Switch
                value={enabled[s.id] ?? false}
                onValueChange={(v) => handleToggle(s.id, v)}
                trackColor={{ false: "#1F1F38", true: "#00C9A7" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#1F1F38"
              />
            </View>
          ))}
        </View>

        {/* Danger zone */}
        <Pressable
          onPress={handleCancelAll}
          className="py-3 rounded-xl items-center active:opacity-70"
          style={{ backgroundColor: "#FF6B6B20", borderWidth: 1, borderColor: "#FF6B6B40" }}
        >
          <Text className="text-accent font-nunito-bold">すべての通知をキャンセル</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
