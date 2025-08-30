import { useState } from "react";
import Link from "next/link";

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid");

  const categories = ["All", "Electronics", "Vehicles", "Home & Garden", "Sports", "Tools", "Party & Events"];

  const items = [
    {
      id: 1,
      title: "MacBook Pro 13-inch (M2)",
      category: "Electronics",
      price: "₹2,500/week",
      location: "Indiranagar, Bengaluru",
      rating: 4.8,
      reviews: 24,
      owner: "Alex K.",
      available: true,
      featured: true
    },
    {
      id: 2,
      title: "Canon DSLR Camera Kit",
      category: "Electronics",
      price: "₹1,200/week",
      location: "Koramangala, Bengaluru",
      rating: 4.9,
      reviews: 18,
      owner: "Sarah M.",
      available: true,
      featured: false
    },
    {
      id: 3,
      title: "Honda City - Self Drive",
      category: "Vehicles",
      price: "₹1,800/day",
      location: "Whitefield, Bengaluru",
      rating: 4.6,
      reviews: 32,
      owner: "Mike R.",
      available: false,
      featured: true
    },
    {
      id: 4,
      title: "Mountain Bike - Trek",
      category: "Sports",
      price: "₹300/day",
      location: "Jayanagar, Bengaluru",
      rating: 4.7,
      reviews: 15,
      owner: "Emma L.",
      available: true,
      featured: false
    },
    {
      id: 5,
      title: "Party Sound System",
      category: "Party & Events",
      price: "₹3,500/day",
      location: "Electronic City, Bengaluru",
      rating: 4.5,
      reviews: 28,
      owner: "David P.",
      available: true,
      featured: true
    },
    {
      id: 6,
      title: "Power Drill Set",
      category: "Tools",
      price: "₹200/day",
      location: "HSR Layout, Bengaluru",
      rating: 4.4,
      reviews: 12,
      owner: "Lisa T.",
      available: true,
      featured: false
    }
  ];

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-pattern connecting-lines">
      {/* Navigation */}
      <nav className="glass-effect sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-black">ShareHub</span>
            </Link>

            {/* Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search for items to rent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 border border-gray-200 rounded-2xl input-focus bg-white/50 backdrop-blur-sm text-black placeholder-gray-500"
                />
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/marketplace" className="text-green-500 font-medium">Marketplace</Link>
              <Link href="/how-it-works" className="text-black hover:text-black font-medium transition-colors">How it Works</Link>
              <Link href="/login" className="text-black hover:text-black font-medium transition-colors">Login</Link>
              <Link href="/signup" className="btn-gradient px-6 py-2 rounded-2xl font-semibold text-black glow-mint-hover">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8 fade-in-up">
          <h1 className="text-4xl font-bold text-black mb-4">Discover Amazing Items</h1>
          <p className="text-xl text-black">Find exactly what you need from trusted community members</p>
        </div>

        {/* Search and Filters */}
        <div className="glass-effect p-6 rounded-3xl soft-shadow mb-8 fade-in-up" style={{animationDelay: '0.2s'}}>
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-2xl input-focus bg-white/50 backdrop-blur-sm text-black"
              />
              <svg className="w-5 h-5 absolute left-4 top-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                    selectedCategory === category
                      ? "btn-gradient text-black"
                      : "glass-effect text-black hover:bg-white/20"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === "grid" ? "btn-gradient" : "glass-effect hover:bg-white/20"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-all ${
                  viewMode === "list" ? "btn-gradient" : "glass-effect hover:bg-white/20"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 fade-in-up" style={{animationDelay: '0.3s'}}>
          <p className="text-black">
            Showing {filteredItems.length} items
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
          </p>
        </div>

        {/* Items Grid/List */}
        <div className={`${
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
        } fade-in-up`} style={{animationDelay: '0.4s'}}>
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={`glass-effect rounded-3xl overflow-hidden soft-shadow glow-mint-hover transition-all duration-300 ${
                viewMode === "list" ? "flex" : ""
              }`}
            >
              {/* Image */}
              <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${
                viewMode === "list" ? "w-48 h-32" : "h-48"
              }`}>
                <div className="text-gray-400 text-4xl">📷</div>
                {item.featured && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    FEATURED
                  </div>
                )}
                {!item.available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">Not Available</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(item.rating) ? "text-yellow-400" : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">
                    {item.rating} ({item.reviews} reviews)
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{item.location}</p>
                <p className="text-sm text-gray-600 mb-4">by {item.owner}</p>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">{item.price}</span>
                  <button
                    disabled={!item.available}
                    className={`px-6 py-2 rounded-2xl font-semibold transition-all ${
                      item.available
                        ? "btn-gradient text-gray-800 glow-mint-hover"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {item.available ? "Request to Rent" : "Unavailable"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12 fade-in-up" style={{animationDelay: '0.5s'}}>
          <button className="btn-gradient px-8 py-3 rounded-2xl font-semibold text-gray-800 glow-mint-hover">
            Load More Items
          </button>
        </div>
      </div>
    </div>
  );
}