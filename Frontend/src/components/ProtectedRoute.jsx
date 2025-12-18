"use client";

import { API_URL, authFetch } from '@/lib/api';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await authFetch(`${API_URL}/api/v1/auth/me`);

        if (!res.ok) {
          // Clear invalid token
          localStorage.removeItem('accessToken');
          if (pathname?.startsWith('/admin')) {
             router.push('/admin/login');
          } else {
             router.push('/login');
          }
          return;
        }

        const data = await res.json();
        const userRole = data.data?.role;

        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
          if (userRole === 'user') {
            router.push('/user');
          } else if (userRole === 'business') {
            router.push('/business');
          } else if (userRole === 'admin') {
            router.push('/adminDashboard');
          } else {
            router.push('/');
          }
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        if (pathname?.startsWith('/admin')) {
           router.push('/admin/login');
        } else {
           router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <div className="w-full h-full border-4 border-emerald-200 dark:border-emerald-500/30 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}


