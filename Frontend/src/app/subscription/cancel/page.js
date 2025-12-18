"use client";

import { useTranslations } from '@/hooks/useTranslations';
import { XCircle, ArrowRight, LayoutDashboard, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionCancelPage() {
  const { t } = useTranslations();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700/50 p-10 text-center">
        {/* Cancel Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/25">
            <XCircle size={48} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {t('subscriptionCancel.title')}
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          {t('subscriptionCancel.description')}
        </p>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-4 mb-8 text-left">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>{t('subscription.note')}:</strong> {t('subscription.trialInfo')}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/select-plan">
            <button className="btn-primary w-full py-4 flex items-center justify-center gap-2">
              {t('subscriptionCancel.tryAgain')} <ArrowRight size={18} />
            </button>
          </Link>
          
          <Link href="/business">
            <button className="btn-secondary w-full py-4 mt-3 flex items-center justify-center gap-2">
              <LayoutDashboard size={18} /> {t('subscriptionCancel.goToDashboard')}
            </button>
          </Link>
        </div>

        {/* Help */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700/50">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('subscription.needHelp')} <Link href="/contact" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1"><HelpCircle size={14} /> {t('subscriptionCancel.contactSupport')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}


