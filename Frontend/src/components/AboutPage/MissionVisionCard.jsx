"use client";
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Target, Eye } from 'lucide-react';

export default function MissionVisionCard({ title, value, delay = 0 }) {
  const [ref, isVisible] = useIntersectionObserver();
  const isMission = title.toLowerCase().includes('mission');
  
  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 p-10 rounded-3xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-500 w-[98%] md:w-[45%] md:min-h-[320px] ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="w-16 h-16 mb-6 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
          {isMission ? <Target size={32} /> : <Eye size={32} />}
        </div>
        <h3 className="text-3xl font-bold text-white mb-6 group-hover:translate-x-2 transition-transform">
          {title}
        </h3>
        <p className="text-white/90 text-lg leading-relaxed">
          {value}
        </p>
      </div>
    </div>
  );
}


