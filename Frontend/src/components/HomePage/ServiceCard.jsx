"use client";

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export default function ServiceCard({ icon: Icon, title, description, delay = 0 }) {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Background Glow Effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Icon Container */}
      <div className="relative z-10 w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 group-hover:scale-110 group-hover:shadow-emerald-500/50 transition-all duration-300">
        <Icon size={28} className="text-white" />
      </div>
      
      {/* Content */}
      <h3 className="relative z-10 text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
        {title}
      </h3>
      <p className="relative z-10 text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
      
      {/* Hover Arrow */}
      <div className="relative z-10 mt-6 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2">
        <span>Learn more</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}


