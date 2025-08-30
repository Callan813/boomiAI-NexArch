import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("ALL CATEGORIES");
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("HSR Layout Sector 6, B...");

  const categories = [
    "ALL CATEGORIES",
    "Cars",
    "Motorcycles", 
    "Mobile Phones",
    "For Sale: Houses & Apartments",
    "Scooters",
    "Commercial & Other Vehicles",
    "For Rent: Houses & Apartments"
  ];

  const rentalItems = [
    {
      name: "Samsung 200litres fridge & 6.5kg washing machine",
      category: "Electronics",
      lender: "Sarah M.",
      rating: 4.8,
      price: "₹ 12,999",
      image: "/fridge.jpg",
      location: "HSR LAYOUT SECTOR 6, BENGALURU",
      date: "TODAY",
      featured: true
    },
    {
      name: "OnePlus Nord Smartphone",
      category: "Electronics",
      lender: "Mike R.",
      rating: 4.9,
      price: "₹ 15,000",
      image: "/phone.jpg",
      location: "HSR LAYOUT SECTOR 6, BENGALURU",
      date: "AUG 20",
      featured: false
    },
    {
      name: "Redmi 9 Prime",
      category: "Electronics",
      lender: "Alex K.",
      rating: 4.7,
      price: "₹ 2,500",
      image: "/redmi.jpg",
      location: "HSR LAYOUT SECTOR 6, BENGALURU",
      date: "AUG 20",
      featured: false
    },
    {
      name: "Honda Jazz Car",
      category: "Vehicles",
      lender: "Emma L.",
      rating: 4.6,
      price: "₹ 6,20,000",
      image: "/car.jpg",
      location: "HSR LAYOUT SECTOR 6, BENGALURU",
      date: "AUG 20",
      featured: true
    },
    {
      name: "Hyundai Creta",
      category: "Vehicles",
      lender: "David P.",
      rating: 4.8,
      price: "₹ 9,95,000",
      image: "/creta.jpg",
      location: "HSR LAYOUT SECTOR 6, BENGALURU",
      date: "AUG 20",
      featured: false
    },
    {
      name: "2BHK Apartment for Sale",
      category: "Real Estate",
      lender: "Lisa T.",
      rating: 4.5,
      price: "₹ 36,00,000",
      image: "/apartment.jpg",
      location: "HSR LAYOUT SECTOR 6, BENGALURU",
      date: "AUG 20",
      featured: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Left Side - Logo and Search */}
            <div className="flex items-center space-x-6 flex-1">
              {/* Logo */}
              <div className="flex items-center">
                <div className="w-12 h-8 bg-blue-600 rounded font-bold text-white text-xl flex items-center justify-center">
                  olx
                </div>
              </div>

              {/* Location Search */}
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Location"
                />
                <svg className="w-5 h-5 absolute right-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Product Search */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search 'Cars'"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <span className="text-sm font-medium">ENGLISH</span>
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <button className="text-gray-700 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                Login
              </Link>
              
              <Link href="/signup">
                <button className="bg-gradient-to-r from-yellow-400 to-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-yellow-500 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg">
                  + SELL
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8 py-3 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-lg ${
                  selectedCategory === category
                    ? "text-blue-600 bg-blue-50 border-b-2 border-blue-600"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {category}
                {category === "ALL CATEGORIES" && (
                  <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fresh Recommendations Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 font-serif">Fresh recommendations</h1>
        
        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Product Cards */}
          {rentalItems.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
              {/* Image Section */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl group-hover:scale-110 transition-transform duration-300">
                  📷
                </div>
                
                {/* Featured Tag */}
                {item.featured && (
                  <div className="absolute bottom-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-sm">
                    FEATURED
                  </div>
                )}
                
                {/* Heart Icon */}
                <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-all duration-200 opacity-0 group-hover:opacity-100">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
              
              {/* Details Section */}
              <div className="p-4">
                <div className="text-xl font-bold text-gray-900 mb-2">{item.price}</div>
                <h3 className="text-sm text-gray-700 mb-2 line-clamp-2 leading-tight">{item.name}</h3>
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="font-medium">{item.location}</div>
                  <div className="text-gray-400">{item.date}</div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Call to Action Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg p-6 flex flex-col justify-center text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-lg font-semibold mb-3">Want to see your stuff here?</h3>
            <p className="text-sm text-blue-100 mb-4 leading-relaxed">
              Make some extra cash by selling things in your community. Go on, it's quick and easy.
            </p>
            <Link href="/signup">
              <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-sm hover:shadow-md">
                Start selling
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              © 2024 RentShare. All rights reserved. | 
              <Link href="/signup" className="text-blue-600 hover:text-blue-800 ml-2 font-medium hover:underline transition-colors duration-200">
                Join our rental community
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
