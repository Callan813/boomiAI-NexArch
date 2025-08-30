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
    <div className="min-h-screen bg-orange-100">
      <Header />
      
      {/* Search Results Section */}
      <section className="py-16 bg-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters and Results Header */}
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            {/* Left Sidebar - Filters */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-orange-600 hover:text-orange-500"
                  >
                    Clear all
                  </button>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Price Range (per day)</label>
                  <div className="space-y-3">
                    <input
                      type="number"
                      placeholder="Min price"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max price"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Availability Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  >
                    <option value="all">All Items</option>
                    <option value="available">Available Now</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Apply Filters Button */}
                <button
                  onClick={handleSearch}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Right Side - Results */}
            <div className="lg:w-3/4">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Search Results
                  </h2>
                  <p className="text-gray-600">
                    {loading ? 'Searching...' : `${totalResults} items found`}
                  </p>
                  {!loading && searchResults.length > 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      💡 Click on any item card or "Rent Now" button to view details
                    </p>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Searching for items...</p>
                </div>
              )}

              {/* No Results */}
              {!loading && searchResults.length === 0 && totalResults === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">No items found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria or filters</p>
                </div>
              )}

                             {/* Results Grid */}
               {!loading && searchResults.length > 0 && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {searchResults.map((item) => (
                     <div key={item.item_id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group cursor-pointer hover:scale-105 transform" onClick={() => router.push(`/item/${item.item_id}`)}>
                       {/* Item Image */}
                       <div className="relative h-48 bg-gray-100 overflow-hidden">
                         {item.image_url ? (
                           <img
                             src={item.image_url}
                             alt={item.title}
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                           />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                             {getCategoryIcon(item.category)}
                           </div>
                         )}
                         
                         {/* Condition Badge */}
                         <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                           {item.condition || 'Good'}
                         </div>

                         {/* Bookmark Icon */}
                         <button className="absolute top-3 left-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-all duration-200 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                           <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                           </svg>
                         </button>
                       </div>

                       {/* Item Info */}
                       <div className="p-4">
                         <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                           {item.title}
                         </h3>
                         
                         {/* Lender Info */}
                         <div className="flex items-center mb-3">
                           <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
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
                               <span className="text-yellow-500 text-xs">★</span>
                               <span className="text-xs text-gray-600 ml-1">
                                 {item.users?.credibility_score?.toFixed(1) || '0.0'}
                               </span>
                             </div>
                           </div>
                         </div>

                         {/* Price and Action */}
                         <div className="flex items-center justify-between">
                           <div className="text-xl font-bold text-orange-500">
                             {formatPrice(item.price_per_day)}
                           </div>
                           <button 
                             className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors" 
                             onClick={() => router.push(`/item/${item.item_id}`)}
                           >
                             Rent Now
                           </button>
                         </div>

                         {/* Category Badge */}
                         {item.category && (
                           <div className="mt-3">
                             <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
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
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      <Footer />
    </div>
  );
}
