"use client";

import React, { useState, useEffect } from 'react';
import useLocalization from '@/hooks/useLocalization';

export default function LanguageToggle() {
  const { language, changeLanguage } = useLocalization();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full p-1">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded-full font-medium text-sm transition-all ${
          language === 'en'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('ar')}
        className={`px-3 py-1 rounded-full font-medium text-sm transition-all ${
          language === 'ar'
            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        العربية
      </button>
    </div>
  );
}


