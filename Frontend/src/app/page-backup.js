// "use client";
import { API_URL } from '@/lib/api';

// import CardLists from "@/components/CardLists";
// import Image from "next/image";
// import Link from "next/link";
// import { CiSearch } from "react-icons/ci";
// import { useState } from "react";

// export default function Home() {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [isSearching, setIsSearching] = useState(false);

//   const handleSearch = async () => {
//     setIsSearching(true);
//     try {
//       const url = searchQuery.trim() 
//         ? `${API_URL}/api/v1/search/semantic?q=${encodeURIComponent(searchQuery)}`
//         : `${API_URL}/api/v1/search`;
        
//       const response = await fetch(url);
      
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
      
//       const contentType = response.headers.get('content-type');
//       if (!contentType || !contentType.includes('application/json')) {
//         console.warn('Search API returned non-JSON response');
//         setSearchResults([]);
//         return;
//       }
      
//       const data = await response.json();
//       console.log('Search results:', data);
      
//       // Handle semantic search response format
//       if (data.success && data.data) {
//         setSearchResults(data.data.businesses || []);
//       } else {
//         setSearchResults(Array.isArray(data) ? data : data.results || []);
//       }
//     } catch (error) {
//       console.error("Error searching clinics:", error);
//       setSearchResults([]);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       handleSearch();
//     }
//   };

//   return (
//     <>
//       <div className="pb-20 min-h-screen bg-[#F3F3F3] text-black dark:bg-[#221F1B] dark:text-white transition-all duration-300">
//         <div className="container w-full px-4 sm:px-6 lg:w-11/12 mx-auto">
          
//           <div className="relative">
//             <h1 className="pt-10 text-3xl sm:text-4xl md:text-5xl lg:text-5xl text-center text-[#359487] font-bold dark:text-[#C6FE02] dark:drop-shadow-[0_0_10px_rgba(198,254,2,0.5)] drop-shadow-[0_0_10px_rgba(30,240,220,0.7)] big-scale">
//               Skip the Wait, Book Your Spot
//             </h1>
            
//             <div className="grid grid-cols-1 lg:grid-cols-3 items-center justify-center pt-5 lg:pt-10 gap-8 lg:gap-0">
              
//               <div className="lg:col-span-1 px-4 sm:px-5 text-center flex flex-col justify-center order-2 lg:order-1">
                
//                 <div className="mb-6 lg:mb-8 hidden sm:block">
//                   <div className="flex items-center justify-center gap-4 sm:gap-5 lg:gap-7">
//                     <div className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 rounded-full bg-[#359487] dark:bg-[#b4f221] animate-pulse"></div>
//                     <div className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 rounded-full bg-[#359487] dark:bg-[#b4f221] animate-pulse" style={{animationDelay: '0.1s'}}></div>
//                     <div className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 rounded-full bg-[#359487] dark:bg-[#b4f221] animate-pulse" style={{animationDelay: '0.4s'}}></div>
//                     <div className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 rounded-full bg-[#359487] dark:bg-[#b4f221] animate-pulse" style={{animationDelay: '0.7s'}}></div>
//                     <div className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 rounded-full bg-[#359487] dark:bg-[#b4f221] animate-pulse" style={{animationDelay: '1s'}}></div>
//                   </div>
//                 </div>

//                 <h5 className="py-3 sm:py-4 lg:py-5 text-2xl sm:text-3xl font-semibold text-[#359487] dark:text-[white]">
//                   Manage Queues Intelligently
//                 </h5>
                
//                 <div className="flex justify-center">
//                   <p className="w-full sm:w-11/12 text-sm sm:text-base text-gray-600 dark:text-gray-300 px-2">
//                     Find and book appointments at clinics, banks, telecom centers,
//                     and more. Manage your time efficiently with our smart queue
//                     system
//                   </p>
//                 </div>
                
//                 <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-5">
//                   <button className="cursor-pointer w-full sm:w-auto bg-[#359487] px-6 py-2.5 rounded-md text-white font-medium hover:bg-[#2a8074] dark:bg-[#C6FE02] dark:text-black dark:hover:bg-[#9dc704] transition-colors">
//                     Book an Appointment
//                   </button>
//                   <button className="cursor-pointer w-full sm:w-auto bg-transparent border-2 text-[#359487] border-[#359487] hover:bg-[#359487] hover:text-white dark:bg-transparent dark:border-[#C6FE02] dark:text-[#C6FE02] dark:hover:bg-[#C6FE02] dark:hover:text-[#221F1B] px-6 py-2.5 rounded-md font-medium transition-colors">
//                     Add Your Business
//                   </button>
//                 </div>
//               </div>
              
//               <div className="lg:col-span-2 w-full px-4 sm:px-5 flex justify-center items-center order-1 lg:order-2">
//                 <div className="w-full max-w-md lg:max-w-none lg:w-10/12">
//                   <Image
//                     width={600}
//                     height={600}
//                     src="/./landingLight.png"
//                     className="w-full h-auto dark:hidden object-contain"
//                     alt="Queue management illustration"
//                     priority
//                   />
//                   <Image
//                     width={600}
//                     height={600}
//                     src="/./LandingDark.png"
//                     className="w-full h-auto hidden dark:block object-contain"
//                     alt="Queue management illustration"
//                     priority
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
          
//           <div className="text-center mt-16 sm:mt-20 lg:mt-24 px-4">
//             <h2 className="text-2xl sm:text-3xl lg:text-3xl font-semibold pb-3">Available Services</h2>
//             <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
//               Browse and book your spot at various locations
//               <svg className="w-5 h-5 text-[#359487] dark:text-[#C6FE02]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
//                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//               </svg>
//               <span className="text-xs font-semibold text-[#359487] dark:text-[#C6FE02] bg-[#359487]/10 dark:bg-[#C6FE02]/10 px-2 py-0.5 rounded-full">AI Powered</span>
//             </p>
//           </div>
          
          
//           <div className="mt-6 sm:mt-8 flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 mx-auto space-x-2 px-4">
//             <div className="relative w-full">
//               <input 
//                 type="text" 
//                 id="simple-search" 
//                 className="rounded-xl px-3 sm:px-4 py-2.5 bg-white dark:bg-[#2b2825] border border-gray-300 dark:border-gray-600 text-sm sm:text-base focus:ring-2 focus:ring-[#359487] dark:focus:ring-[#C6FE02] focus:border-transparent block w-full placeholder:text-gray-400" 
//                 placeholder="Search Business name..." 
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 onKeyPress={handleKeyPress}
//               />
//             </div>
//             <button 
//               onClick={handleSearch}
//               disabled={isSearching}
//               className="cursor-pointer dark:bg-[#C6FE02] dark:text-black bg-[#359487] rounded-xl inline-flex items-center justify-center shrink-0 text-white hover:bg-[#2a8074] dark:hover:bg-[#a7d404] focus:ring-4 focus:ring-[#359487]/30 dark:focus:ring-[#C6FE02]/30 shadow-sm w-10 h-10 sm:w-11 sm:h-11 focus:outline-none transition-colors disabled:opacity-50">
//               {isSearching ? (
//                 <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                 </svg>
//               ) : (
//                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                 </svg>
//               )}
//             </button>
//           </div>
          
//           <div className="mt-10 sm:mt-12 lg:mt-16 px-4 pb-10">
//             <CardLists searchResults={searchResults} isSearching={isSearching} />
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }









"use client";
import { API_URL } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';
import { ArrowRight, Building2, Calendar, Clock, Search, Sparkles, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// Intersection Observer Hook
const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isVisible) {
        setIsVisible(true);
      }
    }, { threshold: 0.2, ...options });
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [isVisible, options]);
  
  return [ref, isVisible];
};

// Animated Counter
const AnimatedCounter = ({ end, duration = 2000, suffix = "", prefix = "" }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [ref, isVisible] = useIntersectionObserver();
  
  useEffect(() => {
    if (!isVisible || hasAnimated) return;
    
    let startTime;
    let animationFrame;
    
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, end, duration, hasAnimated]);
  
  return (
    <div ref={ref} className="text-3xl md:text-4xl font-bold text-[#359487] dark:text-[#C6FE02]">
      {prefix}{count}{suffix}
    </div>
  );
};

// Service Card Component
const ServiceCard = ({ icon: Icon, title, description, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div
      ref={ref}
      className={`group bg-white dark:bg-[#2A2825] p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-[#3A3835] hover:border-[#359487] dark:hover:border-[#C6FE02] hover:-translate-y-2 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="bg-gradient-to-br from-[#359487] to-[#2a7569] dark:from-[#C6FE02] dark:to-[#a8d902] p-4 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon size={28} className="text-white dark:text-black" />
      </div>
      <h3 className="text-xl font-bold mb-2 dark:text-white group-hover:text-[#359487] dark:group-hover:text-[#C6FE02] transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

// Stats Card
const StatsCard = ({ value, label, icon: Icon, delay = 0 }) => {
  const [ref, isVisible] = useIntersectionObserver();
  
  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-[#2A2825] p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-[#3A3835] transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Icon className="text-[#359487] dark:text-[#C6FE02] mb-3" size={32} />
      <div className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
};

export default function Home() {
  const { t } = useTranslations();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [heroRef, heroVisible] = useIntersectionObserver();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleSearch = async () => {
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      console.log('Searching for:', searchQuery);
      setIsSearching(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const services = [
    { icon: Calendar, title: "Medical Clinics", description: "Book appointments with doctors and specialists without the wait" },
    { icon: Building2, title: "Banks & Finance", description: "Skip the line at banks and financial institutions" },
    { icon: Users, title: "Government Services", description: "Access public services with scheduled appointments" },
    { icon: Clock, title: "Telecom Centers", description: "Get service at telecom outlets efficiently" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F3F3] to-[#E8E8E8] dark:from-[#181715] dark:to-[#1F1D1A] pb-20">
      <div className="container w-full px-4 sm:px-6 lg:w-11/12 mx-auto">
        
        {/* Hero Section */}
        <div className="relative pt-10">
          <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl text-center text-[#359487] font-bold dark:text-[#C6FE02] dark:drop-shadow-[0_0_20px_rgba(198,254,2,0.6)] drop-shadow-[0_0_15px_rgba(53,148,135,0.4)] animate-fade-in mb-4 big-scale">
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
          
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 pt-8 lg:pt-12">
            
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
                    className="w-6 h-6 rounded-full bg-[#359487] dark:bg-[#C6FE02] animate-pulse"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold text-[#359487] dark:text-white">
                {t('hero.subtitle')}
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed text-center lg:text-left">
                {t('hero.description')}
              </p>
              
              <div className="flex flex-col items-center lg:items-start sm:flex-row gap-4 pt-4">
                {!loading && (
                  <>
                    <Link href={isAuthenticated ? "/user" : "/login"}>
                      <button className="cursor-pointer group relative overflow-hidden bg-gradient-to-r from-[#359487] to-[#2a7569] dark:from-[#C6FE02] dark:to-[#a8d902] px-8 py-3.5 rounded-xl text-white dark:text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95">
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {t('hero.bookAppointment')}
                          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-white/20 dark:bg-black/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                      </button>
                    </Link>
                    
                    <Link href={isAuthenticated ? "/login/businessregister" : "/login"}>
                      <button className="cursor-pointer relative overflow-hidden bg-transparent border-2 border-[#359487] dark:border-[#C6FE02] text-[#359487] dark:text-[#C6FE02] px-8 py-3.5 rounded-xl font-semibold hover:bg-[#359487] hover:text-white dark:hover:bg-[#C6FE02] dark:hover:text-black transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg">
                        {t('hero.addBusiness')}
                      </button>
                    </Link>
                  </>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6">
                <StatsCard value="10K+" label="Active Users" icon={Users} delay={0} />
                <StatsCard value="500+" label="Businesses" icon={Building2} delay={100} />
                <StatsCard value="99.9%" label="Uptime" icon={TrendingUp} delay={200} />
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
                    src="/./landingLight.png"
                    className="w-full h-auto dark:hidden object-contain"
                    alt="Queue management illustration"
                    priority
                  />
                  <Image
                    width={600}
                    height={600}
                    src="/./LandingDark.png"
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
            <div className="text-lg text-gray-600 dark:text-gray-300 flex items-center justify-center gap-3 flex-wrap">
              <span>{t('services.subtitle')}</span>
              <div className="flex items-center gap-2 bg-[#359487]/10 dark:bg-[#C6FE02]/10 px-4 py-1.5 rounded-full">
                <Sparkles size={18} className="text-[#359487] dark:text-[#C6FE02]" />
                <span className="text-sm font-semibold text-[#359487] dark:text-[#C6FE02]">{t('services.aiPowered')}</span>
              </div>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <input 
                type="text" 
                className="w-full rounded-2xl px-6 py-4 bg-white dark:bg-[#2A2825] border-2 border-gray-200 dark:border-[#3A3835] text-base focus:ring-2 focus:ring-[#359487] dark:focus:ring-[#C6FE02] focus:border-transparent placeholder:text-gray-400 dark:text-white shadow-lg transition-all duration-300 hover:shadow-xl pr-14" 
                placeholder={t('services.search')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#359487] to-[#2a7569] dark:from-[#C6FE02] dark:to-[#a8d902] rounded-xl p-3 text-white dark:text-black hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50">
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white dark:border-black border-t-transparent"></div>
                ) : (
                  <Search size={20} />
                )}
              </button>
            </div>
          </div>
          
          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Features Section */}
        <div className="mt-24 px-4">
          <div className="bg-gradient-to-r from-[#359487] to-[#2a7569] dark:from-[#C6FE02] dark:to-[#a8d902] rounded-3xl p-8 md:p-12 text-center shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-bold text-white dark:text-black mb-4">
              {t('cta.title')}
            </h3>
            <p className="text-lg text-white/90 dark:text-black/80 mb-8 max-w-2xl mx-auto">
              {t('cta.description')}
            </p>
            <button className="bg-white dark:bg-black text-[#359487] dark:text-[#C6FE02] px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95">
              {t('cta.button')}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes particle-float {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(var(--x), var(--y));
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          opacity: 0.3;
          animation: particle-float 8s ease-in-out infinite;
        }

        .particle-1 {
          background: #359487;
          top: 20%;
          left: 10%;
          --x: 30px;
          --y: -40px;
          animation-delay: 0s;
        }

        .particle-2 {
          background: #C6FE02;
          top: 60%;
          left: 80%;
          --x: -50px;
          --y: 30px;
          animation-delay: 1s;
        }

        .particle-3 {
          background: #359487;
          top: 40%;
          left: 90%;
          --x: 20px;
          --y: -50px;
          animation-delay: 2s;
        }

        .particle-4 {
          background: #C6FE02;
          top: 80%;
          left: 20%;
          --x: -40px;
          --y: -20px;
          animation-delay: 3s;
        }

        .particle-5 {
          background: #359487;
          top: 30%;
          left: 50%;
          --x: 35px;
          --y: 45px;
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}


