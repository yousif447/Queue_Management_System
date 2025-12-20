"use client";

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export default function StatsCard({ value, label, icon: Icon, delay = 0 }) {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div
      ref={ref}
      className={`card-enterprise-hover text-center transition-all duration-500 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
        <Icon className="text-white" size={20} />
      </div>
      <div className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</div>
    </div>
  );
}



