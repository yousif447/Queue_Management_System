"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaGithub } from 'react-icons/fa';
import { Mail, Phone, MapPin, ArrowUpRight, Heart } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

const Footer = () => {
  const pathName = usePathname();
  const { t } = useTranslations();
  
  if(pathName === '/login' || pathName === '/login/businessregister' || pathName === '/login/customerregister' || pathName === '/login/forgot-password') {
    return null;
  }

  const footerLinks = {
    product: [
      { labelKey: 'footer.links.features', href: '/#services' },
      { labelKey: 'footer.links.pricing', href: '/business-solutions' },
    ],
    company: [
      { labelKey: 'footer.links.aboutUs', href: '/about' },
    ],
    resources: [
      { labelKey: 'footer.links.contact', href: '/contact' },
    ],
    legal: [],
  };

  const socialLinks = [
    // { icon: FaFacebookF, href: '#', label: 'Facebook' },
    // { icon: FaTwitter, href: '#', label: 'Twitter' },
    // { icon: FaInstagram, href: '#', label: 'Instagram' },
    // { icon: FaLinkedinIn, href: '#', label: 'LinkedIn' },
    // { icon: FaGithub, href: '#', label: 'GitHub' },
  ];

  return (
    <footer className="relative bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 py-16 relative z-10">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Quick<span className="gradient-text">Queue</span>
              </span>
            </Link>
            
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm">
              {t('footer.description')}
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a href={`mailto:${t('footer.contactInfo.email')}`} className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
                  <Mail size={16} className="text-gray-500 dark:text-gray-400 group-hover:text-emerald-500" />
                </div>
                <span className="text-sm">{t('footer.contactInfo.email')}</span>
              </a>
              <a href={`tel:${t('footer.contactInfo.phone')}`} className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
                  <Phone size={16} className="text-gray-500 dark:text-gray-400 group-hover:text-emerald-500" />
                </div>
                <span className="text-sm">{t('footer.contactInfo.phone')}</span>
              </a>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                </div>
                <span className="text-sm">{t('footer.contactInfo.address')}</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">{t('footer.sections.product')}</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm transition-colors flex items-center gap-1 group">
                      {t(link.labelKey)}
                      <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">{t('footer.sections.company')}</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm transition-colors flex items-center gap-1 group">
                      {t(link.labelKey)}
                      <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">{t('footer.sections.resources')}</h4>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm transition-colors flex items-center gap-1 group">
                      {t(link.labelKey)}
                      <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center gap-1">
              {t('footer.copyright')} <Heart size={14} className="text-red-500 fill-red-500" /> {t('footer.allRightsReserved')}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a 
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-emerald-500/25"
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

