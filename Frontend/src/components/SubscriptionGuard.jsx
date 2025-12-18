"use client";
import { API_URL } from '@/lib/api';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SubscriptionGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  const publicPages = [
    '/login', '/register', '/login/businessregister', '/select-plan',
    '/subscription/success', '/subscription/cancel', '/business-solutions',
    '/for-business', '/', '/contact'
  ];

  const businessPages = ['/business'];

  useEffect(() => {
    const checkAccess = async () => {
      if (publicPages.some(page => pathname.startsWith(page))) {
        setLoading(false);
        setCanAccess(true);
        return;
      }

      if (!businessPages.some(page => pathname.startsWith(page))) {
        setLoading(false);
        setCanAccess(true);
        return;
      }

      try {
        const authRes = await fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' });

        if (!authRes.ok) {
          setCanAccess(true);
          setLoading(false);
          return;
        }

        const authData = await authRes.json();
        const user = authData.data;

        if (user.role !== 'business') {
          setCanAccess(true);
          setLoading(false);
          return;
        }

        const subRes = await fetch(`${API_URL}/api/v1/subscriptions/status`, { credentials: 'include' });

        if (subRes.ok) {
          const subData = await subRes.json();
          const subscription = subData.data;

          if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
            setCanAccess(true);
          } else {
            router.push('/select-plan');
            setCanAccess(false);
          }
        } else {
          router.push('/select-plan');
          setCanAccess(false);
        }
      } catch (error) {
        console.error('Access check error:', error);
        router.push('/select-plan');
        setCanAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 dark:border-emerald-500/30 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return <>{children}</>;
}



