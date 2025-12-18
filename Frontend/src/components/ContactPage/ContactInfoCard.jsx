"use client";

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export default function ContactInfoCard({ icon: Icon, title, content, delay = 0 }) {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div
      ref={ref}
      className={`group flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-gray-900 dark:text-white font-semibold text-lg">{content}</p>
      </div>
    </div>
  );
}


