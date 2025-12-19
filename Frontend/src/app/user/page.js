"use client";
import { API_URL, authFetch } from '@/lib/api';

import ProtectedRoute from '@/components/ProtectedRoute';
import AppointmentsTab from '@/components/UserDashboard/AppointmentsTab';
import DashboardTab from '@/components/UserDashboard/DashboardTab';
import FindBusinessTab from '@/components/UserDashboard/FindBusinessTab';
import MyProfileTab from '@/components/UserDashboard/MyProfileTab';
import MyTicketsTab from '@/components/UserDashboard/MyTicketsTab';
import PaymentsTab from '@/components/UserDashboard/PaymentsTab';
import ReviewsTab from '@/components/UserDashboard/ReviewsTab';
import Sidebar from '@/components/UserDashboard/Sidebar';
import { useSocket } from '@/contexts/SocketContext';
import { useTranslations } from '@/hooks/useTranslations';
import { Button, Modal, ModalBody, ModalHeader } from "flowbite-react";
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaBars, FaTimes } from "react-icons/fa";
import { HiOutlineExclamationCircle } from "react-icons/hi";

export default function PatientDashboard() {
  const { t } = useTranslations();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);

  // Date and time
  const date = new Date();
  const day = date.getDate();
  const dayName = date.toLocaleString("default", { weekday: "long" });
  const monthName = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  const [time, setTime] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAISuggestion, setIsAISuggestion] = useState(false);

  // Data states
  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [myPayments, setMyPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Handlers
  const handleEditProfile = () => setIsDisabled(false);
  const handleSaveEdit = () => setIsDisabled(true);
  const handleDeleteAccount = () => setOpenModal(true);

  const performSearch = async (query = searchQuery) => {
    // If search is empty, restore all businesses
    if (!query.trim()) {
      setIsAISuggestion(false);
      try {
        const response = await fetch(`${API_URL}/api/v1/search/businesses?limit=50`);
        const data = await response.json();
        let businessList = data.data?.businesses || [];
        
        // Sort: Online -> Busy -> Closed
        businessList = businessList.sort((a, b) => {
          const getPriority = (business) => {
            if (!business.isOpen) return 3;
            if (business.isFullyBooked) return 3;
            if (business.queueStatus === 'active') return 1;
            return 2;
          };
          return getPriority(a) - getPriority(b);
        });
        
        setSearchResults(businessList);
      } catch (error) {
        console.error("Error fetching businesses:", error);
      }
      return;
    }

    // Hybrid search
    setIsSearching(true);
    try {
      // Step 1: Regular text search
      let response = await fetch(`${API_URL}/api/v1/search/businesses?q=${encodeURIComponent(query)}&limit=50`);
      let data = await response.json();
      let results = data.data?.businesses || [];
      
      // Step 2: Fallback to AI semantic search
      if (results.length === 0) {
        setIsAISuggestion(true);
        response = await fetch(`${API_URL}/api/v1/search/semantic?q=${encodeURIComponent(query)}&limit=50`);
        data = await response.json();
        results = data.data?.businesses || [];
      } else {
        setIsAISuggestion(false);
      }
      
      // Sort: Online -> Busy -> Closed
      results = results.sort((a, b) => {
        const getPriority = (business) => {
          if (!business.isOpen) return 3;
          if (business.isFullyBooked) return 3;
          if (business.queueStatus === 'active') return 1;
          return 2;
        };
        return getPriority(a) - getPriority(b);
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching clinics:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    performSearch(searchQuery);
  };

  // Debounce search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length === 0 || searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/v1/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setUserData(data.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Fetch all businesses when Find Business tab is active
  // Fetch all businesses when Find Business tab is active and search is empty
  useEffect(() => {
    if (activeTab === 'findBusiness' && !searchQuery) {
      performSearch("");
    }
  }, [activeTab]);

  // Fetch tickets
  useEffect(() => {
    if (activeTab === 'myTickets' || activeTab === 'appointments') {
      const fetchMyTickets = async () => {
        setLoadingTickets(true);
        try {
          const res = await authFetch(`${API_URL}/api/v1/tickets/users/me/tickets`);
          if (res.ok) {
            const data = await res.json();
            // Filter to only show active tickets (not completed, cancelled, or no-show)
            const activeTickets = (data.data || []).filter(ticket => 
              ['waiting', 'called', 'in-progress'].includes(ticket.status)
            );
            setMyTickets(activeTickets);
          }
        } catch (error) {
          console.error('Error fetching tickets:', error);
        } finally {
          setLoadingTickets(false);
        }
      };
      fetchMyTickets();
    }
  }, [activeTab]);

  // Fetch reviews
  useEffect(() => {
    if (activeTab === 'reviews') {
      const fetchMyReviews = async () => {
        setLoadingReviews(true);
        try {
          const res = await authFetch(`${API_URL}/api/v1/reviews/users/me/reviews`);
          if (res.ok) {
            const result = await res.json();
            setMyReviews(result || []);
          }
        } catch (error) {
          console.error('Error fetching reviews:', error);
        } finally {
          setLoadingReviews(false);
        }
      };
      fetchMyReviews();
    }
  }, [activeTab]);

  // Fetch payments
  useEffect(() => {
    if (activeTab === 'payments') {
      const fetchMyPayments = async () => {
        setLoadingPayments(true);
        try {
          const res = await authFetch(`${API_URL}/api/v1/payments/users/me/payments`);
          if (res.ok) {
            const result = await res.json();
            setMyPayments(result.data?.payments || []);
          }
        } catch (error) {
          console.error('Error fetching payments:', error);
        } finally {
          setLoadingPayments(false);
        }
      };
      fetchMyPayments();
    }
  }, [activeTab]);

  // Socket integration for real-time updates
  useEffect(() => {
    if (!socket || !userData?._id) return;

    socket.emit('joinUserRoom', userData._id);

    socket.on('ticketUpdated', (updatedTicket) => {
      setMyTickets(prevTickets => {
        // If ticket is completed, cancelled, or no-show, remove it from the list
        if (!['waiting', 'called', 'in-progress'].includes(updatedTicket.status)) {
          return prevTickets.filter(t => t._id !== updatedTicket._id);
        }
        // Otherwise update it
        return prevTickets.map(t => 
          t._id === updatedTicket._id ? updatedTicket : t
        );
      });
    });

    socket.on('yourTurn', (ticket) => {
      toast.success(t('userDashboard.yourTurnNotification', { ticketNumber: ticket.ticketNumber || ticket.position }), {
        duration: 5000,
      });
      if (Notification.permission === 'granted') {
        new Notification(t('userDashboard.yourTurnTitle'), {
          body: t('userDashboard.proceedTo', { businessName: ticket.businessId?.name }),
          icon: '/logo.png',
        });
      }
    });

    return () => {
      socket.off('ticketUpdated');
      socket.off('yourTurn');
    };
  }, [socket, userData]);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = new Date();
      const currentTime = currentDate.toLocaleString("default", { 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit" 
      });
      setTime(currentTime);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ProtectedRoute allowedRoles={['user']}>
      {/* Delete Account Modal */}
      {openModal && (
        <Modal className='flex items-center' show={openModal} size="md" onClose={() => setOpenModal(false)} popup>
          <div className="rounded-lg border-2 border-gray-300 p-3 shadow-sm">
            <ModalHeader />
            <ModalBody>
              <div className="text-center">
                <HiOutlineExclamationCircle color="red" className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                <h3 className="mb-5 text-lg font-normal text-gray-800 dark:text-gray-400">
                  {t('userDashboard.confirmDelete')}
                </h3>
                <div className="flex justify-center gap-4">
                  <Button className="bg-red-500 hover:bg-red-600" onClick={async () => {
                    try {
                      const res = await authFetch(`${API_URL}/api/v1/users/me`, { method: 'DELETE' });
                      if (res.ok) {
                        toast.success(t('userDashboard.accountDeleted'));
                        window.location.href = '/';
                      } else {
                        const error = await res.json();
                        toast.error(error.message || t('userDashboard.deleteAccountFailed'));
                      }
                    } catch (error) { toast.error(t('userDashboard.deleteAccountFailed')); }
                    finally { setOpenModal(false); }
                  }}>
                    {t('userDashboard.confirm')}
                  </Button>
                  <Button className="bg-gray-200 hover:bg-gray-300 text-gray-800" onClick={() => setOpenModal(false)}>
                    {t('userDashboard.cancel')}
                  </Button>
                </div>
              </div>
            </ModalBody>
          </div>
        </Modal>
      )}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white dark:bg-gray-900 p-4 flex justify-between items-center shadow-sm sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('userDashboard.tabs.dashboard')}</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-white">
            {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        <div className="flex relative">
          {/* Sidebar Component */}
          <Sidebar 
            t={t}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
            {activeTab === "dashboard" && (
              <DashboardTab
                t={t}
                userData={userData}
                day={day}
                dayName={dayName}
                monthName={monthName}
                year={year}
                time={time}
              />
            )}

            {activeTab === "findBusiness" && (
              <FindBusinessTab
                t={t}
                searchResults={searchResults}
                isSearching={isSearching}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                isAISuggestion={isAISuggestion}
              />
            )}

            {activeTab === "myTickets" && (
              <MyTicketsTab
                t={t}
                myTickets={myTickets}
                loadingTickets={loadingTickets}
                setMyTickets={setMyTickets}
              />
            )}

            {activeTab === "myProfile" && (
              <MyProfileTab
                t={t}
                userData={userData}
                isDisabled={isDisabled}
                handleEditProfile={handleEditProfile}
                handleSaveEdit={handleSaveEdit}
                handleDeleteAccount={handleDeleteAccount}
                refreshUserData={fetchUserData}
              />
            )}

            {activeTab === "reviews" && (
              <ReviewsTab
                t={t}
                myReviews={myReviews}
                loadingReviews={loadingReviews}
              />
            )}

            {activeTab === "appointments" && (
              <AppointmentsTab
                t={t}
                myTickets={myTickets}
                loadingTickets={loadingTickets}
              />
            )}

            {activeTab === "payments" && (
              <PaymentsTab
                t={t}
                myPayments={myPayments}
                loadingPayments={loadingPayments}
              />
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}



