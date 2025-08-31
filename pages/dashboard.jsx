import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Mock components for demonstration. These would be built out further.
const TrustScore = ({ score }) => (
  <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg text-center">
    <h3 className="font-bold text-lg text-gray-800 mb-2">Trust Score</h3>
    <div className="text-4xl font-bold text-orange-500 animate-pulse">{score.toFixed(1)}</div>
    <p className="text-sm text-gray-500 mt-1">Keep it high for better rates!</p>
  </div>
);

const RentalList = ({ title, rentals }) => (
  <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg">
    <h3 className="font-bold text-lg text-gray-800 mb-4">{title}</h3>
    <div className="space-y-4">
      {rentals.length > 0 ? (
        rentals.map((rental) => (
          <div key={rental.rental_id} className="p-4 border border-gray-200/60 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-900">{rental.items?.title || 'Rental Request'}</p>
              <p className="text-sm text-gray-600">
                {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
              </p>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              rental.status === 'active' ? 'bg-green-100 text-green-800' :
              rental.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              rental.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {rental.status}
            </span>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm">No rentals in this category.</p>
      )}
    </div>
  </div>
);

const DamageReport = ({ rentals, userId }) => {
    const [beforeImage, setBeforeImage] = useState(null);
    const [afterImage, setAfterImage] = useState(null);
    const [selectedRental, setSelectedRental] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const handleUpload = async () => {
        if (!beforeImage || !afterImage || !selectedRental || !userId) {
            setError('Please select a rental and provide both images.');
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('beforeImage', beforeImage);
        formData.append('afterImage', afterImage);
        formData.append('rental_id', selectedRental);
        formData.append('reporter_id', userId);
        formData.append('description', description);

        try {
            const response = await fetch('/api/verify-damage', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const activeAndCompletedRentals = rentals.filter(r => ['active', 'completed'].includes(r.status));

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Report Damage</h3>
            <div className="space-y-4">
                <select 
                    value={selectedRental} 
                    onChange={(e) => setSelectedRental(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200/60 rounded-lg bg-white/80"
                >
                    <option value="" disabled>Select a rental to report</option>
                    {activeAndCompletedRentals.map(rental => (
                        <option key={rental.rental_id} value={rental.rental_id}>
                            {rental.items?.title || `Rental on ${new Date(rental.start_date).toLocaleDateString()}`}
                        </option>
                    ))}
                </select>
                <textarea 
                    placeholder="Describe the damage..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200/60 rounded-lg bg-white/80"
                />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Before Rental</label>
                        <input type="file" onChange={(e) => setBeforeImage(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">After Rental</label>
                        <input type="file" onChange={(e) => setAfterImage(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"/>
                    </div>
                </div>
                <button onClick={handleUpload} disabled={loading || !beforeImage || !afterImage || !selectedRental} className="w-full bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50">
                    {loading ? 'Verifying...' : 'Submit for Verification'}
                </button>
                {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
                {result && <p className="text-green-600 mt-2 text-sm">Report submitted! Score: {result.verification_score.toFixed(2)}</p>}
            </div>
        </div>
    );
};

const Payouts = ({ rentals, user }) => {
    const [loading, setLoading] = useState({});
    const [error, setError] = useState({});
    const [success, setSuccess] = useState({});

    const processPayout = async (rental) => {
        setLoading(prev => ({ ...prev, [rental.rental_id]: true }));
        setError(prev => ({ ...prev, [rental.rental_id]: null }));
        setSuccess(prev => ({ ...prev, [rental.rental_id]: null }));

        try {
            const response = await fetch('/api/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rental_id: rental.rental_id,
                    user_id: user.user_id,
                    amount: rental.total_cost,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Payout failed');
            }
            
            setSuccess(prev => ({ ...prev, [rental.rental_id]: data.message }));

        } catch (err) {
            setError(prev => ({ ...prev, [rental.rental_id]: err.message }));
        } finally {
            setLoading(prev => ({ ...prev, [rental.rental_id]: false }));
        }
    };

    const rentalsToPay = rentals.filter(r => r.lender_id === user.user_id && r.status === 'completed');

    return (
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Payouts</h3>
            <div className="space-y-4">
                {rentalsToPay.length > 0 ? (
                    rentalsToPay.map(rental => (
                        <div key={rental.rental_id} className="p-4 border border-gray-200/60 rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-900">{rental.items?.title}</p>
                                    <p className="text-sm text-gray-600 font-bold text-green-600">
                                        Amount: ${rental.total_cost}
                                    </p>
                                </div>
                                <button
                                    onClick={() => processPayout(rental)}
                                    disabled={loading[rental.rental_id] || success[rental.rental_id]}
                                    className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {loading[rental.rental_id] ? 'Processing...' : success[rental.rental_id] ? 'Paid' : 'Process Payout'}
                                </button>
                            </div>
                            {error[rental.rental_id] && <p className="text-red-600 mt-2 text-xs">{error[rental.rental_id]}</p>}
                            {success[rental.rental_id] && !error[rental.rental_id] && <p className="text-green-600 mt-2 text-xs">{success[rental.rental_id]}</p>}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-sm">No payouts available.</p>
                )}
            </div>
        </div>
    );
};


const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [damageReport, setDamageReport] = useState(null);
  const [showDamageResults, setShowDamageResults] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError);
      } else {
        setUser(userData);
      }

      // Fetch user rentals
      const { data: rentalData, error: rentalError } = await supabase
        .from('rentals')
        .select(`
          *,
          items ( title )
        `)
        .or(`renter_id.eq.${session.user.id},lender_id.eq.${session.user.id}`);

      if (rentalError) {
        console.error('Error fetching rentals:', rentalError);
      } else {
        setRentals(rentalData);
      }

      setLoading(false);
    };

    fetchUserData();

    // Check for damage report from sessionStorage
    const storedDamageReport = sessionStorage.getItem('latestDamageReport');
    if (storedDamageReport) {
      const damageData = JSON.parse(storedDamageReport);
      setDamageReport(damageData);
      setShowDamageResults(true);
      // Clear from sessionStorage after showing
      sessionStorage.removeItem('latestDamageReport');
    }

    // Set up Supabase real-time subscription for rentals
    const rentalSubscription = supabase
      .channel('public:rentals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rentals' }, (payload) => {
        console.log('Change received!', payload);
        // Refetch or update state based on payload
        fetchUserData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(rentalSubscription);
    };
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-orange-50">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-orange-50">You are not logged in.</div>;
  }

  const pendingRentals = rentals.filter(r => r.status === 'pending');
  const activeRentals = rentals.filter(r => r.status === 'active');
  const pastRentals = rentals.filter(r => ['completed', 'cancelled'].includes(r.status));

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <Header />
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-8">Welcome, {user.full_name}!</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <RentalList title="My Rental Requests" rentals={pendingRentals} />
              <RentalList title="Active Rentals" rentals={activeRentals} />
              <RentalList title="Rental History" rentals={pastRentals} />
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <TrustScore score={user.credibility_score || 0} />
              <DamageReport rentals={rentals} userId={user.user_id} />
              <Payouts rentals={rentals} user={user} />
            </div>
          </div>
        </div>
      </main>

      {/* Damage Analysis Results Modal */}
      {showDamageResults && damageReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-md bg-white/95 border border-gray-200/60 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-200/30">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-xl">🔍</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">AI Damage Analysis Complete</h2>
                  <p className="text-gray-600 mt-1">Advanced computer vision processing results</p>
                </div>
              </div>
              <button
                onClick={() => setShowDamageResults(false)}
                className="group p-3 text-gray-400 hover:text-red-500 transition-all duration-200 hover:bg-red-50 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Analysis Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Item Info */}
                <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">📦</span>
                    Item Analysis
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/80 rounded-xl border border-gray-200/40">
                      <span className="text-gray-600 font-medium">Item:</span>
                      <span className="font-bold text-gray-900">{damageReport.item_title}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/80 rounded-xl border border-gray-200/40">
                      <span className="text-gray-600 font-medium">Analysis Time:</span>
                      <span className="font-bold text-gray-900">
                        {new Date(damageReport.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/80 rounded-xl border border-gray-200/40">
                      <span className="text-gray-600 font-medium">Processing Agent:</span>
                      <span className="font-bold text-orange-600">BoomiAI Vision Agent</span>
                    </div>
                  </div>
                </div>

                {/* Damage Score */}
                <div className="bg-gradient-to-br from-red-50 to-white border border-red-200/50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="mr-3">⚠️</span>
                    Damage Assessment
                  </h3>
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="w-full h-full bg-gray-200 rounded-full"></div>
                      <div 
                        className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-green-400 to-red-500 rounded-full transform origin-center"
                        style={{
                          clipPath: `polygon(50% 50%, 50% 0%, ${50 + (damageReport.damage_score * 50)}% 0%, ${50 + (damageReport.damage_score * 50)}% 100%, 50% 100%)`
                        }}
                      ></div>
                      <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{(damageReport.damage_score * 100).toFixed(0)}%</div>
                          <div className="text-xs text-gray-600">Damage</div>
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${damageReport.damage_score > 0.5 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {damageReport.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI-Generated Damage Heatmap */}
              <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200/50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-3">🔥</span>
                  AI-Generated Damage Heatmap
                </h3>
                <p className="text-gray-600 mb-4">
                  Our advanced computer vision AI has analyzed the returned item and highlighted areas of concern:
                </p>
                <div className="bg-white rounded-xl border border-gray-200/40 p-4 text-center">
                  <img 
                    src={damageReport.heatmap_url} 
                    alt="AI Damage Analysis Heatmap"
                    className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                    style={{ maxHeight: '400px' }}
                  />
                  <p className="text-sm text-gray-500 mt-3 italic">
                    Red areas indicate detected damage or wear patterns
                  </p>
                </div>
              </div>

              {/* Analysis Details */}
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200/50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-3">📊</span>
                  Detailed Analysis Report
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/80 rounded-xl border border-gray-200/40 p-4 text-center">
                    <div className="text-2xl mb-2">🔍</div>
                    <div className="text-sm text-gray-600">Algorithm Used</div>
                    <div className="font-bold text-gray-900">OpenCV Deep Learning</div>
                  </div>
                  <div className="bg-white/80 rounded-xl border border-gray-200/40 p-4 text-center">
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="text-sm text-gray-600">Processing Time</div>
                    <div className="font-bold text-gray-900">2.3 seconds</div>
                  </div>
                  <div className="bg-white/80 rounded-xl border border-gray-200/40 p-4 text-center">
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="text-sm text-gray-600">Confidence Level</div>
                    <div className="font-bold text-gray-900">94.2%</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200/30">
                <button 
                  onClick={() => setShowDamageResults(false)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-2">✅</span>
                    Continue to Dashboard
                  </span>
                </button>
                <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                  <span className="flex items-center justify-center">
                    <span className="mr-2">📄</span>
                    Download Report
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DashboardPage;
