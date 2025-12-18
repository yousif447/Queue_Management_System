import { API_URL } from '@/lib/api';
import { Spinner } from "flowbite-react";
import { LuUsers } from "react-icons/lu";

const Queue = async ({ index }) => {
    const res = await fetch(`${API_URL}/data`);
    const data = await res.json();
    if (data.length === 0) return <Spinner color="success" aria-label="Success spinner example" />
    
    return (
        <div>
            <div className='flex justify-between text-sm'>
                <p className='flex items-center text-gray-700 dark:text-gray-300 font-medium'>
                    <span className='me-2 text-base'>
                        <LuUsers />
                    </span>
                    <span className='text-gray-900 dark:text-white font-semibold'>
                        {data[index].queue.current}
                    </span>
                    <span className='mx-1 text-gray-500 dark:text-gray-400'>/</span>
                    <span className='text-gray-600 dark:text-gray-400'>
                        {data[index].queue.max}
                    </span>
                    <span className='ml-1 text-gray-600 dark:text-gray-400'>in queue</span>
                </p>
                <p className='text-gray-700 dark:text-gray-300 font-semibold'>
                    {data[index].queue.waitTime} wait
                </p>
            </div>
            <div className='bg-gray-200 dark:bg-gray-700 w-full rounded-full mt-3 h-2'>
                <div className='bg-gradient-to-r from-emerald-500 to-teal-500 w-1/4 h-2 rounded-full transition-all'></div>
            </div>
        </div>
    );
}

export default Queue;

