import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function ItemDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [item, setItem] = useState(null);
  const [lender, setLender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDates, setSelectedDates] = useState({
    startDate: null,
    endDate: null
  });
  const [rentalPeriod, setRentalPeriod] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [user, setUser] = useState(null);
  const itemDatePickerRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDatePicker && itemDatePickerRef.current && !itemDatePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
        setSelectingStartDate(true);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch item with lender information
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select(`
          *,
          users!items_user_id_fkey (
            user_id,
            full_name,
            profile_pic,
            credibility_score,
            address,
            latitude,
            longitude,
            created_at
          )
        `)
        .eq('item_id', id)
        .single();

      if (itemError) {
        throw itemError;
      }

      setItem(itemData);
      setLender(itemData.users);

    } catch (err) {
      console.error('Error fetching item:', err);
      setError('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(0);
  };

  const calculateTotalPrice = () => {
    if (!item || !rentalPeriod) return 0;
    return item.price_per_day * rentalPeriod;
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
      'Photography': '📷',
      'Music': '🎵',
      'Outdoor': '🏕️',
      'Home & Garden': '🏡',
      'default': '📦'
    };
    return icons[category] || icons.default;
  };

  const handleRentRequest = async () => {
    if (!user) {
      alert('Please login to rent this item');
      return;
    }

    if (!selectedDates.startDate || !selectedDates.endDate) {
      alert('Please select rental dates');
      return;
    }

    if (user.id === item.user_id) {
      alert('You cannot rent your own item');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      // Calculate total cost
      const totalCost = item.price_per_day * rentalPeriod;

      // Create rental record
      const { data: rentalData, error: rentalError } = await supabase
        .from('rentals')
        .insert([
          {
            item_id: item.item_id,
            renter_id: user.id,
            lender_id: item.user_id,
            start_date: selectedDates.startDate.toISOString().split('T')[0],
            end_date: selectedDates.endDate.toISOString().split('T')[0],
            status: 'pending',
            total_cost: totalCost,
            item_type: item.category
          }
        ])
        .select()
        .single();

      if (rentalError) {
        throw rentalError;
      }

      // Update item availability to false
      const { error: updateError } = await supabase
        .from('items')
        .update({ available: false })
        .eq('item_id', item.item_id);

      if (updateError) {
        console.error('Error updating item availability:', updateError);
      }

      setSubmitMessage("✅ Rental request sent successfully!");
      
      // Reset form
      setSelectedDates({ startDate: null, endDate: null });
      setRentalPeriod(1);
      
      // Close popup after 3 seconds
      setTimeout(() => {
        setSubmitMessage("");
      }, 3000);

    } catch (error) {
      console.error('Error creating rental:', error);
      setSubmitMessage("❌ Failed to send rental request: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNegotiate = () => {
    // TODO: Implement negotiation/messaging logic
    alert('Messaging functionality coming soon!');
  };

  // Date utility functions
  const formatDateRange = (start, end) => {
    if (!start || !end) return 'Select dates';
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
      setSelectedDates(prev => ({ ...prev, startDate: date }));
      setSelectingStartDate(false);
    } else {
      if (date >= selectedDates.startDate) {
        setSelectedDates(prev => ({ ...prev, endDate: date }));
        const daysDiff = Math.ceil((date - selectedDates.startDate) / (1000 * 60 * 60 * 24)) + 1;
        setRentalPeriod(daysDiff);
        setShowDatePicker(false);
        setSelectingStartDate(true);
      }
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
      const isSelected = (selectingStartDate && date.toDateString() === selectedDates.startDate?.toDateString()) ||
                        (!selectingStartDate && date.toDateString() === selectedDates.endDate?.toDateString());
      const isInRange = selectedDates.startDate && selectedDates.endDate && 
                       date >= selectedDates.startDate && date <= selectedDates.endDate;
      const isPast = date < today;
      
      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateSelect(date)}
          disabled={isPast}
          className={`p-2 w-8 h-8 text-sm rounded-lg transition-all duration-200 ${
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
      <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-orange-200/60 p-4 z-[9999] backdrop-blur-md bg-white/95 min-w-[280px] max-w-[320px]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {selectedDates.startDate && !selectedDates.endDate && (
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

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading item details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-orange-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">⚠️</div>
            <p className="text-gray-600">{error || 'Item not found'}</p>
            <button 
              onClick={() => router.back()}
              className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-100">
      <Header />
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-sm text-gray-600">
            <button onClick={() => router.push('/')} className="hover:text-orange-600">Home</button>
            <span className="mx-2">/</span>
            <button onClick={() => router.push('/search')} className="hover:text-orange-600">All Categories</button>
            {item.category && (
              <>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{item.category}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Item Image and Details */}
          <div className="lg:col-span-2">
            {/* Item Image */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="relative h-96 bg-gray-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-8xl">
                    {getCategoryIcon(item.category)}
                  </div>
                )}
                
                {/* Condition Badge */}
                <div className="absolute top-4 right-4 bg-orange-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                  {item.condition || 'Good'}
                </div>
              </div>
            </div>

            {/* Item Title and Description */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h1>
              {item.description && (
                <p className="text-gray-700 text-lg leading-relaxed mb-6">{item.description}</p>
              )}
              
              {/* Item Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-2 font-medium text-gray-900">{item.category || 'Uncategorized'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Condition:</span>
                  <span className="ml-2 font-medium text-gray-900">{item.condition || 'Good'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Listed:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {item.available ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lender Information */}
            {lender && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Owned by {lender.full_name}</h2>
                
                <div className="flex items-start space-x-4">
                  {/* Profile Picture */}
                  <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {lender.profile_pic ? (
                      <img
                        src={lender.profile_pic}
                        alt={lender.full_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-orange-700">
                        {lender.full_name?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>

                  {/* Lender Details */}
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-yellow-500 text-lg">★</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {lender.credibility_score?.toFixed(1) || '0.0'} rating
                      </span>
                    </div>
                    
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        Verified user
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        Usually responds within a few hours
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        100% response rate
                      </li>
                      {lender.address && (
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                          {lender.address}
                        </li>
                      )}
                    </ul>

                    <button className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation Policy */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Cancellation Policy</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Free cancellation until 2 days before your rental starts. After that, you'll get half your money back until the day before. 
                <button className="text-orange-600 hover:text-orange-700 ml-1 font-medium">Read more</button>
              </p>
            </div>
          </div>

          {/* Right Column - Rental Options */}
          <div className="lg:col-span-1">
            {/* Rental Calendar and Pricing */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Rental Period</h2>
              
              {/* Rental Period Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Dates</label>
                <div className="relative" ref={itemDatePickerRef}>
                  <div 
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="flex items-center text-gray-700 bg-white border-2 border-orange-200/60 rounded-lg px-4 py-3 hover:bg-orange-50 hover:border-orange-300/80 transition-all duration-300 cursor-pointer"
                  >
                    <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">
                      {formatDateRange(selectedDates.startDate, selectedDates.endDate)}
                    </span>
                  </div>
                  
                  {showDatePicker && <DatePickerCalendar />}
                </div>
                
                {selectedDates.startDate && selectedDates.endDate ? (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Duration:</span> {rentalPeriod} day{rentalPeriod > 1 ? 's' : ''}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700">
                      <span className="font-medium">Please select start and end dates to continue</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Display */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">PRICES FOR ALL PERIODS</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>1 day</span>
                    <span className="font-medium">₹{formatPrice(item.price_per_day)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>3 days</span>
                    <span className="font-medium">₹{formatPrice(item.price_per_day * 3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>7 days</span>
                    <span className="font-medium">₹{formatPrice(item.price_per_day * 7)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>14 days</span>
                    <span className="font-medium">₹{formatPrice(item.price_per_day * 14)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>30 days</span>
                    <span className="font-medium">₹{formatPrice(item.price_per_day * 30)}</span>
                  </div>
                </div>
              </div>

              {/* Total Price */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Price</span>
                  <span className="text-2xl font-bold text-orange-600">
                    ₹{formatPrice(calculateTotalPrice())}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  for {rentalPeriod} day{rentalPeriod > 1 ? 's' : ''}
                </p>
              </div>

              {/* Submit Message */}
              {submitMessage && (
                <div className={`p-4 rounded-lg mb-4 ${
                  submitMessage.includes("✅") 
                    ? "bg-green-50 text-green-800 border border-green-200" 
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {submitMessage}
                </div>
              )}

              {/* Rent Button */}
              <button
                onClick={handleRentRequest}
                disabled={!item.available || isSubmitting || !selectedDates.startDate || !selectedDates.endDate || (user && user.id === item?.user_id)}
                className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending Request...' : 
                 (user && user.id === item?.user_id) ? 'Cannot Rent Your Own Item' :
                 (item.available ? 'Send a Request' : 'Not Available')}
              </button>

              {/* Negotiate Button */}
              <button
                onClick={handleNegotiate}
                className="w-full mt-3 bg-white text-orange-600 py-3 px-6 rounded-lg font-semibold border-2 border-orange-500 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              >
                Negotiate & Message
              </button>

              {!user ? (
                <p className="text-xs text-orange-600 mt-3 text-center font-medium">
                  Please login to rent this item
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  No strings attached when you send a request and you can ask questions to {lender?.full_name || 'the lender'}.
                </p>
              )}
            </div>
          </div>
        </div>


      </div>

      <Footer />
    </div>
  );
}
