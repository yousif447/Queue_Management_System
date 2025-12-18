'use client';
import { useTranslations } from '@/hooks/useTranslations';
import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslations();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-6 py-20">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-[200px] md:text-[280px] font-black text-gray-100 dark:text-gray-800 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-float">
              <Search size={48} className="text-white" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('notFound.title')}
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
          {t('notFound.description')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <button className="btn-primary flex items-center justify-center gap-2 py-4 px-8">
              <Home size={20} />
              {t('notFound.button')}
            </button>
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="btn-secondary flex items-center justify-center gap-2 py-4 px-8"
          >
            <ArrowLeft size={20} />
            {t('notFound.goBack')}
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{t('notFound.popularPages')}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { labelKey: 'notFound.aboutUs', href: '/about' },
              { labelKey: 'notFound.contact', href: '/contact' },
              { labelKey: 'notFound.businessSolutions', href: '/business-solutions' },
            ].map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


