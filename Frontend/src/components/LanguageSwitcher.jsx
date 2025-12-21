"use client";

import { ChevronDown, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function LanguageSwitcher({ dropUp = false }) {
  const [locale, setLocale] = useState('en');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const currentLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 'en';
    setLocale(currentLocale);
    document.documentElement.dir = currentLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLocale;
  }, []);

  const changeLanguage = (newLocale) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
    setLocale(newLocale);
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
        aria-label="Change language"
      >
        <Languages size={18} className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">
          {locale}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className={`absolute ltr:right-0 rtl:left-0 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50 z-50 overflow-hidden animate-fade-in-scale ${dropUp ? 'bottom-full mb-2' : 'mt-2'}`}>
            <div className="p-2">
              <button
                onClick={() => changeLanguage('en')}
                className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                  locale === 'en' 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🇺🇸</span>
                  <span>English</span>
                </div>
              </button>
              <button
                onClick={() => changeLanguage('ar')}
                className={`w-full px-4 py-3 rounded-xl transition-all duration-200 ${
                  locale === 'ar' 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🇸🇦</span>
                  <span>العربية</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


