"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false); // tipagem explícita

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = useMemo(() => {
    const t = theme === "system" ? resolvedTheme : theme;
    return t ?? "dark";
  }, [theme, resolvedTheme]);

  const isDark = current === "dark";

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="btn"
      aria-label="Alternar tema"
      title="Alternar tema"
    >
      <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}



