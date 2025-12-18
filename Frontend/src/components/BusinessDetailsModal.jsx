"use client";
import { API_URL } from '@/lib/api';

import { Building2, MapPin, Phone, Mail, Clock, Star, X } from 'lucide-react';
import { FaStar } from 'react-icons/fa';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useTranslations } from '@/hooks/useTranslations';

export default function BusinessDetailsModal({ business, onClose, onBook, isAuthenticated }) {
  const { t } = useTranslations();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [canReview, setCanReview] = useState(false);

  /* New State for Queue Status */
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [queueData, setQueueData] = useState(null);
  const [checkingQueue, setCheckingQueue] = useState(true);
  const [isBookingLimitReached, setIsBookingLimitReached] = useState(false);
  const [bookingLimitInfo, setBookingLimitInfo] = useState(null);
  const hasCheckedQueue = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(false);

  const handleClose = () => {
    if (isClosingRef.current) return; // Prevent multiple calls
    isClosingRef.current = true;
    setIsClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  useEffect(() => {
    // Prevent double calls in React Strict Mode
    if (hasCheckedQueue.current) return;
    hasCheckedQueue.current = true;
    
    fetchReviews();
    fetchCurrentUser();
    checkReviewEligibility();
    checkQueueStatus();
    
    // Reset on unmount
    return () => {
      hasCheckedQueue.current = false;
    };
  }, [business._id]);

  const checkQueueStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/queues/business/${business._id}/queue`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Modal Queue Status Check:', {
          businessName: business.name,
          queueId: data.data?._id,
          status: data.data?.status,
          fullData: data.data
        });
        setQueueData(data.data);
        // Check if queue status is 'paused'
        if (data.data?.status === 'paused') {
          setIsQueuePaused(true);
        } else {
          setIsQueuePaused(false);
        }
      } else if (response.status === 404) {
        // No queue exists
        setQueueData(null);
        setIsQueuePaused(false);
      }
      
      // Check subscription booking limit
      const limitResponse = await fetch(`${API_URL}/api/v1/subscriptions/business/${business._id}/check`, {
        credentials: 'include'
      });
      if (limitResponse.ok) {
        const limitData = await limitResponse.json();
        if (limitData.data) {
          setIsBookingLimitReached(!limitData.data.allowed);
          setBookingLimitInfo(limitData.data);
        }
      }
    } catch (error) {
      console.error('Error checking queue status:', error);
      setQueueData(null);
    } finally {
      setCheckingQueue(false);
    }
  };

  const checkReviewEligibility = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/users/me/tickets?businessId=${business._id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const tickets = data.data || [];
        const hasCompletedTicket = tickets.some(t => ['done', 'ended'].includes(t.status));
        setCanReview(hasCompletedTicket);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Handle nested response structure { status: 'success', data: { user } } or { data: ... }
        const user = data.data?.user || data.data || data;
        setCurrentUser(user);
      }
    } catch (error) {
      console.log('User not authenticated');
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/reviews/businesses/${business._id}/reviews?limit=50`);
      const data = await response.json();
      setReviews(data.reviews || []);
      setAvgRating(data.avgRating || 0);
      setReviewCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error(t('businessDetails.selectRating'));
      return;
    }
    
    if (!comment.trim()) {
      toast.error(t('businessDetails.writeComment'));
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        businessId: business._id,
        rating,
        comment: comment.trim(),
      };

      // If user provided a name (for anonymous reviews)
      if (reviewerName.trim()) {
        reviewData.anonymousName = reviewerName.trim();
      }
      
      // If logged in user wants to be anonymous
      if (currentUser && isAnonymous) {
        reviewData.anonymousName = "Anonymous";
      }

      const response = await fetch(`${API_URL}/api/v1/reviews/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        toast.success(t('businessDetails.reviewSubmitted'));
        setRating(0);
        setComment('');
        setReviewerName('');
        setShowReviewForm(false);
        fetchReviews();
      } else {
        const error = await response.json();
        toast.error(error.message || t('businessDetails.reviewFailed'));
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('businessDetails.reviewFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Helper to determine status display */
  const getStatusDisplay = () => {
    if (isQueuePaused) {
      return {
        text: t('businessDetails.busy'),
        colorClass: 'bg-orange-500/20 border-orange-300 dark:border-orange-600',
        dotClass: 'bg-orange-500 animate-pulse',
        textColor: 'text-orange-700 dark:text-orange-300'
      };
    }
    if (business.isOpen) {
      return {
        text: t('businessDetails.openNow'),
        colorClass: 'bg-green-500/20 border-green-300 dark:border-green-600',
        dotClass: 'bg-green-400 animate-pulse',
        textColor: 'text-green-700 dark:text-green-300'
      };
    }
    return {
      text: t('businessDetails.closed'),
      colorClass: 'bg-red-500/20 border-red-300 dark:border-red-600',
      dotClass: 'bg-red-400',
      textColor: 'text-red-700 dark:text-red-300'
    };
  };

  const status = getStatusDisplay();

  return (
    <div 
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl w-full sm:max-w-lg md:max-w-2xl max-h-[96vh] flex flex-col transition-all duration-300 border border-gray-200 dark:border-gray-700/50 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Photo */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 p-4 md:p-6 rounded-t-xl sm:rounded-t-2xl md:rounded-t-3xl relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
          >
            <X size={20} />
          </button>
          
          {/* Content */}
          <div className="flex items-center gap-4">
            {/* Business Photo */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 border-4 border-white shadow-xl overflow-hidden">
              {(business.profileImage || (business.businessImages && business.businessImages.length > 0)) ? (
                <>
                  <img 
                    src={`${API_URL}${business.profileImage || business.businessImages[0]}`}
                    alt={business.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <Building2 size={32} className="text-white hidden" />
                </>
              ) : (
                <Building2 size={32} className="text-white" />
              )}
            </div>
            
            {/* Business Info */}
            <div className="flex-1 min-w-0 pr-12">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1 truncate">
                {business.name}
              </h2>
              <p className="text-white/80 text-sm mb-3 truncate">
                {business.specialization || business.category || "General Service"}
              </p>
              
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${status.colorClass}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${status.dotClass}`}></div>
                <span className="text-sm font-bold text-white uppercase tracking-wide">
                  {status.text}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto flex-1">
          {/* Business Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            {/* Description */}
            {business.description && (
              <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-l-4 border-blue-500">
                <p className="text-gray-700 dark:text-gray-300">{business.description}</p>
              </div>
            )}

            {/* Services Section - NEW */}
            {business.service && business.service.length > 0 && (
              <div className="md:col-span-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">🛎️</span> {t('businessDetails.servicesOffered')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {business.service.map((service, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white mb-1">{service.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {service.duration ? `⏱️ ${service.duration} mins` : ''} 
                          {service.description ? ` • ${service.description}` : ''}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 px-3 py-1 rounded-lg shadow-sm">
                        <span className="font-bold text-[#359487] dark:text-[#C6FE02]">
                          {service.price === 0 ? t('common.free') : `$${service.price}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                {t('businessDetails.contactLocation')}
              </h3>
              
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm">
                  <MapPin className="text-emerald-600 dark:text-emerald-400" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{t('businessDetails.location')}</p>
                  <p className="text-sm text-gray-800 dark:text-white font-medium leading-relaxed">
                    {typeof business.address === 'object' 
                      ? (business.address.street || business.address.city || 'Location available')
                      : (business.address || 'Location available')}
                  </p>
                </div>
              </div>

              {(business.mobilePhone || business.phoneNumber) && (
                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm">
                    <Phone className="text-emerald-600 dark:text-emerald-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{t('businessDetails.phone')}</p>
                    <p className="text-sm text-gray-800 dark:text-white font-medium">
                      {business.mobilePhone || business.phoneNumber}
                    </p>
                  </div>
                </div>
              )}

              {business.email && (
                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm">
                    <Mail className="text-emerald-600 dark:text-emerald-400" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider font-semibold">{t('businessDetails.email')}</p>
                    <p className="text-sm text-gray-800 dark:text-white font-medium break-all">
                      {business.email}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Working Hours & Status */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                {t('businessDetails.workingHours')}
              </h3>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                {business.workingHours && business.workingHours.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {business.workingHours.map((schedule, idx) => {
                      const isToday = schedule.days === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
                      return (
                        <div key={idx} className={`flex justify-between items-center p-3 ${isToday ? 'bg-[#359487]/10 dark:bg-[#C6FE02]/10' : ''}`}>
                          <span className={`text-sm font-medium ${isToday ? 'text-[#359487] dark:text-[#C6FE02] font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                            {schedule.days} {isToday && `(${t('businessDetails.today')})`}
                          </span>
                          <span className={`text-sm ${isToday ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-800 dark:text-gray-200'}`}>
                            {schedule.isClosed ? t('businessDetails.closed') : `${schedule.openTime} - ${schedule.closeTime}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">{t('businessDetails.hoursNotAvailable')}</div>
                )}
              </div>

               {/* Stats Summary */}
               <div className="grid grid-cols-2 gap-3 mt-4">
                <div className={`p-3 rounded-xl border text-center ${status.colorClass?.replace('border-2', 'border')}`}>
                  <span className={`block text-xs uppercase tracking-wider font-bold mb-1 ${status.textColor}`}>{t('businessDetails.status')}</span>
                  <span className={`block font-bold ${status.textColor}`}>
                    {status.text}
                  </span>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-800 text-center">
                  <span className="block text-xs text-yellow-600 dark:text-yellow-400 uppercase tracking-wider font-bold mb-1">{t('businessDetails.rating')}</span>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-bold text-gray-800 dark:text-white">{avgRating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{t('businessDetails.customerReviews')}</h3>
              {canReview && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  <FaStar /> {t('businessDetails.writeReview')}
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('businessDetails.shareExperience')}</h4>
                
                {/* User Info Display */}
                {currentUser ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border-2 border-[#359487] dark:border-[#C6FE02]">
                      <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
                             {!isAnonymous && currentUser.profilePhoto ? (
                                <img src={currentUser.profilePhoto.startsWith('http') ? currentUser.profilePhoto : `${API_URL}${currentUser.profilePhoto}`} className="w-full h-full object-cover" 
                                  onError={(e) => { e.target.style.display='none'; if(e.target.nextSibling) e.target.nextSibling.style.display='flex'; }}
                                />
                             ) : null}
                             <div className={`w-full h-full flex items-center justify-center font-bold text-white dark:text-black text-lg absolute inset-0 bg-gradient-to-br from-[#359487] to-[#2a7569] dark:from-[#C6FE02] dark:to-[#a8d902] ${!isAnonymous && currentUser.profilePhoto ? 'hidden' : 'flex'}`}>
                               {isAnonymous ? 'A' : (currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
                             </div>
                          </div>
                          
                          <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-extrabold text-[#359487] dark:text-[#C6FE02] uppercase tracking-wider">{t('businessDetails.postingAs')}</span>
                              <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                {isAnonymous ? t('businessDetails.anonymous') : (currentUser.name || currentUser.email || 'User')}
                              </span>
                          </div>
                      </div>

                      <div className="relative">
                          <select 
                            value={isAnonymous ? 'anonymous' : 'public'}
                            onChange={(e) => setIsAnonymous(e.target.value === 'anonymous')}
                            className="appearance-none bg-gray-100 dark:bg-gray-700 text-xs font-bold py-2 pl-3 pr-8 rounded-lg border-none focus:ring-0 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <option value="public">{t('businessDetails.showName')}</option>
                            <option value="anonymous">{t('businessDetails.hideName')}</option>
                          </select>
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px]">▼</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('businessDetails.yourName')}
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder={t('businessDetails.leaveBlankAnonymous')}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400"
                    />
                  </div>
                )}

                {/* Rating */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('businessDetails.ratingRequired')}
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <FaStar
                          size={32}
                          className={`${
                            star <= (hoveredRating || rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('businessDetails.yourReview')}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('businessDetails.shareExperiencePlaceholder')}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-6 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || rating === 0 || !comment.trim()}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#359487] to-[#2a7569] dark:from-[#C6FE02] dark:to-[#a8d902] text-white dark:text-black font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-black border-t-transparent"></div>
                        {t('businessDetails.submitting')}
                      </>
                    ) : (
                      <>
                        <FaStar /> {t('businessDetails.submitReview')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359487] dark:border-[#C6FE02] mx-auto"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <span className="text-5xl mb-4 block">⭐</span>
                <p className="text-gray-600 dark:text-gray-400">{t('businessDetails.noReviewsYet')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-4">
                      {/* User Avatar */}
                      <div className="flex-shrink-0 relative">
                        {review.userId?.profilePhoto && !review.anonymousName ? (
                          <>
                            <img 
                              src={review.userId.profilePhoto.startsWith('http') ? review.userId.profilePhoto : `${API_URL}${review.userId.profilePhoto}`} 
                              alt={review.userId.name}
                              className="w-12 h-12 rounded-full object-cover"
                              onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'flex';
                                  }
                              }}
                            />
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#359487] to-[#2a7569] dark:from-[#C6FE02] dark:to-[#a8d902] items-center justify-center hidden absolute top-0 left-0">
                              <span className="text-white dark:text-black font-bold text-lg">
                                {(review.userId?.name || 'A').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#359487] to-[#2a7569] dark:from-[#C6FE02] dark:to-[#a8d902] flex items-center justify-center">
                            <span className="text-white dark:text-black font-bold text-lg">
                              {(review.anonymousName || review.userId?.name || 'A').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-white">
                              {review.anonymousName || review.userId?.name || 'Anonymous'}
                              {review.anonymousName && <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">Hidden</span>}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                                size={16}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700/50 p-6 rounded-b-2xl">
          {/* Closed Warning */}
          {!business.isOpen && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" size={18} />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300 mb-1">
                    {t('businessDetails.businessClosed')}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {t('businessDetails.cannotBook')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Queue Paused/Busy Warning */}
           {business.isOpen && isQueuePaused && (
             <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-lg">
               <div className="flex items-start gap-3">
                 <div className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0 text-lg">⏸️</div>
                 <div>
                   <p className="font-semibold text-orange-800 dark:text-orange-300 mb-1">
                     {t('businessDetails.businessBusy')}
                   </p>
                   <p className="text-sm text-orange-700 dark:text-orange-400">
                     {t('businessDetails.queuePaused')}
                   </p>
                 </div>
               </div>
             </div>
           )}

           {/* Fully Booked Warning - User-friendly message without exposing subscription details */}
           {business.isOpen && !isQueuePaused && queueData?.status === 'active' && isBookingLimitReached && (
             <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg">
               <div className="flex items-start gap-3">
                 <div className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0 text-lg">🔥</div>
                 <div>
                   <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                     {t('businessDetails.fullyBooked')}
                   </p>
                   <p className="text-sm text-amber-700 dark:text-amber-400">
                     {t('businessDetails.highDemand')}
                   </p>
                 </div>
               </div>
             </div>
           )}

           {/* Queue Status Warning */}
           {business.isOpen && !isQueuePaused && !isBookingLimitReached && (!queueData || queueData.status !== 'active') && !checkingQueue && (
             <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/30 border-l-4 border-gray-400 dark:border-gray-500 rounded-lg">
               <div className="flex items-start gap-3">
                 <div className="text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0 text-lg">ℹ️</div>
                 <div>
                   <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                     {queueData && queueData.status === 'closed' ? t('businessDetails.queueClosed') : t('businessDetails.businessBusy')}
                   </p>
                   <p className="text-sm text-gray-600 dark:text-gray-400">
                     {queueData && queueData.status === 'closed' 
                       ? t('businessDetails.queueClosedDesc')
                       : t('businessDetails.queuePaused')}
                   </p>
                 </div>
               </div>
             </div>
           )}
          
          <div className="flex gap-4">
            <button
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {t('businessDetails.close')}
            </button>
            <button
              onClick={onBook}
              disabled={!business.isOpen || checkingQueue || isQueuePaused || (!queueData && !checkingQueue) || (queueData && queueData.status !== 'active') || isBookingLimitReached}
              className={`flex-1 py-3 rounded-xl font-bold transition-all duration-200 ${
                business.isOpen && !checkingQueue && !isQueuePaused && queueData && queueData.status === 'active' && !isBookingLimitReached
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              {!business.isOpen 
                ? t('businessDetails.closed') 
                : checkingQueue
                ? t('businessDetails.loading')
                : isQueuePaused 
                ? t('businessDetails.busy') 
                : isBookingLimitReached
                ? t('businessDetails.fullyBooked')
                : (queueData && queueData.status === 'closed')
                ? t('businessDetails.closed')
                : (!queueData || queueData.status !== 'active')
                ? t('businessDetails.busy')
                : t('businessDetails.bookTicket')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



