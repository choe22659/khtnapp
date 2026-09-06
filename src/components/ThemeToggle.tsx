'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Đảm bảo component chỉ render ở Client để tránh lỗi Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Trả về button ẩn/skeleton trong lúc chờ Client mount để không lệch UI
    return (
      <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm opacity-0 pointer-events-none">
        🌙 Chế độ Tối
      </button>
    );
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme;
  const isDark = currentTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
      title="Đổi giao diện Sáng/Tối"
    >
      {isDark ? (
        <>
          <span className="text-amber-400">☀️</span> Chế độ Sáng
        </>
      ) : (
        <>
          <span className="text-indigo-400">🌙</span> Chế độ Tối
        </>
      )}
    </button>
  );
}