"use client";
import { API_URL } from '@/lib/api';

import { useState } from "react";
import toast from "react-hot-toast";
import { Ticket, Calendar, Clock, X, Star, Building2, CreditCard, Phone, Mail } from 'lucide-react';
import ReviewModal from '../ReviewModal';

export default function MyTicketsTab({ t, myTickets, loadingTickets, setMyTickets }) {
  const [cancellingId, setCancellingId] = useState(null);
  const [reviewingTicket, setReviewingTicket] = useState(null);
  const [completedTickets, setCompletedTickets] = useState([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [ticketReviews, setTicketReviews] = useState({});

  const fetchCompletedTickets = async () => {
    setLoadingCompleted(true);
    try {
      const [ticketsRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/tickets/users/me/tickets`, { credentials: 'include' }),
        fetch(`${API_URL}/api/v1/reviews/users/me/reviews`, { credentials: 'include' })
      ]);

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        const completed = (data.data || []).filter(ticket => ['completed', 'served', 'ended', 'done', 'cancelled', 'no-show'].includes(ticket.status));
        setCompletedTickets(completed);
        
        let myReviewedTicketIds = new Set();
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || []);
          reviews.forEach(review => {
            const ticketRef = review.ticketId || review.ticket;
            if (ticketRef) {
              myReviewedTicketIds.add(typeof ticketRef === 'object' ? ticketRef._id : ticketRef);
            }
          });
        }
        
        const reviewChecks = {};
        for (const ticket of completed) {
          reviewChecks[ticket._id] = myReviewedTicketIds.has(ticket._id);
        }
        setTicketReviews(reviewChecks);
      }
    } catch (error) { console.error('Error fetching completed tickets:', error); }
    finally { setLoadingCompleted(false); }
  };

  const handleCancelTicket = async (ticketId) => {
    // if (!confirm('Are you sure you want to cancel this ticket?')) return; // Removed prompt as requested
    setCancellingId(ticketId);
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${ticketId}/cancel`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User cancelled' }),
      });
      if (response.ok) {
        // Remove from active list
        setMyTickets(prevTickets => prevTickets.filter(t => t._id !== ticketId));
        
        // Optionally update history if currently viewing history (though typically we are in active view when cancelling)
        // If we want to show it in history immediately without refetch, we would need to add it to completedTickets
        // But simplest pattern is just remove from active. User finds it in History later.
        toast.success(t('userDashboard.messages.ticketCancelled'));
      } else {
        const error = await response.json();
        toast.error(error.message || t('userDashboard.messages.ticketCancelFailed'));
      }
    } catch (error) { toast.error(t('userDashboard.messages.ticketCancelFailed')); }
    finally { setCancellingId(null); }
  };

  const handleShowCompleted = () => { if (!showCompleted) fetchCompletedTickets(); setShowCompleted(!showCompleted); };
  const handleReviewSubmitted = () => { setTicketReviews(prev => ({ ...prev, [reviewingTicket._id]: true })); };

  return (
    <>
      {reviewingTicket && <ReviewModal ticket={reviewingTicket} onClose={() => setReviewingTicket(null)} onReviewSubmitted={handleReviewSubmitted} />}
      
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Ticket className="text-emerald-500" /> {t('userDashboard.tabs.tickets')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('userDashboard.tickets.subtitle')}</p>
          </div>
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1.5 border border-gray-200 dark:border-gray-700/50">
             <button onClick={() => { setShowCompleted(false); if(showCompleted) fetchCompletedTickets(); }} 
               className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                 !showCompleted ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
               }`}>
                {t('userDashboard.tickets.active')}
             </button>
             <button onClick={() => { setShowCompleted(true); fetchCompletedTickets(); }}
               className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                 showCompleted ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
               }`}>
                {t('userDashboard.tickets.history')}
             </button>
          </div>
        </div>
      
        {(showCompleted ? loadingCompleted : loadingTickets) ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-500/30 rounded-full animate-spin border-t-emerald-500"></div>
            </div>
          </div>
        ) : (showCompleted ? completedTickets : myTickets).length === 0 ? (
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-20 text-center shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-emerald-500/10"></div>
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform duration-500">
              <Ticket className="text-gray-400 dark:text-gray-500" size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{showCompleted ? t('userDashboard.tickets.noHistory') : t('userDashboard.tickets.noActiveTickets')}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-lg">{showCompleted ? t('userDashboard.tickets.historyDescription') : t('userDashboard.tickets.activeDescription')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {(showCompleted ? completedTickets : myTickets).map((ticket) => (
              <div key={ticket._id} className="group bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700/50 hover:shadow-2xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       {/* Business Photo/Logo or Initials */}
                  {ticket.businessId?.profileImage ? (
                    <img 
                      src={`${API_URL}${ticket.businessId.profileImage}`}
                      alt={ticket.businessId.name}
                      className="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xl text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700" style={{ display: ticket.businessId?.profileImage ? 'none' : 'flex' }}>
                    {ticket.businessId?.name?.charAt(0) || 'T'}
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{ticket.businessId?.name || 'Business Name'}</h3>
                    {ticket.queueId?.name && <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{ticket.queueId.name}</p>}
                    </div>
                  </div>
                </div>
                  <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                    (ticket.status === 'served' || ticket.status === 'ended' || ticket.status === 'done') ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/50' :
                    ticket.status === 'called' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/50 animate-pulse' :
                    ticket.status === 'cancelled' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/50' :
                    'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/50'
                  }`}>{ticket.status}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-emerald-600 dark:to-teal-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group/card">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                    <p className="text-xs font-medium opacity-70 mb-1 uppercase tracking-wider">{t('userDashboard.tickets.ticketNumber')}</p>
                    <p className="text-3xl font-bold tracking-tight">#{ticket.ticketNumber || ticket.position}</p>
                    <Ticket className="absolute bottom-4 right-4 opacity-20 rotate-12" size={40} />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-5">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{t('userDashboard.tickets.currentPosition')}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{ticket.position || '-'}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/30">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2 font-medium"><Calendar className="text-emerald-500" size={16} /> {t('userDashboard.tickets.dateTime')}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{new Date(ticket.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/30">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2 font-medium"><CreditCard className="text-emerald-500" size={16} /> {t('userDashboard.tickets.paymentStatus')}</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md ${ticket.paymentStatus === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
                      {ticket.paymentStatus === 'paid' ? t('userDashboard.tickets.paid') : t('userDashboard.tickets.unpaid')}
                    </span>
                  </div>
                </div>

                <div className="relative z-10">
                  {ticket.status === 'waiting' && (
                    <button onClick={() => handleCancelTicket(ticket._id)} disabled={cancellingId === ticket._id}
                      className="w-full bg-white dark:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/20 border-2 border-red-100 dark:border-red-500/30 text-red-600 dark:text-red-400 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                      {cancellingId === ticket._id ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>{t('common.processing')}</>) : (<><X size={18} />{t('userDashboard.tickets.cancelTicket')}</>)}
                    </button>
                  )}
                  
                  {showCompleted && ['completed', 'served', 'ended', 'done'].includes(ticket.status) && (
                    ticketReviews[ticket._id] ? (
                      <div className="w-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 py-3.5 rounded-xl font-bold text-center border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center gap-2">
                        <Star size={18} className="fill-current" /> {t('userDashboard.tickets.reviewSubmitted')}
                      </div>
                    ) : (
                      <button onClick={() => setReviewingTicket(ticket)}
                        className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98]">
                        <Star size={18} className="fill-white" /> {t('userDashboard.tickets.rateExperience')}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}



