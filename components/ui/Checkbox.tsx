import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/Text";
import { useAppTheme } from "@/lib/theme";

type CheckboxProps = {
  checked: boolean;
  label: string;
  onPress: () => void;
};

export function Checkbox({ checked, label, onPress }: CheckboxProps) {
  const theme = useAppTheme();

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked
              ? theme.colors.primary
              : theme.colors.surfaceElevated,
            borderColor: checked ? theme.colors.primary : theme.colors.border,
          },
        ]}
      />
      <Text variant="body">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  box: {
    borderRadius: 8,
    borderWidth: 1,
    height: 22,
    width: 22,
  },
});
