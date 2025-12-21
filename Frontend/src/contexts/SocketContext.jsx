"use client";

import { API_URL, authFetch } from '@/lib/api';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const SocketContext = createContext(null);

// Singleton socket instance to prevent multiple connections
let socketInstance = null;

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(() => socketInstance?.connected || false);
  const [notifications, setNotifications] = useState([]);
  const [registeredUserId, setRegisteredUserId] = useState(null);
  const isInitialized = useRef(false);
  const lastBookedTicketRef = useRef(null);
  const pathname = usePathname();
  
  // Initialize socket with singleton pattern
  const [socket] = useState(() => {
    if (typeof window === 'undefined') return null;
    
    if (!socketInstance) {
      console.log('🔌 Creating new socket instance');
      socketInstance = io(API_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        timeout: 20000,
      });
    } else {
      console.log('♻️ Reusing existing socket instance');
    }
    
    return socketInstance;
  });

  // Register/Re-register logic
  useEffect(() => {
    if (socket && connected && registeredUserId) {
      const uId = String(registeredUserId);
      console.log('👤 [SocketContext] Emitting joinUserRoom for:', uId);
      socket.emit('joinUserRoom', { userId: uId });
    } else {
      console.log('⏳ [SocketContext] Pending joinUserRoom:', { 
        hasSocket: !!socket, 
        connected, 
        hasUserId: !!registeredUserId 
      });
    }
  }, [socket, connected, registeredUserId]);

  const registerUser = (userId) => {
    if (!userId) {
      console.warn('⚠️ [SocketContext] registerUser called with null/undefined');
      return;
    }
    const uIdStr = String(userId);
    console.log('👤 [SocketContext] registerUser called with:', uIdStr);
    setRegisteredUserId(uIdStr);
  };

  const fetchNotifications = async () => {
    if (!connected) {
        console.log('⏳ [SocketContext] fetchNotifications skipped (not connected yet)');
        // But we should fetch anyway if we are on a page that needs them?
        // Actually fetchNotifications is REST, not socket.
    }
    try {
      console.log('📥 [SocketContext] Fetching initial notifications...');
      const res = await authFetch(`${API_URL}/api/v1/notifications?limit=50&isRead=false`);
      if (!res.ok) {
          if (res.status === 401) {
              console.log('🚫 [SocketContext] Unauthorized - user likely guest');
              return;
          }
          throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      if(data.status === 'success') {
         const mapped = data.notifications.map(n => ({
            id: n._id,
            type: n.type,
            message: n.message,
            timestamp: n.createdAt,
            isRead: n.isRead,
            data: n
         }));
         setNotifications(mapped);
         console.log('✅ [SocketContext] Notifications synced:', mapped.length);
      }
    } catch (e) { 
        console.warn("⚠️ [SocketContext] Sync failed:", e.message); 
    }
  };
// ... (omitting middle parts for conciseness in replacement chunk but keeping structure)
  useEffect(() => {
    if (!socket || isInitialized.current) return;
    
    console.log('🎬 [SocketContext] Initializing socket listeners');
    isInitialized.current = true;

    // Set initial state if already connected
    if (socket.connected) setConnected(true);

    socket.on('connect', () => {
      console.log('✅ [SocketContext] Connected - ID:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ [SocketContext] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 [SocketContext] Reconnected after', attemptNumber, 'attempts');
      setConnected(true);
    });

    socket.on('joinedUserRoom', (data) => {
      console.log('🏠 [SocketContext] Confirmed joined user room:', data.room);
    });

    socket.on('error', (err) => {
      console.error('⚠️ [SocketContext] Socket error:', err);
    });

    // Listen for new notifications (Unified Event)
    socket.on('newNotification', (data) => {
      console.log('🔔 [SocketContext] newNotification received:', data);
      const notification = {
        id: data.id || Date.now(),
        type: data.type,
        message: data.message,
        timestamp: data.timestamp || new Date(),
        isRead: data.isRead || false,
        data: data.data || data
      };
      
      setNotifications(prev => {
        // Prevent duplicates if possible (MongoDB ID check)
        if (notification.id && prev.some(n => n.id === notification.id)) return prev;
        return [notification, ...prev].slice(0, 50);
      });

      // Special handling for Turn notifications (higher priority/custom style)
      if (data.type === 'turn') {
        showNotification('Your Turn! 🔔', data.message, 'turn');
      } else {
        const toastTitle = {
            ticket: 'Ticket Update 🎟️',
            payment: 'Payment Update 💳',
            system: 'System Alert 📢'
        }[data.type] || 'New Notification';
        
        showNotification(toastTitle, data.message, data.type);
      }
    });

    // ticketCreated - When a new ticket is booked (per documentation)
    socket.on('ticketCreated', (data) => {
      console.log('🎟️ Ticket Created:', data);
      const notification = {
        id: Date.now(), // Temporary ID until fetched from DB
        type: 'ticket',
        message: `Ticket #${data.number} created successfully`,
        data: data,
        timestamp: new Date(),
        isRead: false,
      };
      setNotifications(prev => [notification, ...prev].slice(0, 50));
    });

    // ticketUpdated - Queue position or status changes (per documentation)
    socket.on('ticketUpdated', (data) => {
      console.log('🔄 Ticket Updated:', data);
      const notification = {
        id: Date.now(),
        type: 'ticket',
        message: `Ticket #${data.number} - ${data.status}`,
        data: data,
        timestamp: new Date(),
      };
      setNotifications(prev => [notification, ...prev].slice(0, 50));
    });

    // Queue update notifications
    socket.on('queueUpdate', (data) => {
      console.log('📢 Queue Update:', data);
      const notification = {
        id: Date.now(),
        type: 'queue',
        message: data.message,
        data: data,
        timestamp: new Date(),
      };
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      
      showNotification('Queue Update', data.message, 'queue');
    });

    // Position update notifications
    socket.on('positionUpdate', (data) => {
      console.log('📍 Position Update:', data);
      const notification = {
        id: Date.now(),
        type: 'position',
        message: `Your position: #${data.position}. Estimated wait: ${data.estimatedWait} min`,
        data: data,
        timestamp: new Date(),
      };
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      
      showNotification('Position Update', `You are #${data.position} in line`, 'info');
    });

    // Your turn notification
    socket.on('yourTicketCalled', (data) => {
      console.log('🔔 Your Turn:', data);
      const notification = {
        id: Date.now(),
        type: 'turn',
        message: data.message,
        data: data,
        timestamp: new Date(),
        isRead: false
      };
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      
      showNotification('Your Turn! 🔔', data.message, 'turn');
    });

    // Payment update notifications
    socket.on('paymentUpdate', (data) => {
      console.log('💳 Payment Update:', data);
      const notification = {
        id: Date.now(),
        type: 'payment',
        message: data.message,
        data: data,
        timestamp: new Date(),
        isRead: false
      };
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      
      showNotification(data.title || 'Payment Successful', data.message, 'success');
    });
    
    // Ticket Booked notification
    socket.on('ticketBooked', (data) => {
      console.log('🔔 Ticket Booked:', data);
      
      const ticketId = data.ticket?._id || data._id;
      if (ticketId && lastBookedTicketRef.current === ticketId) {
          console.log('Skipping duplicate ticket notification:', ticketId);
          return;
      }
      if (ticketId) lastBookedTicketRef.current = ticketId;

      // If we are on the payment page, suppress the socket toast because the page shows its own
      if (pathname === '/payment') {
          console.log('Suppressing socket toast on payment page');
          return;
      }

      const notification = {
        id: Date.now(),
        type: 'ticket',
        message: data.message || "Ticket booked successfully!",
        data: data.ticket || data,
        timestamp: new Date(),
        // unread by default
        isRead: false 
      };
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      
      showNotification('Ticket Booked', data.message || "Ticket Booked Successfully", 'ticket');
    });

    // Appointment reminders
    socket.on('appointmentReminder', (data) => {
      console.log('⏰ Appointment Reminder:', data);
      const notification = {
        id: Date.now(),
        type: 'reminder',
        message: `Reminder: Appointment in ${data.timeUntil}`,
        data: data,
        timestamp: new Date(),
      };
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      
      showNotification('Appointment Reminder', `You have an appointment in ${data.timeUntil}`, 'info');
    });

    // =========================================
    // BUSINESS UPDATE EVENTS (for homepage real-time updates)
    // =========================================
    socket.on('businessCreated', (data) => {
      console.log('🏢 Business Created:', data.business?.name);
      window.dispatchEvent(new CustomEvent('businessListUpdate', { 
        detail: { type: 'created', business: data.business }
      }));
    });

    socket.on('businessUpdated', (data) => {
      console.log('🏢 Business Updated:', data.business?.name);
      window.dispatchEvent(new CustomEvent('businessListUpdate', { 
        detail: { type: 'updated', business: data.business }
      }));
    });

    socket.on('businessDeleted', (data) => {
      console.log('🏢 Business Deleted:', data.businessId);
      window.dispatchEvent(new CustomEvent('businessListUpdate', { 
        detail: { type: 'deleted', businessId: data.businessId }
      }));
    });

    return () => {
      // Listeners persistent per socketInstance
    };
  }, [socket, connected, registeredUserId]);

  const joinQueue = (queueId) => {
    if (socket) {
      socket.emit('joinQueue', queueId);
    }
  };

  const leaveQueue = (queueId) => {
    if (socket) {
      socket.emit('leaveQueue', queueId);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Usually singleton persist, but we can disconnect if needed
      // However, usually we keep it for faster re-visits
    };
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        joinQueue,
        leaveQueue,
        clearNotifications,
        removeNotification,
        markAsRead,
        fetchNotifications,
        registerUser,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};


