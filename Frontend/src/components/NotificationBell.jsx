"use client";
import { useTranslations } from '@/hooks/useTranslations';
import { useSocket } from '@/contexts/SocketContext';
import { Bell, Clock, CreditCard, MapPin, X, CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function NotificationBell() {
  const { t } = useTranslations();
  const { notifications, removeNotification, clearNotifications, markAsRead } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    const icons = {
      'queue': <MapPin size={18} className="text-blue-500" />,
      'position': <MapPin size={18} className="text-purple-500" />,
      'turn': <CheckCircle size={18} className="text-emerald-500" />,
      'reminder': <Clock size={18} className="text-amber-500" />,
      'payment': <CreditCard size={18} className="text-pink-500" />,
    };
    return icons[type] || <Bell size={18} className="text-gray-500" />;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return t('notificationBell.justNow');
    if (diff < 3600) return t('notificationBell.minutesAgo', { minutes: Math.floor(diff / 60) });
    if (diff < 86400) return t('notificationBell.hoursAgo', { hours: Math.floor(diff / 3600) });
    
    return time.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center"
        aria-label={t('notificationBell.title')}
      >
        <Bell size={20} className="text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/50 z-50 overflow-hidden flex flex-col animate-fade-in-scale">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Bell size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{t('notificationBell.title')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{unreadCount} {t('notificationBell.unread')}</p>
                </div>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); clearNotifications(); }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                >
                  {t('notificationBell.clearAll')}
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Bell size={32} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">{t('notificationBell.empty')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('notificationBell.emptyDesc')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group relative cursor-pointer ${
                        !notification.isRead ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-l-4 border-emerald-500' : ''
                      }`}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <X size={14} className="text-gray-500 dark:text-gray-400" />
                      </button>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatTime(notification.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


