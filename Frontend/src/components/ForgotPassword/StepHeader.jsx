"use client";
import { KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

export default function StepHeader({ step, error, success }) {
  const { t } = useTranslations();
  
  const content = {
    1: { title: t('forgotPassword.title'), subtitle: t('forgotPassword.subtitle') },
    2: { title: t('forgotPassword.otpStep.title'), subtitle: t('forgotPassword.otpStep.subtitle') },
    3: { title: t('forgotPassword.resetStep.title'), subtitle: t('forgotPassword.resetStep.subtitle') },
  };

  return (
    <div className="mb-8">
      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25 lg:hidden">
        <KeyRound className="text-white" size={28} />
      </div>
      
      <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white text-center lg:text-left">
        {content[step].title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center lg:text-left">
        {content[step].subtitle}
      </p>

      {/* Errors */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-700 dark:text-emerald-400 text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}


