"use client";

import { useTranslations } from '@/hooks/useTranslations';
import { Calendar, Clock, Mail, MapPin, Phone, X, Star, ArrowRight } from 'lucide-react';

export default function BookingModal({ business, onClose, onCheckout, isProcessing }) {
  const { t } = useTranslations();
  
  if (!business) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700/50 animate-scaleIn">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 p-8 flex items-start justify-between rounded-t-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {business.name}
            </h2>
            <p className="text-white/80">
              {business.specialization || business.category || t('booking.generalService')}
            </p>
            {business.rating !== undefined && (
              <div className="flex items-center gap-2 mt-3">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <span className="text-white font-semibold">{business.rating.toFixed(1)}</span>
                <span className="text-white/60 text-sm">{t('business.rating')}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Description */}
          {business.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('payment.about')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{business.description}</p>
            </div>
          )}

          {/* Business Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('booking.businessInfo')}</h3>
            <div className="space-y-4">
              {/* Address */}
              {business.address && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
                    <MapPin size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('businessDetails.location')}</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {business.address.street && `${business.address.street}, `}
                      {business.address.city || t('booking.notSpecified')}
                      {business.address.state && `, ${business.address.state}`}
                      {business.address.zipCode && ` ${business.address.zipCode}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Phone */}
              {business.phoneNumber && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
                    <Phone size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('businessDetails.phone')}</p>
                    <p className="text-gray-900 dark:text-white font-medium">{business.phoneNumber}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              {business.email && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
                    <Mail size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('businessDetails.email')}</p>
                    <p className="text-gray-900 dark:text-white font-medium">{business.email}</p>
                  </div>
                </div>
              )}

              {/* Working Hours */}
              {business.workingHours && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
                    <Clock size={18} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('payment.workingHours')}</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {business.workingHours.open && business.workingHours.close 
                        ? `${business.workingHours.open} - ${business.workingHours.close}`
                        : t('booking.hoursNotSpecified')}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-3 pt-2">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm ${
                  business.isOpen 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' 
                    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${business.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {business.isOpen ? t('payment.openNow') : t('payment.closed')}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Info */}
          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">{t('booking.bookingInfo')}</p>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  {t('booking.redirectInfo')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700/50 p-6 flex gap-4 rounded-b-3xl">
          <button onClick={onClose} className="flex-1 btn-secondary py-4">
            {t('common.cancel')}
          </button>
          <button
            onClick={() => { console.log('Checkout clicked', { business, isProcessing }); onCheckout(); }}
            disabled={isProcessing}
            className="flex-1 btn-primary py-4 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('common.processing')}</>
            ) : (
              <>{t('booking.proceedToCheckout')} <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


