"use client";
import { API_URL, authFetch } from '@/lib/api';

import { useTranslations } from '@/hooks/useTranslations';
import { ArrowRight, Check, Crown, Rocket, X, Zap } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import PaymentForm from './PaymentForm';

const getPlans = (t) => [
  {
    id: 'basic',
    name: t('subscription.plans.basic.name'),
    icon: Zap,
    price: 9,
    period: 'month',
    description: t('subscription.plans.basic.description'),
    monthlyLimit: 50,
    features: [
      { text: `50 ${t('subscription.features.bookingsPerMonth')}`, included: true },
      { text: t('subscription.features.realTimeDashboard'), included: true },
      { text: t('subscription.features.callSkipComplete'), included: true },
      { text: t('subscription.features.walkinSupport'), included: true },
      { text: t('subscription.features.emailNotifications'), included: true },
      { text: t('subscription.features.todayStats'), included: true },
      { text: t('subscription.features.paymentTracking'), included: false },
      { text: t('subscription.features.customerReviews'), included: false },
      { text: t('subscription.features.customerHistory'), included: false },
      { text: t('subscription.features.advancedAnalytics'), included: false },
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: t('subscription.plans.pro.name'),
    icon: Crown,
    price: 29,
    period: 'month',
    description: t('subscription.plans.pro.description'),
    monthlyLimit: 500,
    features: [
      { text: `500 ${t('subscription.features.bookingsPerMonth')}`, included: true },
      { text: t('subscription.features.everythingInBasic'), included: true },
      { text: t('subscription.features.paymentTrackingCashCard'), included: true },
      { text: t('subscription.features.reviewsManagement'), included: true },
      { text: t('subscription.features.customerHistory'), included: true },
      { text: t('subscription.features.advancedQueueControls'), included: true },
      { text: t('subscription.features.profileCustomization'), included: true },
      { text: t('subscription.features.prioritySupport'), included: true },
      { text: t('subscription.features.advancedAnalytics'), included: false },
      { text: t('subscription.features.dataExport'), included: false },
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: t('subscription.plans.enterprise.name'),
    icon: Rocket,
    price: 99,
    period: 'month',
    description: t('subscription.plans.enterprise.description'),
    monthlyLimit: 2000,
    features: [
      { text: `2000 ${t('subscription.features.bookingsPerMonth')}`, included: true },
      { text: t('subscription.features.everythingInPro'), included: true },
      { text: t('subscription.features.detailedAnalytics'), included: true },
      { text: t('subscription.features.paymentAnalytics'), included: true },
      { text: t('subscription.features.customerInsights'), included: true },
      { text: t('subscription.features.prioritySupport'), included: true },
      { text: t('subscription.features.exportCapabilities'), included: true },
      { text: t('subscription.features.customIntegrations'), included: true },
      { text: t('subscription.features.dedicatedManager'), included: true },
      { text: t('subscription.features.slaGuarantee'), included: true },
    ],
    popular: false,
  },
];

export default function SubscriptionPlans({ currentPlan = 'basic', onPlanChange }) {
  const { t } = useTranslations();
  const plans = getPlans(t);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const handleSelectPlan = (plan) => {
    if (plan.id === 'basic') {
      toast.success(t('subscription.buttons.currentPlan'));
      return;
    }
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      const response = await authFetch(`${API_URL}/api/v1/subscription/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id, paymentIntentId: paymentData.paymentIntentId, billingPeriod }),
      });
      if (response.ok) {
        toast.success(`${t('toast.success')}: ${selectedPlan.name}!`);
        setShowPayment(false);
        if (onPlanChange) onPlanChange(selectedPlan.id);
      }
    } catch (error) {
      toast.error(t('toast.failed'));
    }
  };

  if (showPayment && selectedPlan) {
    const amount = billingPeriod === 'yearly' ? selectedPlan.price * 10 * 100 : selectedPlan.price * 100;
    return (
      <div>
        <button onClick={() => setShowPayment(false)} className="mb-6 text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-2 font-medium">
          {t('subscription.buttons.backToPlans')}
        </button>

        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700/50 p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <selectedPlan.icon size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('subscription.payment.subscribeTitle')} {selectedPlan.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">{selectedPlan.description}</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold gradient-text">${billingPeriod === 'yearly' ? selectedPlan.price * 10 : selectedPlan.price}</span>
            <span className="text-gray-600 dark:text-gray-400">{billingPeriod === 'yearly' ? t('subscription.perYear') : t('subscription.perMonth')}</span>
          </div>
          {billingPeriod === 'yearly' && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">{t('subscription.payment.saveWithAnnual')} ${selectedPlan.price * 2}!</p>
          )}
        </div>

        <PaymentForm amount={amount} currency="usd" onSuccess={handlePaymentSuccess} onCancel={() => setShowPayment(false)} metadata={{ type: 'subscription', planId: selectedPlan.id }} />
      </div>
    );
  }

  return (
    <div>
      {/* Billing Toggle */}
      <div className="flex justify-center mb-10">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 flex">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              billingPeriod === 'monthly'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('subscription.billing.monthly')}
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-200 relative ${
              billingPeriod === 'yearly'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('subscription.billing.yearly')}
            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {t('subscription.billing.savePercent')}
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          const displayPrice = billingPeriod === 'yearly' ? plan.price * 10 : plan.price;

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
                    {t('subscription.popular')}
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  plan.popular ? 'bg-white/20 backdrop-blur-sm' : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25'
                }`}>
                  <Icon size={28} className={plan.popular ? 'text-white' : 'text-white'} />
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>{plan.description}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>${displayPrice}</span>
                  <span className={plan.popular ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}>{billingPeriod === 'yearly' ? t('subscription.perYear') : t('subscription.perMonth')}</span>
                </div>
                {billingPeriod === 'yearly' && plan.price > 0 && (
                  <p className={`text-xs mt-2 ${plan.popular ? 'text-white/80' : 'text-emerald-600 dark:text-emerald-400'}`}>{t('subscription.saveAmount')} ${plan.price * 2}{t('subscription.perYear')}</p>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check size={18} className={plan.popular ? 'text-white' : 'text-emerald-500'} />
                    ) : (
                      <X size={18} className={plan.popular ? 'text-white/40' : 'text-gray-300 dark:text-gray-600'} />
                    )}
                    <span className={`text-sm ${
                      feature.included
                        ? plan.popular ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                        : plan.popular ? 'text-white/40 line-through' : 'text-gray-400 dark:text-gray-600 line-through'
                    }`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan}
                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-white text-emerald-600 hover:shadow-xl hover:scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500'
                }`}
              >
                {isCurrentPlan ? t('subscription.buttons.currentPlan') : plan.price === 0 ? t('subscription.buttons.getStarted') : <>{t('subscription.buttons.subscribe')} <ArrowRight size={18} /></>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Enterprise Contact */}
      <div className="mt-12 relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-12 text-center shadow-2xl shadow-emerald-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h3 className="text-3xl font-bold text-white mb-3">{t('subscription.enterprise.title')}</h3>
          <p className="mb-6 text-white/80 text-lg max-w-xl mx-auto">{t('subscription.enterprise.description')}</p>
          <button className="bg-white text-emerald-600 px-10 py-4 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300">
            {t('subscription.enterprise.button')}
          </button>
        </div>
      </div>
    </div>
  );
}



