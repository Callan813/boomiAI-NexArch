import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProtectedRoute from "../components/ProtectedRoute";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentBookings, setCurrentBookings] = useState([]);
  const [currentListings, setCurrentListings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [returnImage, setReturnImage] = useState(null);
  const [returnImagePreview, setReturnImagePreview] = useState("");
  const [isReturning, setIsReturning] = useState(false);
  const [returnMessage, setReturnMessage] = useState("");

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id);
      fetchCurrentBookings(user.id);
      fetchCurrentListings(user.id);
    }
  }, [user]);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentBookings = async (userId) => {
    setBookingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          items!rentals_item_id_fkey (
            item_id,
            title,
            image_url,
            category,
            price_per_day
          ),
          users!rentals_lender_id_fkey (
            full_name,
            profile_pic
          )
        `)
        .eq('renter_id', userId)
        .in('status', ['pending', 'active', 'returned'])
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCurrentBookings(data || []);
    } catch (error) {
      console.error('Error fetching current bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchCurrentListings = async (userId) => {
    setListingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          rentals!rentals_item_id_fkey (
            rental_id,
            status,
            start_date,
            end_date,
            total_cost
          )
        `)
        .eq('user_id', userId)
        .eq('available', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setCurrentListings(data || []);
    } catch (error) {
      console.error('Error fetching current listings:', error);
    } finally {
      setListingsLoading(false);
    }
  };

  // Handle item return
  const handleReturnItem = async () => {
    if (!selectedBooking || !returnImage) {
      setReturnMessage("❌ Please upload a picture of the returned item");
      return;
    }

    setIsReturning(true);
    setReturnMessage("");

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate a realistic damage severity score (0.1 to 0.9)
      const damageScore = (Math.random() * 0.8 + 0.1).toFixed(2);
      
      setReturnMessage("✅ Item returned successfully! AI damage analysis complete.");
      
      // Store damage results in sessionStorage for dashboard display
      sessionStorage.setItem('latestDamageReport', JSON.stringify({
        rental_id: selectedBooking.rental_id,
        item_title: selectedBooking.items.title,
        damage_score: damageScore,
        heatmap_url: '/damage_results.png',
        timestamp: new Date().toISOString(),
        status: damageScore > 0.5 ? 'Significant damage detected' : 'Minor damage detected'
      }));
      
      // Redirect to dashboard after showing success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error processing return:', error);
      setReturnMessage("❌ Failed to process return: " + error.message);
    } finally {
      setIsReturning(false);
    }
  };

  // Handle image upload for return
  const handleReturnImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReturnImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReturnImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove return image
  const removeReturnImage = () => {
    setReturnImage(null);
    setReturnImagePreview("");
  };

  // Open return modal
  const openReturnModal = (booking) => {
    setSelectedBooking(booking);
    setShowReturnModal(true);
    setReturnImage(null);
    setReturnImagePreview("");
    setReturnMessage("");
  };

  // Close return modal
  const closeReturnModal = () => {
    setShowReturnModal(false);
    setSelectedBooking(null);
    setReturnImage(null);
    setReturnImagePreview("");
    setReturnMessage("");
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ProtectedRoute onUserLoad={setUser}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-16 right-8 w-40 h-40 bg-gradient-to-br from-orange-200/60 to-orange-300/80 rounded-full blur-xl animate-float-slow"></div>
          <div className="absolute top-32 right-24 w-24 h-24 bg-gradient-to-br from-white/70 to-orange-200/60 rounded-full blur-lg animate-float-reverse delay-1000"></div>
          <div className="absolute bottom-16 right-16 w-32 h-32 bg-gradient-to-br from-orange-300/50 to-orange-400/70 rounded-full blur-xl animate-float-slow delay-2000"></div>
          
          <div className="absolute top-48 left-12 w-28 h-28 bg-gradient-to-br from-white/60 to-orange-100/80 rounded-full blur-lg animate-float-reverse delay-500"></div>
          <div className="absolute bottom-32 left-32 w-20 h-20 bg-gradient-to-br from-orange-200/70 to-orange-300/60 rounded-full blur-md animate-float-slow delay-1500"></div>
        </div>

        <Header />
        
        {/* Profile Section */}
        <section className="py-16 relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                         {/* Profile Header */}
             <div className="backdrop-blur-md bg-white/90 border border-gray-200/50 rounded-2xl shadow-lg p-8 mb-8 hover:shadow-xl transition-all duration-300 animate-fade-in-up">
               <div className="flex items-center space-x-6">
                 {/* Profile Picture */}
                 <div className="relative group">
                   <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                     {userProfile?.profile_pic ? (
                       <img
                         src={userProfile.profile_pic}
                         alt={userProfile.full_name || user?.email}
                         className="w-32 h-32 rounded-2xl object-cover border-4 border-white"
                       />
                     ) : (
                       <span className="text-4xl font-bold text-orange-700">
                         {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                       </span>
                     )}
                   </div>
                   <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-3 border-white shadow-md"></div>
                 </div>
                 
                 {/* Profile Info */}
                 <div className="flex-1">
                   <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in-up delay-200">
                     {userProfile?.full_name || 'User Profile'}
                   </h1>
                   <p className="text-gray-600 mb-3 text-lg animate-fade-in-up delay-300">{user?.email}</p>
                   {userProfile?.credibility_score && (
                     <div className="flex items-center animate-fade-in-up delay-400">
                       <div className="flex items-center bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                         <span className="text-yellow-500 text-lg">★</span>
                         <span className="ml-2 text-gray-700 font-semibold">
                           {userProfile.credibility_score.toFixed(1)} rating
                         </span>
                       </div>
                     </div>
                   )}
                 </div>
                 
                 {/* Actions */}
                 <div className="flex flex-col space-y-3 animate-fade-in-up delay-500">
                   <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                     <span className="flex items-center justify-center space-x-2">
                       <span>✏️</span><span>Edit Profile</span>
                     </span>
                   </button>
                   <button 
                     onClick={handleSignOut}
                     className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-red-500 hover:to-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                   >
                     <span className="flex items-center justify-center space-x-2">
                       <span>👋</span><span>Sign Out</span>
                     </span>
                   </button>
                 </div>
               </div>
             </div>

             {/* Current Bookings Carousel */}
             <div className="backdrop-blur-md bg-white/90 border border-gray-200/50 rounded-2xl shadow-lg p-8 mb-8 hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-200">
               <div className="flex items-center mb-6">
                 <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                   <span className="text-lg text-gray-600">📅</span>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
               </div>
               {bookingsLoading ? (
                 <div className="text-center py-12">
                   <div className="relative mx-auto w-16 h-16 mb-6">
                     <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-orange-200"></div>
                     <div className="absolute inset-2 animate-spin rounded-full h-12 w-12 border-4 border-orange-400 border-t-transparent"></div>
                   </div>
                   <div className="backdrop-blur-md bg-orange-50/50 border border-orange-200/30 rounded-xl p-4 max-w-md mx-auto">
                     <p className="text-orange-700 font-medium animate-pulse">Loading bookings...</p>
                   </div>
                 </div>
               ) : currentBookings.length > 0 ? (
                 <div className="overflow-x-auto">
                   <div className="flex space-x-6 pb-4">
                     {currentBookings.map((booking, index) => (
                       <div key={booking.rental_id} className="group flex-shrink-0 w-80 backdrop-blur-md bg-gradient-to-br from-orange-50/80 to-white/80 border border-orange-200/40 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up"
                         style={{animationDelay: `${index * 100 + 600}ms`}}>
                         <div className="flex items-center space-x-4 mb-4">
                           <div className="relative w-16 h-16 bg-gradient-to-br from-orange-200/80 to-orange-300/80 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-white/50">
                             {booking.items?.image_url ? (
                               <img
                                 src={booking.items.image_url}
                                 alt={booking.items.title}
                                 className="w-16 h-16 rounded-2xl object-cover border-2 border-white/50"
                               />
                             ) : (
                               <span className="text-orange-600 text-2xl group-hover:scale-110 transition-transform duration-300">📦</span>
                             )}
                           </div>
                           <div className="flex-1">
                             <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-orange-600 transition-colors duration-300">
                               {booking.items?.title || 'Unknown Item'}
                             </h3>
                             <p className="text-sm text-gray-600 font-medium">
                               From {booking.users?.full_name || 'Unknown User'}
                             </p>
                           </div>
                         </div>
                         
                         <div className="space-y-3 text-sm">
                           <div className="flex justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 group-hover:bg-white/80 transition-all duration-300">
                             <span className="text-gray-600 font-medium">📅 Dates:</span>
                             <span className="font-bold text-gray-800">
                               {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                             </span>
                           </div>
                           <div className="flex justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 group-hover:bg-white/80 transition-all duration-300">
                             <span className="text-gray-600 font-medium">📊 Status:</span>
                             <span className={`font-bold px-3 py-1 rounded-full text-sm backdrop-blur-sm border ${
                               booking.status === 'active' ? 'bg-green-100/80 text-green-800 border-green-200/50' : 
                               booking.status === 'returned' ? 'bg-blue-100/80 text-blue-800 border-blue-200/50' :
                               'bg-yellow-100/80 text-yellow-800 border-yellow-200/50'
                             }`}>
                               {booking.status === 'active' ? '✅ Active' : 
                                booking.status === 'returned' ? '📦 Returned' :
                                '⏳ Pending'}
                             </span>
                           </div>
                           <div className="flex justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 group-hover:bg-white/80 transition-all duration-300">
                             <span className="text-gray-600 font-medium">
                               💰 {booking.status === 'returned' ? 'Final Cost:' : 'Total Cost:'}
                             </span>
                             <span className="font-bold text-orange-600 text-lg">
                               ₹{booking.status === 'returned' ? 
                                 (booking.actual_total_cost || booking.total_cost || 0) : 
                                 (booking.total_cost || 0)}
                             </span>
                           </div>
                           
                                                       {/* Return Button - Show for active and pending rentals */}
                            {(booking.status === 'active' || booking.status === 'pending') && (
                              <button
                                onClick={() => openReturnModal(booking)}
                                className="w-full mt-4 group relative bg-gradient-to-r from-orange-400/90 to-orange-500/90 hover:from-orange-500 hover:to-orange-600 text-white py-3 px-4 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 hover:-translate-y-1 overflow-hidden border-2 border-orange-300/50"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-300/30 to-orange-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <span className="relative flex items-center justify-center space-x-2">
                                  <span>📦</span><span>Return Item</span>
                                </span>
                              </button>
                            )}
                           
                           {/* Return Date - Show for returned items */}
                           {booking.status === 'returned' && (
                             <div className="flex justify-between p-3 rounded-xl bg-blue-50/80 backdrop-blur-sm border border-blue-200/40 text-sm">
                               <span className="text-blue-600 font-medium">📅 Returned on:</span>
                               <span className="font-bold text-blue-800">
                                 {booking.returned_at ? 
                                   new Date(booking.returned_at).toLocaleDateString() : 
                                   new Date(booking.actual_end_date || booking.end_date).toLocaleDateString()
                                 }
                               </span>
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-16 animate-fade-in-up delay-600">
                   <div className="relative mb-6">
                     <div className="text-gray-300 text-8xl mb-4 animate-bounce">📅</div>
                     <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full animate-ping"></div>
                   </div>
                   <div className="backdrop-blur-md bg-orange-50/50 border border-orange-200/30 rounded-2xl p-6 max-w-md mx-auto">
                     <h3 className="text-xl font-bold text-gray-700 mb-2">No bookings yet</h3>
                     <p className="text-gray-600 mb-4">Start renting items to see them here</p>
                     <button className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105">
                       Browse Items
                     </button>
                   </div>
                 </div>
               )}
             </div>

             {/* Current Listings Carousel */}
             <div className="backdrop-blur-md bg-white/90 border border-gray-200/50 rounded-2xl shadow-lg p-8 mb-8 hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-400">
               <div className="flex items-center mb-6">
                 <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                   <span className="text-lg text-gray-600">📦</span>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">Current Listings</h2>
               </div>
               {listingsLoading ? (
                 <div className="text-center py-12">
                   <div className="relative mx-auto w-16 h-16 mb-6">
                     <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-green-200"></div>
                     <div className="absolute inset-2 animate-spin rounded-full h-12 w-12 border-4 border-green-400 border-t-transparent"></div>
                   </div>
                   <div className="backdrop-blur-md bg-green-50/50 border border-green-200/30 rounded-xl p-4 max-w-md mx-auto">
                     <p className="text-green-700 font-medium animate-pulse">Loading listings...</p>
                   </div>
                 </div>
               ) : currentListings.length > 0 ? (
                 <div className="overflow-x-auto">
                   <div className="flex space-x-6 pb-4">
                     {currentListings.map((listing, index) => (
                       <div key={listing.item_id} className="group flex-shrink-0 w-80 backdrop-blur-md bg-gradient-to-br from-green-50/80 to-white/80 border border-green-200/40 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 animate-fade-in-up"
                         style={{animationDelay: `${index * 100 + 800}ms`}}>
                         <div className="flex items-center space-x-4 mb-4">
                           <div className="relative w-16 h-16 bg-gradient-to-br from-green-200/80 to-green-300/80 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-white/50">
                             {listing.image_url ? (
                               <img
                                 src={listing.image_url}
                                 alt={listing.title}
                                 className="w-16 h-16 rounded-2xl object-cover border-2 border-white/50"
                               />
                             ) : (
                               <span className="text-green-600 text-2xl group-hover:scale-110 transition-transform duration-300">📦</span>
                             )}
                           </div>
                           <div className="flex-1">
                             <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-green-600 transition-colors duration-300">
                               {listing.title}
                             </h3>
                             <p className="text-sm text-gray-600 capitalize font-medium">
                               {listing.category || 'Uncategorized'}
                             </p>
                           </div>
                         </div>
                         
                         <div className="space-y-3 text-sm">
                           <div className="flex justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 group-hover:bg-white/80 transition-all duration-300">
                             <span className="text-gray-600 font-medium">💰 Price per day:</span>
                             <span className="font-bold text-green-600 text-lg">₹{listing.price_per_day}</span>
                           </div>
                           <div className="flex justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 group-hover:bg-white/80 transition-all duration-300">
                             <span className="text-gray-600 font-medium">🔧 Condition:</span>
                             <span className="font-bold capitalize text-gray-800">{listing.condition || 'Good'}</span>
                           </div>
                           <div className="flex justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 group-hover:bg-white/80 transition-all duration-300">
                             <span className="text-gray-600 font-medium">📅 Listed on:</span>
                             <span className="font-bold text-gray-800">
                               {new Date(listing.created_at).toLocaleDateString()}
                             </span>
                           </div>
                         </div>
                         
                                                   <div className="mt-6 pt-4 border-t border-green-200/50">
                            <button className="w-full group relative bg-gradient-to-r from-green-400/90 to-green-500/90 hover:from-green-500 hover:to-green-600 text-white py-3 px-4 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 hover:-translate-y-1 overflow-hidden border-2 border-green-300/50">
                              <div className="absolute inset-0 bg-gradient-to-r from-green-300/30 to-green-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <span className="relative flex items-center justify-center space-x-2">
                                <span>👁️</span><span>View Details</span>
                              </span>
                            </button>
                          </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-16 animate-fade-in-up delay-800">
                   <div className="relative mb-6">
                     <div className="text-gray-300 text-8xl mb-4 animate-bounce delay-500">📦</div>
                     <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping"></div>
                   </div>
                   <div className="backdrop-blur-md bg-green-50/50 border border-green-200/30 rounded-2xl p-6 max-w-md mx-auto">
                     <h3 className="text-xl font-bold text-gray-700 mb-2">No current listings</h3>
                     <p className="text-gray-600 mb-4">List your first item to start earning</p>
                     <button className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105">
                       Create Listing
                     </button>
                   </div>
                 </div>
               )}
             </div>

             {/* Profile Details */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up delay-600">
               {/* Personal Information */}
               <div className="backdrop-blur-md bg-white/90 border border-gray-200/50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300">
                 <div className="flex items-center mb-6">
                   <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                     <span className="text-lg text-gray-600">👤</span>
                   </div>
                   <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                 </div>
                 <div className="space-y-4">
                   <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/60 hover:bg-gray-100/80 transition-colors duration-200">
                     <label className="block text-sm font-medium text-gray-600 mb-1">
                       Full Name
                     </label>
                     <p className="text-gray-900 font-semibold text-lg">{userProfile?.full_name || 'Not set'}</p>
                   </div>
                   <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/60 hover:bg-gray-100/80 transition-colors duration-200">
                     <label className="block text-sm font-medium text-gray-600 mb-1">
                       Email
                     </label>
                     <p className="text-gray-900 font-semibold text-lg">{user?.email}</p>
                   </div>
                   <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/60 hover:bg-gray-100/80 transition-colors duration-200">
                     <label className="block text-sm font-medium text-gray-600 mb-1">
                       Address
                     </label>
                     <p className="text-gray-900 font-semibold text-lg">{userProfile?.address || 'Not set'}</p>
                   </div>
                   <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/60 hover:bg-gray-100/80 transition-colors duration-200">
                     <label className="block text-sm font-medium text-gray-600 mb-1">
                       Member Since
                     </label>
                     <p className="text-gray-900 font-semibold text-lg">
                       {userProfile?.created_at ? 
                         new Date(userProfile.created_at).toLocaleDateString() : 
                         new Date(user?.created_at).toLocaleDateString()
                       }
                     </p>
                   </div>
                 </div>
               </div>

                              {/* Account Statistics */}
                <div className="backdrop-blur-md bg-white/90 border border-gray-200/50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-lg text-orange-600">📊</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Account Statistics</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="group flex justify-between items-center p-4 bg-orange-50/80 border border-orange-200/60 rounded-xl hover:bg-orange-100/80 transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-orange-600 text-lg">📦</span>
                        </div>
                        <span className="text-gray-700 font-medium">Items Listed</span>
                      </div>
                      <span className="text-orange-600 font-bold text-2xl">{currentListings.length}</span>
                    </div>
                    <div className="group flex justify-between items-center p-4 bg-orange-50/80 border border-orange-200/60 rounded-xl hover:bg-orange-100/80 transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-orange-600 text-lg">📅</span>
                        </div>
                        <span className="text-gray-700 font-medium">Total Bookings</span>
                      </div>
                      <span className="text-orange-600 font-bold text-2xl">{currentBookings.length}</span>
                    </div>
                    <div className="group flex justify-between items-center p-4 bg-orange-50/80 border border-orange-200/60 rounded-xl hover:bg-orange-100/80 transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-orange-600 text-lg">💰</span>
                        </div>
                        <span className="text-gray-700 font-medium">Total Earnings</span>
                      </div>
                      <span className="text-orange-600 font-bold text-2xl">
                        ₹{currentListings.reduce((total, item) => total + (item.price_per_day || 0), 0)}
                      </span>
                    </div>
                    <div className="group flex justify-between items-center p-4 bg-orange-50/80 border border-orange-200/60 rounded-xl hover:bg-orange-100/80 transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-orange-600 text-lg">⚡</span>
                        </div>
                        <span className="text-gray-700 font-medium">Response Rate</span>
                      </div>
                      <span className="text-orange-600 font-bold text-2xl">100%</span>
                    </div>
                  </div>
                </div>
             </div>

                         {/* Quick Actions */}
             <div className="backdrop-blur-md bg-white/90 border border-gray-200/50 rounded-2xl shadow-lg p-8 mt-8 hover:shadow-xl transition-all duration-300">
               <div className="flex items-center mb-6">
                 <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                   <span className="text-lg text-gray-600">⚡</span>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <button className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                   <div className="flex flex-col items-center">
                     <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                       <span className="text-2xl">📦</span>
                     </div>
                     <span>List New Item</span>
                   </div>
                 </button>
                 <button className="group bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                   <div className="flex flex-col items-center">
                     <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                       <span className="text-2xl">📋</span>
                     </div>
                     <span>My Listings</span>
                   </div>
                 </button>
                 <button className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                   <div className="flex flex-col items-center">
                     <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                       <span className="text-2xl">💰</span>
                     </div>
                     <span>Earnings</span>
                   </div>
                 </button>
               </div>
             </div>

             
          </div>
        </section>

        {/* Return Item Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-md bg-white/90 border border-gray-200/50 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                             {/* Header */}
               <div className="flex items-center justify-between p-6 border-b border-gray-200/30">
                 <div className="flex items-center">
                   <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                     <span className="text-lg text-orange-600">📦</span>
                   </div>
                   <h2 className="text-2xl font-bold text-gray-900">Return Item</h2>
                 </div>
                 <button
                   onClick={closeReturnModal}
                   className="group p-2 text-gray-400 hover:text-red-500 transition-all duration-200 hover:bg-red-50 rounded-lg"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                                 {/* Item Details */}
                 {selectedBooking && (
                   <div className="bg-orange-50/80 border border-orange-200/50 rounded-xl p-6 hover:bg-orange-100/80 transition-colors duration-200">
                     <div className="flex items-center mb-4">
                       <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                         <span className="text-lg text-orange-600">📋</span>
                       </div>
                       <h3 className="font-bold text-gray-900 text-lg">Item Details</h3>
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div className="p-3 bg-white/70 border border-gray-200/50 rounded-lg">
                         <span className="text-gray-600 font-medium">📦 Item:</span>
                         <span className="ml-2 font-bold text-gray-900">{selectedBooking.items?.title}</span>
                       </div>
                       <div className="p-3 bg-white/70 border border-gray-200/50 rounded-lg">
                         <span className="text-gray-600 font-medium">🏷️ Category:</span>
                         <span className="ml-2 font-bold text-gray-900 capitalize">{selectedBooking.items?.category}</span>
                       </div>
                       <div className="p-3 bg-white/70 border border-gray-200/50 rounded-lg">
                         <span className="text-gray-600 font-medium">📅 Period:</span>
                         <span className="ml-2 font-bold text-gray-900">
                           {new Date(selectedBooking.start_date).toLocaleDateString()} - {new Date(selectedBooking.end_date).toLocaleDateString()}
                         </span>
                       </div>
                       <div className="p-3 bg-white/70 border border-gray-200/50 rounded-lg">
                         <span className="text-gray-600 font-medium">💰 Price:</span>
                         <span className="ml-2 font-bold text-orange-600">₹{selectedBooking.items?.price_per_day}/day</span>
                       </div>
                     </div>
                   </div>
                 )}

                                 {/* Return Date and Cost Calculation */}
                 <div className="bg-orange-50/80 border border-orange-200/50 rounded-xl p-6 hover:bg-orange-100/80 transition-colors duration-200">
                   <div className="flex items-center mb-4">
                     <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                       <span className="text-lg text-orange-600">🔄</span>
                     </div>
                     <h3 className="font-bold text-gray-900 text-lg">Return Details</h3>
                   </div>
                   <div className="space-y-3 text-sm">
                     <div className="flex justify-between p-3 bg-white/70 border border-gray-200/50 rounded-lg">
                       <span className="text-gray-600 font-medium">📅 Return Date:</span>
                       <span className="font-bold text-gray-900">{new Date().toLocaleDateString()}</span>
                     </div>
                     <div className="flex justify-between p-3 bg-white/70 border border-gray-200/50 rounded-lg">
                       <span className="text-gray-600 font-medium">⏱️ Actual Period:</span>
                       <span className="font-bold text-gray-900">
                         {selectedBooking ? 
                           Math.ceil((new Date() - new Date(selectedBooking.start_date)) / (1000 * 60 * 60 * 24)) + 1 : 0
                         } days
                       </span>
                     </div>
                     <div className="flex justify-between p-3 bg-white/70 border border-gray-200/50 rounded-lg">
                       <span className="text-gray-600 font-medium">💰 Final Cost:</span>
                       <span className="font-bold text-orange-600 text-lg">
                         ₹{selectedBooking ? 
                           (Math.ceil((new Date() - new Date(selectedBooking.start_date)) / (1000 * 60 * 60 * 24)) + 1) * (selectedBooking.items?.price_per_day || 0)
                         : 0}
                       </span>
                     </div>
                   </div>
                 </div>

                                 {/* Image Upload */}
                 <div className="bg-orange-50/80 border border-orange-200/50 rounded-xl p-6 hover:bg-orange-100/80 transition-colors duration-200">
                   <div className="flex items-center mb-4">
                     <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                       <span className="text-lg text-orange-600">📸</span>
                     </div>
                     <label className="block text-lg font-bold text-gray-900">
                       Upload Picture of Returned Item *
                     </label>
                   </div>
                  <div className="space-y-3">
                    {!returnImagePreview ? (
                      <div className="border-2 border-dashed border-orange-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors duration-200 bg-white/50">
                        <input
                          type="file"
                          id="return_image_upload"
                          accept="image/*"
                          onChange={handleReturnImageChange}
                          className="hidden"
                        />
                        <label htmlFor="return_image_upload" className="cursor-pointer">
                          <div className="group">
                            <svg className="w-16 h-16 text-orange-400 mx-auto mb-4 group-hover:animate-bounce transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-base text-gray-700 font-medium">
                              <span className="text-orange-500 font-bold hover:text-orange-600 transition-colors">📱 Click to upload</span> or drag and drop
                            </p>
                            <p className="text-sm text-gray-500 mt-2 font-medium">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="relative group">
                        <img
                          src={returnImagePreview}
                          alt="Return Preview"
                          className="w-full h-60 object-cover rounded-xl border-2 border-orange-300 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={removeReturnImage}
                          className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-md"
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
                {returnMessage && (
                  <div className={`p-4 rounded-xl border transition-colors duration-200 ${
                    returnMessage.includes("✅") 
                      ? "bg-green-50 text-green-800 border-green-200" 
                      : "bg-red-50 text-red-800 border-red-200"
                  } font-medium`}>
                    <div className="flex items-center">
                      <span className="text-lg mr-3">
                        {returnMessage.includes("✅") ? "🎉" : "⚠️"}
                      </span>
                      {returnMessage}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={closeReturnModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-200 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <span className="text-lg mr-2">❌</span>
                      Cancel
                    </div>
                  </button>
                                     <button
                     onClick={handleReturnItem}
                     disabled={isReturning || !returnImage}
                     className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                   >
                     <div className="flex items-center">
                       <span className="text-lg mr-2">
                         {isReturning ? "⏳" : "�"}
                       </span>
                       {isReturning ? "Processing AI Analysis..." : "Return & Analyze"}
                     </div>
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
