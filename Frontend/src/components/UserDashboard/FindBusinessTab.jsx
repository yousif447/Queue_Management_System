"use client";
import { API_URL, authFetch } from '@/lib/api';

import BusinessDetailsModal from '@/components/BusinessDetailsModal';
import { Building2, Clock, Search, Sparkles } from 'lucide-react';
import { useState } from "react";
import toast from "react-hot-toast";

export default function FindBusinessTab({ t, searchResults, isSearching, searchQuery, setSearchQuery, handleSearch, isAISuggestion }) {
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBookClick = (business) => setSelectedBusiness(business);

  const handleCheckout = async (business) => {
    if (!business) return;
    setIsProcessing(true);
    try {
      const queueResponse = await authFetch(`${API_URL}/api/v1/queues/business/${business._id}/queue`);
      if (!queueResponse.ok) { toast.error(t('userDashboard.messages.queueNotAvailable')); setIsProcessing(false); return; }
      const queueData = await queueResponse.json();
      const queueId = queueData.data?._id;
      if (!queueId) { toast.error(t('userDashboard.messages.queueNotFound')); setIsProcessing(false); return; }
      sessionStorage.setItem('pendingBooking', JSON.stringify({ businessId: business._id, businessName: business.name, queueId, type: 'examination', priority: 'normal' }));
      window.location.href = '/payment';
    } catch (error) { toast.error(t('userDashboard.messages.checkoutFailed')); setIsProcessing(false); }
  };

  return (
    <>
      {selectedBusiness && <BusinessDetailsModal business={selectedBusiness} onClose={() => setSelectedBusiness(null)} onBook={() => handleCheckout(selectedBusiness)} isAuthenticated={true} />}
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Search className="text-emerald-500" /> {t('clinics.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('userDashboard.findBusiness.subtitle')}</p>
        </div>

        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-lg dark:shadow-xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input type="text" placeholder={t('clinics.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <button onClick={handleSearch} disabled={isSearching}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] flex items-center justify-center gap-2">
              {isSearching ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>{t('common.searching')}</>) : (<><Search size={18} />{t('common.search')}</>)}
            </button>
          </div>
        </div>

        {/* AI Suggestion Banner */}
        {isAISuggestion && searchResults.length > 0 && (
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 border-2 border-purple-300 dark:border-purple-600 rounded-2xl p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-1 flex items-center gap-2">
                  <span>{t('services.aiSuggestions')}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500 text-white">{t('services.smart')}</span>
                </h3>
                <p className="text-sm text-purple-800 dark:text-purple-400">
                  {t('services.aiSuggestionsDescription')}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {searchResults.length > 0 && !isSearching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...searchResults].sort((a, b) => {
              // Helper to determine status priority
              const getPriority = (business) => {
                if (!business.isOpen) return 3; // Closed (Lowest priority)
                if (business.isFullyBooked) return 3; // Treated as closed/unavailable
                if (business.queueStatus === 'active') return 1; // Online/Open (Highest priority)
                return 2; // Busy
              };

              const priorityA = getPriority(a);
              const priorityB = getPriority(b);

              if (priorityA !== priorityB) {
                return priorityA - priorityB;
              }
              return 0; // Maintain original order if same priority
            }).map((business) => (
              <div 
                key={business._id} 
                onClick={() => setSelectedBusiness(business)}
                className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700/50 overflow-hidden cursor-pointer transform hover:scale-[1.02]"
              >
                {/* Business Header */}
                <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 p-6">
                  <div className="flex gap-4 items-center">
                    {/* Business Photo */}
                    {business.profileImage || (business.businessImages && business.businessImages.length > 0) ? (
                      <img 
                        src={`${API_URL}${business.profileImage || business.businessImages[0]}`}
                        alt={business.name}
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border-4 border-white/20 shadow-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 border-4 border-white/20 shadow-lg"
                      style={{ display: (business.profileImage || (business.businessImages && business.businessImages.length > 0)) ? 'none' : 'flex' }}
                    >
                      <Building2 size={32} className="text-white" />
                    </div>
                    
                    {/* Business Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {business.name}
                      </h3>
                      <p className="text-white/90 text-sm">
                        {business.specialization || business.category || "General Service"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="p-6 space-y-4">
                  {/* Rating & Status Row */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-xl">⭐</span>
                      <span className="text-lg font-bold text-gray-800 dark:text-white">
                        {(business.rating || 0).toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({business.reviewCount || 0})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!business.isOpen ? (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                          <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                            {t('common.closed')}
                          </span>
                        </>
                      ) : business.isFullyBooked ? (
                        <>
                          <span className="text-amber-500">🔥</span>
                          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                            {t('common.fullyBooked')}
                          </span>
                        </>
                      ) : business.queueStatus === 'active' ? (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {t('common.open')}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                            {t('common.busy')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Key Information */}
                  <div className="space-y-3">
                    {/* Location */}
                    {business.address && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-600 dark:text-emerald-400">📍</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('businessDetails.location')}</p>
                          <p className="text-sm text-gray-800 dark:text-white font-medium line-clamp-2">
                            {typeof business.address === 'object' 
                              ? (business.address?.city || business.address?.street || 'Location available')
                              : (business.address || 'Location available')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Working Hours */}
                    {business.workingHours && business.workingHours.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                          <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('userDashboard.findBusiness.hours')}</p>
                          <p className="text-sm text-gray-800 dark:text-white font-medium">
                            {(() => {
                              const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                              const today = days[new Date().getDay()];
                              if (!business.workingHours) return 'See details';
                              
                              const todaySchedule = business.workingHours.find(wh => wh.days === today);
                              
                              if (todaySchedule && !todaySchedule.isClosed) {
                                return `${todaySchedule.openTime} - ${todaySchedule.closeTime}`;
                              } else {
                                return t('payment.closed');
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-16 text-center shadow-lg">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 dark:border-gray-700 relative">
               <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping opacity-20"></div>
                     {isSearching ? <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500/30 border-t-emerald-500"></div> : <Search className="text-gray-400 dark:text-gray-600" size={40} />}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{isSearching ? t('common.searching') : (searchQuery ? t('clinics.noBusinessesFound') : t('userDashboard.findBusiness.findActive'))}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">{isSearching ? t('userDashboard.findBusiness.lookingForMatches') : (searchQuery ? t('userDashboard.findBusiness.noMatches') : t('userDashboard.findBusiness.startTyping'))}</p>
          </div>
        )}
      </div>
    </>
  );
}



