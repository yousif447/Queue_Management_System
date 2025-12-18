"use client";

import { useTranslations } from '@/hooks/useTranslations';
import { XCircle, ArrowRight, Home, Ticket, RefreshCcw, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function PaymentCancelPage() {
  const { t } = useTranslations();
  const router = useRouter();

  useEffect(() => {
    toast.error(t('paymentCancel.title'));
  }, [t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-rose-50/20 to-gray-50 dark:from-gray-950 dark:via-rose-950/10 dark:to-gray-950 p-6 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Cancel Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-10 text-center animate-fade-in-scale">
          
          {/* Cancel Icon - Softer Design */}
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-rose-400 via-rose-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-rose-500/20">
              <XCircle size={48} className="text-white" />
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t('paymentCancel.title')}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {t('paymentCancel.description')}
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Try Again - Primary */}
            <button
              onClick={() => router.push('/payment')}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
              {t('paymentCancel.tryAgain')}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            {/* View Tickets - Secondary */}
            <button
              onClick={() => router.push('/user?tab=myTickets')}
              className="w-full py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Ticket size={20} />
              {t('paymentCancel.viewMyTickets')}
            </button>
            
            {/* Go Home - Tertiary */}
            <button
              onClick={() => router.push('/')}
              className="w-full py-4 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Home size={20} />
              {t('paymentCancel.goToHome')}
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 border border-blue-100 dark:border-blue-500/20">
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                <MessageCircle size={18} />
                <p className="text-sm font-medium">
                  {t('paymentCancel.needHelp')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


