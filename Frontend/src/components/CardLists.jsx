"use client";

import React, { useEffect, useState } from 'react';
import { Spinner } from "flowbite-react";
import Card from './Card';
import { v4 as uuid } from 'uuid';

const CardLists = ({ searchResults, isSearching }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Only show search results when provided
        if (searchResults && searchResults.length >= 0) {
            setData(searchResults);
            setLoading(false);
        } else {
            // Don't fetch anything if no search results
            setData([]);
            setLoading(false);
        }
    }, [searchResults]);

    if (loading || isSearching) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner color="success" aria-label="Loading..." size="xl" />
            </div>
        );
    }
    
    if (data.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                    Use the search box above to find businesses
                </p>
                {/* <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    Try searching for: قلب, عيون, بنك, فودافون
                </p> */}
            </div>
        );
    }

    return (
        <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-8 px-6 md:px-1 lg:px-6 '>
            {data.map((item) => (
                <div key={item._id || uuid()}>
                    <Card clinic={item} />
                </div>
            ))}
        </div>
    );
}

export default CardLists;

