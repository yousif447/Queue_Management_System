"use client";
import { API_URL } from '@/lib/api';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useTranslations } from '@/hooks/useTranslations';
import { Button, Modal, ModalBody, ModalHeader } from "flowbite-react";
import { useEffect, useState } from 'react';
import { BiLogOut } from "react-icons/bi";
import { BsTicketPerforatedFill } from "react-icons/bs";
import { FaBars, FaCalendarAlt, FaCreditCard, FaSearch, FaTimes, FaUser } from "react-icons/fa";
import { FaPhone } from 'react-icons/fa6';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { IoCamera } from 'react-icons/io5';
import { MdAccountBalance, MdCheck, MdDelete, MdEdit, MdEmail, MdReviews, MdSave } from 'react-icons/md';
import { SiGoogleanalytics } from "react-icons/si";

export default function PatientDashboard() {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const date = new Date();
    const day = date.getDate();
    const dayName = date.toLocaleString("default", { weekday: "long" });
    const monthName = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    const [time, setTime] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [isDisabled, setIsDisabled] = useState(true);
    const [myTickets, setMyTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [myReviews, setMyReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [myPayments, setMyPayments] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);

    const handleEditProfile = () => {
        setIsDisabled(false);
    };

    const handleSaveEdit = () => {
        setIsDisabled(true);
    };

    const handleDeleteAccount = () => {
        setOpenModal(true);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        try {
            const response = await fetch(`${API_URL}/api/v1/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Error searching clinics:", error);
        } finally {
            setIsSearching(false);
        }
    };

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch(`${API_URL}/api/v1/auth/me`, {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    console.log(data);
                    setUserData(data.data);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUserData();
    }, []);

    // Fetch user tickets
    useEffect(() => {
        const fetchMyTickets = async () => {
            setLoadingTickets(true);
            try {
                const res = await fetch(`${API_URL}/api/v1/users/me/tickets`, {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    setMyTickets(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching tickets:', error);
            } finally {
                setLoadingTickets(false);
            }
        };

        if (activeTab === 'myTickets') {
            fetchMyTickets();
        }
    }, [activeTab]);

    // Fetch user reviews
    useEffect(() => {
        const fetchMyReviews = async () => {
            setLoadingReviews(true);
            try {
                const res = await fetch(`${API_URL}/api/v1/users/me/reviews`, {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    setMyReviews(data || []);
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoadingReviews(false);
            }
        };

        if (activeTab === 'reviews') {
            fetchMyReviews();
        }
    }, [activeTab]);

    // Fetch user payments
    useEffect(() => {
        const fetchMyPayments = async () => {
            setLoadingPayments(true);
            try {
                const res = await fetch(`${API_URL}/api/v1/users/me/payments`, {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    setMyPayments(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching payments:', error);
            } finally {
                setLoadingPayments(false);
            }
        };

        if (activeTab === 'payments') {
            fetchMyPayments();
        }
    }, [activeTab]);

    useEffect(() => {
        const interval = setInterval(() => {
            const currentDate = new Date();
            const currentTime = currentDate.toLocaleString("default", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            setTime(currentTime);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

  return (
    <ProtectedRoute allowedRoles={['user']}>
    <>
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
                        <Button className="bg-red-500 hover:bg-red-600" onClick={() => setOpenModal(false)}>
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
    
    <div className="min-h-screen bg-[#F3F3F3] dark:bg-[#221F1B] transition-colors duration-300">
      <div className="lg:hidden bg-white dark:bg-[#2b2825] p-4 flex justify-between items-center shadow-sm sticky top-0 z-30">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('userDashboard.tabs.dashboard')}</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600 dark:text-white focus:outline-none">
            {isSidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>

      <div className="flex relative">
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}

        <aside className={`
            fixed lg:sticky top-0 left-0 z-50 h-screen w-64 
            bg-white dark:bg-[#2b2825] shadow-lg transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6 lg:hidden">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Menu</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="text-gray-600 dark:text-white">
                    <FaTimes size={24} />
                </button>
            </div>
            
            <nav className="space-y-2">
              {[
                { id: "dashboard", label: t('userDashboard.tabs.dashboard'), icon: <SiGoogleanalytics /> },
                { id: "findBusiness", label: t('common.search'), icon: <FaSearch /> },
                { id: "myTickets", label: t('userDashboard.tabs.tickets'), icon: <BsTicketPerforatedFill /> },
                { id: "appointments", label: t('userDashboard.stats.upcomingAppointments'), icon: <FaCalendarAlt /> },
                { id: "myProfile", label: t('userDashboard.tabs.profile'), icon: <FaUser /> },
                { id: "reviews", label: t('userDashboard.tabs.reviews'), icon: <MdReviews /> },
                { id: "payments", label: "Payments", icon: <FaCreditCard /> }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? "bg-[#359487]/10 text-[#359487] border-l-4 border-[#359487] dark:text-[#C6FE02] dark:border-[#C6FE02] dark:bg-[#C6FE02]/10"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 dark:text-white"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/api/v1/auth/logout`, {
                      method: 'POST',
                      credentials: 'include',
                    });
                    if (res.ok) {
                      window.location.href = '/';
                    }
                  } catch (error) {
                    console.error('Logout error:', error);
                  }
                }}
                className="cursor-pointer b w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-white hover:bg-gray-200 dark:hover:bg-white/5 transition-all"
              >
                <span className="text-xl"><BiLogOut size={25}/></span>
                <span className="font-medium">{t('nav.logout')}</span>
              </button>
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
            {activeTab === "dashboard" && (
            <div>
                <div className="bg-white dark:bg-[#2b2825] rounded-2xl shadow-sm p-6 mb-8 transition-colors duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">{t('userDashboard.greeting')}, {userData?.name.split(" ")[0]}! 👋</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{t('userDashboard.date')}: {dayName}, {monthName} {day}, {year}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-800 dark:text-white text-2xl md:text-3xl">{time}</p>
                    </div>
                </div>
                </div>
            </div>

            <div className="bg-[#359487] dark:bg-[#359487] rounded-2xl shadow-lg p-6 md:p-8 mb-8 text-white transition-colors duration-300">
                <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                <BsTicketPerforatedFill /> Active Queue Ticket
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/10 dark:bg-black/10 backdrop-blur rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Clinic</p>
                    <p className="text-lg md:text-xl font-bold">Cairo Medical Center</p>
                </div>
                <div className="bg-white/10 dark:bg-black/10 backdrop-blur rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Your Number</p>
                    <p className="text-lg md:text-xl font-bold">#A-24</p>
                </div>
                <div className="bg-white/10 dark:bg-black/10 backdrop-blur rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Current Number</p>
                    <p className="text-lg md:text-xl font-bold">#A-18</p>
                </div>
                <div className="bg-white/10 dark:bg-black/10 backdrop-blur rounded-xl p-4">
                    <p className="text-sm opacity-90 mb-1">Est. Wait Time</p>
                    <p className="text-lg md:text-xl font-bold">25 mins</p>
                </div>
                </div>
                <div className="bg-white/10 dark:bg-black/10 backdrop-blur rounded-xl p-4">
                <div className="flex justify-between mb-2 text-sm md:text-base">
                    <span>Queue Progress</span>
                    <span>6 patients ahead</span>
                </div>
                <div className="bg-white/20 dark:bg-black/20 h-3 rounded-full overflow-hidden">
                    <div className="bg-white dark:bg-gray-900 h-full w-3/5 rounded-full"></div>
                </div>
                </div>
            </div>
            </div>
            )}
          

          {activeTab === "findBusiness" && (
          <div className="bg-white dark:bg-[#2b2825] rounded-2xl shadow-sm p-6 mb-8 transition-colors duration-300">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <FaSearch /> {t('clinics.title')}
            </h2>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <input
                type="text"
                placeholder={t('clinics.searchPlaceholder')}
                className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#359487] dark:focus:border-[#C6FE02] focus:outline-none transition-colors bg-transparent dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-[#359487] dark:bg-[#C6FE02] text-white dark:text-black px-8 py-3 rounded-xl font-semibold hover:bg-[#2a8074] dark:hover:bg-[#a7d404] transition-colors disabled:opacity-50"
              >
                {isSearching ? t('common.searching') : t('common.search')}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.length > 0 ? (
                searchResults.map((clinic) => (
                  <div key={clinic._id} className="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:border-[#359487] dark:hover:border-[#C6FE02] hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex items-center gap-4 mb-4">
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{clinic.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{clinic.specialization || "General Practice"}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4 pt-4 border-t dark:border-gray-600">
                      <span>⭐ {clinic.rating || "N/A"}</span>
                      <span>📍 {clinic.address}</span>
                      <span>⏰ {clinic.isOpen ? "Open" : "Closed"}</span>
                    </div>
                    <button className="w-full bg-[#359487] dark:bg-[#C6FE02] text-white dark:text-black py-2 rounded-lg font-semibold hover:bg-[#2a8074] dark:hover:bg-[#a7d404] transition-colors">
                      {t('hero.bookAppointment')}
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchQuery ? t('clinics.noBusinessesFound') : t('userDashboard.searchPlaceholder')}
                </div>
              )}
            </div>
          </div>
          )}

          {activeTab === "myTickets" && (
          <div className="bg-white dark:bg-[#2b2825] rounded-2xl shadow-sm p-6 transition-colors duration-300">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
              <BsTicketPerforatedFill /> {t('userDashboard.tabs.tickets')}
            </h2>
            
            {loadingTickets ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359487] dark:border-[#C6FE02] mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">{t('common.loading')}</p>
              </div>
            ) : myTickets.length === 0 ? (
              <div className="text-center py-12">
                <BsTicketPerforatedFill className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">{t('userDashboard.noTickets')}</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Book a ticket from Find Business to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myTickets.map((ticket) => (
                  <div 
                    key={ticket._id} 
                    className="border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                            Ticket #{ticket.ticketNumber}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ticket.status === 'waiting' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            ticket.status === 'called' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            ticket.status === 'in-progress' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                            ticket.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            ticket.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {ticket.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Business: {ticket.businessId?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Queue: {ticket.queueId?.name || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Booked: {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          {new Date(ticket.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t dark:border-gray-600">
                      {ticket.queuePosition && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Position</p>
                          <p className="font-semibold text-gray-800 dark:text-white">#{ticket.queuePosition}</p>
                        </div>
                      )}
                      {ticket.estimatedWaitTime && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Est. Wait</p>
                          <p className="font-semibold text-gray-800 dark:text-white">{ticket.estimatedWaitTime} min</p>
                        </div>
                      )}
                      {ticket.serviceType && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Service</p>
                          <p className="font-semibold text-gray-800 dark:text-white">{ticket.serviceType}</p>
                        </div>
                      )}
                      {ticket.appointmentDate && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Appointment</p>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {new Date(ticket.appointmentDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {ticket.status === 'waiting' && (
                      <div className="mt-4 pt-4 border-t dark:border-gray-600">
                        <button 
                          onClick={async () => {
                            if (confirm('Are you sure you want to cancel this ticket?')) {
                              try {
                                const res = await fetch(`${API_URL}/api/v1/tickets/${ticket._id}/cancel`, {
                                  method: 'PUT',
                                  credentials: 'include',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ reason: 'User cancelled' })
                                });
                                if (res.ok) {
                                  setMyTickets(prev => prev.map(t => 
                                    t._id === ticket._id ? { ...t, status: 'cancelled' } : t
                                  ));
                                }
                              } catch (error) {
                                console.error('Error cancelling ticket:', error);
                              }
                            }
                          }}
                          className="w-full md:w-auto px-6 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        >
                          {t('userDashboard.cancel')} Ticket
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {activeTab === "myProfile" && (
          <div className="bg-white dark:bg-[#2b2825] rounded-2xl shadow-sm p-6 md:p-8 transition-colors duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                👤 {t('userDashboard.tabs.profile')}
              </h2>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {isDisabled === true && (
                  <button onClick={handleEditProfile} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#359487] dark:bg-[#C6FE02] text-white dark:text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#2a8074] dark:hover:bg-[#a7d404] transition-colors">
                    <span><MdEdit size={22}/></span>
                    {t('userDashboard.editProfile')}
                  </button>
                )}
                <button onClick={handleDeleteAccount} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-6 py-3 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <span><MdDelete size={22}/></span>
                  {t('userDashboard.deleteAccount')}
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 pb-8 border-b dark:border-gray-600 text-center md:text-left">
              <div className="relative">
                <div className="w-32 h-32 bg-[#359487] dark:bg-[#C6FE02] rounded-full flex items-center justify-center text-white dark:text-black text-4xl font-bold">
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-[#359487] dark:bg-[#C6FE02] rounded-full flex items-center justify-center text-white dark:text-black hover:bg-[#2a8074] dark:hover:bg-[#a7d404] transition-colors">
                  <IoCamera/>
                </button>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{userData?.name || 'Loading...'}</h3>
                <p className="text-gray-600 dark:text-gray-400">Patient Account</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Member since {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                   <span className=""><FaUser/></span>
                   Name
                </label>
                <input
                  type="text"
                  value={userData?.name || ''}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#221F1B] text-gray-800 dark:text-white focus:outline-none"
                  disabled={isDisabled}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                   <span className=""><MdEmail/></span>
                   Email
                </label>
                <input
                  type="email"
                  value={userData?.email || ''}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#221F1B] text-gray-800 dark:text-white focus:outline-none"
                  disabled={isDisabled}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                   <span className=""><FaPhone/></span>
                   Phone
                </label>
                <input
                  type="tel"
                  value={userData?.phone || 'Not provided'}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#221F1B] text-gray-800 dark:text-white focus:outline-none"
                  disabled={isDisabled}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                   <span className=""><MdAccountBalance/></span>
                   Account Type
                </label>
                <input
                  type="text"
                  value={userData?.type || 'customer'}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#221F1B] text-gray-800 dark:text-white focus:outline-none capitalize"
                  disabled={isDisabled}
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                   <span className=""><MdCheck size={22} color="green"/></span>
                   Email Verified
                </label>
                <input
                  type="text"
                  value={userData?.isEmailVerified ? 'Verified' : 'Not Verified'}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-[#221F1B] text-gray-800 dark:text-white focus:outline-none"
                  disabled={isDisabled}
                />
              </div>
            </div>
            {isDisabled === false && (
              <div className="flex justify-end">
                <button
                  onClick={handleSaveEdit}
                  className="mt-5 w-1/4 flex items-center justify-center gap-2 bg-[#359487] dark:bg-[#C6FE02] text-white dark:text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#2a8074] dark:hover:bg-[#a7d404] transition-colors"
                >
                  <span><MdSave size={22}/></span>
                  {t('userDashboard.saveChanges')}
                </button>
              </div>
            )}
          </div>
          )}

          {/* Reviews Section */}
          {activeTab === "reviews" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  {t('userDashboard.reviews.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('userDashboard.reviews.subtitle')}
                </p>
              </div>

              {loadingReviews ? (
                <div className="bg-white dark:bg-[#2b2825] rounded-2xl p-8 shadow-sm">
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359487] dark:border-[#C6FE02] mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reviews...</p>
                  </div>
                </div>
              ) : myReviews.length === 0 ? (
                <div className="bg-white dark:bg-[#2b2825] rounded-2xl p-8 shadow-sm">
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-5xl">⭐</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      {t('userDashboard.reviews.noReviews')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {t('userDashboard.reviews.subtitle')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReviews.map((review) => (
                    <div key={review._id} className="bg-white dark:bg-[#2b2825] rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                            {review.businessId?.name || 'Business'}
                          </h3>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                ⭐
                              </span>
                            ))}
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              {review.rating}/5
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Appointments Section - Using Tickets Data */}
          {activeTab === "appointments" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  {t('userDashboard.appointments.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('userDashboard.appointments.subtitle')}
                </p>
              </div>

              {loadingTickets ? (
                <div className="bg-white dark:bg-[#2b2825] rounded-2xl p-8 shadow-sm">
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359487] dark:border-[#C6FE02] mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading appointments...</p>
                  </div>
                </div>
              ) : myTickets.length === 0 ? (
                <div className="bg-white dark:bg-[#2b2825] rounded-2xl p-8 shadow-sm">
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-5xl">📅</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      {t('userDashboard.appointments.noAppointments')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('userDashboard.appointments.subtitle')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTickets.map((ticket) => (
                    <div key={ticket._id} className="bg-white dark:bg-[#2b2825] rounded-2xl p-6 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                            {ticket.businessId?.name || 'Business'}
                          </h3>
                          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <p className="flex items-center gap-2">
                              <FaCalendarAlt className="text-[#359487] dark:text-[#C6FE02]" />
                              {new Date(ticket.createdAt).toLocaleString()}
                            </p>
                            <p>Queue: {ticket.queueId?.name || 'N/A'}</p>
                            <p>Position: #{ticket.position}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ticket.status === 'served' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            ticket.status === 'called' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            ticket.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payments Section */}
          {activeTab === "payments" && (
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  {t('userDashboard.payments.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('userDashboard.payments.subtitle')}
                </p>
              </div>

              {loadingPayments ? (
                <div className="bg-white dark:bg-[#2b2825] rounded-2xl p-8 shadow-sm">
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#359487] dark:border-[#C6FE02] mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payments...</p>
                  </div>
                </div>
              ) : myPayments.length === 0 ? (
                <div className="bg-white dark:bg-[#2b2825] rounded-2xl p-8 shadow-sm">
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-5xl">💳</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      {t('userDashboard.payments.noPayments')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('userDashboard.payments.subtitle')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#2b2825] rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-[#221F1B]">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            {t('userDashboard.payments.transactionId')}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            {t('userDashboard.payments.business')}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            {t('userDashboard.payments.amount')}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            {t('userDashboard.payments.date')}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            {t('userDashboard.payments.status')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {myPayments.map((payment) => (
                          <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-[#221F1B] transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-300 font-mono">
                              {payment.transactionId || payment._id.slice(-8)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-300">
                              {payment.businessId?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-gray-300">
                              ${(payment.amount / 100).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                payment.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                payment.status === 'refunded' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* <div className="hidden fixed inset-0 bg-black/50 items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#2b2825] rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🗑️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Delete Account?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div> */}
    </div>
  </>
  </ProtectedRoute>
  );
}


