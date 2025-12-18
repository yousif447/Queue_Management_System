"use client";
import { API_URL } from '@/lib/api';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function RequirePayment({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let timeoutId;

    const checkPaymentStatus = async (retryCount = 0) => {
      let status; // Define status here to be accessible in finally block
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/me`, { credentials: 'include' });

        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        const subscription = data.data?.subscription;
        status = subscription?.status; // Assign value to status

        if (status === 'active' || status === 'trialing') {
          setHasAccess(true);
        } else if (retryCount < 3) {
           // Retry if status is not yet active (might be race condition)
           setTimeout(() => checkPaymentStatus(retryCount + 1), 1000);
        } else {
          // Wait 10 seconds before redirecting to allow user to see the "Payment Required" message
          timeoutId = setTimeout(() => {
            router.push('/select-plan');
          }, 10000);
        }
      } catch (error) {
        console.error('Payment check error:', error);
        if (retryCount < 3) {
            setTimeout(() => checkPaymentStatus(retryCount + 1), 1000);
        } else {
             router.push('/login');
        }
      } finally {
        // Now status is accessible here
        if (retryCount >= 3 || (status === 'active' || status === 'trialing')) {
            setLoading(false);
        }
      }
    };

    checkPaymentStatus();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <div className="w-full h-full border-4 border-emerald-200 dark:border-emerald-500/30 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700/50 p-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-500/25">
            <Lock size={36} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Payment Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Please complete your payment to access this feature and start managing your queue.
          </p>
          <button
            onClick={() => router.push('/select-plan')}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} /> Choose a Plan <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}



