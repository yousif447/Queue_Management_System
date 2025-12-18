"use client";

import { Building2, Calendar, CheckCircle, Clock, LineChart, Shield, Sparkles, Users, Zap, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

export default function BusinessSolutionsPage() {
  const { t } = useTranslations();
  
  const features = [
    { icon: Clock, titleKey: "businessSolutions.realTimeQueue", descKey: "businessSolutions.realTimeQueueDesc" },
    { icon: Users, titleKey: "businessSolutions.smartTicket", descKey: "businessSolutions.smartTicketDesc" },
    { icon: Zap, titleKey: "businessSolutions.pauseResume", descKey: "businessSolutions.pauseResumeDesc" },
    { icon: Building2, titleKey: "businessSolutions.walkinSupport", descKey: "businessSolutions.walkinSupportDesc" },
    { icon: LineChart, titleKey: "businessSolutions.dailyStats", descKey: "businessSolutions.dailyStatsDesc" },
    { icon: Calendar, titleKey: "businessSolutions.instantUpdates", descKey: "businessSolutions.instantUpdatesDesc" },
  ];

  const plans = [
    { name: t('subscription.plans.basic.name'), price: "$9", popular: false, features: [
      `50 ${t('subscription.features.bookingsPerMonth')}`,
      t('subscription.features.realTimeDashboard'),
      t('subscription.features.callSkipComplete'),
      t('subscription.features.walkinSupport'),
      t('subscription.features.emailNotifications')
    ]},
    { name: t('subscription.plans.pro.name'), price: "$29", popular: true, features: [
      `500 ${t('subscription.features.bookingsPerMonth')}`,
      t('subscription.features.everythingInBasic'),
      t('subscription.features.paymentTrackingCashCard'),
      t('subscription.features.reviewsManagement'),
      t('subscription.features.customerHistory'),
      t('subscription.features.prioritySupport')
    ]},
    { name: t('subscription.plans.enterprise.name'), price: "$99", popular: false, features: [
      `2000 ${t('subscription.features.bookingsPerMonth')}`,
      t('subscription.features.everythingInPro'),
      t('subscription.features.detailedAnalytics'),
      t('subscription.features.paymentAnalytics'),
      t('subscription.features.customerInsights'),
      t('subscription.features.prioritySupport')
    ]},
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
                <Sparkles size={18} className="text-white" />
                <span className="text-white text-sm font-medium">{t('businessSolutions.forBusinesses')}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {t('businessSolutions.heroTitle')}
              </h1>
              
              <p className="text-xl text-white/80 mb-10 leading-relaxed">
                {t('businessSolutions.heroDescription')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/login/businessregister">
                  <button className="bg-white flex items-center justify-center gap-2 px-8 py-4 text-emerald-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                    {t('businessSolutions.getStarted')} <ArrowRight size={18} />
                  </button>
                </Link>
                <Link href="/contact">
                  <button className="px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300">
                    {t('businessSolutions.contactSales')}
                  </button>
                </Link>
              </div>
              

            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "500+", labelKey: "businessSolutions.activeBusinesses" },
                { value: "50K+", labelKey: "businessSolutions.dailyBookings" },
                { value: "85%", labelKey: "businessSolutions.timeSaved" },
                { value: "4.9", labelKey: "businessSolutions.averageRating", icon: Star },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                  <div className="text-4xl font-bold text-white mb-2 flex items-center gap-1">
                    {stat.value}{stat.icon && <Star size={20} className="text-amber-400 fill-amber-400" />}
                  </div>
                  <div className="text-sm text-white/70">{t(stat.labelKey)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('businessSolutions.featuresTitle')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('businessSolutions.featuresSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon size={26} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t(feature.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 bg-gray-100/50 dark:bg-gray-900/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('businessSolutions.pricingTitle')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('businessSolutions.pricingSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <div key={i} className={`relative rounded-3xl p-8 transition-all duration-500 ${
                plan.popular 
                  ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 shadow-2xl shadow-emerald-500/30 scale-105 z-10' 
                  : 'bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700/50 shadow-xl hover:shadow-2xl hover:-translate-y-2'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white px-5 py-1.5 rounded-full text-sm font-bold text-emerald-600 shadow-lg">
                    {t('businessSolutions.mostPopular')}
                  </div>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.name}</h3>
                <div className="mb-8">
                  <span className={`text-5xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{plan.price}</span>
                  <span className={plan.popular ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}>{t('businessSolutions.perMonth')}</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, j) => (
                    <li key={j} className={`flex items-center gap-3 ${plan.popular ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      <CheckCircle size={18} className={plan.popular ? 'text-white' : 'text-emerald-500'} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/login/businessregister">
                  <button className={`w-full py-4 font-bold rounded-xl transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-white text-emerald-600 hover:shadow-xl hover:scale-105' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500'
                  }`}>
                    {t('businessSolutions.getStarted')}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-12 text-center shadow-2xl shadow-emerald-500/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                {t('businessSolutions.ctaTitle')}
              </h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                {t('businessSolutions.ctaDescription')}
              </p>
              <Link href="/login/businessregister">
                <button className="px-10 py-4 bg-white text-emerald-600 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2">
                  {t('businessSolutions.getStarted')} <ArrowRight size={20} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


