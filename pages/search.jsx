import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useRouter } from "next/router";

export default function Search() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [availability, setAvailability] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
   
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFilters] = useState({});

  const categories = [
    "All Categories",
    "Electronics",
    "Furniture", 
    "Tools",
    "Sports",
    "Books",
    "Clothing",
    "Vehicles",
    "Photography",
    "Music",
    "Outdoor",
    "Home & Garden"
  ];

  const sortOptions = [
    { value: "relevance", label: "Most Relevant" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "distance", label: "Nearest First" },
    { value: "newest", label: "Newest First" }
  ];

  // Utility functions
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
      'Photography': '📷',
      'Music': '🎵',
      'Outdoor': '🏕️',
      'Home & Garden': '🏡',
      'default': '📦'
    };
    return icons[category] || icons.default;
  };

  useEffect(() => {
    // Check for query parameter from URL
    if (router.query.q) {
      setSearchQuery(router.query.q);
      setFilters({ searchQuery: router.query.q });
    } else {
      // Default search for "search_term" if no query parameter
      setSearchQuery("search_term");
      setFilters({ searchQuery: "search_term" });
    }
  }, [router.query.q]);

  useEffect(() => {
    if (searchQuery || Object.keys(filters).length > 0) {
      performSearch();
    }
  }, [searchQuery, filters]);

  const performSearch = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('items')
        .select(`
          *,
          users!items_user_id_fkey (
            user_id,
            full_name,
            profile_pic,
            credibility_score,
            latitude,
            longitude
          )
        `)
        .eq('available', true);

      // Apply search query
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      // Apply category filter
      if (category && category !== "All Categories") {
        query = query.eq('category', category);
      }

      // Apply price range filter
      if (priceRange.min > 0) {
        query = query.gte('price_per_day', priceRange.min);
      }
      if (priceRange.max < 1000) {
        query = query.lte('price_per_day', priceRange.max);
      }

      // Apply availability filter
      if (availability === "available") {
        query = query.eq('available', true);
      }

      // Apply sorting
      switch (sortBy) {
        case "price_low":
          query = query.order('price_per_day', { ascending: true });
          break;
        case "price_high":
          query = query.order('price_per_day', { ascending: false });
          break;
        case "rating":
          query = query.order('users.credibility_score', { ascending: false });
          break;
        case "newest":
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query.limit(50);

      if (error) {
        throw error;
      }

      setSearchResults(data || []);
      setTotalResults(count || data?.length || 0);

    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({
      searchQuery,
      category,
      priceRange,
      availability
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategory("All Categories");
    setPriceRange({ min: 0, max: 1000 });
    setAvailability("all");
    setSortBy("relevance");
    setFilters({});
  };

  return (
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
      
      {/* Search Results Section */}
      <section className="py-16 bg-gradient-to-br from-white via-orange-50/30 to-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters and Results Header */}
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {/* Left Sidebar - Filters */}
            <div className="lg:w-1/4 animate-fade-in-up">
              <div className="backdrop-blur-lg bg-white/95 border border-gray-200/60 rounded-3xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-500 sticky top-6">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Filters</h3>
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-orange-600 hover:text-orange-700 font-semibold px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 transition-all duration-200 transform hover:scale-105"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-4 tracking-wide uppercase">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-5 py-4 bg-white/90 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300 hover:bg-white shadow-sm hover:shadow-md font-medium text-gray-900 appearance-none cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-4 tracking-wide uppercase">
                      Price Range (per day)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Min"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                          className="w-full pl-8 pr-4 py-4 bg-white/90 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300 hover:bg-white shadow-sm hover:shadow-md font-medium text-gray-900"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Max"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                          className="w-full pl-8 pr-4 py-4 bg-white/90 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300 hover:bg-white shadow-sm hover:shadow-md font-medium text-gray-900"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                      </div>
                    </div>
                  </div>

                  {/* Availability Filter */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-4 tracking-wide uppercase">
                      Availability
                    </label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="w-full px-5 py-4 bg-white/90 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300 hover:bg-white shadow-sm hover:shadow-md font-medium text-gray-900 appearance-none cursor-pointer"
                    >
                      <option value="all">All Items</option>
                      <option value="available">Available Now</option>
                    </select>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-4 tracking-wide uppercase">
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-5 py-4 bg-white/90 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300 hover:bg-white shadow-sm hover:shadow-md font-medium text-gray-900 appearance-none cursor-pointer"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Apply Filters Button */}
                  <button
                    onClick={handleSearch}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-5 px-8 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] border border-orange-400/30"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Results */}
            <div className="lg:w-3/4 animate-fade-in-up delay-200">
              {/* Results Header */}
              <div className="backdrop-blur-md bg-white/80 border border-white/30 rounded-2xl shadow-xl p-6 mb-8 hover:shadow-2xl transition-all duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Search Results
                    </h2>
                    <p className="text-gray-600 font-medium">
                      {loading ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2">⏳</span>
                          Searching...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <span className="mr-2">🎯</span>
                          {totalResults} items found
                        </span>
                      )}
                    </p>
                    {!loading && searchResults.length > 0 && (
                      <p className="text-sm text-orange-600 mt-2 bg-orange-50/50 backdrop-blur-sm border border-orange-200/30 rounded-lg px-3 py-2">
                        💡 Click on any item card or "Rent Now" button to view details
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-16 animate-fade-in-up">
                  <div className="relative mx-auto w-16 h-16 mb-6">
                    <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-orange-200"></div>
                    <div className="absolute inset-2 animate-spin rounded-full h-12 w-12 border-4 border-orange-400 border-t-transparent"></div>
                  </div>
                  <div className="backdrop-blur-md bg-orange-50/50 border border-orange-200/30 rounded-xl p-6 max-w-md mx-auto">
                    <p className="text-orange-700 font-medium animate-pulse">Searching for amazing items...</p>
                    <div className="mt-3 flex justify-center space-x-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-200"></div>
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-400"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* No Results */}
              {!loading && searchResults.length === 0 && totalResults === 0 && (
                <div className="text-center py-16 animate-fade-in-up">
                  <div className="relative mb-6">
                    <div className="text-gray-300 text-8xl mb-4 animate-bounce">🔍</div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full animate-ping"></div>
                  </div>
                  <div className="backdrop-blur-md bg-orange-50/50 border border-orange-200/30 rounded-2xl p-8 max-w-md mx-auto">
                    <h3 className="text-xl font-bold text-gray-700 mb-2">No items found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
                    <button 
                      onClick={clearFilters}
                      className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      <span className="flex items-center">
                        <span className="mr-2">✨</span>
                        Clear Filters
                      </span>
                    </button>
                  </div>
                </div>
              )}

                             {/* Results Grid */}
               {!loading && searchResults.length > 0 && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {searchResults.map((item, index) => (
                     <div key={item.item_id} className="group backdrop-blur-md bg-white/70 border border-white/30 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden hover:scale-105 hover:rotate-1 transform cursor-pointer animate-fade-in-up"
                          style={{animationDelay: `${index * 100}ms`}}
                          onClick={() => router.push(`/item/${item.item_id}`)}>
                       {/* Item Image */}
                       <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                         {item.image_url ? (
                           <img
                             src={item.image_url}
                             alt={item.title}
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 group-hover:brightness-110"
                           />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl group-hover:scale-110 transition-transform duration-500">
                             {getCategoryIcon(item.category)}
                           </div>
                         )}
                         
                         {/* Condition Badge */}
                         <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg backdrop-blur-sm border border-white/20 transition-all duration-300 group-hover:scale-110">
                           {item.condition || 'Good'}
                         </div>

                         {/* Bookmark Icon */}
                         <button className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 transform group-hover:scale-110" onClick={(e) => e.stopPropagation()}>
                           <svg className="w-4 h-4 text-gray-600 hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                           </svg>
                         </button>

                         {/* Hover Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                       </div>

                       {/* Item Info */}
                       <div className="p-4 relative">
                         <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300">
                           {item.title}
                         </h3>
                         
                         {/* Lender Info */}
                         <div className="flex items-center mb-3 p-2 rounded-lg bg-white/50 backdrop-blur-sm border border-white/30 group-hover:bg-white/70 transition-all duration-300">
                           <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mr-3 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                             {item.users?.profile_pic ? (
                               <img
                                 src={item.users.profile_pic}
                                 alt={item.users.full_name}
                                 className="w-8 h-8 rounded-full object-cover"
                               />
                             ) : (
                               <span className="text-gray-600 text-sm font-medium">
                                 {item.users?.full_name?.charAt(0) || 'U'}
                               </span>
                             )}
                           </div>
                           <div>
                             <p className="text-sm font-medium text-gray-900">
                               {item.users?.full_name || 'Unknown User'}
                             </p>
                             <div className="flex items-center">
                               <span className="text-yellow-500 text-xs animate-pulse">★</span>
                               <span className="text-xs text-gray-600 ml-1">
                                 {item.users?.credibility_score?.toFixed(1) || '0.0'}
                               </span>
                             </div>
                           </div>
                         </div>

                         {/* Price and Action */}
                         <div className="flex items-center justify-between mb-3">
                           <div className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent group-hover:from-orange-600 group-hover:to-orange-700 transition-all duration-300">
                             {formatPrice(item.price_per_day)}
                           </div>
                           <button 
                             className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20" 
                             onClick={(e) => {
                               e.stopPropagation();
                               router.push(`/item/${item.item_id}`);
                             }}
                           >
                             Rent Now
                           </button>
                         </div>

                         {/* Category Badge */}
                         {item.category && (
                           <div className="mt-3">
                             <span className="inline-block bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full border border-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 cursor-default">
                               {item.category}
                             </span>
                           </div>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Chat Icon */}
      <div className="fixed bottom-6 right-6 z-50 animate-float">
        <button className="group w-14 h-14 bg-gradient-to-r from-orange-400 to-orange-500 backdrop-blur-md border border-white/30 rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 active:scale-95">
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg animate-pulse">
            3
          </div>
        </button>
      </div>

      <Footer />
    </div>
  );
}
