import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Near London");
  const [rentalPeriod, setRentalPeriod] = useState("August 30 - September 1");

  useEffect(() => {
    fetchProducts();
  }, []);

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
      <div className="min-h-screen bg-orange-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-100">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={fetchProducts}
              className="mt-4 bg-orange-400 text-white px-6 py-2 rounded-lg hover:bg-orange-500 transition-colors"
            >
              Try Again
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
      
      {/* Hero Section - Light Orange Background */}
      <section className="bg-orange-100 text-gray-800 py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-10 w-32 h-32 bg-orange-300 rounded-full"></div>
          <div className="absolute top-40 right-32 w-16 h-16 bg-orange-400 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-orange-300 rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
            Rent instead of buying
          </h1>
          
          {/* Sub-headline */}
          <p className="text-xl md:text-2xl mb-12 text-gray-700">
            Nearby and at times that suit you
          </p>

          {/* Large Search Bar */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="relative">
              <div className="flex bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Search Input */}
                <div className="flex-1 flex items-center px-6 py-4">
                  <svg className="w-6 h-6 text-gray-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for what you want to rent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-gray-900 text-lg placeholder-gray-500 focus:outline-none"
                  />
                </div>
                
                {/* Search Button */}
                <button className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg font-semibold transition-colors duration-200">
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Search Filters */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm">
            {/* Location Filter */}
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{location} </span>
              <button className="text-red-500 hover:text-red-600 ml-1 font-medium">(change)</button>
            </div>

            {/* Rental Period Filter */}
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Rental period {rentalPeriod} </span>
              <button className="text-red-500 hover:text-red-600 ml-1 font-medium">(change)</button>
            </div>
          </div>
        </div>

        {/* Decorative Illustrations - Bottom Right */}
        <div className="absolute bottom-0 right-0 w-96 h-96 opacity-30">
          <div className="relative w-full h-full">
            {/* Trees/Foliage */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-300 rounded-full"></div>
            <div className="absolute bottom-8 right-24 w-20 h-20 bg-orange-400 rounded-full"></div>
            <div className="absolute bottom-16 right-16 w-16 h-16 bg-orange-300 rounded-full"></div>
            
            {/* Rental Items */}
            <div className="absolute bottom-20 right-32 w-8 h-8 bg-gray-600 rounded-full"></div> {/* Bicycle wheel */}
            <div className="absolute bottom-24 right-28 w-6 h-6 bg-gray-600 rounded-full"></div> {/* Scooter wheel */}
            <div className="absolute bottom-32 right-36 w-4 h-4 bg-gray-600 rounded-full"></div> {/* Drone */}
            
            {/* Stars */}
            <div className="absolute bottom-40 right-20 w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="absolute bottom-36 right-16 w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="absolute bottom-44 right-24 w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Items Near You
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Discover amazing items available for rent in your area
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No products available</h3>
              <p className="text-gray-500">Be the first to list an item for rent!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.item_id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                        {getCategoryIcon(product.category)}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-orange-400 text-white text-xs px-2 py-1 rounded-full font-medium">
                      {product.condition || 'Good'}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    
                    {/* Lender Info */}
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
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
                          <span className="text-yellow-500 text-xs">★</span>
                          <span className="text-xs text-gray-600 ml-1">
                            {product.users?.credibility_score?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-bold text-orange-500">
                        {formatPrice(product.price_per_day)}
                      </div>
                      <button className="bg-orange-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-500 transition-colors">
                        Rent Now
                      </button>
                    </div>

                    {/* Category Badge */}
                    {product.category && (
                      <div className="mt-3">
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
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

      {/* CTA Section */}
      <section className="py-16 bg-orange-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-gray-700 mb-8 text-lg">
            Join our community of lenders and renters. Turn your unused items into a source of income.
          </p>
          <button className="bg-orange-400 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-500 transition-colors shadow-lg hover:shadow-xl">
            Create Your First Listing
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
