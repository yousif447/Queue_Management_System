"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from "./Navbar";
import Footer from "./Footer";
import { API_URL } from '@/lib/api';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  // Only hide navbar/footer for the actual dashboard, not the landing pages
  const hideNavAndFooter = pathname === '/business' || pathname?.startsWith('/business/') || pathname?.startsWith('/adminDashboard') || pathname?.startsWith('/admin');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Prevent redirect loop if user needs to select a plan or is on subscription pages
          if (data.data?.role === 'business' && 
              !pathname?.startsWith('/business') && 
              pathname !== '/select-plan' && 
              !pathname?.startsWith('/subscription/')) {
             router.replace('/business');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, [pathname, router]);

  return (
    <>
      {!hideNavAndFooter && <Navbar />}
      {children}
      {!hideNavAndFooter && <Footer />}
    </>
  );
}


