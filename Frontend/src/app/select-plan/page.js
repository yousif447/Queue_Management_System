"use client";
import { API_URL } from '@/lib/api';

import { useTranslations } from '@/hooks/useTranslations';
import { CheckCircle, Loader2, ArrowRight, Zap, Crown, Rocket } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function SelectPlanPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  const plans = [
    {
      id: 'basic',
      name: t('subscription.plans.basic.name'),
      icon: Zap,
      price: 9,
      desc: t('subscription.plans.basic.description'),
      features: [
        `50 ${t('subscription.features.bookingsPerMonth')}`,
        t('subscription.features.realTimeDashboard'),
        t('subscription.features.callSkipComplete'),
        t('subscription.features.walkinSupport'),
        t('subscription.features.emailNotifications')
      ],
    },
    {
      id: 'pro',
      name: t('subscription.plans.pro.name'),
      icon: Crown,
      price: 29,
      desc: t('subscription.plans.pro.description'),
      popular: true,
      features: [
        `500 ${t('subscription.features.bookingsPerMonth')}`,
        t('subscription.features.everythingInBasic'),
        t('subscription.features.paymentTrackingCashCard'),
        t('subscription.features.reviewsManagement'),
        t('subscription.features.customerHistory'),
        t('subscription.features.prioritySupport')
      ],
    },
    {
      id: 'enterprise',
      name: t('subscription.plans.enterprise.name'),
      icon: Rocket,
      price: 99,
      desc: t('subscription.plans.enterprise.description'),
      features: [
        `2000 ${t('subscription.features.bookingsPerMonth')}`,
        t('subscription.features.everythingInPro'),
        t('subscription.features.detailedAnalytics'),
        t('subscription.features.paymentAnalytics'),
        t('subscription.features.customerInsights'),
        t('subscription.features.prioritySupport')
      ],
    },
  ];

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/subscriptions/status`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCurrentSubscription(data.data);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };
    checkSubscription();
  }, []);

  const handleSelectPlan = async (plan) => {
    setLoading(true);
    setSelectedPlan(plan);
    try {
      const res = await fetch(`${API_URL}/api/v1/subscriptions/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('selectPlan.failedCheckout'));
      window.location.href = data.sessionUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.message || t('selectPlan.failedCheckout'));
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('selectPlan.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('selectPlan.subtitle')}
          </p>
          {currentSubscription?.status === 'active' && (
            <div className="mt-6 inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-5 py-2.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                {t('selectPlan.currentPlan')}: <span className="font-bold capitalize">{currentSubscription.plan}</span>
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentSubscription?.plan === plan.id && currentSubscription?.status === 'active';

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 transition-all duration-500 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 shadow-2xl shadow-emerald-500/30 scale-105 z-10'
                    : 'bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700/50 shadow-xl hover:shadow-2xl hover:-translate-y-2'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-white px-5 py-1.5 rounded-full text-sm font-bold text-emerald-600 shadow-lg">
                      {t('businessSolutions.mostPopular')}
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    plan.popular ? 'bg-white/20 backdrop-blur-sm' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25'
                  }`}>
                    <Icon size={28} className="text-white" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      ${plan.price}
                    </span>
                    <span className={plan.popular ? 'text-white/70' : 'text-gray-600 dark:text-gray-400'}>{t('businessSolutions.perMonth')}</span>
                  </div>
                  <p className={plan.popular ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}>{plan.desc}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle size={18} className={plan.popular ? 'text-white' : 'text-emerald-500'} />
                      <span className={plan.popular ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading || isCurrent}
                  className={`w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrent
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      : plan.popular
                      ? 'bg-white text-emerald-600 hover:shadow-xl hover:scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500'
                  }`}
                >
                  {loading && selectedPlan === plan.id ? (
                    <><Loader2 className="animate-spin" size={20} /> {t('common.processing')}</>
                  ) : isCurrent ? (
                    t('selectPlan.currentPlan')
                  ) : (
                    <>{t('selectPlan.selectPlan')} <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('subscription.securePayment')}
          </p>
          {currentSubscription?.status === 'active' && (
            <Link href="/business" className="link-enterprise">
              ← {t('subscription.backToDashboard')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}



