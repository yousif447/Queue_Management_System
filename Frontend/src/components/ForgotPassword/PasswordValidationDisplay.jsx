"use client";
import { Check, X } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

export default function PasswordValidationDisplay({ validation }) {
  const { t } = useTranslations();

  const rules = [
    { key: 'minLength', label: t('forgotPassword.validation.minLength') },
    { key: 'hasUppercase', label: t('forgotPassword.validation.hasUppercase') },
    { key: 'hasLowercase', label: t('forgotPassword.validation.hasLowercase') },
    { key: 'hasDigit', label: t('forgotPassword.validation.hasDigit') },
    { key: 'hasSpecialChar', label: t('forgotPassword.validation.hasSpecialChar') },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 p-4 rounded-xl space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('forgotPassword.validation.title')}</p>
      {rules.map((rule) => (
        <div key={rule.key} className={`flex items-center gap-2 text-sm transition-colors ${
          validation[rule.key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
            validation[rule.key] 
              ? 'bg-emerald-100 dark:bg-emerald-500/20' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            {validation[rule.key] 
              ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
              : <X size={12} className="text-gray-400 dark:text-gray-500" />
            }
          </div>
          <span>{rule.label}</span>
        </div>
      ))}
    </div>
  );
}


