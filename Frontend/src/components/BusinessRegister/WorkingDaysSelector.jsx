"use client";
import { Label } from "@/components/ui/label";

export default function WorkingDaysSelector({ selectedDays, onDayChange, t }) {
  const days = [
    { key: 'Saturday', label: t('register.business.saturday') },
    { key: 'Sunday', label: t('register.business.sunday') },
    { key: 'Monday', label: t('register.business.monday') },
    { key: 'Tuesday', label: t('register.business.tuesday') },
    { key: 'Wednesday', label: t('register.business.wednesday') },
    { key: 'Thursday', label: t('register.business.thursday') },
    { key: 'Friday', label: t('register.business.friday') }
  ];

  return (
    <div className="grid gap-4 mb-4">
      <Label>{t('register.business.workingDays')}</Label>
      <div className="grid grid-cols-2 gap-2">
        {days.map((day) => (
          <label key={day.key} className="flex items-center gap-2 cursor-pointer p-3 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <input
              type="checkbox"
              checked={selectedDays.includes(day.key)}
              onChange={() => onDayChange(day.key)}
              className="w-4 h-4 text-emerald-500 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{day.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}


