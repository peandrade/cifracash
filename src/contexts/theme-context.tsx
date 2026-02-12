"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  mounted: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Inicialização
  useEffect(() => {
    const saved = localStorage.getItem("cifracash-theme") as Theme | null;
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light");
    }
    setMounted(true);
  }, []);

  // Aplica tema no DOM (apenas na inicialização)
  useEffect(() => {
    if (!mounted) return;

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("cifracash-theme", theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";

    // 1. Aplica classe no DOM primeiro (CSS variables mudam instantaneamente)
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);

    // 2. Depois atualiza estado React (componentes re-renderizam)
    setTheme(newTheme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
