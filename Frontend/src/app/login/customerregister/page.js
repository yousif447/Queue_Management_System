"use client";
import { useTranslations } from '@/hooks/useTranslations';
import { API_URL } from '@/lib/api';
import { ArrowRight, Lock, Mail, Phone, Shield, Star, User, UserPlus, Zap, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FcGoogle } from "react-icons/fc";

export default function Page() {
  const router = useRouter();
  const { t } = useTranslations();
  const API = `${API_URL}/api/v1/auth/register`;
  const [user, setUser] = useState({name: '', email: '', password: '', phone: ''});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => setUser({...user, [e.target.name]: e.target.value});
  const handleGoogleSignup = () => window.location.href = `${API_URL}/api/v1/auth/google`;

  const formatError = (errorData) => {
    if (!errorData) return '';

    // If it's already an array (direct result from res.json())
    if (Array.isArray(errorData)) {
      return errorData.map(e => e.message || e.toString()).join('. ');
    }

    // If it's an object with a message property (e.g., standard API error)
    if (typeof errorData === 'object' && errorData.message) {
      if (typeof errorData.message === 'string') return errorData.message;
      return formatError(errorData.message);
    }

    // If it's a string, try to parse it (in case it's stringified JSON from throw Error)
    if (typeof errorData === 'string') {
      try {
        const parsed = JSON.parse(errorData);
        return formatError(parsed);
      } catch (e) {
        return errorData;
      }
    }

    return errorData.toString();
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(user)
      });
      const data = await res.json();
      
      if(!res.ok) {
        const formatted = formatError(data.message || "Failed to register user");
        setError(formatted);
        setLoading(false);
        return;
      }

      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }

      router.push('/user');
    } catch (err) {
      setError(formatError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, text: t('register.features.skipLine') },
    { icon: Shield, text: t('register.features.secure') },
    { icon: Star, text: t('register.features.realTime') },
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center p-16">
          <div className="mb-12">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8">
              <UserPlus size={32} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">{t('register.joinQuickQueue')}</h1>
            <p className="text-xl text-white/80">{t('register.createAccountStart')}</p>
          </div>
          
          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <feature.icon size={20} className="text-white" />
                </div>
                <span className="text-white font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col justify-center bg-gray-50 dark:bg-gray-950 px-6 py-12 lg:px-16">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('register.customer.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('register.customer.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('register.customer.fullName')}
              </label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  onChange={handleChange}
                  value={user.name}
                  name="name"
                  className="input-enterprise pl-11"
                  placeholder={t('register.customer.namePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('register.customer.email')}
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  onChange={handleChange}
                  value={user.email}
                  name="email"
                  className="input-enterprise pl-11"
                  placeholder={t('register.customer.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('register.customer.phone')}
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  onChange={handleChange}
                  value={user.phone || ''}
                  name="phone"
                  className="input-enterprise pl-11"
                  placeholder={t('register.customer.phonePlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('register.customer.password')}
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  onChange={handleChange}
                  value={user.password}
                  name="password"
                  className="input-enterprise pl-11"
                  placeholder={t('register.customer.passwordPlaceholder')}
                />
              </div>
            </div>
          </div>

          <button 
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 mb-6" 
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('common.processing')}</>
            ) : (
              <>{t('register.customer.createAccount')} <ArrowRight size={18} /></>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400">{t('register.customer.orContinueWith')}</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignup}
            className="w-full py-3.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-200"
          >
            <FcGoogle size={20} />
            {t('register.customer.signUpWithGoogle')}
          </button>

          <p className="text-center mt-8 text-gray-600 dark:text-gray-400">
            {t('register.customer.alreadyHaveAccount')}
            <Link className='font-bold text-emerald-600 dark:text-emerald-400 hover:underline ml-1' href="/login">
              {t('register.customer.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}



