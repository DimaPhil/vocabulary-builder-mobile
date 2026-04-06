import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/lib/theme";

type PageProps = PropsWithChildren<
  ScrollViewProps & {
    scrollEnabled?: boolean;
  }
>;

export function Page({
  children,
  contentContainerStyle,
  scrollEnabled = true,
  style,
  ...rest
}: PageProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.safeArea,
        { backgroundColor: theme.colors.background },
        style,
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.safeArea}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
          contentContainerStyle={[
            styles.content,
            {
              padding: theme.spacing.lg,
            },
            contentContainerStyle,
          ]}
          {...rest}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 120,
  },
});
