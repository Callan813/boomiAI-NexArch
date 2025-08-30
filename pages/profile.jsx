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
      const today = new Date();
      const startDate = new Date(selectedBooking.start_date);
      const endDate = new Date(selectedBooking.end_date);
      
      // Calculate actual rental period and cost
      let actualEndDate = today;
      if (today > endDate) {
        actualEndDate = endDate; // Don't charge extra for late returns
      }
      
      const actualDays = Math.ceil((actualEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const actualCost = selectedBooking.items.price_per_day * actualDays;
      
      // Create damage report record
      const { error: damageReportError } = await supabase
        .from('damage_reports')
        .insert([
          {
            rental_id: selectedBooking.rental_id,
            item_id: selectedBooking.items.item_id,
            renter_id: user.id,
            lender_id: selectedBooking.lender_id,
            report_date: today.toISOString().split('T')[0],
            damage_description: 'Item returned',
            image_before_url: selectedBooking.items.image_url,
            image_after_url: returnImagePreview,
            status: 'pending_review'
          }
        ]);

      if (damageReportError) {
        throw damageReportError;
      }

      // Update rental status to 'returned' and add return details
      const { error: rentalUpdateError } = await supabase
        .from('rentals')
        .update({
          status: 'returned',
          actual_end_date: today.toISOString().split('T')[0],
          actual_total_cost: actualCost,
          returned_at: new Date().toISOString()
        })
        .eq('rental_id', selectedBooking.rental_id);

      if (rentalUpdateError) {
        throw rentalUpdateError;
      }

      // Update item availability back to true
      const { error: itemUpdateError } = await supabase
        .from('items')
        .update({ available: true })
        .eq('item_id', selectedBooking.items.item_id);

      if (itemUpdateError) {
        console.error('Error updating item availability:', itemUpdateError);
      }

      setReturnMessage("✅ Item returned successfully! Damage report created.");
      
      // Refresh bookings after return
      setTimeout(() => {
        setShowReturnModal(false);
        setReturnMessage("");
        setReturnImage(null);
        setReturnImagePreview("");
        setSelectedBooking(null);
        fetchCurrentBookings(user.id);
      }, 2000);

    } catch (error) {
      console.error('Error returning item:', error);
      setReturnMessage("❌ Failed to return item: " + error.message);
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
      <div className="min-h-screen bg-orange-100">
        <Header />
        
        {/* Profile Section */}
        <section className="py-16 bg-orange-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                         {/* Profile Header */}
             <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
               <div className="flex items-center space-x-6">
                 {/* Profile Picture */}
                 <div className="w-24 h-24 bg-orange-200 rounded-full flex items-center justify-center">
                   {userProfile?.profile_pic ? (
                     <img
                       src={userProfile.profile_pic}
                       alt={userProfile.full_name || user?.email}
                       className="w-24 h-24 rounded-full object-cover"
                     />
                   ) : (
                     <span className="text-4xl font-bold text-orange-700">
                       {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                     </span>
                   )}
                 </div>
                 
                 {/* Profile Info */}
                 <div className="flex-1">
                   <h1 className="text-3xl font-bold text-gray-900 mb-2">
                     {userProfile?.full_name || 'User Profile'}
                   </h1>
                   <p className="text-gray-600 mb-2">{user?.email}</p>
                   {userProfile?.credibility_score && (
                     <div className="flex items-center">
                       <span className="text-yellow-500 text-lg">★</span>
                       <span className="ml-2 text-gray-700 font-medium">
                         {userProfile.credibility_score.toFixed(1)} rating
                       </span>
                     </div>
                   )}
                 </div>
                 
                 {/* Actions */}
                 <div className="flex flex-col space-y-3">
                   <button className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors">
                     Edit Profile
                   </button>
                   <button 
                     onClick={handleSignOut}
                     className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                   >
                     Sign Out
                   </button>
                 </div>
               </div>
             </div>

             {/* Current Bookings Carousel */}
             <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
               <h2 className="text-xl font-bold text-gray-900 mb-4">My Bookings</h2>
               {bookingsLoading ? (
                 <div className="text-center py-8">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                   <p className="mt-2 text-gray-600">Loading bookings...</p>
                 </div>
               ) : currentBookings.length > 0 ? (
                 <div className="overflow-x-auto">
                   <div className="flex space-x-4 pb-4">
                     {currentBookings.map((booking) => (
                       <div key={booking.rental_id} className="flex-shrink-0 w-80 bg-orange-50 rounded-lg p-4 border border-orange-200">
                         <div className="flex items-center space-x-3 mb-3">
                           <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                             {booking.items?.image_url ? (
                               <img
                                 src={booking.items.image_url}
                                 alt={booking.items.title}
                                 className="w-12 h-12 rounded-lg object-cover"
                               />
                             ) : (
                               <span className="text-orange-600 text-lg">📦</span>
                             )}
                           </div>
                           <div className="flex-1">
                             <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                               {booking.items?.title || 'Unknown Item'}
                             </h3>
                             <p className="text-xs text-gray-600">
                               From {booking.users?.full_name || 'Unknown User'}
                             </p>
                           </div>
                         </div>
                         
                         <div className="space-y-2 text-xs">
                           <div className="flex justify-between">
                             <span className="text-gray-600">Dates:</span>
                             <span className="font-medium">
                               {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Status:</span>
                             <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                               booking.status === 'active' ? 'bg-green-100 text-green-800' : 
                               booking.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                               'bg-yellow-100 text-yellow-800'
                             }`}>
                               {booking.status === 'active' ? 'Active' : 
                                booking.status === 'returned' ? 'Returned' :
                                'Pending'}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">
                               {booking.status === 'returned' ? 'Final Cost:' : 'Total Cost:'}
                             </span>
                             <span className="font-medium text-orange-600">
                               ₹{booking.status === 'returned' ? 
                                 (booking.actual_total_cost || booking.total_cost || 0) : 
                                 (booking.total_cost || 0)}
                             </span>
                           </div>
                           
                                                       {/* Return Button - Show for active and pending rentals */}
                            {(booking.status === 'active' || booking.status === 'pending') && (
                              <button
                                onClick={() => openReturnModal(booking)}
                                className="w-full mt-3 bg-orange-500 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                              >
                                Return Item
                              </button>
                            )}
                           
                           {/* Return Date - Show for returned items */}
                           {booking.status === 'returned' && (
                             <div className="flex justify-between text-xs">
                               <span className="text-gray-600">Returned on:</span>
                               <span className="font-medium">
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
                 <div className="text-center py-8">
                   <div className="text-gray-400 text-4xl mb-2">📅</div>
                   <p className="text-gray-600">No bookings yet</p>
                   <p className="text-sm text-gray-500 mt-1">Start renting items to see them here</p>
                 </div>
               )}
             </div>

             {/* Current Listings Carousel */}
             <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
               <h2 className="text-xl font-bold text-gray-900 mb-4">Current Listings</h2>
               {listingsLoading ? (
                 <div className="text-center py-8">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                   <p className="mt-2 text-gray-600">Loading listings...</p>
                 </div>
               ) : currentListings.length > 0 ? (
                 <div className="overflow-x-auto">
                   <div className="flex space-x-4 pb-4">
                     {currentListings.map((listing) => (
                       <div key={listing.item_id} className="flex-shrink-0 w-80 bg-green-50 rounded-lg p-4 border border-green-200">
                         <div className="flex items-center space-x-3 mb-3">
                           <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                             {listing.image_url ? (
                               <img
                                 src={listing.image_url}
                                 alt={listing.title}
                                 className="w-12 h-12 rounded-lg object-cover"
                               />
                             ) : (
                               <span className="text-green-600 text-lg">📦</span>
                             )}
                           </div>
                           <div className="flex-1">
                             <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                               {listing.title}
                             </h3>
                             <p className="text-xs text-gray-600 capitalize">
                               {listing.category || 'Uncategorized'}
                             </p>
                           </div>
                         </div>
                         
                         <div className="space-y-2 text-xs">
                           <div className="flex justify-between">
                             <span className="text-gray-600">Price per day:</span>
                             <span className="font-medium text-green-600">₹{listing.price_per_day}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Condition:</span>
                             <span className="font-medium capitalize">{listing.condition || 'Good'}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Listed on:</span>
                             <span className="font-medium">
                               {new Date(listing.created_at).toLocaleDateString()}
                             </span>
                           </div>
                         </div>
                         
                                                   <div className="mt-3 pt-3 border-t border-green-200">
                            <button className="w-full bg-green-500 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-green-600 transition-colors">
                              View Details
                            </button>
                          </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <div className="text-gray-400 text-4xl mb-2">📦</div>
                   <p className="text-gray-600">No current listings</p>
                   <p className="text-sm text-gray-500 mt-1">List your first item to start earning</p>
                 </div>
               )}
             </div>

             {/* Profile Details */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Personal Information */}
               <div className="bg-white rounded-xl shadow-lg p-6">
                 <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                     <p className="text-gray-900">{userProfile?.full_name || 'Not set'}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                     <p className="text-gray-900">{user?.email}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                     <p className="text-gray-900">{userProfile?.address || 'Not set'}</p>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                     <p className="text-gray-900">
                       {userProfile?.created_at ? 
                         new Date(userProfile.created_at).toLocaleDateString() : 
                         new Date(user?.created_at).toLocaleDateString()
                       }
                     </p>
                   </div>
                 </div>
               </div>

                              {/* Account Statistics */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Account Statistics</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-gray-700">Items Listed</span>
                      <span className="text-orange-600 font-bold text-lg">{currentListings.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-700">Total Bookings</span>
                      <span className="text-green-600 font-bold text-lg">{currentBookings.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Total Earnings</span>
                      <span className="text-blue-600 font-bold text-lg">
                        ₹{currentListings.reduce((total, item) => total + (item.price_per_day || 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-700">Response Rate</span>
                      <span className="text-purple-600 font-bold text-lg">100%</span>
                    </div>
                  </div>
                </div>
             </div>

                         {/* Quick Actions */}
             <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
               <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <button className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4 rounded-lg font-medium hover:from-orange-500 hover:to-orange-600 transition-all duration-200">
                   <div className="text-2xl mb-2">📦</div>
                   <div>List New Item</div>
                 </button>
                 <button className="bg-gradient-to-r from-green-400 to-green-500 text-white p-4 rounded-lg font-medium hover:from-green-500 hover:to-green-600 transition-all duration-200">
                   <div className="text-2xl mb-2">📋</div>
                   <div>My Listings</div>
                 </button>
                 <button className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-4 rounded-lg font-medium hover:from-blue-500 hover:to-blue-600 transition-all duration-200">
                   <div className="text-2xl mb-2">💰</div>
                   <div>Earnings</div>
                 </button>
               </div>
             </div>

             
          </div>
        </section>

        {/* Return Item Modal */}
        {showReturnModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/30">
                             {/* Header */}
               <div className="flex items-center justify-between p-6 border-b border-gray-200">
                 <h2 className="text-2xl font-bold text-gray-900">Return Item</h2>
                 <button
                   onClick={closeReturnModal}
                   className="text-gray-400 hover:text-gray-600 transition-colors"
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
                   <div className="bg-orange-50 rounded-lg p-4">
                     <h3 className="font-semibold text-gray-900 mb-2">Item Details</h3>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <span className="text-gray-600">Item:</span>
                         <span className="ml-2 font-medium">{selectedBooking.items?.title}</span>
                       </div>
                       <div>
                         <span className="text-gray-600">Category:</span>
                         <span className="ml-2 font-medium capitalize">{selectedBooking.items?.category}</span>
                       </div>
                       <div>
                         <span className="text-gray-600">Rental Period:</span>
                         <span className="ml-2 font-medium">
                           {new Date(selectedBooking.start_date).toLocaleDateString()} - {new Date(selectedBooking.end_date).toLocaleDateString()}
                         </span>
                       </div>
                       <div>
                         <span className="text-gray-600">Price per Day:</span>
                         <span className="ml-2 font-medium text-orange-600">₹{selectedBooking.items?.price_per_day}</span>
                       </div>
                     </div>
                   </div>
                 )}

                                 {/* Return Date and Cost Calculation */}
                 <div className="bg-blue-50 rounded-lg p-4">
                   <h3 className="font-semibold text-gray-900 mb-2">Return Details</h3>
                   <div className="space-y-3 text-sm">
                     <div className="flex justify-between">
                       <span className="text-gray-600">Return Date:</span>
                       <span className="font-medium">{new Date().toLocaleDateString()}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Actual Rental Period:</span>
                       <span className="font-medium">
                         {selectedBooking ? 
                           Math.ceil((new Date() - new Date(selectedBooking.start_date)) / (1000 * 60 * 60 * 24)) + 1 : 0
                         } days
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Final Cost:</span>
                       <span className="font-medium text-orange-600">
                         ₹{selectedBooking ? 
                           (Math.ceil((new Date() - new Date(selectedBooking.start_date)) / (1000 * 60 * 60 * 24)) + 1) * (selectedBooking.items?.price_per_day || 0)
                         : 0}
                       </span>
                     </div>
                   </div>
                 </div>

                                 {/* Image Upload */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-3">
                     Upload Picture of Returned Item *
                   </label>
                  <div className="space-y-3">
                    {!returnImagePreview ? (
                      <div className="border-2 border-dashed border-orange-200/60 rounded-lg p-6 text-center hover:border-orange-300/80 transition-colors">
                        <input
                          type="file"
                          id="return_image_upload"
                          accept="image/*"
                          onChange={handleReturnImageChange}
                          className="hidden"
                        />
                        <label htmlFor="return_image_upload" className="cursor-pointer">
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
                          src={returnImagePreview}
                          alt="Return Preview"
                          className="w-full h-48 object-cover rounded-lg border-2 border-orange-200/60"
                        />
                        <button
                          type="button"
                          onClick={removeReturnImage}
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
                {returnMessage && (
                  <div className={`p-4 rounded-lg ${
                    returnMessage.includes("✅") 
                      ? "bg-green-50 text-green-800 border border-green-200" 
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}>
                    {returnMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={closeReturnModal}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                                     <button
                     onClick={handleReturnItem}
                     disabled={isReturning || !returnImage}
                     className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isReturning ? "Processing..." : "Return Item"}
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
