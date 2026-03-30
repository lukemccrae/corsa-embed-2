"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

/**
 * ThemeProvider
 *
 * - controls Tailwind dark class on <html>
 * - dynamically loads the PrimeReact theme CSS by adding/updating a <link id="primereact-theme" ...>
 *
 * Implementation notes:
 * - We intentionally default to a stable server-safe value ("light") for initial state so server and initial client render match.
 * - We then synchronize with localStorage / prefers-color-scheme on mount via useEffect. This avoids hydration mismatches.
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Stable server-side default (do NOT access window/localStorage here)
  const [theme, setThemeState] = useState<Theme>("dark");

  // On mount, read persisted user preference or system preference and apply it.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("theme");
    let initial: Theme = "dark";

    if (saved === "dark" || saved === "light") {
      initial = saved as Theme;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      initial = "dark";
    }

    // Only update state if it differs from the current state to avoid an unnecessary render.
    if (initial !== theme) {
      setThemeState(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // apply Tailwind dark class to root element and manage PrimeReact theme link whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);

    // Manage PrimeReact theme css link
    const themeLinkId = "primereact-theme";
    const existing = document.getElementById(themeLinkId) as HTMLLinkElement | null;

    const themeMap: Record<Theme, string> = {
      light: "https://unpkg.com/primereact/resources/themes/lara-light-blue/theme.css",
      dark: "https://unpkg.com/primereact/resources/themes/lara-dark-blue/theme.css",
    };

    const href = themeMap[theme];

    if (existing) {
      if (existing.getAttribute("href") !== href) {
        existing.setAttribute("href", href);
      }
    } else {
      const link = document.createElement("link");
      link.id = themeLinkId;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggle = () => setThemeState((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}