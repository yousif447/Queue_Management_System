import { API_URL } from '@/lib/api';
import { Spinner } from "flowbite-react";

const Category = async ({index}) => {
    const res = await fetch(`${API_URL}/data`, {cache: 'force-cache'});
    const data = await res.json();
    if(data.length === 0) return <Spinner color="success" aria-label="Success spinner example" />
    
    return (
        <div>
            <span className='bg-gray-200 dark:bg-gray-700 p-2 px-3 rounded-2xl font-bold text-[11px] text-gray-800 dark:text-gray-200 uppercase tracking-wide'>
                {data[index].category}
            </span>
        </div>
    );
}

export default Category;

