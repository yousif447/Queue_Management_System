"use client";
import useCountAnimation from '@/hooks/useCountAnimation';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export default function AnimatedStatCard({ icon, title, value, delay = 0 }) {
  const [ref, isVisible] = useIntersectionObserver();
  const numericValue = parseInt(value);
  const suffix = value.replace(/[0-9]/g, '');
  const animatedCount = useCountAnimation(numericValue, 2000, isVisible);
  
  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 min-w-[250px] group ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Background Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {animatedCount}{suffix}
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          {title}
        </div>
      </div>
    </div>
  );
}


