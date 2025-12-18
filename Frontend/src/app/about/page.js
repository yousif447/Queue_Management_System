"use client";
import AnimatedFeatureCard from '@/components/AboutPage/AnimatedFeatureCard';
import AnimatedStatCard from '@/components/AboutPage/AnimatedStatCard';
import MissionVisionCard from '@/components/AboutPage/MissionVisionCard';
import SectionTitle from '@/components/AboutPage/SectionTitle';
import ValueCard from '@/components/AboutPage/ValueCard';
import { useTranslations } from '@/hooks/useTranslations';
import { Shield, Users, Zap, Globe, Clock, BarChart3 } from "lucide-react";
import Link from 'next/link';

export default function Page() {
  const { t } = useTranslations();
  
  const statics = [
    { icon: <Users size={28} />, title: t('about.stats.businesses'), value: "500+" },
    { icon: <BarChart3 size={28} />, title: t('about.stats.awards'), value: "120+" },
    { icon: <Clock size={28} />, title: t('about.stats.waitTime'), value: "60%" },
    { icon: <Zap size={28} />, title: t('about.stats.uptime'), value: "99%" }
  ];
  
  const advantages = [
    { icon: <Zap size={24} />, title: t('about.whyChooseUs.realTime.title'), description: t('about.whyChooseUs.realTime.description') },
    { icon: <Shield size={24} />, title: t('about.whyChooseUs.secure.title'), description: t('about.whyChooseUs.secure.description') },
    { icon: <Globe size={24} />, title: t('about.whyChooseUs.multiLanguage.title'), description: t('about.whyChooseUs.multiLanguage.description') },
    { icon: <Users size={24} />, title: t('about.whyChooseUs.integration.title'), description: t('about.whyChooseUs.integration.description') },
    { icon: <Clock size={24} />, title: t('about.whyChooseUs.scheduling.title'), description: t('about.whyChooseUs.scheduling.description') },
    { icon: <BarChart3 size={24} />, title: t('about.whyChooseUs.analytics.title'), description: t('about.whyChooseUs.analytics.description') }
  ];
  
  const values = [
    { title: t('about.values.innovation.title'), description: t('about.values.innovation.description') },
    { title: t('about.values.customerFirst.title'), description: t('about.values.customerFirst.description') },
    { title: t('about.values.reliability.title'), description: t('about.values.reliability.description') },
    { title: t('about.values.transparency.title'), description: t('about.values.transparency.description') }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Hero Section */}
      <section className="relative section-enterprise bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-full mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">{t('about.hero.trustedBy')}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="text-gray-900 dark:text-white">{t('about.hero.titlePrefix')}</span>
            <span className="gradient-text">QuickQueue</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed animate-fade-in-up max-w-2xl mx-auto">
            {t('about.subtitle')}
          </p>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center items-stretch gap-6">
            {statics.map((stat, index) => (
              <AnimatedStatCard
                key={index}
                icon={stat.icon}
                title={stat.title}
                value={stat.value}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Mission & Vision */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center items-stretch gap-8">
            <MissionVisionCard
              title={t('about.mission.title')}
              value={t('about.mission.description')}
              delay={0}
            />
            <MissionVisionCard
              title={t('about.vision.title')}
              value={t('about.vision.description')}
              delay={200}
            />
          </div>
        </div>
      </section>
      
      {/* Why Choose Us */}
      <section className="py-20 px-6 bg-gray-100/50 dark:bg-gray-900/50">
        <div className="container mx-auto">
          <div className="mb-16">
            <SectionTitle>{t('about.whyChooseUs.title')}</SectionTitle>
          </div>
          <div className="flex flex-wrap justify-center items-stretch gap-6">
            {advantages.map((advantage, index) => (
              <AnimatedFeatureCard
                key={index}
                icon={advantage.icon}
                title={advantage.title}
                description={advantage.description}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Our Values */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="mb-16">
            <SectionTitle>{t('about.values.title')}</SectionTitle>
          </div>
          <div className="flex flex-wrap justify-center items-stretch gap-6">
            {values.map((value, index) => (
              <ValueCard
                key={index}
                title={value.title}
                description={value.description}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-12 text-center shadow-2xl shadow-emerald-500/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {t('about.cta.title')}
              </h3>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                {t('about.cta.subtitle')}
              </p>
              <Link href="/business-solutions" className="px-10 py-4 bg-white text-emerald-600 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-block">
                {t('about.cta.button')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

