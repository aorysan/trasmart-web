"use client";
import { useContext } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const context = useContext(ThemeContext);

  if (!context) return null;

  const { theme, toggleTheme } = context;

  return (
    <button onClick={toggleTheme}>
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
