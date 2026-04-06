import { createContext, useContext } from "react";

import { colors } from "@/lib/theme/colors";
import { spacing } from "@/lib/theme/spacing";
import { typography } from "@/lib/theme/typography";

const appTheme = {
  colors,
  spacing,
  typography,
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    pill: 999,
  },
};

const ThemeContext = createContext(appTheme);

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={appTheme}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
