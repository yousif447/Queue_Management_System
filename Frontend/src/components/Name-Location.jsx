import React from 'react';
import { Spinner } from "flowbite-react";
import { CiLocationOn } from 'react-icons/ci';

const NameLocation = async ({index}) => {
    const res = await fetch('http://localhost:3001/data', {cache: 'no-store'});
    const data = await res.json();
    if(data.length === 0) return <Spinner color="success" aria-label="Success spinner example" />
    
    return (
        <div className=''>
            <h3 className='text-[20px] font-semibold text-gray-900 dark:text-white'>
                {data[index].businessName}
            </h3>
            <p className='flex items-center text-gray-600 dark:text-gray-400 text-sm mt-1'>
                <span className='me-1 text-base'>
                    <CiLocationOn />
                </span>
                {data[index].location}
            </p>
        </div>
    );
}

export default NameLocation;

