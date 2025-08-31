import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Search location...");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showListingPopup, setShowListingPopup] = useState(false);
  const [listingForm, setListingForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    price_per_day: "",
    image_url: ""
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const router = useRouter();

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

  // Sign out function
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Search for places in India
  const searchPlaces = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      // Search using OpenStreetMap Nominatim API with India focus
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&countrycodes=in&limit=10&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle listing form submission
  const handleListingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setSubmitMessage("❌ Please login to create a listing");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const { data, error } = await supabase
        .from('items')
        .insert([
          {
            user_id: user.id,
            title: listingForm.title,
            description: listingForm.description,
            category: selectedCategory || "Other",
            condition: selectedCondition || "Good",
            price_per_day: parseFloat(listingForm.price_per_day),
            image_url: imagePreview || listingForm.image_url || null,
            available: true
          }
        ]);

      if (error) {
        throw error;
      }

             setSubmitMessage("✅ Listing created successfully!");
       setListingForm({
         title: "",
         description: "",
         category: "",
         condition: "",
         price_per_day: "",
         image_url: ""
       });
       setSelectedCategory("");
       setSelectedCondition("");
       setImageFile(null);
       setImagePreview("");
      
      // Close popup after 2 seconds
      setTimeout(() => {
        setShowListingPopup(false);
        setSubmitMessage("");
      }, 2000);

    } catch (error) {
      console.error('Error creating listing:', error);
      setSubmitMessage("❌ Failed to create listing: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form input changes
  const handleListingFormChange = (e) => {
    const { name, value } = e.target;
    setListingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form when popup closes
  const handleCloseListingPopup = () => {
    setShowListingPopup(false);
    setListingForm({
      title: "",
      description: "",
      category: "",
      condition: "",
      price_per_day: "",
      image_url: ""
    });
         setSelectedCategory("");
     setSelectedCondition("");
     setImageFile(null);
     setImagePreview("");
     setSubmitMessage("");
  };

  // Handle category selection (single selection)
  const selectCategory = (category) => {
    setSelectedCategory(selectedCategory === category ? "" : category);
  };

  // Handle condition selection (single selection)
  const selectCondition = (condition) => {
    setSelectedCondition(selectedCondition === condition ? "" : condition);
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  // Check authentication status
  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.location-search')) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Header */}
      <header className="bg-orange-500/95 backdrop-blur-md shadow-lg border-b border-orange-400/30 sticky top-0 z-50 transition-all duration-500 hover:bg-orange-500/90 hover:shadow-xl animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* Left Side - Logo and Search */}
            <div className="flex items-center space-x-8 flex-1">
                             {/* Logo */}
               <Link href="/" className="flex items-center group">
                 <div className="flex items-center space-x-3 transform transition-all duration-300 group-hover:scale-105">
                   <div className="w-12 h-12 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:bg-white border border-white/30">
                     <svg className="w-7 h-7 text-orange-700 transform transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                     </svg>
                   </div>
                   <span className="text-3xl font-bold text-white drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-300">ShareHub</span>
                 </div>
               </Link>

                                                           {/* Location Search */}
                <div className="relative location-search group">
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <svg className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500 transition-all duration-300 group-hover:text-orange-600 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          searchPlaces(e.target.value);
                          setShowLocationDropdown(true);
                        }}
                        onFocus={() => setShowLocationDropdown(true)}
                        className="w-80 pl-12 pr-14 py-4 border-2 border-orange-200/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-200/60 focus:border-orange-300/50 text-sm bg-white/95 backdrop-blur-md hover:bg-white hover:border-orange-300/60 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] focus:scale-[1.02]"
                        placeholder="Search location..."
                      />
                      <button
                        onClick={getCurrentLocation}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-orange-500 hover:text-orange-600 hover:bg-gradient-to-r hover:from-orange-50/80 hover:to-pink-50/80 rounded-full transition-all duration-300 cursor-pointer hover:scale-125 active:scale-95 shadow-sm hover:shadow-md group border border-orange-200/30 hover:border-orange-300/60"
                        title="📍 Use current location"
                      >
                        <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                 
                 {/* Location Dropdown */}
                 {showLocationDropdown && (location.length > 0 || searchResults.length > 0) && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-orange-200/40 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto animate-fade-in">
                     {isSearching ? (
                       <div className="p-4 text-center text-gray-500">
                         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mx-auto"></div>
                         <span className="ml-2">Searching...</span>
                       </div>
                     ) : searchResults.length > 0 ? (
                       searchResults.map((place, index) => (
                         <div
                           key={index}
                           onClick={() => {
                             setLocation(place.display_name.split(',')[0]);
                             setShowLocationDropdown(false);
                             setSearchResults([]);
                           }}
                           className="p-4 hover:bg-orange-50/80 cursor-pointer border-b border-gray-100/50 last:border-b-0 transition-all duration-200 hover:scale-[1.01] transform"
                         >
                           <div className="font-medium text-gray-900">{place.display_name.split(',')[0]}</div>
                           <div className="text-sm text-gray-600">{place.display_name.split(',').slice(1, 3).join(',')}</div>
                         </div>
                       ))
                     ) : location.length > 0 ? (
                       <div className="p-4 text-gray-500 text-center">No results found</div>
                     ) : null}
                   </div>
                 )}
               </div>

               {/* Product Search */}
               <form onSubmit={(e) => {
                 e.preventDefault();
                 if (searchQuery.trim()) {
                   router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                 }
               }} className="relative w-80 group">
                 <input
                   type="text"
                   placeholder="Search 'Cars'"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full px-12 py-4 border-2 border-orange-200/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-200/60 focus:border-orange-300/50 text-sm bg-white/95 backdrop-blur-md hover:bg-white hover:border-orange-300/60 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] focus:scale-[1.02]"
                 />
                 <svg className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-orange-500 transition-all duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                 </svg>
               </form>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-4">
              <button className="group relative text-white hover:text-orange-50 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/40 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-300/20 to-pink-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-1.5">
                  <span className="text-sm font-bold tracking-wide">🌍 ENGLISH</span>
                  <svg className="w-4 h-4 transition-all duration-500 group-hover:rotate-180 group-hover:text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              <button className="group relative text-white hover:text-pink-100 p-3 rounded-full bg-gradient-to-br from-pink-400/20 to-red-400/20 hover:from-pink-400/40 hover:to-red-400/40 transition-all duration-300 backdrop-blur-sm border-2 border-pink-300/30 hover:border-pink-300/60 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl animate-pulse hover:animate-bounce overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-200/20 to-red-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                <svg className="relative w-5 h-5 transition-all duration-300 group-hover:scale-125 drop-shadow-lg" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping"></div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
              </button>
              
              {/* Profile/Login Section */}
              {!loading && (
                <>
                  {user ? (
                    <div className="relative group">
                      <button 
                        onClick={() => router.push('/profile')}
                        className="group relative text-white hover:text-blue-100 p-3 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 hover:from-blue-400/40 hover:to-purple-400/40 transition-all duration-300 backdrop-blur-sm border-2 border-blue-300/30 hover:border-purple-300/60 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl overflow-hidden"
                        title="👤 Profile"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-purple-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <svg className="relative w-5 h-5 transition-all duration-300 group-hover:scale-125 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                      </button>
                      
                      {/* Profile Dropdown */}
                      <div className="absolute right-0 top-full mt-3 w-56 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-gradient-to-r from-blue-200/50 to-purple-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-purple-50/80"></div>
                        <div className="relative py-3">
                          <div className="px-5 py-3 text-sm text-gray-700 border-b border-gradient-to-r from-blue-100/60 to-purple-100/60">
                            <p className="font-bold text-gray-800 flex items-center space-x-2">
                              <span>👋</span><span>{user.email}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => router.push('/profile')}
                            className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 transition-all duration-200 hover:scale-[1.02] transform font-medium flex items-center group/item space-x-3"
                          >
                            <span className="text-lg group-hover/item:animate-bounce">🏠</span>
                            <span>My Profile</span>
                          </button>
                          <button
                            onClick={handleSignOut}
                            className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50/80 hover:to-pink-50/80 transition-all duration-200 hover:scale-[1.02] transform font-medium flex items-center group/item space-x-3"
                          >
                            <span className="text-lg group-hover/item:animate-bounce">👋</span>
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link href="/login" className="group relative text-white hover:text-cyan-100 font-bold px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-400/20 hover:from-cyan-400/40 hover:to-blue-400/40 transition-all duration-300 backdrop-blur-sm border-2 border-cyan-300/30 hover:border-blue-300/60 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-200/20 to-blue-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative flex items-center space-x-1.5">
                        🔑 <span>Login</span>
                      </span>
                    </Link>
                  )}
                  
                                     <button 
                     onClick={() => setShowListingPopup(true)}
                     className="group relative bg-gradient-to-r from-yellow-300/90 to-orange-300/90 hover:from-yellow-300 hover:to-orange-300 backdrop-blur-md text-orange-800 px-6 py-3 rounded-full font-black hover:bg-white transition-all duration-300 shadow-xl hover:shadow-2xl border-3 border-yellow-200/60 hover:border-yellow-300/80 transform hover:scale-110 active:scale-95 hover:-translate-y-1 overflow-hidden animate-pulse hover:animate-bounce"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-yellow-100/50 to-orange-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     <span className="relative flex items-center font-black tracking-wide space-x-2">
                       <span>✨</span><span>+ LIST</span><span>✨</span>
                     </span>
                     <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-400 rounded-full animate-ping"></div>
                     <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                       <span className="text-xs text-white font-bold">!</span>
                     </div>
                   </button>
                </>
              )}
            </div>
          </div>
                 </div>
       </header>

       {/* Listing Popup */}
       {showListingPopup && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/30">
             {/* Header */}
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <h2 className="text-2xl font-bold text-gray-900">Create New Listing</h2>
               <button
                 onClick={handleCloseListingPopup}
                 className="text-gray-400 hover:text-gray-600 transition-colors"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>

             {/* Form */}
             <form onSubmit={handleListingSubmit} className="p-6 space-y-6">
               {/* Title */}
               <div>
                 <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                   Item Title *
                 </label>
                 <input
                   type="text"
                   id="title"
                   name="title"
                   value={listingForm.title}
                   onChange={handleListingFormChange}
                   required
                   className="w-full px-4 py-3 border-2 border-orange-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent transition-all duration-200"
                   placeholder="e.g., Mountain Bike, DSLR Camera, Camping Tent"
                 />
               </div>

               {/* Description */}
               <div>
                 <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                   Description
                 </label>
                 <textarea
                   id="description"
                   name="description"
                   value={listingForm.description}
                   onChange={handleListingFormChange}
                   rows="3"
                   className="w-full px-4 py-3 border-2 border-orange-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent transition-all duration-200 resize-none"
                   placeholder="Describe your item, its features, and any important details..."
                 />
               </div>

               {/* Category Selection */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-3">
                   Category *
                 </label>
                 <div className="flex flex-wrap gap-2">
                   {["Electronics", "Sports", "Outdoor", "Tools", "Vehicles", "Furniture", "Clothing", "Books", "Other"].map((category) => (
                     <button
                       key={category}
                       type="button"
                       onClick={() => selectCategory(category)}
                       className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
                         selectedCategory === category
                           ? "bg-orange-100 text-orange-700 border-orange-300"
                           : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                       }`}
                     >
                       {category}
                     </button>
                   ))}
                 </div>
                 {selectedCategory && (
                   <p className="text-sm text-gray-500 mt-2">
                     Selected: {selectedCategory}
                   </p>
                 )}
               </div>

               {/* Condition Selection */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-3">
                   Condition *
                 </label>
                 <div className="flex flex-wrap gap-2">
                   {["New", "Like New", "Excellent", "Good", "Fair", "Poor"].map((condition) => (
                     <button
                       key={condition}
                       type="button"
                       onClick={() => selectCondition(condition)}
                       className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
                         selectedCondition === condition
                           ? "bg-orange-100 text-orange-700 border-orange-300"
                           : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                       }`}
                     >
                       {condition}
                     </button>
                   ))}
                 </div>
                 {selectedCondition && (
                   <p className="text-sm text-gray-500 mt-2">
                     Selected: {selectedCondition}
                   </p>
                 )}
               </div>

               {/* Price */}
               <div>
                 <label htmlFor="price_per_day" className="block text-sm font-medium text-gray-700 mb-2">
                   Price per Day (₹) *
                 </label>
                 <input
                   type="number"
                   id="price_per_day"
                   name="price_per_day"
                   value={listingForm.price_per_day}
                   onChange={handleListingFormChange}
                   required
                   min="0"
                   step="0.01"
                   className="w-full px-4 py-3 border-2 border-orange-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent transition-all duration-200"
                   placeholder="0.00"
                 />
               </div>

               {/* Image Upload */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Item Image
                 </label>
                 <div className="space-y-3">
                   {!imagePreview ? (
                     <div className="border-2 border-dashed border-orange-200/60 rounded-lg p-6 text-center hover:border-orange-300/80 transition-colors">
                       <input
                         type="file"
                         id="image_upload"
                         accept="image/*"
                         onChange={handleImageChange}
                         className="hidden"
                       />
                       <label htmlFor="image_upload" className="cursor-pointer">
                         <svg className="w-12 h-12 text-orange-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                         </svg>
                         <p className="text-sm text-gray-600">
                           <span className="text-orange-500 font-medium">Click to upload</span> or drag and drop
                         </p>
                         <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                       </label>
                     </div>
                   ) : (
                     <div className="relative">
                       <img
                         src={imagePreview}
                         alt="Preview"
                         className="w-full h-48 object-cover rounded-lg border-2 border-orange-200/60"
                       />
                       <button
                         type="button"
                         onClick={removeImage}
                         className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                         </svg>
                       </button>
                     </div>
                   )}
                 </div>
               </div>

               {/* Submit Message */}
               {submitMessage && (
                 <div className={`p-4 rounded-lg ${
                   submitMessage.includes("✅") 
                     ? "bg-green-50 text-green-800 border border-green-200" 
                     : "bg-red-50 text-red-800 border border-red-200"
                 }`}>
                   {submitMessage}
                 </div>
               )}

               {/* Action Buttons */}
               <div className="flex items-center justify-end space-x-4 pt-4">
                 <button
                   type="button"
                   onClick={handleCloseListingPopup}
                   className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   disabled={isSubmitting}
                   className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isSubmitting ? "Creating..." : "Create Listing"}
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
     </>
   );
 }
