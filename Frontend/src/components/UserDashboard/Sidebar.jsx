"use client";
import { API_URL, authFetch } from '@/lib/api';

import { BiLogOut } from "react-icons/bi";
import { BsTicketPerforatedFill } from "react-icons/bs";
import { FaCalendarAlt, FaCreditCard, FaSearch, FaTimes, FaUser } from "react-icons/fa";
import { MdReviews } from 'react-icons/md';
import { SiGoogleanalytics } from "react-icons/si";

export default function Sidebar({ t, activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen }) {
  const navItems = [
    { id: "dashboard", label: t('userDashboard.tabs.dashboard'), icon: <SiGoogleanalytics /> },
    { id: "findBusiness", label: t('common.search'), icon: <FaSearch /> },
    { id: "myTickets", label: t('userDashboard.tabs.tickets'), icon: <BsTicketPerforatedFill /> },
    { id: "appointments", label: t('userDashboard.tabs.appointments'), icon: <FaCalendarAlt /> },
    { id: "myProfile", label: t('userDashboard.tabs.profile'), icon: <FaUser /> },
    { id: "reviews", label: t('userDashboard.tabs.reviews'), icon: <MdReviews /> },
    { id: "payments", label: t('userDashboard.tabs.payments'), icon: <FaCreditCard /> }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-72
        bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-950 
        shadow-2xl transition-transform duration-300 ease-in-out 
        border-r border-gray-200 dark:border-gray-800/50
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header Area */}
          <div className="p-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800/50">
            <div></div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
              <FaTimes size={20} />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">{t('userDashboard.navigation')}</p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span className={`text-xl transition-transform group-hover:scale-110 ${
                  activeTab === item.id ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                }`}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-white/50" />
                )}
              </button>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-gray-950/50">
            <button 
              onClick={async () => {
                try {
                  const res = await authFetch(`${API_URL}/api/v1/auth/logout`, {
                    method: 'POST',
                  });
                  // Clear localStorage token and cookies
                  localStorage.removeItem('accessToken');
                  document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  window.location.href = '/';
                } catch (error) {
                  console.error('Logout error:', error);
                  // Still try to clear and redirect even on error
                  localStorage.removeItem('accessToken');
                  document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  window.location.href = '/';
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/30 transition-all group"
            >
              <span className="text-xl group-hover:-translate-x-1 transition-transform"><BiLogOut /></span>
              <span className="font-medium">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}



