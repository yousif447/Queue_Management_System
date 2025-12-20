"use client";
import { useTranslations } from '@/hooks/useTranslations';
import { API_URL } from '@/lib/api';
import { ArrowRight, Building2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FcGoogle } from "react-icons/fc";

export default function Page() {
  const { t } = useTranslations();
  const router = useRouter();
  const API = `${API_URL}/api/v1/auth/login`;
  
  const [activeTab, setActiveTab] = useState('customer');
  const [customerData, setCustomerData] = useState({ email: '', password: '' });
  const [businessData, setBusinessData] = useState({ email: '', password: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const formatError = (errorData) => {
    if (!errorData) return '';

    // If it's already an array
    if (Array.isArray(errorData)) {
      return errorData.map(e => e.message || e.toString()).join('. ');
    }

    // If it's an object with a message property
    if (typeof errorData === 'object' && errorData.message) {
      if (typeof errorData.message === 'string') return errorData.message;
      return formatError(errorData.message);
    }

    // If it's a string, try to parse it
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

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/v1/auth/google`;
  };

  const handleLogin = async (e, data, expectedRole, redirectPath, errorMsg) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(API, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
      });

      const result = await res.json();
      console.log('Login response:', result); // Debug log
      console.log('User role:', result.user?.role, 'Expected:', expectedRole); // Debug log
      
      if (!res.ok) {
        const formatted = formatError(result.message || "Failed to login");
        setError(formatted);
        setLoading(false);
        return;
      }

      // Store token in localStorage for cross-origin auth (cookies don't work cross-domain)
      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
        console.log('Token stored in localStorage'); // Debug log
      }

      // Check redirect
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl && result.user?.role === 'user') {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectUrl);
        return;
      }

      if (result.user?.role === expectedRole || (expectedRole === 'customer' && result.user?.role === 'user')) {
        console.log('Redirecting to:', redirectPath); // Debug log
        router.push(redirectPath);
      } else {
        console.log('Role mismatch - not redirecting'); // Debug log
        setError(errorMsg);
      }
    } catch (err) {
      const formatted = formatError(err.message);
      setError(formatted);
      toast.error(formatted);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'customer', label: t('login.customerTab'), icon: User, color: 'emerald' },
    { id: 'business', label: t('login.businessTab'), icon: Building2, color: 'indigo' },
  ];

  const getData = () => activeTab === 'customer' ? customerData : businessData;
  const setData = (data) => activeTab === 'customer' ? setCustomerData(data) : setBusinessData(data);

  return (
    <div className="min-h-screen w-full flex bg-gray-50 dark:bg-gray-950">
      {/* Left Panel - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl">
              <span className="text-white font-bold text-3xl">Q</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">QuickQueue</h1>
            <p className="text-white/80 text-lg max-w-md">{t('login.tagline')}</p>
          </div>
          
          <div className="relative w-full max-w-lg">
            <Image src="/register7.png" width={500} height={500} className="w-full h-auto drop-shadow-2xl" alt="Login visual" priority />
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {[t('login.featureRealTime'), t('login.featureScheduling'), t('login.featureAnalytics')].map((feature) => (
              <span key={feature} className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <span className="text-white font-bold text-2xl">Q</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QuickQueue</h1>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('login.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('login.subtitle')}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                <span className="text-red-500 font-bold">!</span>
              </div>
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 mb-8">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}>
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Login Form */}
          <form onSubmit={(e) => {
            if (activeTab === 'customer') handleLogin(e, customerData, 'customer', '/user', t('login.userNotFound'));
            else handleLogin(e, businessData, 'business', '/business', t('login.businessNotFound'));
          }} className="space-y-6">
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('login.email')}</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={20} /></div>
                <input type="email" value={getData().email} onChange={(e) => setData({...getData(), email: e.target.value})}
                  className="input-enterprise pl-12" placeholder="email@example.com" required />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('login.password')}</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={20} /></div>
                <input type={showPassword ? 'text' : 'password'} value={getData().password} onChange={(e) => setData({...getData(), password: e.target.value})}
                  className="input-enterprise pl-12 pr-12" placeholder={t('login.enterPassword')} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
              <div className="text-right">
                <Link href="/login/forgot-password" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">
                  {t('login.forgotPassword')}
                </Link>
              </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><span>{t('login.loginButton')}</span><ArrowRight size={18} /></>
              )}
            </button>

            {/* Google Login (Customer only) */}
            {activeTab === 'customer' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
                  <div className="relative flex justify-center"><span className="px-4 bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 text-sm">{t('login.orContinueWith')}</span></div>
                </div>
                <button type="button" onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow-md">
                  <FcGoogle size={22} />
                  {t('login.googleLogin')}
                </button>
              </>
            )}

            <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
              {t('login.noAccount')}{' '}
              <Link href={activeTab === 'customer' ? '/login/customerregister' : '/login/businessregister'} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                {t('login.signUp')}
              </Link>
            </p>
          </form>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium flex items-center justify-center gap-2">
              <ArrowRight size={16} className="rotate-180" />
              {t('login.backToHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

