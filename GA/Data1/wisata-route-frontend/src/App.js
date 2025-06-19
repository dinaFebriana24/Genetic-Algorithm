import React, { useState, useEffect } from 'react';
import { MapPin, Play, Clock, Star, TrendingUp, Award, AlertCircle, CheckCircle } from 'lucide-react';

const WisataRouteApp = () => {
  const [locations, setLocations] = useState([]);
  const [startPoint, setStartPoint] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState([]);
  const [bestResults, setBestResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // API Base URL - adjust this to match your backend
  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch locations on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`);
      const data = await response.json();
      
      if (data.success) {
        setLocations(data.locations);
      } else {
        setError('Failed to fetch locations');
      }
    } catch (err) {
      setError('Failed to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateAllRoutes = async () => {
    if (!startPoint) {
      setError('Please select a starting point!');
      return;
    }

    setIsCalculating(true);
    setResults([]);
    setBestResults([]);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/calculate-routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startLocation: startPoint
        })
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data.allResults);
        setBestResults(data.data.bestResults);
      } else {
        setError(data.message || 'Failed to calculate routes');
      }
    } catch (err) {
      setError('Failed to connect to server. Please check your connection.');
    } finally {
      setIsCalculating(false);
    }
  };

  const getMethodColor = (rank) => {
    if (rank === 1) return 'bg-green-100 border-green-300 text-green-800';
    if (rank <= 3) return 'bg-blue-100 border-blue-300 text-blue-800';
    if (rank <= 6) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    return 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Award className="w-4 h-4 text-green-600" />;
    if (rank <= 3) return <TrendingUp className="w-4 h-4 text-blue-600" />;
    return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
          <h1 className="text-2xl font-bold mb-2">Wisata Route AI</h1>
          <p className="text-blue-100">Perbandingan 9 Kombinasi Algoritma Genetika</p>
          <p className="text-blue-200 text-sm mt-1">
            3 Metode Seleksi (Tournament, Roulette Wheel, and Rank Selection)
          </p>
          <p className="text-blue-200 text-sm mt-1">
            3 Metode Mutasi (Inversion, Swap, and Scramble Mutation)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-300 rounded-xl p-4 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Pilih Titik Awal Perjalanan
            </label>
            <select
              value={startPoint}
              onChange={(e) => {
                setStartPoint(e.target.value);
                setError('');
              }}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              disabled={isCalculating}
            >
              <option value="">-- Pilih Lokasi --</option>
              {locations.map((location, index) => (
                <option key={index} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCalculateAllRoutes}
            disabled={!startPoint || isCalculating || locations.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Menghitung 9 Kombinasi...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Hitung Semua Kombinasi Rute
              </>
            )}
          </button>
        </div>

        {/* Server Status */}
        {locations.length === 0 && !loading && (
          <div className="bg-yellow-100 border border-yellow-300 rounded-xl p-4 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-yellow-800 font-medium">Backend Server Not Connected</p>
              <p className="text-yellow-700 text-sm">
                Please ensure the Python backend is running on http://localhost:5000
              </p>
            </div>
          </div>
        )}

        {/* Best Results Highlight */}
        {bestResults.length > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center mb-3">
              <Award className="w-6 h-6 mr-2" />
              <h3 className="text-xl font-bold">
                {bestResults.length === 1 ? 'Kombinasi Terbaik' : `${bestResults.length} Kombinasi Terbaik (Tied)`}
              </h3>
            </div>
            
            {bestResults.length === 1 ? (
              // Single best result
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-green-100 text-sm">Metode</p>
                  <p className="font-semibold">{bestResults[0].combinationName}</p>
                </div>
                <div>
                  <p className="text-green-100 text-sm">Total Jarak</p>
                  <p className="font-semibold">{bestResults[0].totalDistance} km</p>
                </div>
                <div>
                  <p className="text-green-100 text-sm">Total Waktu</p>
                  <p className="font-semibold flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {bestResults[0].totalTime} menit
                  </p>
                </div>
                <div>
                  <p className="text-green-100 text-sm">Fitness Score</p>
                  <p className="font-semibold">{bestResults[0].fitnessScore}</p>
                </div>
              </div>
            ) : (
              // Multiple tied results
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-green-100 text-sm">Total Jarak</p>
                    <p className="font-semibold">{bestResults[0].totalDistance} km</p>
                  </div>
                  <div>
                    <p className="text-green-100 text-sm">Total Waktu</p>
                    <p className="font-semibold flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {bestResults[0].totalTime} menit
                    </p>
                  </div>
                  <div>
                    <p className="text-green-100 text-sm">Fitness Score</p>
                    <p className="font-semibold">{bestResults[0].fitnessScore}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-green-100 text-sm mb-2">Metode dengan Performa Sama:</p>
                  <div className="flex flex-wrap gap-2">
                    {bestResults.map((result, index) => (
                      <span key={index} className="bg-green-400 bg-opacity-30 px-3 py-1 rounded-full text-sm font-medium">
                        {result.combinationName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, index) => (
              <div key={index} className={`rounded-xl p-4 border-2 ${getMethodColor(result.rank)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{result.combinationName}</h3>
                  {getRankIcon(result.rank)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Fitness:</span>
                    <span className="font-bold">{result.fitnessScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jarak:</span>
                    <span className="font-semibold">{result.totalDistance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span className="font-semibold">{result.totalTime} min</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                  <p className="text-xs opacity-75 mb-1">Rute:</p>
                  <div className="text-xs space-y-1">
                    {result.route.slice(0, 9).map((location, locIndex) => (
                      <div key={locIndex} className="flex items-center">
                        <div className="w-4 h-4 bg-current rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 opacity-80">
                          {locIndex + 1}
                        </div>
                        <span className="truncate">{location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success Message */}
        {results.length > 0 && !isCalculating && (
          <div className="mt-6 bg-green-100 border border-green-300 rounded-xl p-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">
              Successfully calculated {results.length} route combinations!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WisataRouteApp;