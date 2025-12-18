"use client";
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import PasswordValidationDisplay from './PasswordValidationDisplay';

import { useTranslations } from '@/hooks/useTranslations';

export default function ResetPasswordStep({ 
  newPassword, 
  confirmPassword, 
  passwordValidation,
  onPasswordChange, 
  onConfirmPasswordChange,
  onResetPassword,
  onBack
}) {
  const { t } = useTranslations();
  return (
    <div className="space-y-6">
      <PasswordValidationDisplay validation={passwordValidation} />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('forgotPassword.resetStep.newPassword')}
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={newPassword}
            onChange={onPasswordChange}
            className="input-enterprise pl-11"
            placeholder={t('forgotPassword.resetStep.newPasswordPlaceholder')}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('forgotPassword.resetStep.confirmPassword')}
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            className="input-enterprise pl-11"
            placeholder={t('forgotPassword.resetStep.confirmPasswordPlaceholder')}
            required
          />
        </div>
      </div>

      <button className="btn-primary w-full py-4 flex items-center justify-center gap-2" onClick={onResetPassword}>
        {t('forgotPassword.resetStep.button')} <ArrowRight size={18} />
      </button>
      
      <div className="text-center">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
          <ArrowLeft size={14} /> {t('forgotPassword.resetStep.backToVerify')}
        </button>
      </div>
    </div>
  );
}


