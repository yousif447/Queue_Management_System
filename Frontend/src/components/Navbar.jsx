"use client";
import { useSocket } from '@/contexts/SocketContext';
import { useTranslations } from '@/hooks/useTranslations';
import { API_URL, authFetch } from '@/lib/api';
import { ChevronDown, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BiLogOut } from "react-icons/bi";
import { FaArrowRight } from "react-icons/fa";
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathName = usePathname();
  const router = useRouter();
  const { t } = useTranslations();
  const { registerUser } = useSocket();
  const [userData, setUserData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${API_URL}/${cleanPath}`;
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authFetch(`${API_URL}/api/v1/auth/me`);
        if (res.ok) {
          setIsAuthenticated(true);
          const data = await res.json();
          setUserData(data.data);
          if(data.data?._id) registerUser(data.data._id);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('accessToken');
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathName]);

  if(pathName === '/login' || pathName === '/login/businessregister' || pathName === '/login/customerregister' || pathName === '/login/forgot-password') {
    return null;
  }

  const handleLogout = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/v1/auth/logout`, { method: 'POST' });
      // Clear localStorage token
      localStorage.removeItem('accessToken');
      // Clear cookies client-side as well (backup for cross-origin issues)
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      setIsAuthenticated(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to clear and redirect even on error
      localStorage.removeItem('accessToken');
      document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      setIsAuthenticated(false);
      window.location.href = '/';
    }
  };

  const navLinks = [
    { href: '/', label: t('nav.home') },
    ...(!isAuthenticated ? [{ href: '/business-solutions', label: t('nav.businessSolutions') }] : []),
    { href: '/about', label: t('nav.about') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg shadow-gray-900/5 dark:shadow-black/20 border-b border-gray-100 dark:border-gray-800' 
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-transparent'
      }`}>
        <div className="container mx-auto flex justify-between items-center h-20 px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 group-hover:scale-105 transition-all duration-300">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Quick<span className="gradient-text">Queue</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      pathName === link.href 
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' 
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {link.label}
                    {pathName === link.href && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Auth Section */}
            {!loading && (
              isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {userData?.role === 'user' && (
                    <div className="relative"><NotificationBell /></div>
                  )}
                  
                  {/* User Avatar Menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)} 
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/25 ring-2 ring-white dark:ring-gray-800">
                        {(userData?.profileImage || userData?.image) ? (
                          <img src={getImageUrl(userData?.profileImage || userData?.image)} alt={userData?.name} className="w-full h-full object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.innerText = userData?.name?.charAt(0).toUpperCase(); }} />
                        ) : (userData?.name?.charAt(0).toUpperCase())}
                      </div>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isAvatarMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAvatarMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 border border-gray-100 dark:border-gray-800 animate-fade-in-scale overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/25 overflow-hidden">
                              {(userData?.profileImage || userData?.image) ? (
                                <img src={getImageUrl(userData?.profileImage || userData?.image)} alt={userData?.name} className="w-full h-full object-cover" 
                                  onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.classList.remove('overflow-hidden'); e.target.parentNode.innerText = userData?.name?.charAt(0).toUpperCase(); }} />
                              ) : (
                                userData?.name?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">{userData?.name || t('adminDashboard.user')}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{userData?.email || ''}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2">
                          <Link href={userData?.role === 'user' ? '/user' : userData?.role === 'business' ? '/business' : userData?.role === 'admin' ? '/adminDashboard' : '/'}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors font-medium"
                            onClick={() => setIsAvatarMenuOpen(false)}>
                            <span className="text-lg">📊</span>
                            {t('nav.dashboard')}
                          </Link>
                          <button onClick={() => { handleLogout(); setIsAvatarMenuOpen(false); }} 
                            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-medium">
                            <BiLogOut size={18} />
                            {t('nav.logout')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link href="/login">
                  <button className="btn-primary flex items-center gap-2 text-sm">
                    {t('nav.login')}
                    <FaArrowRight size={12} />
                  </button>
                </Link>
              )
            )}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            
            {/* Mobile Menu Button */}
            <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isOpen ? <X className="w-6 h-6 text-gray-600 dark:text-gray-300" /> : <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 top-20 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl animate-fade-in">
          <div className="container mx-auto px-6 py-8">
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl font-medium transition-all ${
                      pathName === link.href 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
              {!loading && (
                isAuthenticated ? (
                  <div className="space-y-3">
                    <Link href={userData?.role === 'user' ? '/user' : userData?.role === 'business' ? '/business' : userData?.role === 'admin' ? '/adminDashboard' : '/'}
                      onClick={() => setIsOpen(false)} className="block px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-medium text-gray-700 dark:text-gray-300">
                      📊 {t('nav.dashboard')}
                    </Link>
                    <button onClick={() => { handleLogout(); setIsOpen(false); }} className="btn-danger w-full flex items-center justify-center gap-2">
                      <BiLogOut /> {t('nav.logout')}
                    </button>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <button className="btn-primary w-full flex items-center justify-center gap-2">
                      {t('nav.login')} <FaArrowRight />
                    </button>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for avatar menu */}
      {isAvatarMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsAvatarMenuOpen(false)} />
      )}
    </>
  );
}


