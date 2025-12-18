"use client";
import { API_URL } from '@/lib/api';

import { useSocket } from '@/contexts/SocketContext';
import { useTranslations } from '@/hooks/useTranslations';
import { Clock, Phone, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function QueueManagementTab({ businessId }) {
  const { t } = useTranslations();
  const { socket, connected } = useSocket();
  const [tickets, setTickets] = useState([]);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [queue, setQueue] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [stats, setStats] = useState({
    waiting: 0,
    serving: 0,
    completed: 0,
    avgWaitTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!businessId) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/businesses/${businessId}/tickets`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      toast.error(t('businessDashboard.queueManagement.fetchTicketsError'));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const fetchQueue = useCallback(async () => {
    if (!businessId) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/business/${businessId}/queue`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setQueue(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch queue');
    }
  }, [businessId]);

  const fetchStats = useCallback(async () => {
    if (!businessId) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/stats/business/${businessId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          waiting: data.data?.overview?.waitingTickets || 0,
          serving: data.data?.overview?.completedTickets || 0,
          completed: data.data?.overview?.completedTickets || 0,
          avgWaitTime: data.data?.performance?.averageWaitTime || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) {
      fetchQueue();
      fetchTickets();
      fetchStats();

      // Join business room for real-time updates
      if (socket) {
        socket.emit('joinBusiness', { businessId });
      }

      // Listen for ticket updates
      if (socket) {
        socket.on('ticketCreated', () => {
          fetchQueue();
          fetchTickets();
          fetchStats();
        });

        socket.on('ticketUpdated', () => {
          fetchQueue();
          fetchTickets();
          fetchStats();
        });
      }

      return () => {
        if (socket) {
          socket.off('ticketCreated');
          socket.off('ticketUpdated');
        }
      };
    }
  }, [socket, businessId, fetchQueue, fetchTickets, fetchStats]);

  const handleToggleQueue = async () => {
    if (!queue) return;
    
    try {
      setQueueLoading(true);
      const newStatus = queue.status === 'active' ? 'paused' : 'active';
      const endpoint = newStatus === 'active' ? 'resume' : 'pause';
      
      const response = await fetch(`${API_URL}/api/v1/queue/${queue._id}/${endpoint}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setQueue(data.data);
        toast.success(newStatus === 'active' ? t('businessDashboard.queueManagement.queueResumed') : t('businessDashboard.queueManagement.queuePaused'));
      } else {
        throw new Error('Failed to toggle queue');
      }
    } catch (error) {
      toast.error(t('businessDashboard.queueManagement.queueUpdateError'));
      console.error('Toggle queue error:', error);
    } finally {
      setQueueLoading(false);
    }
  };

  const handleCallNext = async () => {
    if (queue?.status !== 'active') {
      toast.error(t('businessDashboard.queueManagement.queueNotActive'));
      return;
    }

    setCalling(true);
    try {
      const nextTicket = tickets.find(t => t.status === 'waiting');
      if (!nextTicket) {
        toast.error(t('businessDashboard.queueManagement.noTicketsWaiting'));
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${nextTicket._id}/call`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTicket(data.ticket);
        
        if (socket) {
          socket.emit('callNext', { ticketId: nextTicket._id, businessId });
        }
        
        toast.success(t('businessDashboard.queueManagement.ticketCalled', { number: nextTicket.number }));
        fetchTickets();
        fetchStats();
      } else {
        toast.error(t('businessDashboard.queueManagement.callError'));
      }
    } catch (error) {
      toast.error(t('businessDashboard.queueManagement.networkError'));
    } finally {
      setCalling(false);
    }
  };

  const handleServeTicket = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${ticketId}/serve`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(t('businessDashboard.queueManagement.ticketServed'));
        setCurrentTicket(null);
        fetchTickets();
        fetchStats();
      } else {
        toast.error(t('businessDashboard.queueManagement.serveError'));
      }
    } catch (error) {
      toast.error(t('businessDashboard.queueManagement.networkError'));
    }
  };

  const handleCancelTicket = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${ticketId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(t('businessDashboard.queueManagement.ticketCancelled'));
        fetchTickets();
        fetchStats();
      } else {
        toast.error(t('businessDashboard.queueManagement.cancelError'));
      }
    } catch (error) {
      toast.error(t('businessDashboard.queueManagement.networkError'));
    }
  };

  // Filter waiting tickets - exclude unpaid online payments
  const waitingTickets = tickets.filter(t => 
    t.status === 'waiting' && 
    (t.paymentStatus === 'paid' || t.paymentMethod === 'cash' || !t.paymentMethod)
  );
  const servingTickets = tickets.filter(t => t.status === 'serving');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-emerald-200 dark:border-emerald-500/30 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('businessDashboard.queueManagement.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('businessDashboard.queueManagement.subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleQueue}
              disabled={queueLoading || !queue}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                queue?.status === 'active'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : queue?.status === 'paused'
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-red-100 text-red-700'
              } ${queueLoading || !queue ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span>{queue?.status === 'active' ? '⏸️' : '▶️'}</span>
              {queue?.status === 'active' ? t('businessDashboard.queueManagement.pauseQueue') : queue?.status === 'paused' ? t('businessDashboard.queueManagement.resumeQueue') : t('businessDashboard.queueManagement.closed')}
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {connected ? t('businessDashboard.queueManagement.connected') : t('businessDashboard.queueManagement.disconnected')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <Users size={24} className="text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('businessDashboard.queueManagement.waiting')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.waiting}</p>
        </div>

        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <Phone size={24} className="text-orange-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('businessDashboard.queueManagement.serving')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.serving}</p>
        </div>

        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">✅</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('businessDashboard.queueManagement.completed')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.completed}</p>
        </div>

        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock size={24} className="text-purple-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('businessDashboard.queueManagement.avgWait')}</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.avgWaitTime} {t('businessDashboard.queueManagement.minutes')}</p>
        </div>
      </div>

      {/* Current Serving */}
      {currentTicket && (
        <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl shadow-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-4">{t('businessDashboard.queueManagement.currentlyServing')}</h3>
          <div className="bg-white dark:bg-black/10 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-700 mb-1">{t('businessDashboard.queueManagement.ticketNumber')}</p>
                <p className="text-4xl font-bold gradient-text">
                  #{currentTicket.number}
                </p>
              </div>
              <button
                onClick={() => handleServeTicket(currentTicket._id)}
                className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
              >
                ✓ {t('businessDashboard.queueManagement.markAsServed')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Next Button */}
      <button
        onClick={handleCallNext}
        disabled={calling || waitingTickets.length === 0}
        className="btn-primary w-full py-6 text-xl flex items-center justify-center gap-3"
      >
        {calling ? (
          <>
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{t('businessDashboard.queueManagement.calling')}</span>
          </>
        ) : (
          <>
            <Phone size={24} />
            <span>{t('businessDashboard.queueManagement.callNext')}</span>
            {waitingTickets.length > 0 && (
              <span className="bg-white text-emerald-600 px-3 py-1 rounded-full text-sm">
                {t('businessDashboard.queueManagement.waitingCount', { count: waitingTickets.length })}
              </span>
            )}
          </>
        )}
      </button>

      {/* Queue Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting Queue */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700/50 p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            {t('businessDashboard.queueManagement.waitingQueue')} ({waitingTickets.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {waitingTickets.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-5xl mb-3 block">📋</span>
                <p className="text-gray-500 dark:text-gray-400">{t('businessDashboard.queueManagement.noWaitingTickets')}</p>
              </div>
            ) : (
              waitingTickets.map((ticket, index) => (
                <div key={ticket._id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {t('businessDashboard.queueManagement.ticket')} #{ticket.number}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {ticket.userId?.name || t('businessDashboard.queueManagement.guest')} • {ticket.priority}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelTicket(ticket._id)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Serving Queue */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700/50 p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Phone size={20} className="text-orange-500" />
            {t('businessDashboard.queueManagement.beingServed')} ({servingTickets.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {servingTickets.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-5xl mb-3 block">👤</span>
                <p className="text-gray-500 dark:text-gray-400">{t('businessDashboard.queueManagement.noServingTickets')}</p>
              </div>
            ) : (
              servingTickets.map((ticket) => (
                <div key={ticket._id} className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-gray-800 dark:text-white">
                      {t('businessDashboard.queueManagement.ticket')} #{ticket.number}
                    </p>
                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full">
                      {t('businessDashboard.queueManagement.active')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {ticket.userId?.name || t('businessDashboard.queueManagement.guest')}
                  </p>
                  <button
                    onClick={() => handleServeTicket(ticket._id)}
                    className="w-full py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
                  >
                    ✓ {t('businessDashboard.queueManagement.complete')}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



