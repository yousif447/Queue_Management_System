"use client";
import { API_URL, authFetch } from '@/lib/api';

import DashboardTab from '@/components/BusinessDashboard/DashboardTab';
import PatientsTab from '@/components/BusinessDashboard/PatientsTab';
import PaymentsTab from '@/components/BusinessDashboard/PaymentsTab';
import ProfileTab from '@/components/BusinessDashboard/ProfileTab';
import ReviewsTab from '@/components/BusinessDashboard/ReviewsTab';
import Sidebar from '@/components/BusinessDashboard/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import RequirePayment from '@/components/RequirePayment';
import { useTranslations } from '@/hooks/useTranslations';
import { Button, Modal, ModalBody, ModalHeader } from "flowbite-react";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaBars, FaChartLine, FaCreditCard, FaTimes, FaUser, FaUsers } from "react-icons/fa";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { MdReviews } from 'react-icons/md';
import { SiGoogleanalytics } from "react-icons/si";
const AnalyticsTab = dynamic(() => import('@/components/BusinessDashboard/AnalyticsTab'), { ssr: false });

export default function ClinicDashboard() {
  const { t } = useTranslations();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDisabled, setIsDisabled] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const navItems = [
    { id: "dashboard", label: t('businessDashboard.nav.dashboard'), icon: <SiGoogleanalytics /> },
    { id: "analytics", label: t('businessDashboard.nav.analytics'), icon: <FaChartLine />, requiresPlan: 'enterprise' },
    { id: "patients", label: t('businessDashboard.nav.customers'), icon: <FaUsers />, requiresPlan: 'pro' },
    { id: "payments", label: t('businessDashboard.nav.payments'), icon: <FaCreditCard />, requiresPlan: 'pro' },
    { id: "reviews", label: t('businessDashboard.nav.reviews'), icon: <MdReviews />, requiresPlan: 'pro' },
    { id: "profile", label: t('businessDashboard.nav.profile'), icon: <FaUser /> },
  ];

  // Get current plan (treat trial as basic)
  let currentPlan = businessData?.subscription?.plan || 'basic';
  if (currentPlan === 'trial') currentPlan = 'basic';
  
  // Filter nav items based on plan
  const filteredNavItems = navItems.filter(item => {
    if (!item.requiresPlan) return true; // Always show items without requirements
    
    // Show pro features to pro and enterprise users
    if (item.requiresPlan === 'pro') {
      return currentPlan === 'pro' || currentPlan === 'enterprise';
    }
    
    // Show enterprise features only to enterprise users
    if (item.requiresPlan === 'enterprise') {
      return currentPlan === 'enterprise';
    }
    
    return true;
  });

  // Handle tab change with plan check
  const handleTabChange = (tabId) => {
    const tab = navItems.find(item => item.id === tabId);
    
    // Check if tab requires upgrade
    if (tab?.requiresPlan) {
      if (tab.requiresPlan === 'pro' && currentPlan === 'basic') {
        toast.error(t('businessDashboard.upgradeRequired.pro'), {
          duration: 4000,
          icon: '🔒',
        });
        return;
      }
      
      if (tab.requiresPlan === 'enterprise' && (currentPlan === 'basic' || currentPlan === 'pro')) {
        toast.error(t('businessDashboard.upgradeRequired.enterprise'), {
          duration: 4000,
          icon: '🔒',
        });
        return;
      }
    }
    
    setActiveTab(tabId);
  };

  const handleEditProfile = () => {
    setIsDisabled(false);
  }

  const handleCancelEdit = () => {
    setIsDisabled(true);
    fetchBusinessData();
  }

  const handleSaveEdit = async (formData) => {
    try {
      const response = await authFetch(`${API_URL}/api/v1/businesses/${businessData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
        setIsDisabled(true);
        fetchBusinessData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Error updating profile');
    }
  }

  const handleDeleteAccount = () => {
    setOpenModal(true);
  }

  const confirmDeleteAccount = async () => {
    try {
      const response = await authFetch(`${API_URL}/api/v1/businesses/business/${businessData._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        setOpenModal(false);
        
        // Logout and redirect to home
        await authFetch(`${API_URL}/api/v1/auth/logout`, {
          method: 'POST',
        });
        
        window.location.href = '/';
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Error deleting account');
    }
  }

  // Fetch business data
  const fetchBusinessData = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/v1/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setBusinessData(data.data);
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessData();
  }, []);

  return (
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
                    <Button className="bg-red-500 hover:bg-red-600" onClick={confirmDeleteAccount}>
                      {t('userDashboard.confirm')}
                    </Button>
                    <Button className="bg-gray-200 hover:bg-gray-300 text-gray-800" onClick={() => setOpenModal(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              </ModalBody>
          </div>
        </Modal>
      )}
      <ProtectedRoute allowedRoles={['business']}>
        <RequirePayment>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white dark:bg-gray-900 p-4 flex justify-between items-center shadow-sm sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('businessDashboard.nav.dashboard')}</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-white">
            {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        <div className="flex relative">
          {/* Sidebar Component */}
          <Sidebar 
            t={t}
            navItems={filteredNavItems}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            businessData={businessData}
          />

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
            {activeTab === "dashboard" && <DashboardTab businessData={businessData} />}
            {activeTab === "analytics" && <AnalyticsTab businessData={businessData} />}


            {activeTab === "patients" && <PatientsTab businessId={businessData?._id} currentPlan={businessData?.subscription?.plan} />}



            {activeTab === "payments" && <PaymentsTab businessId={businessData?._id} currentPlan={businessData?.subscription?.plan} />}


            {activeTab === "reviews" && <ReviewsTab businessId={businessData?._id} />}

            {activeTab === "profile" && (
              <ProfileTab 
                businessData={businessData}
                isDisabled={isDisabled}
                handleEditProfile={handleEditProfile}
                handleCancelEdit={handleCancelEdit}
                handleDeleteAccount={handleDeleteAccount}
                handleSaveEdit={handleSaveEdit}
                refreshBusinessData={fetchBusinessData}
              />
            )}
          </main>
        </div>
      </div>
      </RequirePayment>
      </ProtectedRoute>
    </>
  );
}



