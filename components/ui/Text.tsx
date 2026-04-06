import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { useAppTheme } from "@/lib/theme";

type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "bodyStrong"
  | "label"
  | "caption";

type TextProps = RNTextProps & {
  color?: string;
  variant?: TextVariant;
};

export function Text({
  children,
  color,
  style,
  variant = "body",
  ...rest
}: TextProps) {
  const theme = useAppTheme();

  return (
    <RNText
      style={[
        theme.typography[variant],
        {
          color: color ?? theme.colors.text,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
