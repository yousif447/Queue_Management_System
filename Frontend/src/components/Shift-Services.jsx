import React from 'react';
import { Spinner } from "flowbite-react";
import { IoMdTime } from "react-icons/io";
import { v4 as uuid } from 'uuid';

const ShiftServices = async ({index}) => {
    const res = await fetch('http://localhost:3001/data', {cache: 'force-cache'});
    const data = await res.json();
    if(data.length === 0) return <Spinner color="success" aria-label="Success spinner example" />
    
    return (
        <div>
            <p className='flex items-center mb-3 text-gray-700 dark:text-gray-300 font-medium'>
                <span className='me-2 text-lg'>
                    <IoMdTime/>
                </span>
                {data[index].workingHours}
            </p>
            <div className='flex flex-wrap gap-2'>
                {data[index].services.map(s => (
                    <p 
                        className='border border-gray-300 dark:border-gray-600 py-1 px-3 rounded-2xl text-[14px] w-fit bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300' 
                        key={uuid()}
                    >
                        {s}
                    </p>
                ))}
            </div>
        </div>
    );
}

export default ShiftServices;

