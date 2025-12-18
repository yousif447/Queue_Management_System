"use client";

import { useTranslations } from "@/hooks/useTranslations";
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdEdit, MdSave } from 'react-icons/md';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Building2, Mail, Phone, MapPin, Clock, DollarSign, Briefcase, Settings, AlertTriangle, CreditCard, Banknote } from 'lucide-react';
import BusinessProfilePhoto from '../BusinessProfilePhoto';

const SectionCard = ({ title, icon: Icon, children, className = "" }) => (
  <div className={`bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-lg dark:shadow-xl ${className}`}>
    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
      {Icon && (<span className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl"><Icon className="text-emerald-600 dark:text-emerald-400" size={20} /></span>)}
      {title}
    </h2>
    {children}
  </div>
);

const InputField = ({ label, icon: Icon, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">{Icon && <Icon size={14} />}{label}</label>
    <input {...props} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-900 transition-all" />
  </div>
);

export default function ProfileTab({ businessData, isDisabled, handleEditProfile, handleCancelEdit, handleDeleteAccount, handleSaveEdit, refreshBusinessData }) {
  const { t } = useTranslations();
  const [formData, setFormData] = useState({ name: '', email: '', mobilePhone: '', landlinePhone: '', address: '', paymentMethod: [], specialization: '', service: [], workingHours: [], queueSettings: [{ LastTimeToAppoint: '17:00', maxPatientsPerDay: 50 }] });

  useEffect(() => {
    if (businessData) {
      setFormData({
        name: businessData.name || '', email: businessData.email || '', mobilePhone: businessData.mobilePhone || '', landlinePhone: businessData.landlinePhone || '',
        address: businessData.address || '', paymentMethod: Array.isArray(businessData.paymentMethod) ? businessData.paymentMethod : (businessData.paymentMethod ? [businessData.paymentMethod] : []),
        specialization: businessData.specialization || '', service: businessData.service?.map(s => ({ ...s, description: s.description || '', duration: s.duration || 30 })) || [],
        workingHours: businessData.workingHours || [], queueSettings: (businessData.queueSettings?.length > 0) ? businessData.queueSettings : [{ LastTimeToAppoint: '17:00', maxPatientsPerDay: 50 }]
      });
    }
  }, [businessData]);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handlePaymentMethodChange = (method) => setFormData(prev => {
    const current = Array.isArray(prev.paymentMethod) ? prev.paymentMethod : [];
    return { ...prev, paymentMethod: current.includes(method) ? current.filter(m => m !== method) : [...current, method] };
  });
  const handleServiceChange = (index, field, value) => { const updated = [...formData.service]; updated[index] = { ...updated[index], [field]: value }; setFormData(prev => ({ ...prev, service: updated })); };
  const addService = () => setFormData(prev => ({ ...prev, service: [...prev.service, { name: '', description: '', price: '', duration: '' }] }));
  const removeService = (index) => setFormData(prev => ({ ...prev, service: prev.service.filter((_, i) => i !== index) }));
  const handleWorkingHoursChange = (index, field, value) => { const updated = [...formData.workingHours]; updated[index] = { ...updated[index], [field]: value }; setFormData(prev => ({ ...prev, workingHours: updated })); };
  const addWorkingHours = () => setFormData(prev => ({ ...prev, workingHours: [...prev.workingHours, { days: '', openTime: '', closeTime: '' }] }));
  const removeWorkingHours = (index) => setFormData(prev => ({ ...prev, workingHours: prev.workingHours.filter((_, i) => i !== index) }));
  const handleQueueSettingsChange = (field, value) => setFormData(prev => ({ ...prev, queueSettings: [{ ...prev.queueSettings[0], [field]: value }] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.service.some(s => !s.name || !s.price || !s.description || !s.duration)) { toast.error(t('businessDashboard.profile.fillServiceDetails')); return; }
    await handleSaveEdit(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('businessDashboard.profile.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('businessDashboard.profile.subtitle')}</p>
        </div>
        {isDisabled && (
          <button onClick={handleEditProfile} className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 font-semibold shadow-lg shadow-emerald-500/20">
            <MdEdit size={20} /> {t('businessDashboard.profile.editProfile')}
          </button>
        )}
      </div>

      <SectionCard title={t('businessDashboard.profile.profilePhoto')} icon={Building2}>
        <BusinessProfilePhoto businessData={businessData} isDisabled={isDisabled} onPhotoUpdated={refreshBusinessData} />
      </SectionCard>

      <SectionCard title={t('businessDashboard.profile.basicInfo')} icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label={t('businessDashboard.profile.businessName')} icon={Building2} type="text" name="name" value={formData.name} onChange={handleInputChange} disabled={isDisabled} />
          <InputField label={t('businessDashboard.profile.email')} icon={Mail} type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={isDisabled} />
          <InputField label={t('businessDashboard.profile.mobilePhone')} icon={Phone} type="tel" name="mobilePhone" value={formData.mobilePhone} onChange={handleInputChange} disabled={isDisabled} />
          <InputField label={t('businessDashboard.profile.landlinePhone')} icon={Phone} type="tel" name="landlinePhone" value={formData.landlinePhone} onChange={handleInputChange} disabled={isDisabled} />
          <div className="md:col-span-2"><InputField label={t('businessDashboard.profile.address')} icon={MapPin} type="text" name="address" value={formData.address} onChange={handleInputChange} disabled={isDisabled} /></div>
          <InputField label={t('businessDashboard.profile.specialization')} icon={Briefcase} type="text" name="specialization" value={formData.specialization} onChange={handleInputChange} disabled={isDisabled} />
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2"><DollarSign size={14} />{t('businessDashboard.profile.paymentMethods')}</label>
            <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
              <label className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all ${formData.paymentMethod?.includes('cash') ? 'bg-emerald-100 dark:bg-emerald-500/20 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input type="checkbox" checked={formData.paymentMethod?.includes('cash')} onChange={() => handlePaymentMethodChange('cash')} disabled={isDisabled} className="hidden" />
                <Banknote size={18} /><span className="font-medium">{t('businessDashboard.profile.cash')}</span>
              </label>
              <label className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all ${formData.paymentMethod?.includes('card') ? 'bg-indigo-100 dark:bg-indigo-500/20 border-2 border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input type="checkbox" checked={formData.paymentMethod?.includes('card')} onChange={() => handlePaymentMethodChange('card')} disabled={isDisabled} className="hidden" />
                <CreditCard size={18} /><span className="font-medium">{t('businessDashboard.profile.card')}</span>
              </label>
            </div>
          </div>
        </div>
      </SectionCard>
      
      <SectionCard title={t('businessDashboard.profile.servicesPricing')} icon={DollarSign}>
        <div className="flex justify-end mb-4">
          {!isDisabled && (<button onClick={addService} className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-500/20"><FaPlus /> {t('businessDashboard.profile.addService')}</button>)}
        </div>
        <div className="space-y-4">
          {formData.service?.map((service, index) => (
            <div key={index} className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label={t('businessDashboard.profile.serviceName')} type="text" placeholder={t('businessDashboard.profile.servicePlaceholder')} value={service.name} onChange={(e) => handleServiceChange(index, 'name', e.target.value)} disabled={isDisabled} />
                <InputField label={t('businessDashboard.profile.price')} type="number" placeholder="0.00" value={service.price} onChange={(e) => handleServiceChange(index, 'price', e.target.value)} disabled={isDisabled} />
                <InputField label={t('businessDashboard.profile.description')} type="text" placeholder={t('businessDashboard.profile.descPlaceholder')} value={service.description || ''} onChange={(e) => handleServiceChange(index, 'description', e.target.value)} disabled={isDisabled} />
                <InputField label={t('businessDashboard.profile.duration')} type="number" placeholder="30" value={service.duration || ''} onChange={(e) => handleServiceChange(index, 'duration', e.target.value)} disabled={isDisabled} />
              </div>
              {!isDisabled && (<div className="flex justify-end"><button onClick={() => removeService(index)} className="text-red-500 hover:text-red-600 text-sm flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"><FaTrash size={12} /> {t('businessDashboard.profile.remove')}</button></div>)}
            </div>
          ))}
          {formData.service?.length === 0 && <p className="text-gray-500 text-center py-8">{t('businessDashboard.profile.noServices')}</p>}
        </div>
      </SectionCard>

      <SectionCard title={t('businessDashboard.profile.workingHours')} icon={Clock}>
        <div className="flex justify-end mb-4">
          {!isDisabled && (<button onClick={addWorkingHours} className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-emerald-500/20"><FaPlus /> {t('businessDashboard.profile.addHours')}</button>)}
        </div>
        <div className="space-y-3">
          {formData.workingHours?.length > 0 ? formData.workingHours.map((hours, index) => (
            <div key={index} className="flex flex-wrap gap-3 items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50">
              <select value={hours.days || ''} onChange={(e) => handleWorkingHoursChange(index, 'days', e.target.value)} disabled={isDisabled} className="flex-1 min-w-[150px] px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50">
                <option value="">{t('businessDashboard.profile.selectDay')}</option><option value="Monday">{t('businessDashboard.profile.days.Monday')}</option><option value="Tuesday">{t('businessDashboard.profile.days.Tuesday')}</option><option value="Wednesday">{t('businessDashboard.profile.days.Wednesday')}</option><option value="Thursday">{t('businessDashboard.profile.days.Thursday')}</option><option value="Friday">{t('businessDashboard.profile.days.Friday')}</option><option value="Saturday">{t('businessDashboard.profile.days.Saturday')}</option><option value="Sunday">{t('businessDashboard.profile.days.Sunday')}</option>
              </select>
              <input type="time" value={hours.openTime || ''} onChange={(e) => handleWorkingHoursChange(index, 'openTime', e.target.value)} disabled={isDisabled} className="w-32 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50" />
              <span className="text-gray-500">{t('businessDashboard.profile.to')}</span>
              <input type="time" value={hours.closeTime || ''} onChange={(e) => handleWorkingHoursChange(index, 'closeTime', e.target.value)} disabled={isDisabled} className="w-32 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50" />
              {!isDisabled && (<button onClick={() => removeWorkingHours(index)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"><FaTrash /></button>)}
            </div>
          )) : <p className="text-gray-500 text-center py-8">{t('businessDashboard.profile.noHours')}</p>}
        </div>
      </SectionCard>

      <SectionCard title={t('businessDashboard.profile.queueSettings')} icon={Settings}>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2"><Clock size={14} />{t('businessDashboard.profile.lastAppointment')}</label>
          <input type="time" value={formData.queueSettings?.[0]?.LastTimeToAppoint || ''} onChange={(e) => handleQueueSettingsChange('LastTimeToAppoint', e.target.value)} disabled={isDisabled} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50" />
          <p className="text-sm text-gray-500 mt-2">{t('businessDashboard.profile.lastAppointmentDesc')}</p>
        </div>
      </SectionCard>

      <div className="bg-gray-900 dark:bg-gray-950 rounded-2xl border border-red-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl"><AlertTriangle className="text-red-500" size={24} /></div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-red-500 mb-2">{t('businessDashboard.profile.dangerZone')}</h2>
            <p className="text-sm text-gray-400 mb-4">{t('businessDashboard.profile.deleteWarning')}</p>
            <button onClick={handleDeleteAccount} className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold shadow-lg shadow-red-500/20">{t('businessDashboard.profile.deleteAccount')}</button>
          </div>
        </div>
      </div>

      {!isDisabled && <div className="h-24"></div>}
      
      {!isDisabled && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700/50 shadow-2xl z-50 flex justify-end gap-4 lg:pl-72 transition-all duration-300">
          <button onClick={handleCancelEdit} className="px-6 py-3 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-700">{t('businessDashboard.profile.cancel')}</button>
          <button onClick={handleSubmit} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all flex items-center gap-2"><MdSave size={20} /> {t('businessDashboard.profile.saveChanges')}</button>
        </div>
      )}
    </div>
  );
}


