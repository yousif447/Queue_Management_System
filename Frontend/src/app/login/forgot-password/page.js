"use client";
import { API_URL } from '@/lib/api';
import EmailStep from '@/components/ForgotPassword/EmailStep';
import OTPStep from '@/components/ForgotPassword/OTPStep';
import ResetPasswordStep from '@/components/ForgotPassword/ResetPasswordStep';
import StepHeader from '@/components/ForgotPassword/StepHeader';
import { useTranslations } from '@/hooks/useTranslations';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react';

export default function page() {
  const { t } = useTranslations();
  const router = useRouter()
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasDigit: false,
    hasSpecialChar: false,
  });

  // Clear errors and success messages when step changes
  useState(() => {
    setError('');
    setSuccess('');
  }, [step]);

  const validatePassword = (password) => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasDigit: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
    });
  };

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
    validatePassword(e.target.value);
    if (error) setError('');
  };

  const handleSendResetCode = async (isResend = false) => {
    const resend = isResend === true;
    setError('');
    if (resend) setSuccess(t('forgotPassword.otpStep.sendingCode')); 
    else setSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      if (resend) {
        setSuccess(t('forgotPassword.otpStep.codeResent'));
      } else {
        setStep(2);
      }
    } catch (error) {
      setError(error.message);
      setSuccess('');
    }
  };

  const handleVerifyCode = () => {
    setError('');
    if (isNaN(otp) || otp.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setStep(3);
  };

  const handleResetPassword = async () => {
    const isAllValid = Object.values(passwordValidation).every(v => v === true);
    if (!isAllValid) {
      setError("Please meet all password requirements");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/reset-password/${otp}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess("Password reset successfully");
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const steps = [
    { num: 1, label: t('forgotPassword.steps.email'), icon: Mail },
    { num: 2, label: t('forgotPassword.steps.verify'), icon: ShieldCheck },
    { num: 3, label: t('forgotPassword.steps.reset'), icon: KeyRound },
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center p-16">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8">
            <KeyRound size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">{t('forgotPassword.title')}</h1>
          <p className="text-xl text-white/80 mb-12 leading-relaxed">
            {t('forgotPassword.subtitle')}
          </p>

          {/* Steps Indicator */}
          <div className="flex items-center gap-4">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all ${
                  step >= s.num 
                    ? 'bg-white text-emerald-600' 
                    : 'bg-white/20 text-white/60'
                }`}>
                  <s.icon size={20} />
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 h-1 mx-2 rounded-full transition-all ${step > s.num ? 'bg-white' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col justify-center bg-gray-50 dark:bg-gray-950 px-6 py-12 lg:px-16">
        <div className="max-w-md mx-auto w-full">
          <StepHeader step={step} error={error} success={success} />

          {step === 1 && (
            <EmailStep email={email} setEmail={setEmail} onSendCode={() => handleSendResetCode(false)} />
          )}

          {step === 2 && (
            <OTPStep otp={otp} setOtp={setOtp} onVerifyCode={handleVerifyCode} onResend={() => handleSendResetCode(true)} onBack={() => setStep(1)} />
          )}

          {step === 3 && (
            <ResetPasswordStep
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              passwordValidation={passwordValidation}
              onPasswordChange={handlePasswordChange}
              onConfirmPasswordChange={(e) => setConfirmPassword(e.target.value)}
              onResetPassword={handleResetPassword}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}



