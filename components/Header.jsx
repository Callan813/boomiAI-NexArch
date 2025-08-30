import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("HSR Layout Sector 6, B...");

  return (
    <>
      {/* Header */}
      <header className="bg-orange-500 shadow-sm border-b border-orange-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Left Side - Logo and Search */}
            <div className="flex items-center space-x-6 flex-1">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-white">ShareHub</span>
                </div>
              </Link>

              {/* Location Search */}
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-64 px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent text-sm bg-white"
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
                  className="w-full px-4 py-2 pl-10 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent text-sm bg-white"
                />
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-4">
              <button className="text-white hover:text-orange-100 px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors duration-200">
                <span className="text-sm font-medium">ENGLISH</span>
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <button className="text-white hover:text-orange-100 p-2 rounded-lg hover:bg-orange-600 transition-colors duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              
              <Link href="/login" className="text-white hover:text-orange-100 font-medium px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors duration-200">
                Login
              </Link>
              
              <Link href="/signup">
                <button className="bg-gradient-to-r from-orange-200 to-orange-300 text-orange-700 px-6 py-2 rounded-lg font-semibold hover:from-orange-300 hover:to-orange-400 transition-all duration-200 shadow-md hover:shadow-lg">
                  + SELL
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
