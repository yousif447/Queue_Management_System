import React from 'react'

export default function AboutCard({ icon, title, value, fontSize, showBorder}) {
  return (
    <>
      <div className={`w-[48%] md:w-1/5 py-3 border flex flex-col justify-evenly items-center min-h-[120px] 
        px-5 bg-white dark:bg-gray-900 ${showBorder ? " border-gray-200 dark:border-gray-700" : "border-transparent"}
        rounded-xl shadow-sm hover:shadow-md transition-shadow`}>
            <span className={`text-emerald-500 dark:text-emerald-400 text-[48px] mb-2`}>{icon}</span>
            <p className={`${fontSize}`}>{value}</p>
            <p className='text-gray-600 dark:text-gray-400 text-center text-[13px]'>{title}</p>
        </div>
    </>
  )
}


