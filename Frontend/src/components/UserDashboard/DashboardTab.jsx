"use client";
import { API_URL, authFetch } from '@/lib/api';

import { useSocket } from '@/contexts/SocketContext';
import { Building2, Calendar, Clock, Sparkles, Ticket, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Stat Card Component - Light/Dark mode compatible
const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg dark:shadow-xl group hover:shadow-xl dark:hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${color} opacity-10 dark:opacity-20 blur-3xl rounded-full group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity`}></div>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3" >
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-20`}>
          <Icon className="text-white" size={20} />
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
      {subtitle && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  </div>
);

export default function DashboardTab({ 
  t, 
  userData, 
  day, 
  dayName, 
  monthName, 
  year, 
  time
}) {
  const [activeTicket, setActiveTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const completedTicketIds = useRef(new Set());

  useEffect(() => {
    const fetchActiveTicket = async () => {
      try {
        const res = await authFetch(`${API_URL}/api/v1/tickets/users/me/tickets`);
        if (res.ok) {
          const data = await res.json();
          const active = data.data?.find(t => 
            ['waiting', 'called', 'in-progress'].includes(t.status) && 
            !t.completedAt &&
            !completedTicketIds.current.has(t._id)
          );
          
          if (active) {
            if (active.status === 'waiting') {
              if (active.position) {
                 active.peopleBefore = Math.max(0, active.position - 1);
              } else {
                 const currentTicketNum = active.queueId?.currentTicketNumber || 0;
                 active.position = Math.max(1, active.ticketNumber - currentTicketNum);
                 active.peopleBefore = Math.max(0, active.position - 1);
              }
            } else if (active.status === 'called') {
              active.position = 1;
              active.peopleBefore = 0;
            } else {
              active.position = 0;
              active.peopleBefore = 0;
            }
          }
          
          setActiveTicket(active || null);
        }
      } catch (error) {
        console.error('Error fetching active ticket:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveTicket();
    
    const interval = setInterval(fetchActiveTicket, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket || !userData?._id) return;

    socket.emit('joinUserRoom', userData._id);

    socket.on('yourTurn', (data) => {
      const ticket = data.ticket || data;
      if (ticket && ticket.userId?.toString() === userData._id.toString()) {
        setActiveTicket(ticket);
        if (Notification.permission === 'granted') {
          new Notification("It's Your Turn!", {
            body: `Ticket #${ticket.ticketNumber || ticket.position} - Please proceed`,
            icon: '/logo.png',
          });
        }
      }
    });

    socket.on('yourTicketCalled', (data) => {
      const ticket = data.ticket || data;
      if (ticket && ticket.userId?.toString() === userData._id.toString()) {
        setActiveTicket(ticket);
        if (Notification.permission === 'granted') {
          new Notification(t('userDashboard.dashboard.notifications.calledTitle'), {
            body: t('userDashboard.dashboard.notifications.calledBody', { ticketNumber: ticket.ticketNumber }),
            icon: '/logo.png',
          });
        }
      }
    });

    socket.on('ticketUpdated', (data) => {
      const updatedTicket = data.ticket || data;
      
      if (updatedTicket.completedAt) {
          completedTicketIds.current.add(updatedTicket._id);
          if (activeTicket?._id === updatedTicket._id) {
             setActiveTicket(null);
          }
          return;
      }

      if (activeTicket?._id === updatedTicket._id) {
        if (['waiting', 'called', 'in-progress'].includes(updatedTicket.status)) {
          if (updatedTicket.status === 'waiting' && updatedTicket.queueId) {
            const currentTicketNum = updatedTicket.queueId?.currentTicketNumber || 0;
            updatedTicket.position = Math.max(1, updatedTicket.ticketNumber - currentTicketNum);
            updatedTicket.peopleBefore = Math.max(0, updatedTicket.position - 1);
          } else if (updatedTicket.status === 'called') {
            updatedTicket.position = 1;
            updatedTicket.peopleBefore = 0;
          } else {
            updatedTicket.position = 0;
            updatedTicket.peopleBefore = 0;
          }
          setActiveTicket(updatedTicket);
        } else {
          completedTicketIds.current.add(updatedTicket._id);
          setActiveTicket(null);
        }
      }
    });

    return () => {
      socket.off('yourTurn');
      socket.off('yourTicketCalled');
      socket.off('ticketUpdated');
    };
  }, [socket, userData, activeTicket]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg dark:shadow-xl p-8 border border-gray-200 dark:border-gray-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {t('userDashboard.greeting')}, <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{userData?.name?.split(" ")[0]}!</span> 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
              {t('userDashboard.date')}: {dayName}, {monthName} {day}, {year}
            </p>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-700/50">
            <Clock className="text-emerald-500 dark:text-emerald-400" size={24} />
            <p className="font-bold text-2xl md:text-3xl tracking-tight text-gray-900 dark:text-white">{time}</p>
          </div>
        </div>
      </div>

      {/* Active Queue Ticket Card or Empty State */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/30 rounded-full animate-spin border-t-emerald-500"></div>
          </div>
        </div>
      ) : activeTicket ? (
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700/50 p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6 relative z-10">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                <Ticket className="text-emerald-500 dark:text-emerald-400" size={24} />
              </div>
              {t('userDashboard.currentTicket')}
            </h2>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              (activeTicket.status === 'done' || activeTicket.status === 'ended') ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/50' :
              activeTicket.status === 'called' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/50 animate-pulse' :
              activeTicket.status === 'cancelled' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/50' :
              activeTicket.status === 'in-progress' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/50' :
              'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/50'
            }`}>
              {activeTicket.status?.toUpperCase()}
            </span>
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 relative z-10">
            <StatCard title={t('userDashboard.yourNumber')} value={`#${activeTicket.ticketNumber}`} icon={Ticket} color="bg-emerald-500" />
            <StatCard title={t('userDashboard.positionInQueue')} value={activeTicket.position || t('userDashboard.calculating')} icon={Users} color="bg-purple-500" />
            <StatCard 
              title={
                <span className="flex items-center gap-2">
                  {t('userDashboard.estWaitTime')}
                  <span className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
                    <Sparkles size={10} className="text-white" /> {t('services.aiPowered')}
                  </span>
                </span>
              }
              value={activeTicket.estimatedWaitTime ? `~${activeTicket.estimatedWaitTime} min` : activeTicket.estimatedTime ? `~${activeTicket.estimatedTime} min` : '...'} 
              icon={Clock} 
              color="bg-amber-500" 
            />
          </div>

          {/* Context Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Building2 size={14} /> {t('business.businessName')}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{activeTicket.businessId?.name || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Calendar size={14} /> {t('common.date')}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {new Date(activeTicket.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Queue Progress Bar */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t('userDashboard.queueProgress')}</span>
              <span className="text-gray-900 dark:text-white font-medium">{t('userDashboard.position')} {activeTicket.position || t('userDashboard.calculating')}</span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 shadow-lg shadow-emerald-500/30"
                style={{ 
                  width: activeTicket.position && activeTicket.queueId?.currentCount 
                    ? `${Math.max(5, Math.min(100, ((activeTicket.queueId.currentCount - activeTicket.position + 1) / activeTicket.queueId.currentCount) * 100))}%`
                    : '5%'
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {activeTicket.status === 'called' 
                ? `🔔 ${t('userDashboard.dashboard.queueStatus.yourTurn')}` 
                : activeTicket.status === 'done'
                ? `✅ ${t('userDashboard.dashboard.queueStatus.completed')}`
                : activeTicket.status === 'in-progress'
                ? `🔄 ${t('userDashboard.dashboard.queueStatus.serving')}`
                : activeTicket.position && activeTicket.position > 1
                ? `⏳ ${t('userDashboard.dashboard.queueStatus.waiting', { count: activeTicket.position - 1 })}`
                : activeTicket.position === 1
                ? `🎯 ${t('userDashboard.dashboard.queueStatus.nextInLine')}`
                : `⏳ ${t('userDashboard.dashboard.queueStatus.calculating')}`
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700/50 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-gray-700">
            <Ticket className="text-gray-400 dark:text-gray-600" size={40} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('userDashboard.noCurrentTicket')}</h3>
          <p className="text-gray-500">{t('userDashboard.searchToGetStarted')}</p>
        </div>
      )}
    </div>
  );
}



