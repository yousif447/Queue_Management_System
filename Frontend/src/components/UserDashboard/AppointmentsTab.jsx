"use client";
import { API_URL } from '@/lib/api';

import { useState } from 'react';
import { Calendar, Clock, Ticket, Building2, MapPin, Phone, Mail, DollarSign, Users } from 'lucide-react';

export default function AppointmentsTab({ t, myTickets, loadingTickets }) {
  const [completedTickets, setCompletedTickets] = useState([]);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchCompletedTickets = async () => {
    setLoadingCompleted(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/tickets/users/me/tickets`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const completed = (data.data || []).filter(ticket => ['completed', 'served', 'ended', 'done', 'cancelled', 'no-show'].includes(ticket.status));
        setCompletedTickets(completed);
      }
    } catch (error) { console.error('Error fetching history:', error); }
    finally { setLoadingCompleted(false); }
  };

  const handleShowCompleted = () => { if (!showCompleted) fetchCompletedTickets(); setShowCompleted(!showCompleted); };

  const displayTickets = showCompleted ? completedTickets : myTickets;
  const isLoading = showCompleted ? loadingCompleted : loadingTickets;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3"><Calendar className="text-indigo-500" /> {t('userDashboard.appointments.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('userDashboard.appointments.subtitle')}</p>
        </div>
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1.5 border border-gray-200 dark:border-gray-700/50">
           <button onClick={() => { setShowCompleted(false); }} 
             className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
               !showCompleted ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
             }`}>
              {t('userDashboard.appointments.active')}
           </button>
           <button onClick={() => { setShowCompleted(true); fetchCompletedTickets(); }}
             className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
               showCompleted ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
             }`}>
              {t('userDashboard.appointments.history')}
           </button>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-[400px] flex items-center justify-center"><div className="w-16 h-16 border-4 border-indigo-500/30 rounded-full animate-spin border-t-indigo-500"></div></div>
      ) : displayTickets.length === 0 ? (
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700/50 p-20 text-center shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-indigo-500/10"></div>
          <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100 dark:border-gray-700 group-hover:scale-110 transition-transform duration-500">
             <Calendar className="text-gray-400 dark:text-gray-500" size={48} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{showCompleted ? t('userDashboard.appointments.noHistory') : t('userDashboard.appointments.noAppointments')}</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-lg">{showCompleted ? t('userDashboard.appointments.historyEmpty') : t('userDashboard.appointments.activeEmpty')}</p>
        </div>
      ) : (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent dark:before:via-gray-700">
          {displayTickets.map((ticket, index) => (
            <div key={ticket._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Timeline Icon */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-900 ${showCompleted ? 'bg-gray-400 dark:bg-gray-600' : 'bg-indigo-500'} text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                 <Clock size={16} />
              </div>

              {/* Card Container */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl p-6 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700/50 hover:shadow-2xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                   <div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${
                        (ticket.status === 'served' || ticket.status === 'done' || ticket.status === 'ended') ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/50' :
                        ticket.status === 'called' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/50 animate-pulse' :
                        ticket.status === 'cancelled' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/50' :
                        'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/50'
                      }`}>
                         {ticket.status?.toUpperCase()}
                      </span>
                      
                      <div className="flex items-center gap-3">
                        {ticket.businessId?.profileImage ? (
                          <img 
                            src={`${API_URL}${ticket.businessId.profileImage}`}
                            alt={ticket.businessId.name}
                            className="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xl text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700" style={{ display: ticket.businessId?.profileImage ? 'none' : 'flex' }}>
                           {ticket.businessId?.name?.charAt(0) || 'B'}
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-xl text-gray-900 dark:text-white leading-tight">{ticket.businessId?.name || 'Business'}</h3>
                          {ticket.queueId?.name && <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{ticket.queueId.name}</p>}
                        </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">#{ticket.ticketNumber || ticket.position}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest">{t('userDashboard.appointments.ticketLabel')}</div>
                   </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50 mb-4 flex items-center gap-4">
                   <div className="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-sm text-indigo-500 dark:text-indigo-400">
                      <Calendar size={24} />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{t('userDashboard.appointments.scheduledFor')}</p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {new Date(ticket.createdAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                   </div>
                </div>

                {ticket.businessId && (
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/50 pt-4 mt-2">
                     {ticket.businessId.address && <div className="flex items-start gap-2"><MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" /> <span className="flex-1">{ticket.businessId.address}</span></div>}
                     {ticket.businessId.phone && <div className="flex items-center gap-2"><Phone size={16} className="text-gray-400 shrink-0" /> <span>{ticket.businessId.phone}</span></div>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



