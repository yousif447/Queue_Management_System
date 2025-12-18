"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WorkingDaysSelector from './WorkingDaysSelector';

export default function WorkingTimeSection({ workingHours, onChange, onDayChange, t }) {
  return (
    <div className="border-t pt-4 mt-4">
      <p className="text-lg font-semibold mb-4 text-[#29b7a4]">{t('register.business.workingTime')}</p>

      <WorkingDaysSelector 
        selectedDays={workingHours.days} 
        onDayChange={onDayChange}
        t={t}
      />

      <div className="grid gap-4 mb-4">
        <Label htmlFor="openTime">{t('register.business.openTime')}</Label>
        <Input
          type="time"
          onChange={onChange}
          value={workingHours.openTime}
          name="openTime"
          className="bg-white dark:bg-[#37332f] border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm"
          id="openTime"
        />
      </div>

      <div className="grid gap-4 mb-4">
        <Label htmlFor="closeTime">{t('register.business.closeTime')}</Label>
        <Input
          type="time"
          onChange={onChange}
          value={workingHours.closeTime}
          name="closeTime"
          className="bg-white dark:bg-[#37332f] border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm"
          id="closeTime"
        />
      </div>
    </div>
  );
}


