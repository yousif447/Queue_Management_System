"use client";
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export default function SectionTitle({ children, delay = 0 }) {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div
      ref={ref}
      className={`text-center transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
        {children}
      </h2>
      <div className="w-24 h-1.5 mx-auto bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
    </div>
  );
}


