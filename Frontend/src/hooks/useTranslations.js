"use client";

import { useEffect, useState } from 'react';
import enMessages from '../i18n/messages/en.json';

export function useTranslations() {
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState(enMessages);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get locale from cookie
    const currentLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] || 'en';
    
    setLocale(currentLocale);

    // Load translations
    const loadTranslations = async () => {
      try {
        setIsLoading(true);
        const translations = await import(`../i18n/messages/${currentLocale}.json`);
        setMessages(translations.default);
      } catch (error) {
        console.error('Error loading translations:', error);
        setMessages(enMessages);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, []);

  const t = (key, params = {}) => {
    if (!key) return '';
    
    const keys = key.split('.');
    let value = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value === 'string' && params) {
      Object.keys(params).forEach(paramKey => {
        value = value.replace(new RegExp(`{${paramKey}}`, 'g'), params[paramKey]);
      });
    }
    
    return value || key;
  };

  return { t, locale, isLoading };
}


