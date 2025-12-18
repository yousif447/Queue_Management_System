"use client";
import { API_URL } from '@/lib/api';

import { useSocket } from '@/contexts/SocketContext';
import { useTranslations } from '@/hooks/useTranslations';
import { Phone, Users, Clock, CheckCircle, Ticket, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaForward, FaTimes, FaUser } from 'react-icons/fa';

// Helper to get full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If it's already a full URL (http/https or data:), return as is
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  // Otherwise, prepend the backend URL
  return `${API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// Stat Card Component - Light/Dark mode compatible
const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-lg dark:shadow-xl group hover:shadow-xl dark:hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
    <div className={`absolute -top-10 -right-10 w-32 h-32 ${color} opacity-10 dark:opacity-20 blur-3xl rounded-full group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity`}></div>
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-20`}>
          <Icon className="text-white" size={20} />
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
      {subtitle && <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{subtitle}</p>}
    </div>
  </div>
);

// Plan limits for subscription tiers
const PLAN_LIMITS = {
  basic: 50,
  pro: 500,
  enterprise: 2000,
  trial: 50
};

export default function DashboardTab({ businessData }) {
  const { t } = useTranslations();
  const { socket, connected } = useSocket();
  
  // Get plan limit based on subscription
  const currentPlan = businessData?.subscription?.plan || 'basic';
  const planLimit = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.basic;
  const [monthlyBookingCount, setMonthlyBookingCount] = useState(businessData?.subscription?.monthlyBookingCount || 0);
  const capacityLeft = Math.max(0, planLimit - monthlyBookingCount);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [calling, setCalling] = useState(false);
  const [showQueueMenu, setShowQueueMenu] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInData, setWalkInData] = useState({ name: '', phone: '', email: '', price: 0 });
  const [stats, setStats] = useState({ todaysPatients: 0, inQueue: 0, completed: 0, avgWaitTime: 0 });
  const [currentTicket, setCurrentTicket] = useState(null);
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [newCapacity, setNewCapacity] = useState("");
  const menuRef = useRef(null);
  const hasJoinedRoom = useRef(false);

  // Use useMemo for today to prevent infinite loop
  const today = useMemo(() => new Date(), []);
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = today.toLocaleDateString("en-US", { month: "long" });
  const day = today.getDate();
  const year = today.getFullYear();

  const fetchTickets = useCallback(async () => {
    if (!businessData?._id) return;
    // Don't fetch if no queue or queue is closed
    if (!queue || queue?.status === 'closed') {
      setTickets([]);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/businesses/${businessData._id}/tickets`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        const todayStr = new Date().toDateString();
        // Filter by today's date AND current queue ID
        const todaysTickets = (data.data || []).filter((ticket) => {
          const ticketDate = new Date(ticket.createdAt);
          const isToday = ticketDate.toDateString() === todayStr;
          const isCurrentQueue = ticket.queueId === queue?._id || ticket.queueId?._id === queue?._id;
          const isPendingPayment = ticket.status === 'pending_payment';
          return isToday && isCurrentQueue && !isPendingPayment;
        });
        setTickets(todaysTickets);
      }
    } catch (error) { console.error("Error fetching tickets:", error); }
  }, [businessData?._id, queue]);

  const fetchQueue = useCallback(async () => {
    if (!businessData?._id) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/queues/business/${businessData._id}/queue`, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setQueue(data.data);
      }
    } catch (error) { console.error("Error fetching queue:", error); }
  }, [businessData?._id]);

  const fetchStats = useCallback(async () => {
    if (!businessData?._id) return;
    // Reset stats if no queue or queue is closed
    if (!queue || queue?.status === 'closed') {
      setStats({ todaysPatients: 0, inQueue: 0, completed: 0, avgWaitTime: 0 });
      return;
    }
    try {
      // Pass queueId to filter stats by current queue
      const queueParam = queue?._id ? `?queueId=${queue._id}` : '';
      const response = await fetch(`${API_URL}/api/v1/stats/business/${businessData._id}${queueParam}`, { credentials: "include" });
      if (response.ok) {
        const result = await response.json();
        const data = result.data || {};
        setStats({
          todaysPatients: data.overview?.todayTickets || 0,
          inQueue: data.overview?.waitingTickets || 0,
          completed: data.overview?.completedTickets || 0,
          avgWaitTime: data.performance?.averageWaitTime || 0
        });
      }
    } catch (error) { console.error("Error fetching stats:", error); }
  }, [businessData?._id, queue]);

  // Initial Load (Queue only)
  useEffect(() => {
    const loadQueue = async () => {
      setLoading(true);
      await fetchQueue();
      setLoading(false);
    };
    loadQueue();
  }, [fetchQueue]);

  // Tickets & Stats (Run when queue changes/fetchers change + Interval)
  useEffect(() => {
    fetchTickets();
    fetchStats();
    const interval = setInterval(() => { fetchTickets(); fetchStats(); }, 10000);
    return () => clearInterval(interval);
  }, [fetchTickets, fetchStats]);

  useEffect(() => {
    if (!socket || !connected || !businessData?._id) return;
    
    // Join business room for real-time updates (only if not already joined)
    if (!hasJoinedRoom.current) {
      const businessIdStr = businessData._id.toString();
      socket.emit("joinBusiness", { 
        businessId: businessIdStr,
        userId: businessData._id,
        role: "business"
      });
      
      // Alternative room join methods for compatibility
      socket.emit("joinBusinessRoom", businessData._id);
      hasJoinedRoom.current = true;
    }

    // Handler for ticket events - refresh data when any ticket event occurs
    const handleTicketEvent = (data) => {
      const ticket = data?.ticket || data;
      const ticketBusinessId = ticket?.businessId?._id?.toString() || ticket?.businessId?.toString();
      const currentBusinessId = businessData._id?.toString();
      
      // Only update if it's for this business or no specific business
      if (!ticketBusinessId || ticketBusinessId === currentBusinessId) {
        fetchTickets();
        fetchStats();
      }
    };

    // Handler for queue events
    const handleQueueEvent = (payload) => {
      const { queue: q, businessId } = payload || {};
      const payloadBusinessId = businessId?.toString();
      const currentBusinessId = businessData._id?.toString();
      
      // Only update if it's for this business
      if (!payloadBusinessId || payloadBusinessId === currentBusinessId) {
        if (q) {
          setQueue((prev) => prev ? {
            ...prev,
            _id: q.queueId || q._id || prev._id,
            status: q.status || prev.status,
            currentCount: typeof q.currentCount === "number" ? q.currentCount : prev.currentCount,
            currentTicketNumber: typeof q.currentTicketNumber === "number" ? q.currentTicketNumber : prev.currentTicketNumber,
          } : q);
        }
        fetchTickets();
        fetchStats();
      }
    };

    // Register all ticket event listeners
    socket.on("ticketUpdated", handleTicketEvent);
    socket.on("ticketCalled", handleTicketEvent);
    socket.on("ticketSkipped", handleTicketEvent);
    socket.on("ticketCancelled", handleTicketEvent);
    socket.on("ticketCompleted", handleTicketEvent);
    
    // Register queue event listeners
    socket.on("queueUpdated", handleQueueEvent);

    return () => {
      socket.off("ticketUpdated", handleTicketEvent);
      socket.off("ticketCalled", handleTicketEvent);
      socket.off("ticketSkipped", handleTicketEvent);
      socket.off("ticketCancelled", handleTicketEvent);
      socket.off("ticketCompleted", handleTicketEvent);
      socket.off("queueUpdated", handleQueueEvent);
    };
  }, [socket, connected, businessData?._id, fetchTickets, fetchStats]);

  // Dedicated effect for handling new tickets and updating booking count
  useEffect(() => {
    if (!socket || !connected || !businessData?._id) return;
    
    const handleNewTicket = (data) => {
       // Refresh lists
       fetchTickets();
       fetchStats();
       // Update monthly booking count
       setMonthlyBookingCount(prev => prev + 1);
    };

    socket.on("ticketCreated", handleNewTicket);

    return () => {
      socket.off("ticketCreated", handleNewTicket);
    };
  }, [socket, connected, businessData?._id, fetchTickets, fetchStats]);

  useEffect(() => {
    const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setShowQueueMenu(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateQueue = async () => {
    setQueueLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/queues/business/${businessData._id}/queue`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: "Main Queue", status: "active", maxCapacity: 50, date: new Date() }) });
      if (response.ok) { 
        const data = await response.json(); 
        setQueue(data.data); 
        // Reset dashboard data for fresh start
        setTickets([]);
        setStats({ todaysPatients: 0, inQueue: 0, completed: 0, avgWaitTime: 0 });
        setCurrentTicket(null);
        toast.success(t('businessDashboard.messages.queueStarted')); 
        setShowQueueMenu(false); 
      }
      else { const error = await response.json(); toast.error(error.message || t('businessDashboard.messages.failedCreateQueue')); }
    } catch (error) { toast.error(t('businessDashboard.messages.failedCreateQueue')); }
    finally { setQueueLoading(false); }
  };

  const handleOpenQueue = async () => {
    setQueueLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/queues/queue/${queue._id}/resume`, { method: "PATCH", credentials: "include" });
      if (response.ok) { const data = await response.json(); setQueue(data.data); toast.success(t('businessDashboard.messages.queueOpened')); setShowQueueMenu(false); }
    } catch (error) { toast.error(t('businessDashboard.messages.failedOpenQueue')); }
    finally { setQueueLoading(false); }
  };

  const handlePauseQueue = async () => {
    setQueueLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/queues/queue/${queue._id}/pause`, { method: "PATCH", credentials: "include" });
      if (response.ok) { const data = await response.json(); setQueue(data.data); toast.success(t('businessDashboard.messages.queuePaused')); setShowQueueMenu(false); }
    } catch (error) { toast.error(t('businessDashboard.messages.failedPauseQueue')); }
    finally { setQueueLoading(false); }
  };

  const handleCloseQueue = async () => {
    setQueueLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/queues/queue/${queue._id}/close`, { method: "PATCH", credentials: "include" });
      if (response.ok) { 
        const data = await response.json(); 
        setQueue(data.data); 
        // Clear dashboard data for fresh start
        setTickets([]);
        setStats({ todaysPatients: 0, inQueue: 0, completed: 0, avgWaitTime: 0 });
        setCurrentTicket(null);
        toast.success(t('businessDashboard.messages.queueClosed')); 
        setShowQueueMenu(false); 
      }
    } catch (error) { toast.error(t('businessDashboard.messages.failedCloseQueue')); }
    finally { setQueueLoading(false); }
  };

  const handleUpdateQueue = async () => {
    if (!queue || !newCapacity) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/queues/queue/${queue._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxCapacity: parseInt(newCapacity) }),
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setQueue(data.data);
        setEditingCapacity(false);
        setNewCapacity("");
        toast.success(t('businessDashboard.messages.capacityUpdated'));
      } else {
        const error = await response.json();
        toast.error(error.message || t('businessDashboard.messages.failedUpdateCapacity'));
      }
    } catch (e) {
      toast.error(t('businessDashboard.messages.failedUpdateCapacity'));
    }
  };

  const handleCallNext = async () => {
    if (queue?.status !== "active") {
      toast.error(t('businessDashboard.messages.notActive'));
      return;
    }
    if (!nextTicket) {
      toast.error(t('businessDashboard.messages.noWaitingTickets'));
      return;
    }
    setCalling(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${nextTicket._id}/call`, { method: "PUT", credentials: "include" });
      if (response.ok) { 
        const data = await response.json();
        setCurrentTicket(data.data);
        toast.success(t('businessDashboard.messages.ticketCalled', { ticketNumber: nextTicket.ticketNumber })); 
        fetchTickets(); 
        fetchStats(); 
      } else { 
        const error = await response.json(); 
        toast.error(error.message || t('businessDashboard.messages.failedCall')); 
      }
    } catch (error) { 
      toast.error(t('businessDashboard.messages.failedCall')); 
    } finally { 
      setCalling(false); 
    }
  };

  const handleCallTicket = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${ticketId}/call`, { method: "PUT", credentials: "include" });
      if (response.ok) { toast.success(t('businessDashboard.messages.ticketCalled', { ticketNumber: "??" })); fetchTickets(); fetchStats(); }
    } catch (error) { toast.error(t('businessDashboard.messages.failedCall')); }
  };

  const handleMarkPaid = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${ticketId}/pay`, { method: "PATCH", credentials: "include" });
      if (response.ok) { toast.success(t('businessDashboard.messages.paymentRecorded')); fetchTickets(); }
    } catch (error) { toast.error(t('businessDashboard.messages.failedPayment')); }
  };

  const handleCompleteTicket = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${ticketId}/complete`, { method: "PATCH", credentials: "include" });
      if (response.ok) { toast.success(t('businessDashboard.messages.ticketCompleted')); fetchTickets(); fetchStats(); }
      else { const error = await response.json(); toast.error(error.message || t('businessDashboard.messages.failedComplete')); }
    } catch (error) { toast.error(t('businessDashboard.messages.failedComplete')); }
  };

  const handleSkipTicket = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${ticketId}/no-show`, { method: "PATCH", credentials: "include" });
      if (response.ok) { toast.success(t('businessDashboard.messages.ticketSkipped')); fetchTickets(); fetchStats(); }
      else { const error = await response.json(); toast.error(error.message || t('businessDashboard.messages.failedSkip')); }
    } catch (error) { toast.error(t('businessDashboard.messages.failedSkip')); }
  };

  const handleCancelTicket = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${ticketId}/cancel`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ reason: "Cancelled by staff" }) });
      if (response.ok) { toast.success("Ticket cancelled"); fetchTickets(); fetchStats(); }
      else { const error = await response.json(); toast.error(error.message || t('businessDashboard.messages.failedCancel')); }
    } catch (error) { toast.error(t('businessDashboard.messages.failedCancel')); }
  };

  const handleServeTicket = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/tickets/${ticketId}/serve`, { method: "PATCH", credentials: "include" });
      if (response.ok) { toast.success(t('businessDashboard.messages.nowServing')); fetchTickets(); fetchStats(); }
      else { const error = await response.json(); toast.error(error.message || t('businessDashboard.messages.failedServe')); }
    } catch (error) { toast.error(t('businessDashboard.messages.failedServe')); }
  };

  const handleAddWalkIn = async () => {
    if (!walkInData.name || !walkInData.phone) { toast.error(t('businessDashboard.messages.missingInfo')); return; }
    try {
      const response = await fetch(`${API_URL}/api/v1/tickets/businesses/${businessData._id}/tickets`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        credentials: "include", 
        body: JSON.stringify({ 
          businessId: businessData._id,
          queueId: queue?._id,
          guestName: walkInData.name, 
          guestPhone: walkInData.phone, 
          guestEmail: walkInData.email, 
          price: walkInData.price || 0,
          type: "consultation",
          paymentMethod: "cash",
          priority: "normal",
          suppressUserSocket: true
        }) 
      });
      if (response.ok) { 
        toast.success(t('businessDashboard.messages.walkInAdded')); 
        setShowWalkInModal(false); 
        setWalkInData({ name: "", phone: "", email: "", price: 0 }); 

        fetchTickets(); 
        fetchStats(); 
      }
      else { const error = await response.json(); toast.error(error.message || t('businessDashboard.messages.failedWalkIn')); }
    } catch (error) { toast.error(t('businessDashboard.messages.failedWalkIn')); }
  };

  // Filter tickets by status
  const waitingTickets = tickets.filter((t) => t.status === "waiting").sort((a, b) => a.ticketNumber - b.ticketNumber);
  const calledTickets = tickets.filter((t) => t.status === "called");
  const servingTickets = tickets.filter((t) => t.status === "in-progress");
  const nextTicket = waitingTickets[0];

  if (loading && !businessData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/30 rounded-full animate-spin border-t-emerald-500"></div>
      </div>
    );
  }

  // Show "Start Queue for Today" screen when no queue exists
  if (!queue || queue?.status === 'closed') {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl p-12 border border-gray-200 dark:border-gray-700/50 text-center max-w-lg mx-auto">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <span className="text-5xl">🚀</span>
          </div>
          
          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
             {t('businessDashboard.dashboard.readyToStart')}
          </h2>
          
          {/* Date */}
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
            {dayName}, {monthName} {day}, {year}
          </p>
          
          {/* Subtitle */}
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('businessDashboard.dashboard.startDescription')}
          </p>
          
          {/* Start Button */}
          <button 
            onClick={handleCreateQueue}
            disabled={queueLoading}
            className={`w-full px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
              queueLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
            } bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40`}
          >
            {queueLoading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="text-2xl">▶️</span>
                {t('businessDashboard.dashboard.startQueueToday')}
              </>
            )}
          </button>
          
          {/* Business Info */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{businessData?.name}</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t('businessDashboard.dashboard.bookingsRemaining', { count: capacityLeft, plan: currentPlan })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg dark:shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{businessData?.name || t('businessDashboard.dashboard.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('userDashboard.date')}: {dayName}, {monthName} {day}, {year}</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="relative queue-menu-container" ref={menuRef}>
              <button onClick={() => setShowQueueMenu(!showQueueMenu)} disabled={queueLoading}
                className={`px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all border ${
                  !queue ? "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/50 hover:bg-blue-100 dark:hover:bg-blue-500/30" :
                  queue?.status === "active" ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/50 hover:bg-emerald-100 dark:hover:bg-emerald-500/30" :
                  queue?.status === "paused" ? "bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/50 hover:bg-amber-100 dark:hover:bg-amber-500/30" :
                  "bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/50 hover:bg-red-100 dark:hover:bg-red-500/30"
                } ${queueLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                <span className={`w-2 h-2 rounded-full ${!queue ? "bg-blue-500" : queue?.status === "active" ? "bg-emerald-500" : queue?.status === "paused" ? "bg-amber-500" : "bg-red-500"}`}></span>
                {!queue ? t('businessDashboard.dashboard.notStarted') : queue?.status === "active" ? t("businessDashboard.dashboard.open") : queue?.status === "paused" ? t("businessDashboard.dashboard.paused") : t("businessDashboard.dashboard.closed")}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              {showQueueMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="py-1">
                    {!queue && (<button onClick={handleCreateQueue} className="w-full text-left px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-3 transition-colors"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>{t('businessDashboard.dashboard.startQueue')}</button>)}
                    {queue && queue.status !== 'active' && (<button onClick={handleOpenQueue} className="w-full text-left px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-3 transition-colors"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>{t('businessDashboard.dashboard.openQueue')}</button>)}
                    {queue && queue.status === 'active' && (<button onClick={handlePauseQueue} className="w-full text-left px-4 py-3 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center gap-3 transition-colors"><span className="w-2 h-2 bg-amber-500 rounded-full"></span>{t('businessDashboard.dashboard.pauseQueue')}</button>)}
                    {queue && (queue.status === 'active' || queue.status === 'paused') && (<button onClick={handleCloseQueue} className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"><span className="w-2 h-2 bg-red-500 rounded-full"></span>{t('businessDashboard.dashboard.closeQueue')}</button>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard title={t('businessDashboard.dashboard.todaysCustomers')} value={stats.todaysPatients} icon={Users} color="bg-indigo-500" />
        <StatCard title={t('businessDashboard.dashboard.inQueue')} value={stats.inQueue} subtitle={t('businessDashboard.dashboard.waiting')} icon={Ticket} color="bg-purple-500" />
        <StatCard title={t('businessDashboard.dashboard.completed')} value={stats.completed} icon={CheckCircle} color="bg-emerald-500" />
        <StatCard 
          title={
            <span className="flex items-center gap-2">
              {t('businessDashboard.dashboard.avgWaitTime')}
              <span className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
                <Sparkles size={10} className="text-white" /> {t('services.aiPowered')}
              </span>
            </span>
          } 
          value={`${isNaN(stats.avgWaitTime) ? 0 : Math.round(stats.avgWaitTime)} min`} 
          icon={Clock} 
          color="bg-amber-500" 
        />
      </div>

      {/* Queue Management Section */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg dark:shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700/50">
        {/* Header with Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('businessDashboard.dashboard.queueManagement')}</h2>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button onClick={handleCallNext} disabled={calling || !nextTicket || queue?.status !== 'active'}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all ${calling || !nextTicket || queue?.status !== 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className="text-xl">📢</span>{calling ? t('businessDashboard.dashboard.calling') : t('businessDashboard.dashboard.callNext')}
            </button>
            <button onClick={() => queue?.status === 'active' ? handlePauseQueue() : handleOpenQueue()} disabled={queueLoading || !queue}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-amber-600 dark:text-amber-400 px-6 py-3 rounded-xl font-semibold border border-amber-200 dark:border-amber-500/50 shadow-lg transition-all ${queueLoading || !queue ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className="text-xl">{queue?.status === 'active' ? '⏸' : '▶'}</span>{queue?.status === 'active' ? t('businessDashboard.dashboard.pause') : t('businessDashboard.dashboard.resume')}
            </button>
            <button 
              onClick={() => capacityLeft > 0 ? setShowWalkInModal(true) : toast.error(t('businessDashboard.messages.limitReached'))} 
              disabled={queue?.status !== 'active' || capacityLeft <= 0}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-teal-500/20 transition-all ${queue?.status !== 'active' || capacityLeft <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={capacityLeft <= 0 ? `Monthly limit reached - Upgrade plan for more bookings` : 'Add walk-in customer'}>
              <span className="text-xl">➕</span>{t('businessDashboard.dashboard.walkIn')}{capacityLeft <= 0 && <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded">{t('businessDashboard.dashboard.full')}</span>}
            </button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-700 text-center hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">📢 {t('businessDashboard.dashboard.nextInLine')}</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{nextTicket ? `#${nextTicket.ticketNumber}` : '—'}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-700 text-center hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">⏰ {t('businessDashboard.dashboard.inQueue')}</p>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{waitingTickets.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4 border-2 border-green-200 dark:border-green-700 text-center hover:shadow-lg transition-all">
            <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">⚡ {t('businessDashboard.dashboard.serving')}</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">{servingTickets.length}</p>
          </div>
          <div className={`rounded-xl p-4 border-2 text-center hover:shadow-lg transition-all ${
            capacityLeft <= 0 
              ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700' 
              : capacityLeft < planLimit * 0.1 
              ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700'
              : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700'
          }`}>
            <p className={`text-sm font-semibold mb-2 ${
              capacityLeft <= 0 
                ? 'text-red-600 dark:text-red-400' 
                : capacityLeft < planLimit * 0.1 
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>🎫 {t('businessDashboard.dashboard.monthlyBookingsLeft')}</p>
            <p className={`text-3xl font-bold ${
              capacityLeft <= 0 
                ? 'text-red-700 dark:text-red-300' 
                : capacityLeft < planLimit * 0.1 
                ? 'text-orange-700 dark:text-orange-300'
                : 'text-emerald-700 dark:text-emerald-300'
            }`}>
              {capacityLeft <= 0 ? '⚠️ 0' : capacityLeft}
            </p>
            <p className={`text-xs mt-1 ${
              capacityLeft <= 0 
                ? 'text-red-600 dark:text-red-400' 
                : capacityLeft < planLimit * 0.1 
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {t('businessDashboard.dashboard.plan')}: <span className="capitalize font-semibold">{currentPlan}</span> ({planLimit}/{t('selectPlan.monthly')})
            </p>
          </div>
        </div>

        {/* Active Tickets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('businessDashboard.dashboard.activeTickets')}</h3>
            <div className="flex gap-2 text-sm">
              <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-semibold border border-green-200 dark:border-green-700">⚡ {servingTickets.length} {t('businessDashboard.dashboard.serving')}</span>
              <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-semibold border border-blue-200 dark:border-blue-700">📢 {calledTickets.length} {t('businessDashboard.dashboard.called')}</span>
              <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg font-semibold border border-purple-200 dark:border-purple-700">⏰ {waitingTickets.length} {t('businessDashboard.dashboard.waiting')}</span>
            </div>
          </div>

          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📋</span>
                </div>
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">{t('businessDashboard.dashboard.noActiveTickets')}</h3>
                <p className="text-gray-500 dark:text-gray-400">{t('businessDashboard.queueManagement.noWaitingTickets')}</p>
              </div>
            ) : (
              <>
                {/* Called Tickets */}
                {calledTickets.map((ticket) => (
                  <div key={ticket._id} className="relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 border-blue-400 dark:border-blue-500 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="absolute -top-3 -right-3 px-4 py-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-white text-xs font-bold shadow-lg animate-pulse">{t('businessDashboard.queueManagement.calledBadge')}</div>
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {ticket.userId?.profileImage ? (
                            <img src={getImageUrl(ticket.userId.profileImage)} alt={ticket.userId.name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-md" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-400 shadow-md"><FaUser className="text-white text-lg" /></div>
                          )}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">#{ticket.ticketNumber}</div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white">{ticket.userId?.name || ticket.guestName || t("businessDashboard.queueManagement.guest")}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.userId?.phone || ticket.guestPhone || ''}</p>
                          </div>
                        </div>
                        {ticket.price > 0 && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">${ticket.price}</p>
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${ticket.paymentStatus === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'}`}>{ticket.paymentStatus === 'paid' ? t('businessDashboard.queueManagement.paid') : t('businessDashboard.queueManagement.unpaid')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleServeTicket(ticket._id)} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">▶️ {t('businessDashboard.queueManagement.start')}</button>
                        {ticket.paymentStatus !== 'paid' && ticket.price > 0 && (<button onClick={() => handleMarkPaid(ticket._id)} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-md">💵 {t('businessDashboard.queueManagement.pay')}</button>)}
                      </div>
                    </div>
                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-[auto_auto_1fr_auto_auto] gap-6 items-center">
                      {ticket.userId?.profileImage ? (
                        <img src={getImageUrl(ticket.userId.profileImage)} alt={ticket.userId.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-lg" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-400 shadow-lg"><FaUser className="text-white text-2xl" /></div>
                      )}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">#{ticket.ticketNumber}</div>
                      <div>
                        <h4 className="font-bold text-xl text-gray-900 dark:text-white mb-1">{ticket.userId?.name || ticket.guestName || t("businessDashboard.queueManagement.guest")}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ticket.userId?.phone || ticket.guestPhone || ''}</p>
                        <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-700 w-fit">
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">🕐</span>
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{new Date(ticket.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {ticket.price > 0 && (<><p className="text-3xl font-bold text-blue-600 mb-2">${ticket.price}</p><span className={`text-xs px-4 py-2 rounded-full font-semibold ${ticket.paymentStatus === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'}`}>{ticket.paymentStatus === 'paid' ? t('businessDashboard.queueManagement.paid') : t('businessDashboard.queueManagement.unpaid')}</span></>)}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleServeTicket(ticket._id)} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md flex items-center gap-2" title={t('businessDashboard.queueManagement.startServing')}>▶️ {t('businessDashboard.queueManagement.start')}</button>
                        {ticket.paymentStatus !== 'paid' && ticket.price > 0 && (<button onClick={() => handleMarkPaid(ticket._id)} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-md flex items-center gap-2" title={t('businessDashboard.queueManagement.markAsPaid')}>💵 {t('businessDashboard.queueManagement.pay')}</button>)}
                        <button onClick={() => handleSkipTicket(ticket._id)} className="px-3 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all shadow-md" title={t('businessDashboard.queueManagement.noShow')}><FaForward /></button>
                        <button onClick={() => handleCancelTicket(ticket._id)} className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md" title={t('businessDashboard.queueManagement.cancel')}><FaTimes /></button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Serving Tickets */}
                {servingTickets.map((ticket) => (
                  <div key={ticket._id} className="relative bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 border-green-500 dark:border-green-500 transition-all duration-300">
                    <div className="absolute -top-3 -right-3 px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white text-xs font-bold shadow-lg animate-pulse">{t('businessDashboard.queueManagement.servingNowBadge')}</div>
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      <div className="flex items-start gap-4">
                        {ticket.userId?.profileImage ? (
                          <img src={getImageUrl(ticket.userId.profileImage)} alt={ticket.userId.name} className="w-16 h-16 rounded-full object-cover border-4 border-green-500 shadow-lg" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border-4 border-green-400 shadow-lg"><FaUser className="text-white text-2xl" /></div>
                        )}
                        <div className="flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md mb-2">#{ticket.ticketNumber}</div>
                          <h4 className="font-bold text-xl text-gray-900 dark:text-white">{ticket.userId?.name || ticket.guestName || t('businessDashboard.queueManagement.guest')}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.userId?.phone || ticket.guestPhone || ''}</p>
                        </div>
                      </div>
                      <button onClick={() => handleCompleteTicket(ticket._id)} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md flex items-center justify-center gap-2">{t('businessDashboard.queueManagement.completeService')}</button>
                    </div>
                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-[auto_auto_1fr_auto] gap-6 items-center">
                      {ticket.userId?.profileImage ? (
                        <img src={getImageUrl(ticket.userId.profileImage)} alt={ticket.userId.name} className="w-20 h-20 rounded-full object-cover border-4 border-green-500 shadow-lg" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border-4 border-green-400 shadow-lg"><FaUser className="text-white text-3xl" /></div>
                      )}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-lg">#{ticket.ticketNumber}</div>
                      <div>
                        <h4 className="font-bold text-2xl text-gray-900 dark:text-white mb-1">{ticket.userId?.name || ticket.guestName || t('businessDashboard.queueManagement.guest')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ticket.userId?.phone || ticket.guestPhone || ''}</p>
                        <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 px-3 py-1 rounded-lg border border-green-200 dark:border-green-700 w-fit">
                          <span className="text-xs text-green-600 dark:text-green-400 font-semibold">{t('businessDashboard.queueManagement.inProgress')}</span>
                          <span className="text-sm font-bold text-green-700 dark:text-green-300">{new Date(ticket.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <button onClick={() => handleCompleteTicket(ticket._id)} className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-md flex items-center gap-2">{t('businessDashboard.queueManagement.complete')}</button>
                    </div>
                  </div>
                ))}

                {/* Waiting Tickets */}
                {waitingTickets.map((ticket, index) => (
                  <div key={ticket._id} className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-400 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-500 dark:to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">{index + 1}</div>
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-4">
                      <div className="flex items-start justify-between pl-8">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {ticket.userId?.profileImage ? (
                              <img src={getImageUrl(ticket.userId.profileImage)} alt={ticket.userId.name} className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 dark:border-emerald-400 shadow-md" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md"><FaUser className="text-white text-sm" /></div>
                            )}
                            <div className="w-10 h-10 rounded-lg bg-emerald-500 dark:bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md">#{ticket.ticketNumber}</div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white">{ticket.userId?.name || ticket.guestName || t('businessDashboard.queueManagement.guest')}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.userId?.phone || ticket.guestPhone || ''}</p>
                            </div>
                          </div>
                        </div>
                        {ticket.price > 0 && (<div className="text-right"><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${ticket.price}</p><span className={`text-xs px-3 py-1 rounded-full font-semibold ${ticket.paymentStatus === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'}`}>{ticket.paymentStatus === 'paid' ? t('businessDashboard.queueManagement.paid') : t('businessDashboard.queueManagement.unpaid')}</span></div>)}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800"><p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">{t('businessDashboard.queueManagement.waitTime')}</p><p className="text-lg font-bold text-blue-700 dark:text-blue-300">{Math.round((index + 1) * (stats.avgWaitTime || 15))} min</p></div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800"><p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">{t('businessDashboard.queueManagement.joined')}</p><p className="text-lg font-bold text-purple-700 dark:text-purple-300">{new Date(ticket.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p></div>
                      </div>
                      <div className="flex gap-2">
                        {ticket.paymentStatus !== 'paid' && ticket.price > 0 && (<button onClick={() => handleMarkPaid(ticket._id)} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-md">💵 {t('businessDashboard.queueManagement.pay')}</button>)}
                        <button onClick={() => handleCallTicket(ticket._id)} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold transition-all shadow-md">📢 {t('businessDashboard.queueManagement.call')}</button>
                      </div>
                    </div>
                    {/* Desktop Layout */}
                    <div className="hidden md:grid md:grid-cols-[auto_auto_1fr_auto_auto] gap-6 items-center">
                      {ticket.userId?.profileImage ? (
                        <img src={getImageUrl(ticket.userId.profileImage)} alt={ticket.userId.name} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 dark:border-emerald-400 shadow-lg" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"><FaUser className="text-white text-2xl" /></div>
                      )}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">{ticket.ticketNumber}</div>
                      <div>
                        <h4 className="font-bold text-xl text-gray-900 dark:text-white mb-1">{ticket.userId?.name || ticket.guestName || t('businessDashboard.queueManagement.guest')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ticket.userId?.phone || ticket.guestPhone || ''}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800"><span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">⏰</span><span className="text-sm font-bold text-blue-700 dark:text-blue-300">{Math.round((index + 1) * (stats.avgWaitTime || 15))} min</span></div>
                          <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-lg border border-purple-200 dark:border-purple-800"><span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">🕐</span><span className="text-sm font-bold text-purple-700 dark:text-purple-300">{new Date(ticket.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span></div>
                        </div>
                      </div>
                      <div className="text-right">
                        {ticket.price > 0 && (<><p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">${ticket.price}</p><span className={`text-xs px-4 py-2 rounded-full font-semibold ${ticket.paymentStatus === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-gray-900'}`}>{ticket.paymentStatus === 'paid' ? '✓ Paid' : 'Unpaid'}</span></>)}
                      </div>
                      <div className="flex gap-2">
                        {ticket.paymentStatus !== 'paid' && ticket.price > 0 && (<button onClick={() => handleMarkPaid(ticket._id)} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-md flex items-center gap-2" title="Mark as Paid">💵 Pay</button>)}
                        <button onClick={() => handleCallTicket(ticket._id)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold transition-all shadow-md flex items-center gap-2" title="Call">📢 Call</button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Walk-in Customer Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('businessDashboard.dashboard.addWalkIn')}</h3>
              <button onClick={() => { setShowWalkInModal(false); setWalkInData({ name: '', phone: '', email: '', price: 0 }); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><FaTimes size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessDashboard.dashboard.customerName')} <span className="text-red-500">*</span></label>
                <input type="text" value={walkInData.name} onChange={(e) => setWalkInData({ ...walkInData, name: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder={t('businessDashboard.dashboard.enterCustomerName')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessDashboard.dashboard.phone')} <span className="text-red-500">*</span></label>
                <input type="tel" value={walkInData.phone} onChange={(e) => setWalkInData({ ...walkInData, phone: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder={t('businessDashboard.dashboard.enterPhone')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessDashboard.dashboard.emailOptional')}</label>
                <input type="email" value={walkInData.email} onChange={(e) => setWalkInData({ ...walkInData, email: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder={t('businessDashboard.dashboard.enterEmail')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('businessDashboard.dashboard.servicePrice')} <span className="text-red-500">*</span></label>
                <input type="number" min="0" step="0.01" value={walkInData.price} onChange={(e) => setWalkInData({ ...walkInData, price: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder={t('businessDashboard.dashboard.enterServicePrice')} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowWalkInModal(false); setWalkInData({ name: '', phone: '', email: '', price: 0 }); }} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium">{t('businessDashboard.dashboard.cancel')}</button>
              <button onClick={handleAddWalkIn} className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-medium">{t('businessDashboard.dashboard.addCustomer')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



