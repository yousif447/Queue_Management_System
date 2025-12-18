"use client";
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

export default function EmailStep({ email, setEmail, onSendCode }) {
  const { t } = useTranslations();
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('forgotPassword.emailStep.label')}
        </label>
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-enterprise pl-11"
            placeholder={t('forgotPassword.emailStep.placeholder')}
            required
          />
        </div>
      </div>

      <button className="btn-primary w-full py-4 flex items-center justify-center gap-2" onClick={onSendCode}>
        {t('forgotPassword.emailStep.button')} <ArrowRight size={18} />
      </button>

      <div className="text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
          <ArrowLeft size={16} /> {t('forgotPassword.emailStep.backToLogin')}
        </Link>
      </div>
    </div>
  );
}


