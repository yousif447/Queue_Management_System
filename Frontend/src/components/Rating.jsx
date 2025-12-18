import { API_URL } from '@/lib/api';
import { Spinner } from "flowbite-react";
import { FaStar } from 'react-icons/fa';

const Rating = async ({index}) => {
    const res = await fetch(`${API_URL}/data`, {next:{revalidate:60}});
    const data = await res.json();
    if(data.length === 0) return <Spinner color="success" aria-label="Success spinner example" />
    return (
        <div>
            <p className='flex items-center'><span className='me-1'><FaStar color='#f8f82f'/></span> {data[index].rating}</p>
        </div>
    );
}

export default Rating;


