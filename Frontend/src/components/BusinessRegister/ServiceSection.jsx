"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, Plus, Trash2 } from 'lucide-react';

export default function ServiceSection({ services = [], onServicesChange, t }) {
  // Default empty service template
  const emptyService = { name: '', description: '', price: '', duration: '' };
  
  // Initialize with at least one service
  const servicesList = services.length > 0 ? services : [emptyService];

  const addService = () => {
    onServicesChange([...servicesList, emptyService]);
  };

  const removeService = (index) => {
    if (servicesList.length > 1) {
      onServicesChange(servicesList.filter((_, i) => i !== index));
    }
  };

  const updateService = (index, field, value) => {
    const updated = servicesList.map((service, i) => 
      i === index ? { ...service, [field]: value } : service
    );
    onServicesChange(updated);
  };

  return (
    <div className="border-t pt-6 mt-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Briefcase size={20} className="text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{t('register.business.serviceInfo')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('register.business.addAtLeastOne') || 'Add at least one service'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={addService}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium text-sm hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
        >
          <Plus size={18} />
          {t('register.business.addService') || 'Add Service'}
        </button>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {servicesList.map((service, index) => (
          <div 
            key={index} 
            className="relative bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 transition-all hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg"
          >
            {/* Service Number Badge */}
            <div className="absolute -top-3 -left-2 w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
              {index + 1}
            </div>

            {/* Remove Button */}
            {servicesList.length > 1 && (
              <button
                type="button"
                onClick={() => removeService(index)}
                className="absolute -top-3 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center text-white shadow-md transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}

            {/* Service Fields - 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {/* Service Name */}
              <div className="md:col-span-2">
                <Label htmlFor={`serviceName-${index}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {t('register.business.serviceName')} *
                </Label>
                <Input
                  type="text"
                  onChange={(e) => updateService(index, 'name', e.target.value)}
                  value={service.name}
                  name={`serviceName-${index}`}
                  id={`serviceName-${index}`}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('register.business.serviceNamePlaceholder')}
                  required={index === 0}
                />
              </div>

              {/* Service Description */}
              <div className="md:col-span-2">
                <Label htmlFor={`serviceDesc-${index}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {t('register.business.serviceDescription')} *
                </Label>
                <textarea
                  onChange={(e) => updateService(index, 'description', e.target.value)}
                  value={service.description}
                  name={`serviceDesc-${index}`}
                  id={`serviceDesc-${index}`}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all min-h-[80px] resize-none"
                  placeholder={t('register.business.serviceDescriptionPlaceholder')}
                  required={index === 0}
                />
              </div>

              {/* Price */}
              <div>
                <Label htmlFor={`servicePrice-${index}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {t('register.business.servicePrice')} ($) *
                </Label>
                <Input
                  type="number"
                  onChange={(e) => updateService(index, 'price', e.target.value)}
                  value={service.price}
                  name={`servicePrice-${index}`}
                  id={`servicePrice-${index}`}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('register.business.servicePricePlaceholder')}
                  min="0"
                  step="0.01"
                  required={index === 0}
                />
              </div>

              {/* Duration */}
              <div>
                <Label htmlFor={`serviceDuration-${index}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {t('register.business.serviceDuration')} (min) *
                </Label>
                <Input
                  type="number"
                  onChange={(e) => updateService(index, 'duration', e.target.value)}
                  value={service.duration}
                  name={`serviceDuration-${index}`}
                  id={`serviceDuration-${index}`}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={t('register.business.serviceDurationPlaceholder')}
                  min="1"
                  required={index === 0}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add More Services Button (Bottom) */}
      {servicesList.length > 0 && (
        <button
          type="button"
          onClick={addService}
          className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={18} />
          {t('register.business.addAnotherService') || 'Add Another Service'}
        </button>
      )}
    </div>
  );
}
