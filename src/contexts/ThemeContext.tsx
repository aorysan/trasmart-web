// // src/context/ThemeContext.tsx
// "use client";

// import { createContext, useState, useEffect, ReactNode } from "react";
// import {
//   getInitialTheme,
//   getNextTheme,
//   THEME_STORAGE_KEY,
//   ThemeMode,
// } from "@/app/components/theme";

// interface ThemeContextType {
//   theme: ThemeMode;
//   toggleTheme: () => void;
// }

// export const ThemeContext = createContext<ThemeContextType | undefined>(
//   undefined,
// );

// export function ThemeProvider({ children }: { children: ReactNode }) {
//   const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//     document.documentElement.setAttribute("data-theme", theme);
//   }, [theme]);

//   const toggleTheme = () => {
//     const newTheme = getNextTheme(theme);
//     setTheme(newTheme);
//     localStorage.setItem(THEME_STORAGE_KEY, newTheme);
//   };

//   if (!mounted) return <>{children}</>;

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// }