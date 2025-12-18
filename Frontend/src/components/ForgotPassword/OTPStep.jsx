"use client";
import Link from 'next/link';
import { ShieldCheck, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

export default function OTPStep({ otp, setOtp, onVerifyCode, onResend }) {
  const { t } = useTranslations();
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('forgotPassword.otpStep.label')}
        </label>
        <div className="relative">
          <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            id="otp"
            name="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="input-enterprise pl-11 text-center text-2xl tracking-widest font-mono"
            placeholder={t('forgotPassword.otpStep.placeholder')}
            maxLength={6}
            required
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          {t('forgotPassword.otpStep.hint')}
        </p>
      </div>
      
      <button className="btn-primary w-full py-4 flex items-center justify-center gap-2" onClick={onVerifyCode}>
        {t('forgotPassword.otpStep.button')} <ArrowRight size={18} />
      </button>

      <div className="text-center space-y-3">
        <button 
          onClick={onResend}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
        >
          <RefreshCw size={14} /> {t('forgotPassword.otpStep.resend')}
        </button>
        <Link href="/login" className="block text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
          <span className="inline-flex items-center gap-2"><ArrowLeft size={14} /> {t('forgotPassword.otpStep.backToLogin')}</span>
        </Link>
      </div>
    </div>
  );
}


