"use client";

import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { API_URL } from '@/lib/api';

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
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
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
        reconnectionAttempts: 5,
      });
    } else {
      console.log('♻️ Reusing existing socket instance');
    }
    
    return socketInstance;
  });

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/notifications?limit=50`, { credentials: 'include' });
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
      }
    } catch (e) { 
        console.error("Failed to fetch notifications:", e); 
        toast.error(`Sync Error: ${e.message}`);
    }
  };

  const showNotification = (title, message, type = 'info') => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        } transform transition-all duration-300 max-w-sm w-full bg-white dark:bg-gray-800 shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 dark:ring-white/10 overflow-hidden border-l-4 ${
             type === 'turn' ? 'border-red-500' :
             type === 'success' ? 'border-emerald-500' :
             type === 'queue' ? 'border-amber-500' :
             type === 'ticket' ? 'border-emerald-500' :
             'border-blue-500'
        }`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5 text-2xl">
              {type === 'turn' ? '🔔' : 
               type === 'success' ? '✅' :
               type === 'queue' ? '⚠️' : 
               type === 'ticket' ? '🎟️' : 'ℹ️'}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {title}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-snug">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700"
          >
            ✕
          </button>
        </div>
      </div>
    ), { duration: 4000, id: title + message });
  };

  const markAsRead = async (id) => {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      try {
          // Only call API if it's a real MongoDB ID (24 chars)
          if(typeof id === 'string' && id.length === 24) {
             await fetch(`${API_URL}/api/v1/notifications/${id}/read`, { 
                 method: 'PATCH',
                 credentials: 'include' 
             });
          }
      } catch(e) { console.error("Failed to mark as read:", e); }
  };

  useEffect(() => {
     fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket || isInitialized.current) return;
    
    console.log('🎬 Initializing socket listeners');
    isInitialized.current = true;

    socket.on('connect', () => {
      console.log('✅ Socket.IO Connected - ID:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO Disconnected');
      setConnected(false);
    });

    socket.on('reconnect', () => {
      console.log('🔄 Socket.IO Reconnected');
      setConnected(true);
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
      
      showNotification('Payment Successful', data.message, 'success');
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

    return () => {
      // Don't cleanup on re-render, listeners are initialized once
    };
  }, [socket]);

  const joinQueue = (queueId) => {
    if (socket) {
      socket.emit('joinQueue', queueId);
    }
  };

  const registerUser = (userId) => {
    if (socket && userId) {
      console.log('👤 Joining user room:', userId);
      socket.emit('joinUserRoom', { userId });
    }
  };

  const leaveQueue = (queueId) => {
    if (socket) {
      socket.emit('leaveQueue', queueId);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Cleanup on component unmount - disconnect and clear singleton
  useEffect(() => {
    return () => {
      if (socket && socketInstance) {
        console.log('🔌 Disconnecting socket on SocketProvider unmount');
        socket.disconnect();
        socketInstance = null;
        isInitialized.current = false;
      }
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


