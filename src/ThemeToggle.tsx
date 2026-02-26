"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // ✅ useMemo SEMPRE é chamado (mesmo antes de mounted)
  const current = useMemo(() => {
    const t = theme === "system" ? resolvedTheme : theme;
    return t ?? "dark";
  }, [theme, resolvedTheme]);

  const isDark = current === "dark";

  // ✅ só controla render depois de todos hooks rodarem
  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-extrabold text-white transition rounded-xl ring-1 ring-white/10 bg-white/5 hover:bg-white/10"
      aria-label="Alternar tema"
    >
      <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}