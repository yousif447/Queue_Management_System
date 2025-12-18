import React from 'react'

export default function AboutCard2({ icon, title, value, h, w, titleSize }) {
  return (
    <>
        <div className={` ${w} bg-gray-100 dark:bg-gray-800/50 py-3 border flex flex-col justify-evenly items-start px-5 border-gray-200 dark:border-gray-700 rounded-xl ${h}`}>
                  {icon ? <span className='text-emerald-500 dark:text-emerald-400 text-[36px] py-4'>{icon}</span> : ""}
            <p className={`${titleSize}`}>{title}</p>
            <p className='text-gray-600 dark:text-gray-400 text-[18px]'>{value}</p>
        </div>
    </>
  )
}


