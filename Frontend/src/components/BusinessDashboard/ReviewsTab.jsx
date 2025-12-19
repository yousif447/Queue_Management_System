'use client';
import { API_URL, authFetch } from '@/lib/api';

import { useTranslations } from '@/hooks/useTranslations';
import { MessageSquare, Star, ThumbsDown, ThumbsUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaDownload, FaSearch } from 'react-icons/fa';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg dark:shadow-xl group hover:shadow-xl dark:hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${color} opacity-10 dark:opacity-20 blur-3xl rounded-full group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity`}></div>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3"><div className={`p-2.5 rounded-xl ${color} bg-opacity-20`}><Icon className="text-white" size={20} /></div></div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
      {subtitle && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  </div>
);

const StarRating = ({ rating, size = 16 }) => (
  <div className="flex gap-0.5">{[...Array(5)].map((_, i) => (<Star key={i} size={size} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'} />))}</div>
);

export default function ReviewsTab({ businessId }) {
  const { t } = useTranslations();
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({ total: 0, averageRating: 0, fiveStars: 0, fourStars: 0, threeStars: 0, twoStars: 0, oneStar: 0 });

  useEffect(() => {
    const fetchReviews = async () => {
      if (!businessId) return;
      try {
        const response = await authFetch(`${API_URL}/api/v1/reviews/businesses/${businessId}/reviews`);
        if (response.ok) {
          const result = await response.json();
          const reviewsData = result.reviews || [];
          setReviews(reviewsData);
          setFilteredReviews(reviewsData);
          setStats({
            total: result.count || reviewsData.length,
            averageRating: result.avgRating || 0,
            fiveStars: reviewsData.filter(r => r.rating === 5).length,
            fourStars: reviewsData.filter(r => r.rating === 4).length,
            threeStars: reviewsData.filter(r => r.rating === 3).length,
            twoStars: reviewsData.filter(r => r.rating === 2).length,
            oneStar: reviewsData.filter(r => r.rating === 1).length
          });
        }
      } catch (error) { toast.error(t('businessDashboard.reviews.fetchError')); }
      finally { setLoading(false); }
    };
    fetchReviews();
    const interval = setInterval(fetchReviews, 30000);
    return () => clearInterval(interval);
  }, [businessId]);

  useEffect(() => {
    let filtered = [...reviews];
    if (searchTerm) filtered = filtered.filter(review => (review.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())) || (review.comment?.toLowerCase().includes(searchTerm.toLowerCase())));
    if (ratingFilter !== 'all') filtered = filtered.filter(review => review.rating === parseInt(ratingFilter));
    filtered.sort((a, b) => { let aVal = a[sortField]; let bVal = b[sortField]; if (sortField === 'customer') { aVal = a.userId?.name || ''; bVal = b.userId?.name || ''; } return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1); });
    setFilteredReviews(filtered);
    setCurrentPage(1);
  }, [searchTerm, ratingFilter, reviews, sortField, sortDirection]);

  const handleExportCSV = () => {
    if (filteredReviews.length === 0) { toast.error(t('businessDashboard.reviews.noReviewsExport')); return; }
    const csvData = filteredReviews.map(review => ({ [t('businessDashboard.reviews.tableCustomer')]: review.userId?.name || t('businessDashboard.reviews.anonymous'), [t('businessDashboard.reviews.tableRating')]: review.rating, [t('businessDashboard.reviews.tableComment')]: review.comment || '', [t('businessDashboard.reviews.tableDate')]: new Date(review.createdAt).toLocaleDateString() }));
    const csv = [Object.keys(csvData[0]).join(','), ...csvData.map(row => Object.values(row).map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `reviews-${new Date().toISOString().split('T')[0]}.csv`; a.click(); toast.success(t('businessDashboard.reviews.exportSuccess'));
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedReviews = filteredReviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const negativeReviews = reviews.filter(r => r.rating <= 2).length;

  if (loading) return (<div className="min-h-[400px] flex items-center justify-center"><div className="w-16 h-16 border-4 border-amber-500/30 rounded-full animate-spin border-t-amber-500"></div></div>);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('businessDashboard.reviews.title')}</h1><p className="text-gray-500 dark:text-gray-400 mt-1">{t('businessDashboard.reviews.subtitle')}</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 text-center"><p className="text-white/80 text-sm font-medium mb-2">{t('businessDashboard.reviews.averageRating')}</p><p className="text-6xl font-bold text-white mb-3">{stats.averageRating.toFixed(1)}</p><div className="flex justify-center mb-3"><StarRating rating={Math.round(stats.averageRating)} size={24} /></div><p className="text-white/70 text-sm">{t('businessDashboard.reviews.basedOn', { total: stats.total })}</p></div>
        </div>

        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-lg dark:shadow-xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('businessDashboard.reviews.ratingDistribution')}</h3>
          <div className="space-y-3">
            {[{ stars: 5, count: stats.fiveStars, color: 'bg-emerald-500' }, { stars: 4, count: stats.fourStars, color: 'bg-lime-500' }, { stars: 3, count: stats.threeStars, color: 'bg-amber-500' }, { stars: 2, count: stats.twoStars, color: 'bg-orange-500' }, { stars: 1, count: stats.oneStar, color: 'bg-red-500' }].map(({ stars, count, color }) => (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12"><span className="text-gray-900 dark:text-white text-sm font-medium">{stars}</span><Star size={12} className="text-amber-400 fill-amber-400" /></div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden"><div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }} /></div>
                <span className="text-gray-500 dark:text-gray-400 text-sm w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard title={t('businessDashboard.reviews.totalReviews')} value={stats.total} icon={MessageSquare} color="bg-indigo-500" />
          <StatCard title={t('businessDashboard.reviews.positive')} value={positiveReviews} icon={ThumbsUp} color="bg-emerald-500" />
          <StatCard title={t('businessDashboard.reviews.neutral')} value={reviews.filter(r => r.rating === 3).length} icon={Users} color="bg-amber-500" />
          <StatCard title={t('businessDashboard.reviews.negative')} value={negativeReviews} icon={ThumbsDown} color="bg-red-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1"><div className="relative"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" /><input type="text" placeholder={t('businessDashboard.reviews.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" /></div></div>
          <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"><option value="all">{t('businessDashboard.reviews.allRatings')}</option><option value="5">{t('businessDashboard.reviews.stars5')}</option><option value="4">{t('businessDashboard.reviews.stars4')}</option><option value="3">{t('businessDashboard.reviews.stars3')}</option><option value="2">{t('businessDashboard.reviews.stars2')}</option><option value="1">{t('businessDashboard.reviews.stars1')}</option></select>
          <button onClick={handleExportCSV} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all flex items-center gap-2 font-medium shadow-lg shadow-amber-500/20"><FaDownload />{t('businessDashboard.reviews.export')}</button>
        </div>
      </div>

      <div className="space-y-4">
        {paginatedReviews.length === 0 ? (
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-12 text-center shadow-lg">
            <MessageSquare className="mx-auto text-gray-400 dark:text-gray-600 mb-4" size={48} />
            <p className="text-gray-600 dark:text-gray-400 text-lg">{t('businessDashboard.reviews.noReviewsFound')}</p>
            <p className="text-gray-500 text-sm mt-1">{t('businessDashboard.reviews.noReviewsText')}</p>
          </div>
        ) : (
          paginatedReviews.map((review) => (
            <div key={review._id} className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 hover:shadow-xl transition-all shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">{(review.userId?.name || 'A').charAt(0).toUpperCase()}</div>
                  <div><p className="font-semibold text-gray-900 dark:text-white">{review.userId?.name || t('businessDashboard.reviews.anonymous')}</p><p className="text-gray-500 text-sm">{review.userId?.email || ''}</p></div>
                </div>
                <div className="text-right"><StarRating rating={review.rating} /><p className="text-gray-500 text-xs mt-1">{new Date(review.createdAt).toLocaleDateString()}</p></div>
              </div>
              {review.comment && (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/30">
                  <p className="text-gray-700 dark:text-gray-300 italic">"{review.comment}"</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('businessDashboard.reviews.showing', { start: indexOfFirstItem + 1, end: Math.min(indexOfLastItem, filteredReviews.length), total: filteredReviews.length })}</div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{t('businessDashboard.reviews.previous')}</button>
            <span className="px-4 py-2 text-gray-500 dark:text-gray-400">{t('businessDashboard.reviews.pageInfo', { current: currentPage, total: totalPages })}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">{t('businessDashboard.reviews.next')}</button>
          </div>
        </div>
      )}
    </div>
  );
}



