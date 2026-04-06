import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "@/lib/theme/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 88,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: "sparkles-outline",
            library: "book-outline",
            practice: "albums-outline",
            admin: "settings-outline",
          };

          return (
            <Ionicons
              color={color}
              name={iconMap[route.name] ?? "ellipse-outline"}
              size={size}
            />
          );
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
        }}
      />
    </Tabs>
  );
}
