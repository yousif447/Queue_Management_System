"use client";

import { useTranslations } from '@/hooks/useTranslations';
import { Building2, Calendar, CheckCircle, Clock, LineChart, Shield, Sparkles, TrendingUp, Users, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ForBusinessPage() {
  const { t } = useTranslations();
  const [email, setEmail] = useState('');

  const handleGetStarted = (e) => {
    e.preventDefault();
    window.location.href = '/register?type=business';
  };

  const features = [
    { icon: Clock, title: t('forBusiness.features.realTimeQueue'), desc: t('forBusiness.features.realTimeQueueDesc') },
    { icon: Calendar, title: t('forBusiness.features.smartBooking'), desc: t('forBusiness.features.smartBookingDesc') },
    { icon: LineChart, title: t('forBusiness.features.analytics'), desc: t('forBusiness.features.analyticsDesc') },
    { icon: Users, title: t('forBusiness.features.notifications'), desc: t('forBusiness.features.notificationsDesc') },
    { icon: Shield, title: t('forBusiness.features.secure'), desc: t('forBusiness.features.secureDesc') },
    { icon: Zap, title: t('forBusiness.features.easyIntegration'), desc: t('forBusiness.features.easyIntegrationDesc') }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 py-24 px-6">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
                <Sparkles size={18} />
                <span className="text-sm font-semibold">{t('businessSolutions.forBusinesses')}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('businessSolutions.heroTitle')}
              </h1>
              
              <p className="text-xl mb-8 text-white/80 leading-relaxed max-w-xl">
                {t('businessSolutions.heroDescription')}
              </p>
              
              <form onSubmit={handleGetStarted} className="flex flex-col sm:flex-row gap-3 mb-6 max-w-lg">
                <input
                  type="email"
                  placeholder={t('forBusiness.enterBusinessEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-4 rounded-xl text-gray-900 bg-white border-2 border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                  required
                />
                <button type="submit" className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                  {t('businessSolutions.getStarted')} <ArrowRight size={18} />
                </button>
              </form>
              
              <p className="text-sm text-white/60">
                ✓ {t('forBusiness.noCreditCard')}  ✓ {t('forBusiness.freeTrial')}  ✓ {t('forBusiness.cancelAnytime')}
              </p>
            </div>
            
            {/* Right Content - Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '500+', label: t('businessSolutions.activeBusinesses') },
                { value: '50K+', label: t('businessSolutions.dailyBookings') },
                { value: '85%', label: t('businessSolutions.timeSaved') },
                { value: '4.9★', label: t('businessSolutions.averageRating') },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors">
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
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
              <div key={i} className="group card-enterprise-hover">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                  <feature.icon className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('businessSolutions.pricingTitle')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">{t('businessSolutions.pricingSubtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('subscription.plans.basic.name')}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$29</span>
                <span className="text-gray-600 dark:text-gray-400">{t('businessSolutions.perMonth')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  t('subscription.features.bookingsPerMonth'),
                  t('subscription.features.realTimeDashboard'),
                  t('subscription.features.emailNotifications')
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <CheckCircle size={18} className="text-emerald-500" />{item}
                  </li>
                ))}
              </ul>
              <Link href="/register?type=business&plan=starter">
                <button className="btn-secondary w-full py-3.5">{t('businessSolutions.getStarted')}</button>
              </Link>
            </div>

            {/* Professional Plan */}
            <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-8 shadow-2xl transform scale-105 z-10">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white px-5 py-1.5 rounded-full text-sm font-bold text-emerald-600">
                {t('businessSolutions.mostPopular')}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t('subscription.plans.pro.name')}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$79</span>
                <span className="text-white/70">{t('businessSolutions.perMonth')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  `500 ${t('subscription.features.bookingsPerMonth')}`,
                  t('subscription.features.detailedAnalytics'),
                  t('subscription.features.prioritySupport'),
                  t('forBusiness.customBranding')
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white">
                    <CheckCircle size={18} />{item}
                  </li>
                ))}
              </ul>
              <Link href="/register?type=business&plan=professional">
                <button className="w-full py-3.5 bg-white text-emerald-600 font-bold rounded-xl hover:shadow-xl transition-all">
                  {t('businessSolutions.getStarted')}
                </button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('subscription.plans.enterprise.name')}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{t('forBusiness.custom')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  t('subscription.features.everythingInPro'),
                  t('forBusiness.dedicatedSupport'),
                  t('forBusiness.customIntegrations'),
                  t('forBusiness.slaGuarantee')
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <CheckCircle size={18} className="text-emerald-500" />{item}
                  </li>
                ))}
              </ul>
              <Link href="/contact">
                <button className="btn-secondary w-full py-3.5">{t('businessSolutions.contactSales')}</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24 px-6 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('businessSolutions.ctaTitle')}
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {t('businessSolutions.ctaDescription')}
          </p>
          <Link href="/register?type=business">
            <button className="px-10 py-5 bg-white text-emerald-600 font-bold rounded-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 text-lg flex items-center gap-2 mx-auto">
              {t('forBusiness.startFreeTrial')} <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}


