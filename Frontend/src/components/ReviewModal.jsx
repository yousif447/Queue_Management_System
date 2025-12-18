"use client";
import { API_URL, authFetch } from '@/lib/api';

import { useTranslations } from '@/hooks/useTranslations';
import { Send, Star, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ReviewModal({ ticket, onClose, onReviewSubmitted }) {
  const { t } = useTranslations();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingLabels = [
    '',
    `😞 ${t('reviewModal.ratings.poor')}`,
    `😕 ${t('reviewModal.ratings.fair')}`,
    `😐 ${t('reviewModal.ratings.good')}`,
    `😊 ${t('reviewModal.ratings.veryGood')}`,
    `🤩 ${t('reviewModal.ratings.excellent')}`
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error(t('reviewModal.selectRating')); return; }
    if (!comment.trim()) { toast.error(t('reviewModal.writeComment')); return; }

    setIsSubmitting(true);
    try {
      const response = await authFetch(`${API_URL}/api/v1/reviews/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: ticket.businessId._id || ticket.businessId,
          ticketId: ticket._id,
          rating,
          comment: comment.trim(),
          isAnonymous,
        }),
      });

      if (response.ok) {
        toast.success(t('reviewModal.success'));
        onReviewSubmitted?.();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || t('reviewModal.failed'));
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('reviewModal.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700/50 animate-scaleIn">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 p-8 rounded-t-3xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex-1">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                <Star size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{t('reviewModal.title')}</h2>
              <p className="text-white/80 text-sm">
                {t('reviewModal.subtitle', { businessName: ticket.businessId?.name || t('footer.sections.company') })}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Ticket Info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border-l-4 border-emerald-500">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wider">
              📋 {t('reviewModal.ticketInfo')}
            </p>
            <p className="text-gray-900 dark:text-white font-semibold">
              {ticket.businessId?.name || t('footer.sections.company')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('reviewModal.ticket')}{ticket.ticketNumber || ticket.position} • {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Rating Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {t('reviewModal.ratingPrompt')} *
            </label>
            <div className="flex items-center gap-3 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-all duration-200 hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={44}
                    className={`transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {ratingLabels[rating]}
              </p>
            )}
          </div>

          {/* Comment Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {t('reviewModal.commentLabel')} *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('reviewModal.commentPlaceholder')}
              rows={5}
              className="input-enterprise resize-none"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('reviewModal.characters', { length: comment.length })} • {t('reviewModal.minCharacters')}
            </p>
          </div>

          {/* Privacy Option */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-colors"
            />
            <label htmlFor="isAnonymous" className="text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer font-medium">
              {t('reviewModal.anonymous')}
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-4">
              {t('reviewModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || !comment.trim()}
              className="btn-primary flex-1 py-4 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('reviewModal.submitting')}</>
              ) : (
                <><Send size={18} />{t('reviewModal.submit')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



