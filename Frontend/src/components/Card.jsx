import { API_URL, authFetch } from '@/lib/api';
import { ArrowRight, Building2, Clock, MapPin, Star, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';

const Card = ({ clinic }) => {
    const [queueData, setQueueData] = useState(null);
    const [isQueuePaused, setIsQueuePaused] = useState(false);
    const [queueLoading, setQueueLoading] = useState(true);

    // Helper function to construct image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        return `${API_URL}${cleanPath}`;
    };

    useEffect(() => {
        if (clinic?._id) {
            fetchQueueStatus();
            const interval = setInterval(() => fetchQueueStatus(), 10000);
            return () => clearInterval(interval);
        }
    }, [clinic?._id]);

    const fetchQueueStatus = async () => {
        try {
            const response = await authFetch(`${API_URL}/api/v1/queues/business/${clinic._id}/queue`);
            if (response.ok) {
                const data = await response.json();
                setQueueData(data.data);
                setIsQueuePaused(data.data?.status === 'paused');
            } else if (response.status === 404) {
                setQueueData(null);
                setIsQueuePaused(false);
            }
        } catch (error) {
            console.error('Error fetching queue status:', error);
            setQueueData(null);
        } finally {
            setQueueLoading(false);
        }
    };

    if (!clinic) return null;

    const formatWorkingHours = () => {
        if (!clinic.workingHours || clinic.workingHours.length === 0) return "Not specified";
        const firstDay = clinic.workingHours[0];
        return `${firstDay.openTime} - ${firstDay.closeTime}`;
    };

    const getStatusBadge = () => {
        if (clinic.isOpen && (isQueuePaused || !queueData || queueData.status !== 'active')) {
            return { text: 'Busy', bgClass: 'bg-amber-50 dark:bg-amber-500/10', textClass: 'text-amber-700 dark:text-amber-400', dotClass: 'bg-amber-500', borderClass: 'border-amber-200 dark:border-amber-500/30' };
        }
        if (clinic.isOpen && queueData && queueData.status === 'active') {
            return { text: 'Open', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10', textClass: 'text-emerald-700 dark:text-emerald-400', dotClass: 'bg-emerald-500 animate-pulse', borderClass: 'border-emerald-200 dark:border-emerald-500/30' };
        }
        return { text: 'Closed', bgClass: 'bg-red-50 dark:bg-red-500/10', textClass: 'text-red-700 dark:text-red-400', dotClass: 'bg-red-500', borderClass: 'border-red-200 dark:border-red-500/30' };
    };

    const status = getStatusBadge();
    const isBookable = clinic.isOpen && !isQueuePaused && queueData && queueData.status === 'active';
    const businessImageUrl = getImageUrl(clinic.profileImage || (clinic.businessImages && clinic.businessImages[0]));

    return (
        <div className='group relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/50 w-full max-w-[400px] mx-auto shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1'>
            {/* Background Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 p-6">
                {/* Header */}
                <div className='flex justify-between items-start mb-4'>
                    {/* Business Photo */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 mr-3 overflow-hidden shadow-lg shadow-emerald-500/25">
                        {businessImageUrl ? (
                            <img 
                                src={businessImageUrl}
                                alt={clinic.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${businessImageUrl ? 'hidden' : 'flex'}`}>
                            <Building2 size={24} className="text-white" />
                        </div>
                    </div>
                    
                    <div className='flex-1 min-w-0'>
                        <h3 className='text-xl font-bold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors'>
                            {clinic.name}
                        </h3>
                        <p className='flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm mt-1'>
                            <MapPin size={14} />
                            <span className="truncate">{clinic.address}</span>
                        </p>
                    </div>
                    
                    {clinic.specialization && (
                        <span className='bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wide flex-shrink-0 ml-3'>
                            {clinic.specialization}
                        </span>
                    )}
                </div>

                {/* Status Badge */}
                {!queueLoading && (
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4 border ${status.bgClass} ${status.borderClass}`}>
                        <div className={`w-2 h-2 rounded-full ${status.dotClass}`}></div>
                        <span className={`text-xs font-bold uppercase tracking-wide ${status.textClass}`}>
                            {status.text}
                        </span>
                    </div>
                )}

                {/* Match Score */}
                {clinic.score && (
                    <div className='mb-4'>
                        <div className='flex items-center gap-2 text-sm'>
                            <Star size={14} className="text-amber-500 fill-amber-500" />
                            <span className='text-gray-600 dark:text-gray-400'>Match:</span>
                            <span className='font-semibold text-gray-900 dark:text-white'>{(clinic.score * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                )}

                {/* Info Grid */}
                <div className="space-y-3 mb-4">
                    {/* Working Hours */}
                    <div className='flex items-center gap-3 text-sm'>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                            <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className='text-gray-700 dark:text-gray-300 font-medium'>{formatWorkingHours()}</span>
                    </div>

                    {/* Capacity */}
                    {clinic.queueSettings && clinic.queueSettings.length > 0 && (
                        <div className='flex items-center gap-3 text-sm'>
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className='text-gray-700 dark:text-gray-300'>
                                Max capacity: <span className='font-semibold text-gray-900 dark:text-white'>{clinic.queueSettings[0].maxPatientsPerDay}</span>/day
                            </span>
                        </div>
                    )}
                </div>

                {/* Services */}
                {clinic.service && clinic.service.length > 0 && (
                    <div className='flex flex-wrap gap-2 mb-4'>
                        {clinic.service.slice(0, 3).map(s => (
                            <span className='bg-gray-100 dark:bg-gray-800 py-1.5 px-3 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300' key={uuid()}>
                                {s.name}
                            </span>
                        ))}
                        {clinic.service.length > 3 && (
                            <span className='bg-gray-100 dark:bg-gray-800 py-1.5 px-3 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400'>
                                +{clinic.service.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                {/* Contact */}
                {clinic.mobilePhone && (
                    <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
                        📱 {clinic.mobilePhone}
                    </p>
                )}

                {/* Action Buttons */}
                <div className='flex items-center gap-3'>
                    <button 
                        disabled={!isBookable}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                            isBookable
                                ? 'btn-primary'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {!clinic.isOpen ? 'Closed' : !isBookable ? 'Busy' : 'Book Now'}
                    </button>
                    <button className='w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all'>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Card;

