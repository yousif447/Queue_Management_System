"use client";
import { API_URL } from '@/lib/api';

import UserProfilePhoto from '@/components/UserProfilePhoto';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Shield, CheckCircle, Edit3, Save, Trash2, AlertTriangle } from 'lucide-react';

const SectionCard = ({ children }) => (
  <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-lg dark:shadow-xl">{children}</div>
);

const InputField = ({ label, icon: Icon, disabled, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">{Icon && <Icon size={14} />}{label}</label>
    <input {...props} disabled={disabled}
      className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${disabled ? 'opacity-50 bg-gray-100 dark:bg-gray-900 cursor-not-allowed' : ''}`} />
  </div>
);

export default function MyProfileTab({ t, userData, isDisabled, handleEditProfile, handleDeleteAccount, handleSaveEdit, refreshUserData }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', type: '', isEmailVerified: false });

  useEffect(() => {
    if (userData) setFormData({ name: userData.name || '', email: userData.email || '', phone: userData.phone || '', type: userData.type || 'customer', isEmailVerified: userData.isEmailVerified || false });
  }, [userData]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ name: formData.name, phone: formData.phone }),
      });
      const data = await response.json();
      if (response.ok) { toast.success(t('userDashboard.messages.profileUpdated')); if (refreshUserData) await refreshUserData(); handleSaveEdit(); }
      else toast.error(data.message || t('userDashboard.messages.profileUpdateFailed'));
    } catch (error) { toast.error(t('userDashboard.messages.profileUpdateFailed')); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <User className="text-emerald-500" /> {t('userDashboard.tabs.profile')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('userDashboard.profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card & Actions */}
        <div className="lg:col-span-1 space-y-6">
           <SectionCard>
             <div className="flex flex-col items-center text-center p-2">
               <div className="relative group">
                 <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all opacity-50"></div>
                 <UserProfilePhoto userData={userData} isDisabled={isDisabled} onPhotoUpdated={refreshUserData} />
               </div>
               
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-1">{userData?.name || 'User Name'}</h2>
               <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">{userData?.email || 'email@example.com'}</p>
               


               <div className="w-full space-y-3 pt-6 border-t border-gray-100 dark:border-gray-700/50">
                 {isDisabled ? (
                   <button onClick={handleEditProfile} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold hover:bg-emerald-600 dark:hover:bg-emerald-500 dark:hover:text-white transition-all shadow-lg hover:shadow-xl active:scale-[0.98]">
                     <Edit3 size={18} />{t('userDashboard.editProfile')}
                   </button>
                 ) : (
                    <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3.5 rounded-xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]">
                      <Save size={18} />{t('userDashboard.saveChanges')}
                    </button>
                 )}
                 <button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-[0.98]">
                   <Trash2 size={18} />{t('userDashboard.deleteAccount')}
                 </button>
               </div>
             </div>
           </SectionCard>
        </div>

        {/* Right Column: Details Form */}
        <div className="lg:col-span-2">
           <SectionCard>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                 <Shield className="text-emerald-500" size={24} /> {t('userDashboard.profile.accountDetails')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label={t('userDashboard.profile.fullName')} icon={User} type="text" name="name" value={formData.name} onChange={handleChange} disabled={isDisabled} placeholder={t('userDashboard.profile.enterFullName')} />
                <InputField label={t('userDashboard.profile.emailAddress')} icon={Mail} type="email" name="email" value={formData.email} disabled={true} className="opacity-60" />
                <InputField label={t('userDashboard.profile.phoneNumber')} icon={Phone} type="tel" name="phone" value={formData.phone} onChange={handleChange} disabled={isDisabled} placeholder="+1 (555) 000-0000" />

              </div>
              

           </SectionCard>
        </div>
      </div>
    </div>
  );
}



