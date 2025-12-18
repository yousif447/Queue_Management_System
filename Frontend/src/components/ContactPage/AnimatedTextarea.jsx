"use client";

import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function AnimatedTextarea({ label, name, error, value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="relative">
      <label 
        className={`absolute left-4 transition-all duration-300 pointer-events-none z-10 ${
          isFocused || value 
            ? '-top-2.5 text-xs bg-white dark:bg-gray-900 px-2 text-emerald-600 dark:text-emerald-400 font-medium' 
            : 'top-4 text-gray-400 dark:text-gray-500'
        }`}
      >
        {label} *
      </label>
      <textarea
        name={name}
        rows={6}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full rounded-xl px-4 py-4 pt-5
          border-2 transition-all duration-300 resize-none
          bg-gray-50 dark:bg-gray-800
          ${error 
            ? 'border-red-500 dark:border-red-500' 
            : isFocused 
              ? 'border-emerald-500 dark:border-emerald-500 bg-white dark:bg-gray-900' 
              : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-500/50'
          }
          text-gray-900 dark:text-white
          focus:outline-none focus:ring-4 
          ${error 
            ? 'focus:ring-red-500/20' 
            : 'focus:ring-emerald-500/20'
          }
        `}
      />
      {error && (
        <span className="text-red-500 text-sm mt-2 flex items-center gap-1.5">
          <AlertCircle size={14} />
          {error}
        </span>
      )}
    </div>
  );
}


