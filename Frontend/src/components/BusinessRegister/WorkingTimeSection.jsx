"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from 'lucide-react';

export default function WorkingTimeSection({ workingHours, onChange, onDayChange, t }) {
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
    <div className="border-t pt-6 mt-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Clock size={20} className="text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{t('register.business.workingTime')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('register.business.setSchedule') || 'Set your business schedule'}</p>
        </div>
      </div>

      {/* Working Days Section */}
      <div className="bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-600">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-indigo-500" />
          <Label className="text-sm font-semibold text-gray-900 dark:text-white">{t('register.business.workingDays')}</Label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {days.map((day) => (
            <label 
              key={day.key} 
              className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all ${
                workingHours.days.includes(day.key)
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-400 dark:border-indigo-500'
                  : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={workingHours.days.includes(day.key)}
                onChange={() => onDayChange(day.key)}
                className="w-4 h-4 text-indigo-500 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
              />
              <span className={`text-sm font-medium ${
                workingHours.days.includes(day.key)
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>{day.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Time Inputs Card */}
      <div className="bg-white dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 transition-all hover:border-indigo-300 dark:hover:border-indigo-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Open Time */}
          <div>
            <Label htmlFor="openTime" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t('register.business.openTime')} *
            </Label>
            <Input
              type="time"
              onChange={onChange}
              value={workingHours.openTime}
              name="openTime"
              id="openTime"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Close Time */}
          <div>
            <Label htmlFor="closeTime" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t('register.business.closeTime')} *
            </Label>
            <Input
              type="time"
              onChange={onChange}
              value={workingHours.closeTime}
              name="closeTime"
              id="closeTime"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Last Appointment Time */}
          <div>
            <Label htmlFor="lastAppointmentTime" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t('register.business.lastAppointmentTime')}
            </Label>
            <Input
              type="time"
              onChange={onChange}
              value={workingHours.lastTimeToAppoint || ''}
              name="lastAppointmentTime"
              id="lastAppointmentTime"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
