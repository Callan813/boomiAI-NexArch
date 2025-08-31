import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
      }
    };
    checkAuth();
  }, [router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // First, try to sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        setMessage("❌ Authentication failed: " + authError.message);
        return;
      }

      // If auth succeeds, verify user exists in public.users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", form.email)
        .single();

      if (userError || !userData) {
        setMessage("❌ User not found in database");
        return;
      }

      // Login successful
      
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
      
    } catch (error) {
      setMessage("❌ An error occurred: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-40">
        {/* Large floating elements */}
        <div className="absolute top-16 right-8 w-40 h-40 bg-gradient-to-br from-orange-200/60 to-orange-300/80 rounded-full blur-xl animate-float-slow"></div>
        <div className="absolute top-32 right-24 w-24 h-24 bg-gradient-to-br from-white/70 to-orange-200/60 rounded-full blur-lg animate-float-reverse delay-1000"></div>
        <div className="absolute bottom-16 right-16 w-32 h-32 bg-gradient-to-br from-orange-300/50 to-orange-400/70 rounded-full blur-xl animate-float-slow delay-2000"></div>
        
        {/* Left side elements */}
        <div className="absolute top-48 left-12 w-28 h-28 bg-gradient-to-br from-white/60 to-orange-100/80 rounded-full blur-lg animate-float-reverse delay-500"></div>
        <div className="absolute bottom-32 left-32 w-20 h-20 bg-gradient-to-br from-orange-200/70 to-orange-300/60 rounded-full blur-md animate-float-slow delay-1500"></div>
        
        {/* Medium floating elements */}
        <div className="absolute top-64 right-40 w-12 h-12 bg-gradient-to-br from-orange-400/60 to-orange-500/40 rounded-full blur-sm animate-drift delay-300"></div>
        <div className="absolute bottom-48 left-56 w-16 h-16 bg-gradient-to-br from-white/80 to-orange-200/50 rounded-full blur-md animate-drift delay-800"></div>
        <div className="absolute top-80 left-80 w-10 h-10 bg-gradient-to-br from-orange-300/70 to-white/60 rounded-full blur-sm animate-drift delay-1200"></div>
        
        {/* Small sparkle elements */}
        <div className="absolute top-8 right-8 w-6 h-6 bg-gradient-to-br from-orange-200 to-white rounded-full animate-orbit-slow opacity-40"></div>
        <div className="absolute bottom-8 left-8 w-8 h-8 bg-gradient-to-br from-white to-orange-100 rounded-full animate-orbit-slow delay-4000 opacity-50"></div>
      </div>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Glass Morphism Container */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-orange-200/60 p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-orange-300/80">
            {/* Header Section */}
            <div className="text-center mb-8 animate-fade-in-up delay-200">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-600">Sign in to access your NexArch account</p>
            </div>
            
            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6 animate-fade-in-up delay-400">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-orange-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-orange-400 group-focus-within:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-orange-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-orange-300/80 placeholder-gray-400"
                  />
                </div>
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-orange-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-orange-400 group-focus-within:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-12 py-3 border-2 border-orange-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:border-orange-300/80 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-orange-400 hover:text-orange-500 transition-colors duration-300"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors duration-200"
                >
                  Forgot your password?
                </button>
              </div>
              
              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </div>
                )}
              </button>
            </form>
            
            {/* Message Display */}
            {message && (
              <div className={`mt-6 p-4 rounded-xl backdrop-blur-sm border-2 animate-fade-in-up ${
                message.includes("✅") 
                  ? "bg-green-50/90 text-green-800 border-green-200/60 shadow-green-200/50" 
                  : "bg-red-50/90 text-red-800 border-red-200/60 shadow-red-200/50"
              } shadow-lg transition-all duration-300`}>
                <div className="flex items-center">
                  {message.includes("✅") ? (
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            )}
            
            {/* Sign Up Link */}
            <div className="mt-8 text-center animate-fade-in-up delay-600">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-orange-200/60"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/90 text-gray-500 font-medium">
                    New to NexArch?
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/signup')}
                  className="group inline-flex items-center px-6 py-3 border-2 border-orange-200/60 text-orange-600 bg-white/80 hover:bg-orange-50/90 rounded-xl font-medium hover:border-orange-300/80 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create Account
                </button>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-6 text-center animate-fade-in-up delay-800">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-orange-200/60 hover:border-orange-300/80 transition-all duration-300 hover:scale-105">
                <div className="text-2xl mb-2">🔒</div>
                <div className="text-xs text-gray-600 font-medium">Secure Login</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-orange-200/60 hover:border-orange-300/80 transition-all duration-300 hover:scale-105">
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-xs text-gray-600 font-medium">Quick Access</div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-orange-200/60 hover:border-orange-300/80 transition-all duration-300 hover:scale-105">
                <div className="text-2xl mb-2">🤖</div>
                <div className="text-xs text-gray-600 font-medium">AI Powered</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}