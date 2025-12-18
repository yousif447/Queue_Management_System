"use client";
import FormField from '@/components/BusinessRegister/FormField';
import QueueSettingsSection from '@/components/BusinessRegister/QueueSettingsSection';
import ServiceSection from '@/components/BusinessRegister/ServiceSection';
import WorkingTimeSection from '@/components/BusinessRegister/WorkingTimeSection';
import ProfilePhotoUpload from '@/components/ProfilePhotoUpload';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { useTranslations } from '@/hooks/useTranslations';
import { API_URL, authFetch } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaBriefcase, FaCreditCard, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import { IoPersonOutline } from "react-icons/io5";
import { MdOutlineMailLock } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";

export default function Page() {
  const router = useRouter();
  const { t } = useTranslations();
  const API = `${API_URL}/api/v1/auth/register-business`;
  
  const [business, setBusiness] = useState({
    name: '',
    email: '',
    password: '',
    mobilePhone: '',
    landlinePhone: '',
    address: '',
    paymentMethod: [],
    specialization: '',
    profileImage: '',
    businessImages: '',
    workingHours: { days: [], openTime: '', closeTime: ''},
    service: { name: '', description: '', price: '', duration: ''},
    queueSettings: { maxPatientsPerDay: '', lastTimeToAppoint: ''}
  });

  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle working hours nested fields
    if (name === 'openTime' || name === 'closeTime') {
      setBusiness({
        ...business,
        workingHours: { ...business.workingHours, [name]: value }
      });
    }
    // Handle service nested fields
    else if (name === 'serviceName' || name === 'serviceDescription' || name === 'servicePrice' || name === 'serviceDuration') {
      const fieldName = name.replace('service', '').charAt(0).toLowerCase() + name.replace('service', '').slice(1);
      setBusiness({
        ...business,
        service: { ...business.service, [fieldName]: value }
      });
    }
    // Handle queue settings nested fields
    else if (name === 'maxPatientsPerDay' || name === 'lastAppointmentTime') {
      const fieldName = name === 'lastAppointmentTime' ? 'lastTimeToAppoint' : name;
      setBusiness({
        ...business,
        queueSettings: { ...business.queueSettings, [fieldName]: value }
      });
    }
    // Handle regular fields
    else {
      setBusiness({...business, [name]: value});
    }
  };

  // Handle checkbox for working days
  const handleDayChange = (day) => {
    const currentDays = business.workingHours.days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    setBusiness({
      ...business,
      workingHours: { ...business.workingHours, days: newDays }
    });
  };

  // Handle payment method checkbox
  const handlePaymentMethodChange = (method) => {
    const currentMethods = business.paymentMethod;
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter(m => m !== method)
      : [...currentMethods, method];
    
    setBusiness({
      ...business,
      paymentMethod: newMethods
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const businessData = {
        name: business.name,
        email: business.email,
        password: business.password,
        mobilePhone: business.mobilePhone,
        landlinePhone: business.landlinePhone,
        address: business.address,
        paymentMethod: business.paymentMethod.length > 0 ? business.paymentMethod : ['cash'],
      };

      // Add optional fields
      if (business.specialization) businessData.specialization = business.specialization;
      if (business.profileImage) businessData.profileImage = business.profileImage;
      if (business.businessImages) {
        businessData.businessImages = business.businessImages.split(',').map(url => url.trim());
      }

      // Format workingHours as array (schema expects array)
      if (business.workingHours && business.workingHours.days.length > 0) {
        businessData.workingHours = business.workingHours.days.map(day => ({
          days: day,
          openTime: business.workingHours.openTime,
          closeTime: business.workingHours.closeTime,
          isClosed: false
        }));
      }

      // Format service as array (schema expects array)
      if (business.service && business.service.name) {
        businessData.service = [{
          name: business.service.name,
          description: business.service.description,
          price: parseFloat(business.service.price) || 0,
          duration: parseInt(business.service.duration) || 0
        }];
      }

      // Format queueSettings as array (schema expects array)
      if (business.queueSettings && business.queueSettings.maxPatientsPerDay) {
        businessData.queueSettings = [{
          maxPatientsPerDay: parseInt(business.queueSettings.maxPatientsPerDay),
          LastTimeToAppoint: business.queueSettings.lastTimeToAppoint
        }];
      }

      console.log('Sending business data:', businessData);

      const res = await fetch(API, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(businessData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to register business");
      }

      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }

      console.log('Business registered:', data);

      // Upload profile photo if selected
      if (profilePhotoFile) {
        try {
          const formData = new FormData();
          formData.append('profileImage', profilePhotoFile);

          const uploadRes = await authFetch(`${API_URL}/api/v1/businesses/upload-profile-photo`, {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            toast.success('Profile photo uploaded successfully');
          }
        } catch (uploadErr) {
          console.error('Photo upload error:', uploadErr);
          toast.error('Business registered but photo upload failed');
        }
      }

      toast.success('Business registered successfully! Please select a plan.');
      router.push('/select-plan');
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to register business');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center p-16">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8">
            <FaBriefcase size={36} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">{t('register.business.heroTitle')}</h1>
          <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-md">
            {t('register.business.heroSubtitle')}
          </p>
          <div className="space-y-3">
            {[t('register.business.benefits.reduceWait'), t('register.business.benefits.satisfaction'), t('register.business.benefits.revenue')].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-2 h-2 rounded-full bg-white" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col bg-gray-50 dark:bg-gray-950 px-6 py-12 lg:px-16 overflow-y-auto max-h-screen">
        <div className="max-w-xl mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('register.business.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('register.business.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

        <form onSubmit={handleRegister}>
          {/* Profile Photo Upload */}
          <div className="mb-6">
            <Label className="text-base font-semibold mb-3 block text-center">{t('register.business.profilePhoto')}</Label>
            <ProfilePhotoUpload
              currentImage={business.profileImage}
              onImageChange={(file) => setProfilePhotoFile(file)}
              size="large"
            />
          </div>

          <FormField
            icon={IoPersonOutline}
            label={t('register.business.businessName')}
            id="name"
            name="name"
            value={business.name}
            onChange={handleChange}
            placeholder={t('register.business.businessNamePlaceholder')}
            required
          />

          <FormField
            icon={MdOutlineMailLock}
            label={t('register.business.businessEmail')}
            id="email"
            name="email"
            type="email"
            value={business.email}
            onChange={handleChange}
            placeholder={t('register.business.emailPlaceholder')}
            required
          />

          <FormField
            icon={RiLockPasswordLine}
            label={t('register.business.password')}
            id="password"
            name="password"
            type="password"
            value={business.password}
            onChange={handleChange}
            placeholder={t('register.business.passwordPlaceholder')}
            required
          />

          <FormField
            icon={FaPhone}
            label={t('register.business.mobilePhone')}
            id="mobilePhone"
            name="mobilePhone"
            type="tel"
            value={business.mobilePhone}
            onChange={handleChange}
            placeholder={t('register.business.mobilePhonePlaceholder')}
            pattern="[0-9]{11}"
            required
          />

          <FormField
            icon={FaPhone}
            label={t('register.business.landlinePhone')}
            id="landlinePhone"
            name="landlinePhone"
            type="tel"
            value={business.landlinePhone}
            onChange={handleChange}
            placeholder={t('register.business.landlinePhonePlaceholder')}
            pattern="[0-9]{8}"
            required
          />

          <FormField
            icon={FaMapMarkerAlt}
            label={t('register.business.address')}
            id="address"
            name="address"
            value={business.address}
            onChange={handleChange}
            placeholder={t('register.business.addressPlaceholder')}
            required
          />

          <div className="grid gap-4 mb-4">
            <Label className="flex items-center gap-2 mb-2">
              <FaCreditCard />
              {t('register.business.paymentMethod')}
            </Label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={business.paymentMethod.includes('cash')}
                  onChange={() => handlePaymentMethodChange('cash')}
                  className="w-4 h-4 text-emerald-500 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('register.business.cash')}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={business.paymentMethod.includes('card')}
                  onChange={() => handlePaymentMethodChange('card')}
                  className="w-4 h-4 text-emerald-500 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('register.business.cardStripe')}</span>
              </label>
            </div>
          </div>

          <div className="grid gap-4 mb-4">
            <Label htmlFor="specialization" className="flex items-center gap-2">
              <FaBriefcase />
              {t('register.business.specialization')} *
            </Label>
            <select
              id="specialization"
              name="specialization"
              value={business.specialization}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
              required
            >
              <option value="">{t('register.business.specializations.select')}</option>
              <option value="Medical">{t('register.business.specializations.medical')}</option>
              <option value="Healthcare">{t('register.business.specializations.healthcare')}</option>
              <option value="Banking">{t('register.business.specializations.banking')}</option>
              <option value="Finance">{t('register.business.specializations.finance')}</option>
              <option value="Telecom">{t('register.business.specializations.telecom')}</option>
              <option value="Government">{t('register.business.specializations.government')}</option>
              <option value="Education">{t('register.business.specializations.education')}</option>
              <option value="Restaurant">{t('register.business.specializations.restaurant')}</option>
              <option value="Retail">{t('register.business.specializations.retail')}</option>
              <option value="Technology">{t('register.business.specializations.technology')}</option>
              <option value="Automotive">{t('register.business.specializations.automotive')}</option>
              <option value="Real Estate">{t('register.business.specializations.realEstate')}</option>
              <option value="Legal">{t('register.business.specializations.legal')}</option>
              <option value="Consulting">{t('register.business.specializations.consulting')}</option>
              <option value="Entertainment">{t('register.business.specializations.entertainment')}</option>
              <option value="Fitness">{t('register.business.specializations.fitness')}</option>
              <option value="Beauty">{t('register.business.specializations.beauty')}</option>
              <option value="Travel">{t('register.business.specializations.travel')}</option>
              <option value="Insurance">{t('register.business.specializations.insurance')}</option>
              <option value="Logistics">{t('register.business.specializations.logistics')}</option>
            </select>
          </div>

            <WorkingTimeSection
              workingHours={business.workingHours}
              onChange={handleChange}
              onDayChange={handleDayChange}
              t={t}
            />

            <ServiceSection
              service={business.service}
              onChange={handleChange}
              t={t}
            />


          <QueueSettingsSection
            queueSettings={business.queueSettings}
            onChange={handleChange}
            t={t}
          />

          <Button type="submit" className="w-full my-3" disabled={loading}>
            {loading ? t('register.business.creatingAccount') : t('register.business.createBusinessAccount')}
          </Button>

          <div className="text-center mt-8">
            <p className="text-gray-600 dark:text-gray-400">
              {t('register.business.alreadyHaveAccount')}
              <Link className='font-bold text-emerald-600 dark:text-emerald-400 hover:underline ml-1' href="/login">
                {t('register.business.signIn')}
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}



