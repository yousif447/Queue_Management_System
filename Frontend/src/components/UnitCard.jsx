import React from 'react'

export default function UnitCard({ icon, title, value }) {
  return (
    <div className="w-[45%] md:w-1/5 gap-6 mb-8">
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {value}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <span className="text-xl">{icon}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            ↑ 12%
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">vs last month</span>
        </div>
      </div>
    </div>
  )
}


