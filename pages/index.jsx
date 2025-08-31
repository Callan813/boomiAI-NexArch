import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Near Bangalore");
  const [rentalPeriod, setRentalPeriod] = useState("August 30 - September 1");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date(2025, 7, 30)); // August 30, 2025
  const [endDate, setEndDate] = useState(new Date(2025, 8, 1)); // September 1, 2025
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const datePickerRef = useRef(null);
  const locationDropdownRef = useRef(null);

  // Indian cities list
  const indianCities = [
    "Near Bangalore",
    "Near Goa",
    "Near Mumbai", 
    "Near Delhi",
    "Near Chennai",
    "Near Kolkata",
    "Near Hyderabad",
    "Near Pune",
    "Near Ahmedabad",
    "Near Jaipur",
    "Near Surat",
    "Near Lucknow",
    "Near Kanpur",
    "Near Nagpur",
    "Near Indore",
    "Near Bhopal",
    "Near Visakhapatnam",
    "Near Patna",
    "Near Vadodara",
    "Near Ludhiana",
    "Near Agra"
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
        setSelectingStartDate(true);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };

    if (showDatePicker || showLocationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker, showLocationDropdown]);

  // Get current location
  const getCurrentLocation = () => {
    console.log('getCurrentLocation called'); // Debug log
    
    if (navigator.geolocation) {
      console.log('Geolocation is supported'); // Debug log
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('Position received:', position); // Debug log
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocoding using OpenStreetMap Nominatim API
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data.display_name) {
              const addressParts = data.display_name.split(', ');
              const locality = addressParts[1] || addressParts[0];
              console.log('Setting location to:', locality); // Debug log
              setLocation(locality);
            }
          } catch (error) {
            console.error('Error getting location name:', error);
            setLocation(`Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          console.log('Error code:', error.code); // Debug log
          console.log('Error message:', error.message); // Debug log
          
          // More specific error messages
          switch(error.code) {
            case error.PERMISSION_DENIED:
              setLocation("Location access denied");
              break;
            case error.POSITION_UNAVAILABLE:
              setLocation("Location unavailable");
              break;
            case error.TIMEOUT:
              setLocation("Location request timeout");
              break;
            default:
              setLocation("Location not available");
              break;
          }
        },
        {
          enableHighAccuracy: false, // Changed to false for faster response
          timeout: 30000, // Increased to 30 seconds
          maximumAge: 300000 // Increased to 5 minutes
        }
      );
    } else {
      console.log('Geolocation not supported'); // Debug log
      setLocation("Geolocation not supported");
    }
  };

  // Search for places in India
  const searchPlaces = async (query) => {
    if (query.length < 2) {
      setLocationSearchResults([]);
      return;
    }
    
    setIsLocationSearching(true);
    try {
      // Search using OpenStreetMap Nominatim API with India focus
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&countrycodes=in&limit=10&addressdetails=1`
      );
      const data = await response.json();
      setLocationSearchResults(data);
    } catch (error) {
      console.error('Error searching places:', error);
      setLocationSearchResults([]);
    } finally {
      setIsLocationSearching(false);
    }
  };

  // Date utility functions
  const formatDateRange = (start, end) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const startMonth = months[start.getMonth()];
    const endMonth = months[end.getMonth()];
    
    if (start.getMonth() === end.getMonth()) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}`;
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
    }
  };

  const handleDateSelect = (date) => {
    if (selectingStartDate) {
      setStartDate(date);
      setSelectingStartDate(false);
    } else {
      setEndDate(date);
      setRentalPeriod(formatDateRange(startDate, date));
      setShowDatePicker(false);
      setSelectingStartDate(true);
    }
  };

  const resetDateSelection = () => {
    setSelectingStartDate(true);
    setShowDatePicker(true);
  };

  // Calendar component
  const DatePickerCalendar = () => {
    const today = new Date();
    const [displayMonth, setDisplayMonth] = useState(today.getMonth());
    const [displayYear, setDisplayYear] = useState(today.getFullYear());
    
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
    
    const days = [];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Navigation functions
    const goToPreviousMonth = () => {
      if (displayMonth === 0) {
        setDisplayMonth(11);
        setDisplayYear(displayYear - 1);
      } else {
        setDisplayMonth(displayMonth - 1);
      }
    };
    
    const goToNextMonth = () => {
      if (displayMonth === 11) {
        setDisplayMonth(0);
        setDisplayYear(displayYear + 1);
      } else {
        setDisplayMonth(displayMonth + 1);
      }
    };
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(displayYear, displayMonth, day);
      const isSelected = (selectingStartDate && date.toDateString() === startDate.toDateString()) ||
                        (!selectingStartDate && date.toDateString() === endDate.toDateString());
      const isInRange = !selectingStartDate && date >= startDate && date <= endDate;
      const isPast = date < today;
      
      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateSelect(date)}
          disabled={isPast}
          className={`p-2 w-10 h-10 text-sm rounded-lg transition-all duration-200 ${
            isPast 
              ? 'text-gray-300 cursor-not-allowed' 
              : isSelected
                ? 'bg-orange-500 text-white font-bold shadow-lg'
                : isInRange
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
          }`}
        >
          {day}
        </button>
      );
    }
    
    return (
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-xl shadow-2xl border-2 border-orange-200/60 p-4 z-[9999] backdrop-blur-md bg-white/95 min-w-[300px] max-w-[350px]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <h3 className="font-bold text-lg text-gray-800">{months[displayMonth]} {displayYear}</h3>
            <p className="text-sm text-orange-600 mt-1">
              {selectingStartDate ? 'Select start date' : 'Select end date'}
            </p>
          </div>
          
          <button
            onClick={goToNextMonth}
            className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
        
        <div className="flex justify-between mt-4 pt-3 border-t border-orange-100">
          <button
            onClick={() => setShowDatePicker(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          {!selectingStartDate && (
            <button
              onClick={resetDateSelection}
              className="px-4 py-2 text-sm text-orange-600 hover:text-orange-700 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    );
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          users!items_user_id_fkey (
            full_name,
            profile_pic,
            credibility_score
          )
        `)
        .eq('available', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price).toFixed(0)}/day`;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Electronics': '📱',
      'Furniture': '🪑',
      'Tools': '🔧',
      'Sports': '⚽',
      'Books': '📚',
      'Clothing': '👕',
      'Vehicles': '🚗',
      'default': '📦'
    };
    return icons[category] || icons.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="relative mx-auto w-16 h-16 mb-6">
              <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-orange-200"></div>
              <div className="absolute inset-2 animate-spin rounded-full h-12 w-12 border-4 border-orange-400 border-t-transparent"></div>
            </div>
            <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-gray-700 text-lg font-medium animate-pulse">Loading amazing products...</p>
              <div className="mt-3 flex justify-center space-x-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-200"></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-400"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-xl p-8 max-w-md mx-auto shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="text-red-500 text-6xl mb-4 animate-bounce">⚠</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button 
                onClick={fetchProducts}
                className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <Header />
      
      {/* Hero Section - Enhanced with Glass Morphism */}
      <section className="bg-gradient-to-br from-orange-100 via-white to-orange-50 text-gray-800 py-20 relative overflow-visible">
        {/* Enhanced Background Pattern with Smooth Animations */}
        <div className="absolute inset-0 opacity-40">
          {/* Large floating orbs */}
          <div className="absolute top-16 right-8 w-40 h-40 bg-gradient-to-br from-orange-200/60 to-orange-300/80 rounded-full blur-xl animate-float-slow"></div>
          <div className="absolute top-32 right-24 w-24 h-24 bg-gradient-to-br from-white/70 to-orange-200/60 rounded-full blur-lg animate-float-reverse delay-1000"></div>
          <div className="absolute bottom-16 right-16 w-32 h-32 bg-gradient-to-br from-orange-300/50 to-orange-400/70 rounded-full blur-xl animate-float-slow delay-2000"></div>
          
          {/* Left side orbs */}
          <div className="absolute top-48 left-12 w-28 h-28 bg-gradient-to-br from-white/60 to-orange-100/80 rounded-full blur-lg animate-float-reverse delay-500"></div>
          <div className="absolute bottom-32 left-32 w-20 h-20 bg-gradient-to-br from-orange-200/70 to-orange-300/60 rounded-full blur-md animate-float-slow delay-1500"></div>
          
          {/* Small accent orbs */}
          <div className="absolute top-64 right-40 w-12 h-12 bg-gradient-to-br from-orange-400/60 to-orange-500/40 rounded-full blur-sm animate-drift delay-300"></div>
          <div className="absolute bottom-48 left-56 w-16 h-16 bg-gradient-to-br from-white/80 to-orange-200/50 rounded-full blur-md animate-drift delay-800"></div>
          <div className="absolute top-80 left-80 w-10 h-10 bg-gradient-to-br from-orange-300/70 to-white/60 rounded-full blur-sm animate-drift delay-1200"></div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Main Headline with Animation */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 animate-fade-in-up">
            Rent instead of buying
          </h1>
          
          {/* Sub-headline with Animation */}
          <p className="text-xl md:text-2xl mb-12 text-gray-700 animate-fade-in-up delay-200">
            Get what you need, when you need it - from people nearby
          </p>

          {/* Large Search Bar with Enhanced Definition */}
          <form onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            }
          }} className="max-w-3xl mx-auto mb-8 animate-fade-in-up delay-400">
            <div className="relative">
              <div className="flex bg-white/95 backdrop-blur-lg border-2 border-orange-200/50 rounded-2xl shadow-2xl hover:shadow-orange-200/50 transition-all duration-300 overflow-hidden group hover:scale-[1.02] hover:border-orange-300/60">
                {/* Search Input */}
                <div className="flex-1 flex items-center px-6 py-4 bg-white/90">
                  <svg className="w-6 h-6 text-orange-500 mr-4 transition-colors duration-300 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for what you want to rent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-gray-900 text-lg placeholder-gray-500 focus:outline-none bg-transparent focus:placeholder-gray-400 transition-all duration-300"
                  />
                </div>
                
                {/* Search Button with Enhanced Visibility */}
                <button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl border-l-2 border-orange-400/30">
                  Search
                </button>
              </div>
              
              {/* Additional definition with outer glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-200/20 to-orange-300/20 -z-10 blur-xl group-hover:from-orange-300/30 group-hover:to-orange-400/30 transition-all duration-300"></div>
            </div>
          </form>

          {/* Search Filters with Enhanced Definition */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm animate-fade-in-up delay-600">
                         {/* Location Filter */}
             <div className="relative" ref={locationDropdownRef}>
               <div className="flex items-center space-x-2">
                 <div className="relative">
                   <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                                       <div 
                      onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                      className="flex items-center text-gray-700 bg-white/90 backdrop-blur-sm border-2 border-orange-200/60 rounded-xl pl-10 pr-4 py-3 hover:bg-white hover:border-orange-300/80 transition-all duration-300 cursor-pointer hover:scale-105 shadow-lg hover:shadow-orange-200/40 w-80"
                    >
                      <span className="font-medium">{location}</span>
                    </div>
                                       <button
                      onClick={getCurrentLocation}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-all duration-200 cursor-pointer z-10"
                      title="Use current location"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                 </div>
               </div>
               
               {/* Location Dropdown */}
               {showLocationDropdown && (
                 <div className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-md border-2 border-orange-200/60 rounded-xl shadow-xl z-[9999] min-w-[300px] max-h-64 overflow-y-auto">
                   {/* Search Input */}
                   <div className="p-3 border-b border-orange-100/50">
                     <input
                       type="text"
                       placeholder="Search for places in India..."
                       onChange={(e) => searchPlaces(e.target.value)}
                       className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                     />
                   </div>
                   
                   {/* Search Results */}
                   {isLocationSearching ? (
                     <div className="p-3 text-center text-gray-500">
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mx-auto"></div>
                       <span className="ml-2">Searching...</span>
                     </div>
                   ) : locationSearchResults.length > 0 ? (
                     locationSearchResults.map((place, index) => (
                       <div
                         key={index}
                         onClick={() => {
                           setLocation(place.display_name.split(',')[0]);
                           setShowLocationDropdown(false);
                           setLocationSearchResults([]);
                         }}
                         className="p-3 hover:bg-orange-50/80 cursor-pointer border-b border-orange-100/50 last:border-b-0"
                       >
                         <div className="font-medium text-gray-900">{place.display_name.split(',')[0]}</div>
                         <div className="text-sm text-gray-600">{place.display_name.split(',').slice(1, 3).join(',')}</div>
                       </div>
                     ))
                   ) : (
                     <div className="p-3 text-gray-500 text-center">Search for places in India</div>
                   )}
                 </div>
               )}
             </div>

            {/* Rental Period Filter with Date Picker */}
            <div className="relative" ref={datePickerRef}>
                             <div 
                 onClick={() => setShowDatePicker(!showDatePicker)}
                 className="flex items-center text-gray-700 bg-white/90 backdrop-blur-sm border-2 border-orange-200/60 rounded-xl px-4 py-3 hover:bg-white hover:border-orange-300/80 transition-all duration-300 cursor-pointer hover:scale-105 shadow-lg hover:shadow-orange-200/40 w-80"
               >
                 <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
                 <span className="font-medium">Rental period {rentalPeriod}</span>
               </div>
              
              {showDatePicker && <DatePickerCalendar />}
            </div>
          </div>
        </div>

        {/* Decorative Elements - Moving Around Entire Screen */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top area elements */}
          <div className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full animate-drift-around opacity-60"></div>
          <div className="absolute top-32 right-32 w-12 h-12 bg-gradient-to-br from-white to-orange-100 rounded-full animate-drift-around-reverse delay-1000 opacity-70"></div>
          <div className="absolute top-16 left-1/2 w-8 h-8 bg-gradient-to-br from-orange-300 to-white rounded-full animate-orbit delay-500 opacity-50"></div>
          
          {/* Middle area elements */}
          <div className="absolute top-1/2 left-16 w-20 h-20 bg-gradient-to-br from-orange-100 to-white rounded-full animate-float-around opacity-40"></div>
          <div className="absolute top-1/2 right-20 w-14 h-14 bg-gradient-to-br from-white to-orange-200 rounded-full animate-float-around-reverse delay-2000 opacity-60"></div>
          <div className="absolute top-1/3 left-1/3 w-10 h-10 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full animate-orbit-reverse delay-1500 opacity-50"></div>
          
          {/* Bottom area elements */}
          <div className="absolute bottom-32 left-32 w-18 h-18 bg-gradient-to-br from-orange-300 to-white rounded-full animate-drift-around delay-3000 opacity-55"></div>
          <div className="absolute bottom-20 right-40 w-12 h-12 bg-gradient-to-br from-white to-orange-100 rounded-full animate-float-around delay-800 opacity-65"></div>
          <div className="absolute bottom-40 left-2/3 w-6 h-6 bg-gradient-to-br from-orange-200 to-white rounded-full animate-orbit delay-2500 opacity-70"></div>
          
          {/* Scattered small elements */}
          <div className="absolute top-2/3 left-1/4 w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-300 rounded-full animate-sparkle-float opacity-80"></div>
          <div className="absolute top-1/4 right-1/4 w-5 h-5 bg-gradient-to-br from-white to-orange-200 rounded-full animate-sparkle-float delay-1200 opacity-60"></div>
          <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-gradient-to-br from-orange-300 to-white rounded-full animate-sparkle-float delay-1800 opacity-75"></div>
          
          {/* Corner accents */}
          <div className="absolute top-8 right-8 w-6 h-6 bg-gradient-to-br from-orange-200 to-white rounded-full animate-orbit-slow opacity-40"></div>
          <div className="absolute bottom-8 left-8 w-8 h-8 bg-gradient-to-br from-white to-orange-100 rounded-full animate-orbit-slow delay-4000 opacity-50"></div>
        </div>
      </section>

      {/* Featured Products Section with Enhanced Styling */}
      <section className="py-16 bg-gradient-to-br from-white via-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Items Near You
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Discover amazing items available for rent in your area
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 animate-fade-in-up">
              <div className="text-gray-400 text-6xl mb-4 animate-bounce">📦</div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No products available</h3>
              <p className="text-gray-500">Be the first to list an item for rent!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                                 <div key={product.item_id} className="group backdrop-blur-md bg-white/70 border border-white/30 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden hover:scale-105 hover:rotate-1 transform animate-fade-in-up"
                      style={{animationDelay: `${index * 100}ms`}}>
                  {/* Product Image with Enhanced Hover */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 group-hover:brightness-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl group-hover:scale-110 transition-transform duration-500">
                        {getCategoryIcon(product.category)}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg backdrop-blur-sm border border-white/20 transition-all duration-300 group-hover:scale-110">
                      {product.condition || 'Good'}
                    </div>
                    {/* Overlay gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {/* Product Info with Enhanced Styling */}
                  <div className="p-4 relative">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
                      {product.title}
                    </h3>
                    
                    {/* Lender Info with Glass Effect */}
                    <div className="flex items-center mb-3 p-2 rounded-lg bg-white/50 backdrop-blur-sm border border-white/30 group-hover:bg-white/70 transition-all duration-300">
                      <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mr-3 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {product.users?.profile_pic ? (
                          <img
                            src={product.users.profile_pic}
                            alt={product.users.full_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 text-sm font-medium">
                            {product.users?.full_name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.users?.full_name || 'Unknown User'}
                        </p>
                        <div className="flex items-center">
                          <span className="text-yellow-500 text-xs animate-pulse">★</span>
                          <span className="text-xs text-gray-600 ml-1">
                            {product.users?.credibility_score?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price and Action with Enhanced Button */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent group-hover:from-orange-600 group-hover:to-orange-700 transition-all duration-300">
                        {formatPrice(product.price_per_day)}
                      </div>
                                             <button 
                         onClick={() => router.push(`/item/${product.item_id}`)}
                         className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20"
                       >
                         Rent Now
                       </button>
                    </div>

                    {/* Category Badge with Enhanced Styling */}
                    {product.category && (
                      <div className="mt-3">
                        <span className="inline-block bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full border border-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 cursor-default">
                          {product.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section with Glass Morphism */}
      <section className="py-16 bg-gradient-to-r from-orange-100 via-white to-orange-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full blur-sm animate-float"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full blur-sm animate-float delay-500"></div>
          <div className="absolute top-20 right-20 w-12 h-12 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full blur-sm animate-float delay-1000"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 animate-fade-in-up">
              Ready to Start Earning?
            </h2>
            <p className="text-gray-700 mb-8 text-lg animate-fade-in-up delay-200">
              Join our community of lenders and renters. Turn your unused items into a source of income.
            </p>
            <button className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/20 animate-fade-in-up delay-400">
              Create Your First Listing
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}