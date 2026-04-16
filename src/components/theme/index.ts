export const THEME_STORAGE_KEY = "theme";

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export type ThemeMode = (typeof THEMES)[keyof typeof THEMES];

export function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return THEMES.LIGHT;

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
  return savedTheme ?? THEMES.LIGHT;
}

export function getNextTheme(currentTheme: ThemeMode): ThemeMode {
  return currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
}
