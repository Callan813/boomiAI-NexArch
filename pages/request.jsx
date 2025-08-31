import { useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';

const RequestPage = () => {
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const router = useRouter();

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude}, ${longitude}`);
        },
        (err) => {
          setError(`Geolocation failed: ${err.message}`);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/agents/orchestrator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'request_rental',
          payload: {
            category,
            start_date: startDate,
            end_date: endDate,
            location,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();
      setResult(data);
      // Optionally, redirect to a results page
      // router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <Header />
      <main className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="backdrop-blur-lg bg-white/90 border border-gray-200/60 rounded-3xl shadow-2xl p-8">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-4">Request an Item</h1>
            <p className="text-gray-600 mb-8">Let our agents find the perfect rental for you.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="category" className="block text-sm font-bold text-gray-800 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-white/90 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300"
                >
                  <option value="" disabled>Select a category</option>
                  <option value="DSLR Camera">DSLR Camera</option>
                  <option value="Drone">Drone</option>
                  <option value="Projector">Projector</option>
                  <option value="Camping Gear">Camping Gear</option>
                  <option value="Power Tool">Power Tool</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-bold text-gray-800 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-white/90 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-bold text-gray-800 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-white/90 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-bold text-gray-800 mb-2">
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., 'New York, NY' or latitude, longitude"
                    required
                    className="w-full px-5 py-4 pr-28 bg-white/90 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={handleGeolocation}
                    className="absolute inset-y-0 right-2 my-2 px-3 bg-orange-100 text-orange-600 font-semibold rounded-lg hover:bg-orange-200 transition-colors text-sm"
                  >
                    Use Current
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Finding Rentals...' : 'Submit Request'}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-100 text-red-700 border border-red-200 rounded-xl">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-6 p-4 bg-green-100 text-green-700 border border-green-200 rounded-xl">
                <p className="font-bold">Agent Response:</p>
                <pre className="mt-2 text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RequestPage;
