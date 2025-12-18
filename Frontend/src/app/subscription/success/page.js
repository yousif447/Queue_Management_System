"use client";
import { API_URL, authFetch } from '@/lib/api';

import { useTranslations } from '@/hooks/useTranslations';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function SubscriptionSuccessPage() {
  const { t } = useTranslations();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchSubscription = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (sessionId) {
          try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const confirmRes = await authFetch(`${API_URL}/api/v1/subscriptions/confirm-session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId })
            });
            
            if (confirmRes.ok) {
              const confirmData = await confirmRes.json();
              if (confirmData.data) {
                setSubscription(confirmData.data);
                setLoading(false);
                return;
              }
            }
          } catch (confirmError) {
            console.error('Error confirming session:', confirmError);
          }
        }

        const res = await authFetch(`${API_URL}/api/v1/subscriptions/status`);
        
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.data);
        } else {
          setSubscription({ plan: 'basic', status: 'active' });
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setSubscription({ plan: 'basic', status: 'active' });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700/50 p-10 text-center">
        {loading ? (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 border-4 border-emerald-200 dark:border-emerald-500/30 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">{t('common.loading')}</p>
          </>
        ) : (
          <>
            {/* Success Icon */}
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CheckCircle size={48} className="text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {t('subscriptionSuccess.title')}
            </h1>

            {/* Message */}
            <p className="text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
              {t('subscriptionSuccess.description')}
            </p>

            {/* Subscription Details */}
            {subscription && (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 mb-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{t('subscription.plan')}:</span>
                    <span className="font-bold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-500" />
                      {subscription.plan}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{t('common.status')}:</span>
                    <span className="badge-success">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      {t('common.active')}
                    </span>
                  </div>
                  {subscription.currentPeriodEnd && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">{t('subscription.nextBilling')}:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Go to Dashboard Button */}
            <Link href="/business">
              <button className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                {t('subscriptionSuccess.goToDashboard')} <ArrowRight size={18} />
              </button>
            </Link>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
              {t('subscription.confirmationEmailSent')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}



