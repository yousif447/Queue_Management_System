"use client";
import { API_URL } from '@/lib/api';

import { useTranslations } from '@/hooks/useTranslations';
import { Loader2, AlertCircle, Home, Shield, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function StripeCheckoutPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ticketData, setTicketData] = useState(null);
  const [hasData, setHasData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try to get ticket data from multiple sources
    let data = sessionStorage.getItem('paymentTicket');
    
    // Also check pendingBooking as fallback (this might have ticket info)
    if (!data) {
      const pendingBooking = sessionStorage.getItem('pendingBooking');
      if (pendingBooking) {
        try {
          const booking = JSON.parse(pendingBooking);
          // If pendingBooking has a ticketId, use it
          if (booking.ticketId) {
            data = JSON.stringify({ ticketId: booking.ticketId, amount: booking.amount || 10 });
          }
        } catch (e) {
          console.error('Error parsing pendingBooking:', e);
        }
      }
    }
    
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        setTicketData(parsedData);
        redirectToStripe(parsedData);
      } catch (e) {
        console.error('Error parsing payment data:', e);
        setHasData(false);
      }
    } else {
      // Try URL parameters as fallback
      const ticketId = searchParams.get('ticketId');
      const amount = searchParams.get('amount');
      
      if (ticketId && amount) {
        const urlData = {
          ticketId,
          amount: parseFloat(amount),
        };
        setTicketData(urlData);
        redirectToStripe(urlData);
      } else {
        // No data found - show empty state
        setHasData(false);
      }
    }
  }, [router, searchParams, t]);

  const redirectToStripe = async (data) => {
    if (!data?.ticketId) {
      setError(t('checkout.noPaymentInfo'));
      setHasData(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/payments/create-checkout-session`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: data.ticketId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('checkout.failedSession'));
      }

      const result = await response.json();

      if (result.sessionUrl) {
        window.location.href = result.sessionUrl;
      } else {
        throw new Error(t('checkout.noCheckoutUrl'));
      }

    } catch (err) {
      console.error('Stripe redirect error:', err);
      setError(err.message || t('checkout.failedRedirect'));
      toast.error(err.message || t('checkout.failedRedirect'));
    }
  };

  // Show error state
  if (!hasData || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-rose-50/20 to-gray-50 dark:from-gray-950 dark:via-rose-950/10 dark:to-gray-950 p-6 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-10 text-center animate-fade-in-scale">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-500/20">
              <AlertCircle className="text-white" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {t('checkout.noPaymentInfo')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {error || (t('payment.noBookingDataDesc') || 'Please select a business and book a ticket first.')}
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Home size={20} />
              {t('payment.goToHome') || 'Browse Businesses'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 dark:from-gray-950 dark:via-emerald-950/20 dark:to-gray-950 p-6 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Loading Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-10 text-center animate-fade-in-scale">
          
          {/* Premium Loading Spinner */}
          <div className="relative mb-8">
            <div className="w-28 h-28 mx-auto relative">
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-emerald-200 dark:border-emerald-500/20"></div>
              {/* Spinning Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 border-r-teal-500 animate-spin"></div>
              {/* Inner Glow Ring */}
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-teal-400/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Loader2 size={32} className="text-white animate-spin" />
                </div>
              </div>
            </div>
            {/* Pulsing Glow */}
            <div className="absolute inset-0 w-28 h-28 mx-auto bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {t('checkout.redirecting')}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            {t('checkout.pleaseWait')}
          </p>
          
          {/* Animated Progress Dots */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-bounce shadow-lg shadow-emerald-500/50"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-bounce shadow-lg shadow-emerald-500/50" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-bounce shadow-lg shadow-emerald-500/50" style={{ animationDelay: '0.3s' }}></div>
          </div>
          
          {/* Security Badge */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-500/20">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Lock size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {t('checkout.securedByStripe')}
                </p>
                <p className="text-xs text-indigo-500/70 dark:text-indigo-400/70">
                  {t('checkout.sslEncryption')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-6 flex items-center justify-center gap-4 text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-1.5 text-xs">
              <Shield size={14} />
              <span>{t('checkout.pciCompliant')}</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="flex items-center gap-1.5 text-xs">
              <Lock size={14} />
              <span>{t('checkout.secure')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



