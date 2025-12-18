"use client";
import { API_URL } from '@/lib/api';

import { useTranslations } from '@/hooks/useTranslations';
import { ArrowLeft, Building2, Calendar, CreditCard, Banknote, Shield, Lock, Check, ChevronDown, ChevronUp, MapPin, Phone, Clock, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [bookingData, setBookingData] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showDetails, setShowDetails] = useState(false);

  const hasChecked = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/auth/me`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const data = sessionStorage.getItem('pendingBooking');
          if (data) {
            sessionStorage.setItem('redirectAfterLogin', '/payment');
          }
          toast.error(t('payment.pleaseLogin'));
          router.push('/login');
          return;
        }
        
        const data = sessionStorage.getItem('pendingBooking');
        if (data) {
          const booking = JSON.parse(data);
          setBookingData(booking);
          
          try {
            const businessRes = await fetch(`${API_URL}/api/v1/search/businesses/${booking.businessId}`);
            if (businessRes.ok) {
              const businessInfo = await businessRes.json();
              setBusinessData(businessInfo.data);

              const methods = businessInfo.data?.paymentMethod;
              const available = Array.isArray(methods) ? methods : (methods ? [methods] : ['card', 'cash']);
              
              // Only reset payment method if currently selected method is not available
              // or if we're setting it for the first time
              setPaymentMethod(prev => {
                if (available.includes(prev)) return prev;
                if (available.includes('card')) return 'card';
                if (available.includes('cash')) return 'cash';
                return 'card';
              });
            }
          } catch (err) {
            console.error('Error fetching business details:', err);
          }
          
          setLoading(false);
        } else {
          toast.error(t('payment.noBookingData'));
          router.push('/');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        toast.error(t('payment.pleaseLoginContinue'));
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, t]);

  const handlePayment = async () => {
    if (!bookingData) return;
    
    setProcessing(true);
    try {
      // Step 1: Create the ticket first (unpaid)
      const ticketResponse = await fetch(`${API_URL}/api/v1/tickets/businesses/${bookingData.businessId}/tickets`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          businessId: bookingData.businessId,
          queueId: bookingData.queueId,
          type: bookingData.type || 'examination',
          priority: bookingData.priority || 'normal',
          price: 10.00,
          status: paymentMethod === 'card' ? 'pending_payment' : 'waiting',
          suppressUserSocket: paymentMethod === 'cash' ? true : false
        }),
      });

      if (!ticketResponse.ok) {
        const error = await ticketResponse.json();
        toast.error(error.message || t('payment.failedCreateTicket'));
        setProcessing(false);
        return;
      }

      const ticketData = await ticketResponse.json();
      const ticket = ticketData.data;

      // Step 2: Handle payment based on method
      const amount = 10.00; // Default ticket price

      if (paymentMethod === 'cash') {
        // Create pending payment record so it shows in dashboard
        try {
            await fetch(`${API_URL}/api/v1/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ticketId: ticket._id,
                    amount: amount,
                    paymentMethod: paymentMethod,
                    suppressUserSocket: true
                })
            });
        } catch (e) {
            console.error(`Failed to create cash payment record`, e);
        }

        toast.success(t('payment.ticketCreated'));
        sessionStorage.removeItem('pendingBooking');
        
        setTimeout(() => {
          router.push('/user?tab=myTickets');
        }, 2000);
      } else {
        // For Card (or other online methods handled by Stripe) -> Use Hosted Checkout Use Hosted Checkout
        try {
          const sessionRes = await fetch(`${API_URL}/api/v1/payments/create-checkout-session`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             credentials: 'include',
             body: JSON.stringify({
                 ticketId: ticket._id,
                 paymentMethod: paymentMethod // Pass method to configure checkout
             })
          });
          
          const sessionData = await sessionRes.json();
          
          if (sessionRes.ok && sessionData.sessionUrl) {
             sessionStorage.removeItem('pendingBooking');
             // Redirect to Hosted Checkout
             window.location.href = sessionData.sessionUrl;
          } else {
             toast.error(sessionData.message || t('payment.failedInitPayment'));
             setProcessing(false);
          }
        } catch (error) {
           console.error('Checkout error:', error);
           toast.error(t('payment.failedRedirectPayment'));
           setProcessing(false);
        }
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(t('payment.paymentFailed'));
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-200 dark:border-emerald-500/30 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-teal-400/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  // Determine available payment methods
  const methods = businessData?.paymentMethod;
  const available = Array.isArray(methods) ? methods : (methods ? [methods] : ['card', 'cash']);
  const showCard = available.length === 0 || available.includes('card') || available.includes('both');
  const showCash = available.length === 0 || available.includes('cash') || available.includes('both');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-8 md:py-12 px-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 mb-6 transition-all duration-300 font-medium"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
          {t('payment.back')}
        </button>

        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-0">
            {/* Step 1 - Review */}
            <div className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Check size={20} className="text-white" />
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-2">{t('payment.stepReview')}</span>
              </div>
              <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-2"></div>
            </div>
            
            {/* Step 2 - Payment (Current) */}
            <div className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20 animate-pulse">
                  <CreditCard size={20} className="text-white" />
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2">{t('payment.stepPayment')}</span>
              </div>
              <div className="w-16 md:w-24 h-1 bg-gray-200 dark:bg-gray-700 mx-2"></div>
            </div>
            
            {/* Step 3 - Confirmation */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Check size={20} className="text-gray-400 dark:text-gray-500" />
              </div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-2">{t('payment.stepConfirm')}</span>
            </div>
          </div>
        </div>

        {/* Main Payment Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
          
          {/* Premium Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 p-8 md:p-10">
            {/* Animated Background Patterns */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/15 rounded-full blur-xl"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Lock size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {t('payment.title')}
                  </h1>
                  <p className="text-white/80 text-sm md:text-base">
                    {t('payment.subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Card Section */}
          <div className="p-6 md:p-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-5 md:p-6 border border-gray-100 dark:border-gray-700/50 shadow-lg">
              <div className="flex gap-4 md:gap-5">
                {/* Business Photo */}
                {businessData?.profileImage ? (
                  <img 
                    src={`${API_URL}${businessData.profileImage}`}
                    alt={businessData.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover flex-shrink-0 border-4 border-white dark:border-gray-700 shadow-xl ring-2 ring-emerald-500/20"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 border-4 border-white dark:border-gray-700 shadow-xl">
                    <Building2 size={36} className="text-white" />
                  </div>
                )}

                {/* Business Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-1 truncate">
                    {bookingData?.businessName}
                  </h2>
                  {businessData?.specialization && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {businessData.specialization}
                    </p>
                  )}
                  
                  {/* Status & Rating */}
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      businessData?.isOpen 
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30' 
                        : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${businessData?.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                      {businessData?.isOpen ? t('payment.openNow') : t('payment.closed')}
                    </div>
                    
                    {businessData?.rating && (
                      <div className="inline-flex items-center gap-1 text-amber-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-semibold">{businessData.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Info Icons */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {businessData?.address?.city && (
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <MapPin size={14} className="text-emerald-500" />
                        <span>{businessData.address.city}</span>
                      </div>
                    )}
                    {businessData?.phoneNumber && (
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <Phone size={14} className="text-emerald-500" />
                        <span>{businessData.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* View Details Toggle */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-5 w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {showDetails ? (
                  <>
                    {t('payment.hideDetails')}
                    <ChevronUp size={18} />
                  </>
                ) : (
                  <>
                    {t('payment.viewFullDetails')}
                    <ChevronDown size={18} />
                  </>
                )}
              </button>

              {/* Expandable Details */}
              {showDetails && businessData && (
                <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700 space-y-4 animate-fade-in-up">
                  {/* Description */}
                  {businessData.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('payment.about')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{businessData.description}</p>
                    </div>
                  )}

                  {/* Working Hours */}
                  {businessData.workingHours && businessData.workingHours.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Clock size={14} className="text-emerald-500" />
                        {t('payment.workingHours')}
                      </h3>
                      <div className="space-y-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                        {businessData.workingHours.map((schedule, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">{schedule.days}</span>
                            <span className="text-gray-800 dark:text-white">
                              {schedule.isClosed ? t('payment.closed') : `${schedule.openTime} - ${schedule.closeTime}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Services */}
                  {businessData.service && businessData.service.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('payment.servicesOffered')}</h3>
                      <div className="grid gap-2">
                        {businessData.service.map((service, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="font-semibold text-gray-800 dark:text-white">{service.name}</h4>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">${service.price}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{service.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{t('payment.duration')}: {service.duration} min</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full Address */}
                  {businessData.address && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('payment.address')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {businessData.address.street && `${businessData.address.street}, `}
                        {businessData.address.city}
                        {businessData.address.state && `, ${businessData.address.state}`}
                        {businessData.address.zipCode && ` ${businessData.address.zipCode}`}
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('payment.contact')}</h3>
                    <div className="space-y-1 text-sm">
                      {businessData.email && (
                        <p className="text-gray-600 dark:text-gray-400">✉️ {businessData.email}</p>
                      )}
                      {businessData.phoneNumber && (
                        <p className="text-gray-600 dark:text-gray-400">📞 {businessData.phoneNumber}</p>
                      )}
                      {businessData.mobilePhone && (
                        <p className="text-gray-600 dark:text-gray-400">📱 {businessData.mobilePhone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="p-6 md:p-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
              <CreditCard size={22} className="text-emerald-500" />
              {t('payment.paymentMethod')}
            </h2>
            <div className="space-y-4">
              {showCard && (
                <label 
                  className={`group relative flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                    paymentMethod === 'card' 
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 shadow-lg shadow-emerald-500/10' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  
                  {/* Selection Indicator */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    paymentMethod === 'card' 
                      ? 'border-emerald-500 bg-emerald-500' 
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-400'
                  }`}>
                    {paymentMethod === 'card' && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                  
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    paymentMethod === 'card' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <CreditCard size={26} className={paymentMethod === 'card' ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 dark:text-white text-lg">{t('payment.creditDebitCard')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('payment.payWithStripe')}</p>
                  </div>
                  
                  {/* Stripe Badge */}
                  <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                    <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">Stripe</span>
                  </div>
                </label>
              )}
              
              {showCash && (
                <label 
                  className={`group relative flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                    paymentMethod === 'cash' 
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 shadow-lg shadow-emerald-500/10' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only"
                  />
                  
                  {/* Selection Indicator */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    paymentMethod === 'cash' 
                      ? 'border-emerald-500 bg-emerald-500' 
                      : 'border-gray-300 dark:border-gray-600 group-hover:border-emerald-400'
                  }`}>
                    {paymentMethod === 'cash' && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                  
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    paymentMethod === 'cash' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Banknote size={26} className={paymentMethod === 'cash' ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 dark:text-white text-lg">{t('payment.cash')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('payment.payAtBusiness')}</p>
                  </div>
                </label>
              )}
              
              {!showCard && !showCash && (
                <p className="text-red-500 dark:text-red-400 text-center py-4">
                  {t('payment.noPaymentMethodsAvailable') || 'No payment methods available for this business.'}
                </p>
              )}
            </div>
          </div>

          {/* Payment Summary & CTA */}
          <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50">
            {/* Price Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{t('payment.serviceFee')}</span>
                  <span>$10.00</span>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800 dark:text-white">{t('payment.totalAmount')}</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">$10.00</span>
                </div>
              </div>
            </div>
            
            {/* CTA Button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className="relative w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden group"
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <span className="relative flex items-center justify-center gap-3">
                {processing ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('payment.processingPayment')}
                  </>
                ) : (
                  <>
                    {paymentMethod === 'card' ? <CreditCard size={24} /> : <Banknote size={24} />}
                    {t('payment.completePayment')}
                  </>
                )}
              </span>
            </button>

            {/* Trust Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <Shield size={16} className="text-emerald-500" />
                <span>{t('payment.sslEncrypted')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                <Lock size={16} className="text-emerald-500" />
                <span>{t('payment.securePayment')}</span>
              </div>
              {paymentMethod === 'card' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                  <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">{t('payment.poweredByStripe')}</span>
                </div>
              )}
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              {t('payment.termsAgreement')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



