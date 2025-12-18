"use client";
import { useTranslations } from '@/hooks/useTranslations';
import { Shield, Users } from "lucide-react";
import { useEffect, useRef, useState } from 'react';
import { BsLightning } from "react-icons/bs";
import { FiAward } from "react-icons/fi";
import { IoMdCheckmarkCircleOutline, IoMdTime } from "react-icons/io";
import { MdOutlinePeopleAlt, MdOutlineTrendingUp } from "react-icons/md";
import { TbWorld } from "react-icons/tb";

// Counter Animation Hook
const useCountAnimation = (end, duration = 2000, shouldStart) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!shouldStart) return;
    
    let startTime;
    let animationFrame;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, shouldStart]);
  
  return count;
};

// Intersection Observer Hook
const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
      }
    }, { threshold: 0.3, ...options });
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);
  
  return [ref, isVisible];
};

// Animated Stat Card
const AnimatedStatCard = ({ icon, title, value, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  const numericValue = parseInt(value);
  const suffix = value.replace(/[0-9]/g, '');
  const animatedCount = useCountAnimation(numericValue, 2000, isVisible);
  
  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-[#2A2825] p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 dark:border-[#3A3835] min-w-[250px] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-[#359487] dark:text-[#C6FE02] text-5xl mb-4 flex justify-center animate-pulse">
        {icon}
      </div>
      <div className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
        {animatedCount}{suffix}
      </div>
      <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">
        {title}
      </div>
    </div>
  );
};

// Animated Feature Card
const AnimatedFeatureCard = ({ icon, title, description, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div
      ref={ref}
      className={`group bg-white dark:bg-[#2A2825] p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 w-[98%] md:w-[30%] border border-gray-100 dark:border-[#3A3835] hover:border-[#359487] dark:hover:border-[#C6FE02] ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-[#359487] dark:text-[#C6FE02] text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 group-hover:text-[#359487] dark:group-hover:text-[#C6FE02] transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

// Mission/Vision Card
const MissionVisionCard = ({ title, value, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div
      ref={ref}
      className={`group bg-gradient-to-br from-[#359487] to-[#2a7569] dark:from-[#C6FE02] dark:to-[#a8d902] p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 w-[98%] md:w-[45%] md:min-h-[300px] ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <h3 className="text-3xl font-bold text-white dark:text-black mb-6 group-hover:scale-105 transition-transform">
        {title}
      </h3>
      <p className="text-white/90 dark:text-black/80 text-lg leading-relaxed">
        {value}
      </p>
    </div>
  );
};

// Value Card
const ValueCard = ({ title, description, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div
      ref={ref}
      className={`flex flex-col items-center text-center p-6 bg-white dark:bg-[#2A2825] rounded-xl shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 dark:border-[#3A3835] min-w-[200px] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <IoMdCheckmarkCircleOutline className='text-white dark:text-black text-5xl mb-4 p-2 border-2 rounded-full border-[#359487] dark:border-[#C6FE02] bg-[#359487] dark:bg-[#C6FE02] animate-bounce'/>
      <div className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
        {title}
      </div>
      <div className="text-gray-600 dark:text-gray-400 text-sm">
        {description}
      </div>
    </div>
  );
};

// Section Title
const SectionTitle = ({ children, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <h2
      ref={ref}
      className={`text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-8 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </h2>
  );
};

export default function Page() {
  const { t } = useTranslations();
  
  const statics = [
    { icon: <MdOutlinePeopleAlt />, title: t('about.stats.businesses'), value: "500+" },
    { icon: <FiAward />, title: t('about.stats.awards'), value: "120+" },
    { icon: <IoMdTime />, title: t('about.stats.waitTime'), value: "60%" },
    { icon: <MdOutlineTrendingUp />, title: t('about.stats.uptime'), value: "99%" }
  ];
  
  const advantages = [
    { icon: <BsLightning />, title: t('about.whyChooseUs.realTime.title'), description: t('about.whyChooseUs.realTime.description') },
    { icon: <Shield />, title: t('about.whyChooseUs.secure.title'), description: t('about.whyChooseUs.secure.description') },
    { icon: <TbWorld />, title: t('about.whyChooseUs.multiLanguage.title'), description: t('about.whyChooseUs.multiLanguage.description') },
    { icon: <Users />, title: t('about.whyChooseUs.integration.title'), description: t('about.whyChooseUs.integration.description') },
    { icon: <IoMdTime />, title: t('about.whyChooseUs.scheduling.title'), description: t('about.whyChooseUs.scheduling.description') },
    { icon: <MdOutlinePeopleAlt />, title: t('about.whyChooseUs.analytics.title'), description: t('about.whyChooseUs.analytics.description') }
  ];
  
  const values = [
    { title: t('about.values.innovation.title'), description: t('about.values.innovation.description') },
    { title: t('about.values.customerFirst.title'), description: t('about.values.customerFirst.description') },
    { title: t('about.values.reliability.title'), description: t('about.values.reliability.description') },
    { title: t('about.values.transparency.title'), description: t('about.values.transparency.description') }
  ];
  
  return (
    <div className="bg-[#F3F3F3] dark:bg-gradient-to-b dark:from-[#181715] dark:to-[#1F1D1A] overflow-hidden">
      {/* Hero Section */}
      <div className="w-[90%] md:w-[70%] mx-auto text-center pt-16 mb-12">
        <h1 className="text-[#359487] font-bold text-5xl md:text-7xl py-6 dark:text-[#C6FE02] dark:drop-shadow-[0_0_20px_rgba(198,254,2,0.6)] animate-fade-in">
          {t('about.title')}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed px-4 animate-fade-in-up">
          {t('about.subtitle')}
        </p>
      </div>
      
      {/* Stats Section */}
      <div className="w-[90%] md:w-[80%] mx-auto flex flex-wrap justify-center items-center gap-6 py-12">
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
      
      {/* Mission & Vision */}
      <div className="w-[90%] md:w-[80%] mx-auto flex flex-wrap justify-center items-stretch gap-6 py-12">
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
      
      {/* Why Choose Us */}
      <div className="w-[90%] md:w-[80%] mx-auto py-16">
        <div className="text-center mb-12">
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
      
      {/* Our Values */}
      <div className="w-[90%] md:w-[80%] mx-auto py-16 pb-20">
        <div className="text-center mb-12">
          <SectionTitle>{t('about.values.title')}</SectionTitle>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-6">
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
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out 0.3s both;
        }
      `}</style>
    </div>
  );
}

