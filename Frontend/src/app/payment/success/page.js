"use client";
import { API_URL, authFetch } from '@/lib/api';

import { useTranslations } from '@/hooks/useTranslations';
import { ArrowRight, CheckCircle, Sparkles, Ticket } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const session_id = searchParams.get('session_id');
    if (session_id) {
      setSessionId(session_id);
      
      authFetch(`${API_URL}/api/v1/payments/confirm-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
      })
      .then(res => res.json())
      .then(data => {
         if (data.success) {
            console.log('Payment confirmed by backend');
         }
      })
      .catch(err => console.error('Confirmation error:', err))
      .finally(() => {
          setLoading(false);
          setShowConfetti(true);
          sessionStorage.removeItem('paymentTicket');
          setTimeout(() => {
            router.push('/user?tab=myTickets&refresh=' + Date.now());
          }, 3000);
      });
    } else {
      toast.error(t('payment.invalidPaymentSession'));
      router.push('/');
    }
  }, [router, searchParams, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 dark:from-gray-950 dark:via-emerald-950/20 dark:to-gray-950">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-200 dark:border-emerald-500/30 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-teal-400/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 dark:from-gray-950 dark:via-emerald-950/20 dark:to-gray-950 p-6 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Confetti Particles */}
        {showConfetti && (
          <>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-bounce"
                style={{
                  left: `${10 + (i * 7)}%`,
                  top: `${20 + (i % 3) * 10}%`,
                  backgroundColor: ['#10B981', '#14B8A6', '#06B6D4', '#6366F1', '#F59E0B'][i % 5],
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${1 + (i % 3) * 0.5}s`,
                  opacity: 0.7,
                }}
              />
            ))}
          </>
        )}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Success Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-10 text-center animate-fade-in-scale">
          {/* Success Icon */}
          <div className="relative mb-8">
            <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 animate-pulse-glow">
              <CheckCircle size={56} className="text-white" />
            </div>
            {/* Sparkles */}
            <Sparkles size={24} className="absolute -top-2 -right-2 text-amber-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
            <Sparkles size={18} className="absolute -bottom-1 -left-1 text-emerald-400 animate-bounce" style={{ animationDelay: '0.8s' }} />
          </div>
          
          {/* Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t('paymentSuccess.title')} <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{t('paymentSuccess.successful')}</span>
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-lg">
            {t('paymentSuccess.description')}
          </p>
          
          {/* Session ID */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-5 mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">{t('paymentSuccess.sessionId')}</p>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              {sessionId}
            </p>
          </div>
          
          {/* Redirect Notice */}
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 mb-6">
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium flex items-center justify-center gap-2">
              <Ticket size={18} />
              {t('paymentSuccess.redirecting')}
            </p>
          </div>
          
          {/* Animated Dots */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-bounce shadow-lg shadow-emerald-500/50"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-bounce shadow-lg shadow-emerald-500/50" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-bounce shadow-lg shadow-emerald-500/50" style={{ animationDelay: '0.3s' }}></div>
          </div>
          
          {/* Quick Action */}
          <button
            onClick={() => router.push('/user?tab=myTickets')}
            className="mt-8 w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            {t('payment.viewMyTickets')}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}



