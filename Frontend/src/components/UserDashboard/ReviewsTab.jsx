"use client";
import { API_URL } from '@/lib/api';

import { Star, MessageSquare, Calendar, Clock, Ticket, Building2, MapPin, Phone, Mail } from 'lucide-react';

const StarRating = ({ rating }) => (
  <div className="flex gap-1">
    {[...Array(5)].map((_, i) => (<Star key={i} size={20} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'} />))}
  </div>
);

export default function ReviewsTab({ t, myReviews, loadingReviews }) {
  const avgRating = myReviews.length > 0 ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3"><Star className="text-amber-500" /> {t('userDashboard.reviews.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('userDashboard.reviews.subtitle')}</p>
      </div>

      {myReviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-3xl p-8 text-white text-center relative overflow-hidden group shadow-lg">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-700"></div>
             <div className="relative z-10">
               <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">{t('userDashboard.reviews.averageRating')}</p>
               <p className="text-6xl font-black mb-3 drop-shadow-sm">{avgRating}</p>
               <div className="flex justify-center mb-2"><StarRating rating={Math.round(avgRating)} /></div>
               <p className="text-sm font-medium opacity-90 inline-block bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">{t('userDashboard.reviews.basedOn', { count: myReviews.length })}</p>
             </div>
          </div>
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700/50 flex flex-col items-center justify-center shadow-lg group relative overflow-hidden">
             <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="p-4 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-4 group-hover:scale-110 transition-transform duration-300">
               <MessageSquare className="fill-current" size={32} />
             </div>
             <p className="text-5xl font-black text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{myReviews.length}</p>
             <p className="text-gray-500 font-medium uppercase tracking-wider text-sm">{t('userDashboard.reviews.totalReviews')}</p>
          </div>
        </div>
      )}

      {loadingReviews ? (
        <div className="min-h-[400px] flex items-center justify-center"><div className="w-16 h-16 border-4 border-amber-500/30 rounded-full animate-spin border-t-amber-500"></div></div>
      ) : myReviews.length === 0 ? (
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-20 text-center shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-amber-500/10"></div>
          <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform duration-500">
            <Star className="text-gray-400 dark:text-gray-500" size={48} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('userDashboard.reviews.noReviews')}</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-lg">{t('userDashboard.reviews.placeholder')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {myReviews.map((review) => (
            <div key={review._id} className="group bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 shadow-lg border border-gray-200 dark:border-gray-700/50 hover:shadow-2xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
               {/* Pattern Background */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

               <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-4">
                    {review.businessId?.profileImage ? (
                      <img 
                         src={`${API_URL}${review.businessId.profileImage}`}
                         alt={review.businessId.name}
                         className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                         onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xl text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700" style={{ display: review.businessId?.profileImage ? 'none' : 'flex' }}>
                       {review.businessId?.name?.charAt(0) || 'B'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{review.businessId?.name || 'Business'}</h3>
                      {review.businessId?.category && <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">{review.businessId.category}</p>}
                    </div>
                 </div>
               </div>

               <div className="relative mb-6">
                  <div className="absolute -left-2 -top-2 text-indigo-100 dark:text-indigo-900/30">
                     <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" /></svg>
                  </div>
                  <div className="relative z-10 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                    <p className="text-gray-700 dark:text-gray-300 italic text-lg leading-relaxed font-medium text-center">"{review.comment || t('userDashboard.reviews.noFeedback')}"</p>
                  </div>
               </div>

               <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 pt-4">
                  <div className="bg-amber-50 dark:bg-amber-500/10 px-4 py-1.5 rounded-full flex items-center gap-2 border border-amber-100 dark:border-amber-500/20">
                     <StarRating rating={review.rating} />
                     <span className="font-bold text-amber-600 dark:text-amber-400 ml-1">{review.rating}.0</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                     {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



