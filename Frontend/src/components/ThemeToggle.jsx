"use client";

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? 'dark' : "light")}
      className="relative w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center group"
      aria-label="Toggle theme"
    >
      <Sun 
        className="w-5 h-5 text-amber-500 absolute transition-all duration-300 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" 
      />
      <Moon 
        className="w-5 h-5 text-indigo-400 absolute transition-all duration-300 rotate-90 scale-0 dark:rotate-0 dark:scale-100" 
      />
    </button>
  );
}


