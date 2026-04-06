import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { Provider as JotaiProvider } from "jotai";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { APP_DB_NAME } from "@/lib/constants/app";
import { runMigrations } from "@/lib/db/migrations";
import { queryClient } from "@/lib/query/client";
import { ThemeProvider } from "@/lib/theme";
import { syncWidgetSnapshot } from "@/lib/widget/snapshot";

async function initializeDatabase(db: SQLiteDatabase) {
  await runMigrations(db);
  await syncWidgetSnapshot(db);
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <JotaiProvider>
          <QueryClientProvider client={queryClient}>
            <SQLiteProvider
              databaseName={APP_DB_NAME}
              onInit={initializeDatabase}
              useSuspense
            >
              <ThemeProvider>
                <StatusBar style="dark" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "slide_from_right",
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="practice/session"
                    options={{
                      presentation: "card",
                    }}
                  />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </ThemeProvider>
            </SQLiteProvider>
          </QueryClientProvider>
        </JotaiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
