"use client";
import { Label } from "@/components/ui/label";
import FormField from './FormField';

export default function ServiceSection({ service, onChange, t }) {
  return (
    <div className="border-t pt-4 mt-4">
      <p className="text-lg font-semibold mb-4 text-[#29b7a4]">{t('register.business.serviceInfo')}</p>

      <FormField
        label={t('register.business.serviceName')}
        id="serviceName"
        name="serviceName"
        value={service.name}
        onChange={onChange}
        placeholder={t('register.business.serviceNamePlaceholder')}
      />

      <div className="grid gap-4 mb-4">
        <Label htmlFor="serviceDescription">
          {t('register.business.serviceDescription')}
        </Label>
        <textarea
          onChange={onChange}
          value={service.description}
          name="serviceDescription"
          className="bg-white dark:bg-[#37332f] border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm min-h-[80px]"
          id="serviceDescription"
          placeholder={t('register.business.serviceDescriptionPlaceholder')}
        />
      </div>

      <FormField
        label={t('register.business.servicePrice')}
        id="servicePrice"
        name="servicePrice"
        type="number"
        value={service.price}
        onChange={onChange}
        placeholder={t('register.business.servicePricePlaceholder')}
      />

      <FormField
        label={t('register.business.serviceDuration')}
        id="serviceDuration"
        name="serviceDuration"
        type="number"
        value={service.duration}
        onChange={onChange}
        placeholder={t('register.business.serviceDurationPlaceholder')}
      />
    </div>
  );
}


