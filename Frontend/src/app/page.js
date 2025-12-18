"use client";
import { API_URL } from '@/lib/api';

import BusinessDetailsModal from '@/components/BusinessDetailsModal';
import ServiceCard from '@/components/HomePage/ServiceCard';
import StatsCard from '@/components/HomePage/StatsCard';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useTranslations } from '@/hooks/useTranslations';
import { ArrowRight, Building2, Calendar, Clock, Search, Sparkles, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function Home() {
  const { t } = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [heroRef, heroVisible] = useIntersectionObserver();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessDetails, setSelectedBusinessDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [allBusinesses, setAllBusinesses] = useState([]); // Store all businesses for filtering
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [isAISuggestion, setIsAISuggestion] = useState(false); // Track if showing AI suggestions
  const [isBusinessLoading, setIsBusinessLoading] = useState(true);


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/me`, {
          credentials: 'include',
        });
        setIsAuthenticated(res.ok);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsBusinessLoading(true);
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_URL}/api/v1/search/businesses?limit=50&_t=${timestamp}`);
        const data = await response.json();
        let businessList = data.data?.businesses || [];
        console.log('Businesses data:', businessList);
        console.log('First business:', businessList[0]);
        console.log('First business queueStatus:', businessList[0]?.queueStatus);
        console.log('First business isQueueFull:', businessList[0]?.isQueueFull);
        
        // Log all businesses with their queue status
        businessList.forEach((b, idx) => {
          console.log(`Business ${idx}: ${b.name} - queueStatus: ${b.queueStatus}, isOpen: ${b.isOpen}`);
          if (b.name === 'Hussien Khaled') {
            console.log('🔍 HUSSIEN KHALED FULL DATA:', JSON.stringify(b, null, 2));
          }
        });
        
        // Sort businesses: Open -> Busy -> Closed
        businessList = businessList.sort((a, b) => {
          const getPriority = (business) => {
            if (!business.isOpen) return 3;
            if (business.isFullyBooked) return 3;
            if (business.queueStatus === 'active') return 1;
            return 2;
          };
          return getPriority(a) - getPriority(b);
        });
        
        setBusinesses(businessList);
        setAllBusinesses(businessList); // Store for filtering
        
        // Extract unique categories/specializations
        const uniqueCategories = [...new Set(
          businessList
            .map(b => b.specialization || b.category)
            .filter(Boolean) // Remove null/undefined
        )];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching businesses:", error);
      } finally {
        setIsBusinessLoading(false);
      }
    };
    
    fetchBusinesses();
    
    // Refresh businesses every 30 seconds
    const interval = setInterval(() => {
      fetchBusinesses();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Instant search with debounce
  useEffect(() => {
    const performSearch = async () => {
      // If search is empty, restore all businesses
      if (!searchQuery.trim()) {
        setIsAISuggestion(false); // Not showing AI suggestions
        // Fetch all businesses again
        try {
          const response = await fetch(`${API_URL}/api/v1/search/businesses?limit=50`);
          const data = await response.json();
          let businessList = data.data?.businesses || [];
          
          // Sort businesses: Open -> Busy -> Closed
          businessList = businessList.sort((a, b) => {
            const getPriority = (business) => {
              if (!business.isOpen) return 3;
              if (business.isFullyBooked) return 3;
              if (business.queueStatus === 'active') return 1;
              return 2;
            };
            return getPriority(a) - getPriority(b);
          });
          
          setBusinesses(businessList);
          setAllBusinesses(businessList);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(
            businessList
              .map(b => b.specialization || b.category)
              .filter(Boolean)
          )];
          setCategories(uniqueCategories);
          setSelectedCategory('all');
        } catch (error) {
          console.error("Error fetching businesses:", error);
        }
        return;
      }

      // Hybrid search: Try regular search first, fallback to AI semantic search
      setIsSearching(true);
      try {
        // Step 1: Try regular text search for exact matches
        console.log('🔍 Searching for:', searchQuery);
        let response = await fetch(`${API_URL}/api/v1/search/businesses?q=${encodeURIComponent(searchQuery)}&limit=50`);
        let data = await response.json();
        let searchResults = data.data?.businesses || [];
        console.log('📊 Regular search found:', searchResults.length, 'businesses');
        
        // Step 2: If no results, use AI semantic search for intelligent suggestions
        if (searchResults.length === 0) {
          console.log('🤖 No exact matches, trying AI semantic search...');
          setIsAISuggestion(true); // Mark as AI suggestion
          response = await fetch(`${API_URL}/api/v1/search/semantic?q=${encodeURIComponent(searchQuery)}&limit=50`);
          data = await response.json();
          searchResults = data.data?.businesses || [];
          console.log('🤖 AI search found:', searchResults.length, 'businesses');
        } else {
          setIsAISuggestion(false); // Exact matches found
        }
        
        // Sort search results: Open -> Busy -> Closed
        searchResults = searchResults.sort((a, b) => {
          const getPriority = (business) => {
            if (!business.isOpen) return 3;
            if (business.isFullyBooked) return 3;
            if (business.queueStatus === 'active') return 1;
            return 2;
          };
          return getPriority(a) - getPriority(b);
        });
        
        setBusinesses(searchResults);
        setAllBusinesses(searchResults);
        
        // Update categories from search results
        const uniqueCategories = [...new Set(
          searchResults
            .map(b => b.specialization || b.category)
            .filter(Boolean)
        )];
        setCategories(uniqueCategories);
        setSelectedCategory('all');
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search - wait 800ms after user stops typing
    // Only search if query is at least 2 characters
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length === 0 || searchQuery.trim().length >= 2) {
        performSearch();
      }
    }, 800);

    // Cleanup timeout on searchQuery change
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Hybrid search: Try regular search first, fallback to AI semantic search
      // Step 1: Try regular text search for exact matches
      let response = await fetch(`${API_URL}/api/v1/search/businesses?q=${encodeURIComponent(searchQuery)}&limit=12`);
      let data = await response.json();
      let searchResults = data.data?.businesses || [];
      
      // Step 2: If no results, use AI semantic search for intelligent suggestions
      if (searchResults.length === 0) {
        console.log('No exact matches, trying AI semantic search...');
        response = await fetch(`${API_URL}/api/v1/search/semantic?q=${encodeURIComponent(searchQuery)}&limit=12`);
        data = await response.json();
        searchResults = data.data?.businesses || [];
      }
      
      // Sort search results: Open -> Busy -> Closed
      searchResults = searchResults.sort((a, b) => {
        const getPriority = (business) => {
          if (!business.isOpen) return 3;
          if (business.isFullyBooked) return 3;
          if (business.queueStatus === 'active') return 1;
          return 2;
        };
        return getPriority(a) - getPriority(b);
      });
      
      setBusinesses(searchResults);
      setAllBusinesses(searchResults);
      
      // Update categories from search results
      const uniqueCategories = [...new Set(
        searchResults
          .map(b => b.specialization || b.category)
          .filter(Boolean)
      )];
      setCategories(uniqueCategories);
      setSelectedCategory('all');
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    
    if (category === 'all') {
      // Show all businesses
      setBusinesses(allBusinesses);
    } else {
      // Filter by category
      const filtered = allBusinesses.filter(business => 
        (business.specialization === category) || (business.category === category)
      );
      setBusinesses(filtered);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBookClick = async (business, service = null) => {
    if (!isAuthenticated) {
      toast.error(t('toast.pleaseSignIn'));
      return;
    }
    
    // Go directly to checkout
    setIsProcessing(true);
    try {
      // Fetch the queue for this business
      const queueResponse = await fetch(`${API_URL}/api/v1/queues/business/${business._id}/queue`, {
        credentials: 'include',
      });

      if (!queueResponse.ok) {
        toast.error(t('toast.queueNotAvailable'));
        setIsProcessing(false);
        return;
      }

      const queueData = await queueResponse.json();
      const queueId = queueData.data?._id;

      if (!queueId) {
        toast.error(t('toast.queueNotFound'));
        setIsProcessing(false);
        return;
      }

      // Store booking details in session storage for payment page
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        businessId: business._id,
        businessName: business.name,
        queueId,
        type: 'examination',
        priority: 'normal'
      }));

      // Redirect to payment page
      window.location.href = '/payment';
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error(t('toast.checkoutFailed'));
      setIsProcessing(false);
    }
  };

  const services = [
    { icon: Calendar, title: t('services.medical.title'), description: t('services.medical.description') },
    { icon: Building2, title: t('services.banks.title'), description: t('services.banks.description') },
    { icon: Users, title: t('services.government.title'), description: t('services.government.description') },
    { icon: Clock, title: t('services.telecom.title'), description: t('services.telecom.description') }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 overflow-x-hidden">
      {/* Business Details Modal */}
      {selectedBusinessDetails && (
        <BusinessDetailsModal
          business={selectedBusinessDetails}
          onClose={() => setSelectedBusinessDetails(null)}
          onBook={(service) => handleBookClick(selectedBusinessDetails, service)}
          isAuthenticated={isAuthenticated}
        />
      )}
      
      <div className="container w-full px-4 sm:px-6 lg:w-11/12 mx-auto max-w-full">
        
        {/* Hero Section */}
        <div className="relative pt-10 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl text-center font-bold gradient-text animate-fade-in mb-4 pb-4 big-scale">
            {t('hero.title')}
          </h1>
          
          {/* Floating particles animation */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>
            <div className="particle particle-4"></div>
            <div className="particle particle-5"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 pt-8 lg:pt-12 max-w-full">
            
            {/* Left Content */}
            <div
              ref={heroRef}
              className={`flex flex-col items-center lg:items-start px-4 sm:px-6 space-y-6 transition-all duration-700 ${
                heroVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
            >
              {/* Animated dots */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                {[0, 0.15, 0.3, 0.45, 0.6].map((delay, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                {t('hero.subtitle')}
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed text-center lg:text-left">
                {t('hero.description')}
              </p>
              
              <div className="flex flex-col items-center lg:items-start sm:flex-row gap-4 pt-4">
                {!loading && (
                  <>
                    <Link href={isAuthenticated ? "/user" : "/login"}>
                      <button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                          {t('hero.bookAppointment')}
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>
                    
                    <Link href={isAuthenticated ? "/login/businessregister" : "/login"}>
                      <button className="bg-transparent text-emerald-600 dark:text-emerald-400 font-semibold px-8 py-3.5 rounded-xl border-2 border-emerald-500 hover:bg-emerald-500 hover:text-white transition-all duration-200">
                        {t('hero.addBusiness')}
                      </button>
                    </Link>
                  </>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 max-w-full">
                <StatsCard value="10K+" label={t('stats.activeUsers')} icon={Users} delay={0} />
                <StatsCard value="500+" label={t('stats.businesses')} icon={Building2} delay={100} />
                <StatsCard value="99.9%" label={t('stats.uptime')} icon={TrendingUp} delay={200} />
              </div>
            </div>
            
            {/* Right Image */}
            <div className="flex justify-center items-center">
              <div className="relative w-full max-w-xxl animate-float">
                {/* <div className="absolute inset-0 bg-[#359487]/10 dark:bg-[#C6FE02]/10 rounded-full blur-3xl"></div>
                <div className="relative bg-white dark:bg-[#2A2825] p-8 rounded-3xl shadow-2xl border border-gray-200 dark:border-[#3A3835]">
                  <div className="aspect-square bg-gradient-to-br from-[#359487]/20 to-[#2a7569]/20 dark:from-[#C6FE02]/20 dark:to-[#a8d902]/20 rounded-2xl flex items-center justify-center"> */}
                    <Image
                    width={600}
                    height={600}
                    src="/landingLight.png"
                    className="w-full h-auto dark:hidden object-contain"
                    alt="Queue management illustration"
                    priority
                  />
                  <Image
                    width={600}
                    height={600}
                    src="/landingDark.png"
                    className="w-full h-auto hidden dark:block object-contain"
                    alt="Queue management illustration"
                    priority
                  />
                  {/* </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
        
        {/* Services Section */}
        <div className="mt-24 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 dark:text-white">
              {t('services.title')}
            </h2>
          </div>
          
          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-full">
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                icon={service.icon}
                title={service.title}
                description={service.description}
              />
            ))}
          </div>
        </div>

        {/* Available Businesses Section */}
        <div className="mt-24 px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-gray-800 dark:text-white">
              {t('homePage.browseBusinesses')}
            </h2>
                        <div className="text-lg text-gray-600 dark:text-gray-300 flex items-center justify-center gap-3 flex-wrap">
              <span>{t('services.subtitle')}</span>
              <div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-500/20 px-4 py-1.5 rounded-full">
                <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{t('services.aiPowered')}</span>
              </div>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            </p>

            {/* Search Bar and Filter */}
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-3 items-stretch">
                {/* Search Input */}
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    className="w-full rounded-2xl px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-400 dark:text-white shadow-lg transition-all duration-300 hover:shadow-xl pr-14" 
                    placeholder={t('services.search')} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button 
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-3 text-white hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50">
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white dark:border-black border-t-transparent"></div>
                    ) : (
                      <Search size={20} />
                    )}
                  </button>
                </div>
                
                {/* Filter Dropdown Button */}
                {categories.length > 0 && (
                  <div className="relative md:w-auto">
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-400 transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      <span className="font-semibold text-gray-800 dark:text-white hidden md:inline">
                        {selectedCategory === 'all' ? t('homePage.filter') : (t(`clinics.categories.${selectedCategory.toLowerCase()}`) || selectedCategory)}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-white md:hidden">
                        {t('homePage.filter')}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold">
                        {businesses.length}
                      </span>
                      <svg 
                        className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-300 ${showFilterDropdown ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showFilterDropdown && (
                      <div className="absolute top-full left-0 md:left-auto md:right-0 mt-2 w-screen max-w-sm md:max-w-md bg-white dark:bg-[#2A2825] rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto mx-4 md:mx-0">
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {t('homePage.selectCategory')}
                          </h3>
                          
                          <div className="space-y-2">
                            {/* All Businesses Option */}
                            <button
                              onClick={() => {
                                handleCategoryFilter('all');
                                setShowFilterDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                                selectedCategory === 'all'
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">🏢</span>
                                <span className="font-semibold">{t('homePage.allBusinesses')}</span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                selectedCategory === 'all'
                                  ? 'bg-white/20 dark:bg-black/20'
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}>
                                {allBusinesses.length}
                              </span>
                            </button>

                            {/* Category Options */}
                            {categories.map((category) => {
                              const count = allBusinesses.filter(b => 
                                (b.specialization === category) || (b.category === category)
                              ).length;
                              
                              const categoryIcons = {
                                'Medical': '🏥',
                                'Healthcare': '⚕️',
                                'Banking': '🏦',
                                'Finance': '💰',
                                'Telecom': '📱',
                                'Government': '🏛️',
                                'Education': '🎓',
                                'Restaurant': '🍽️',
                                'Retail': '🛍️',
                                'Technology': '💻',
                                'Automotive': '🚗',
                                'Real Estate': '🏠',
                                'Legal': '⚖️',
                                'Consulting': '💼',
                                'Entertainment': '🎬',
                                'Fitness': '💪',
                                'Beauty': '💅',
                                'Travel': '✈️',
                                'Insurance': '🛡️',
                                'Logistics': '📦'
                              };
                              
                              const icon = categoryIcons[category] || '📋';
                              
                              return (
                                <button
                                  key={category}
                                  onClick={() => {
                                    handleCategoryFilter(category);
                                    setShowFilterDropdown(false);
                                  }}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                                    selectedCategory === category
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl">{icon}</span>
                                    <span className="font-semibold">{t(`clinics.categories.${category.toLowerCase()}`) || category}</span>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                    selectedCategory === category
                                      ? 'bg-white/20 dark:bg-black/20'
                                      : 'bg-gray-200 dark:bg-gray-700'
                                  }`}>
                                    {count}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Suggestion Banner */}
          {isAISuggestion && businesses.length > 0 && (
            <div className="max-w-7xl mx-auto mb-6 px-4">
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 border-2 border-purple-300 dark:border-purple-600 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-1 flex items-center gap-2">
                      <span>{t('homePage.aiSuggestions')}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500 text-white">{t('homePage.smart')}</span>
                    </h3>
                    <p className="text-sm text-purple-800 dark:text-purple-400">
                      {t('homePage.aiSuggestionsDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Businesses Grid */}
          {/* Businesses Grid & Loading State */}
          {isBusinessLoading || isSearching ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-[#2b2825] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 h-96 animate-pulse flex flex-col gap-4">
                    <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="w-3/4 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="flex-1"></div>
                    <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                ))}
             </div>
          ) : businesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {businesses.map((business) => (
                <div 
                  key={business._id} 
                  onClick={() => setSelectedBusinessDetails(business)}
                  className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700/50 overflow-hidden cursor-pointer transform hover:scale-[1.02]"
                >
                  {/* Business Header */}
                  <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 p-6">
                    <div className="flex gap-4 items-center">
                      {/* Business Photo */}
                      {business.profileImage || (business.businessImages && business.businessImages.length > 0) ? (
                        <img 
                          src={`${API_URL}${business.profileImage || business.businessImages[0]}`}
                          alt={business.name}
                          className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border-4 border-white/20 shadow-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 border-4 border-white/20 shadow-lg"
                        style={{ display: (business.profileImage || (business.businessImages && business.businessImages.length > 0)) ? 'none' : 'flex' }}
                      >
                        <Building2 size={32} className="text-white" />
                      </div>
                      
                      {/* Business Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {business.name}
                        </h3>
                        <p className="text-white/90 text-sm">
                          {business.specialization || business.category || t('homePage.generalService')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="p-6 space-y-4">
                    {/* Rating & Status Row */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 text-xl">⭐</span>
                        <span className="text-lg font-bold text-gray-800 dark:text-white">
                          {(business.rating || 0).toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({business.reviewCount || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!business.isOpen || business.queueStatus === 'closed' ? (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                              {t('common.closed')}
                            </span>
                          </>
                        ) : business.isFullyBooked ? (
                          <>
                            <span className="text-amber-500">🔥</span>
                            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                              {t('homePage.fullyBooked')}
                            </span>
                          </>
                        ) : business.queueStatus === 'active' ? (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {t('common.open')}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
                            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                              {t('common.busy')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Key Information */}
                    <div className="space-y-3">
                      {/* Location */}
                      {business.address && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-600 dark:text-emerald-400">📍</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('homePage.location')}</p>
                            <p className="text-sm text-gray-800 dark:text-white font-medium line-clamp-2">
                              {typeof business.address === 'object' 
                                ? (business.address?.city || business.address?.street || t('homePage.locationAvailable'))
                                : (business.address || t('homePage.locationAvailable'))}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Working Hours */}
                      {business.workingHours && business.workingHours.length > 0 && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('homePage.hours')}</p>
                            <p className="text-sm text-gray-800 dark:text-white font-medium">
                              {(() => {
                                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                const today = days[new Date().getDay()];
                                if (!business.workingHours) return t('homePage.seeDetails');
                                
                                const todaySchedule = business.workingHours.find(wh => wh.days === today);
                                
                                if (todaySchedule && !todaySchedule.isClosed) {
                                  return `${todaySchedule.openTime} - ${todaySchedule.closeTime}`;
                                } else {
                                  return t('homePage.closedToday');
                                }
                              })()}
                            </p>
                          </div>
                        </div>
                      )}


                      {/* Phone */}
                      {(business.mobilePhone || business.phoneNumber) && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-emerald-600 dark:text-emerald-400">📞</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('homePage.contact')}</p>
                            <p className="text-sm text-gray-800 dark:text-white font-medium">
                              {business.mobilePhone || business.phoneNumber || t('homePage.noContactInfo')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Services Preview */}
                    {business.service && Array.isArray(business.service) && business.service.length > 0 && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                          <span>🛎️</span> {t('homePage.services')}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {business.service.slice(0, 3).map((service, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300"
                            >
                              {service?.name || t('common.service')}
                            </span>
                          ))}
                          {business.service.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 text-xs text-gray-400 dark:text-gray-500">
                              +{business.service.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description Preview */}
                    {business.description && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {business.description}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBusinessDetails(business);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                      >
                        <Building2 size={18} />
                        {t('homePage.details')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!business.isOpen) {
                            toast.error(t('toast.businessClosed'));
                          } else if (business.queueStatus !== 'active') {
                            toast.error(t('toast.bookingUnavailable'));
                          } else {
                            handleBookClick(business);
                          }
                        }}
                        disabled={!business.isOpen || business.queueStatus !== 'active'}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          business.isOpen && business.queueStatus === 'active'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 cursor-pointer shadow-lg shadow-emerald-500/20'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <Calendar size={18} />
                        {!business.isOpen || business.queueStatus === 'closed' ? t('common.closed') : business.queueStatus === 'active' ? t('homePage.bookTicket') : t('common.busy')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700/50 mx-auto max-w-4xl">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <Search size={40} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('homePage.noBusinessesFound')}</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
                {t('homePage.noBusinessesDescription')}
              </p>
              <button 
                onClick={() => {
                   setSearchQuery('');
                   setSelectedCategory('all');
                }}
                className="btn-primary px-8 py-3"
              >
                {t('homePage.clearSearchFilters')}
              </button>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-24 px-4 max-w-full">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl p-8 md:p-12 text-center shadow-2xl max-w-full">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('cta.title')}
            </h3>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              {t('cta.description')}
            </p>
            <Link href={isAuthenticated ? "/user" : "/login"}>
              <button className="bg-white text-emerald-600 px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95">
                {t('cta.button')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



