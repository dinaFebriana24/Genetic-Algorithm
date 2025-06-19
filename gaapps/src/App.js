import React, { useState, useEffect } from 'react';
import { MapPin, Route, Settings, Play, Clock, Star, TrendingUp, Award } from 'lucide-react';
import './index.css';

const WisataRouteApp = () => {
  const [startPoint, setStartPoint] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState([]);
  const [bestResults, setBestResults] = useState([]);

  // Daftar lokasi wisata
  const locations = [
    'Malioboro',
    'Taman Sari',
    'Alun-Alun Kidul',
    'Prawirotaman',
    'Kaliurang - Jeep Tour',
    'Candi Prambanan',
    'Goa Pindul',
    'Pantai Parangtritis',
    'Pantai Glagah',
    'Tugu Margo Utomo'
  ];

  // Matrix jarak (dalam km)
  const distanceMatrix = [
    [0, 2.5, 2.5, 3.6, 25, 17, 42, 28, 41, 21],
    [2.5, 0, 0.7, 2.9, 27, 19, 42, 27, 41, 20],
    [2.5, 0.7, 0, 2.3, 27, 21, 42, 27, 41, 20],
    [3.6, 2.9, 2.3, 0, 28, 25, 41, 26, 46, 11],
    [25, 27, 27, 28, 0, 24, 59, 53, 66, 52],
    [17, 19, 21, 25, 24, 0, 37, 43, 58, 20],
    [42, 42, 42, 41, 59, 37, 0, 48, 76, 47],
    [28, 27, 27, 26, 53, 43, 48, 0, 38, 34],
    [41, 41, 41, 46, 66, 58, 76, 38, 0, 40],
    [21, 20, 20, 11, 52, 20, 47, 34, 40, 0]
  ];

  // Matrix waktu (dalam menit)
  const timeMatrix = [
    [0, 7, 7, 8, 39, 27, 66, 42, 57, 33],
    [9, 0, 3, 8, 45, 32, 70, 47, 63, 35],
    [8, 3, 0, 6, 53, 37, 72, 46, 63, 36],
    [9, 9, 7, 0, 54, 33, 66, 42, 64, 23],
    [42, 47, 56, 56, 0, 39, 89, 87, 102, 78],
    [26, 32, 39, 39, 40, 0, 64, 67, 86, 40],
    [64, 65, 70, 69, 99, 60, 0, 72, 112, 80],
    [42, 47, 43, 40, 87, 66, 69, 0, 54, 54],
    [63, 66, 66, 61, 100, 94, 110, 53, 0, 62],
    [35, 37, 19, 21, 84, 41, 82, 55, 61, 0]
  ];

  // Semua kombinasi metode
  const methodCombinations = [
    { selection: 'tournament', mutation: 'swap', name: 'Tournament + Swap' },
    { selection: 'tournament', mutation: 'inversion', name: 'Tournament + Inversion' },
    { selection: 'tournament', mutation: 'scramble', name: 'Tournament + Scramble' },
    { selection: 'roulette', mutation: 'swap', name: 'Roulette + Swap' },
    { selection: 'roulette', mutation: 'inversion', name: 'Roulette + Inversion' },
    { selection: 'roulette', mutation: 'scramble', name: 'Roulette + Scramble' },
    { selection: 'rank', mutation: 'swap', name: 'Rank + Swap' },
    { selection: 'rank', mutation: 'inversion', name: 'Rank + Inversion' },
    { selection: 'rank', mutation: 'scramble', name: 'Rank + Scramble' }
  ];

  // Fungsi untuk mendapatkan index lokasi
  const getLocationIndex = (location) => {
    return locations.indexOf(location);
  };

  // Fungsi untuk menghitung total jarak rute
  const calculateTotalDistance = (route) => {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const fromIndex = getLocationIndex(route[i]);
      const toIndex = getLocationIndex(route[i + 1]);
      totalDistance += distanceMatrix[fromIndex][toIndex];
    }
    return totalDistance;
  };

  // Fungsi untuk menghitung total waktu rute
  const calculateTotalTime = (route) => {
    let totalTime = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const fromIndex = getLocationIndex(route[i]);
      const toIndex = getLocationIndex(route[i + 1]);
      totalTime += timeMatrix[fromIndex][toIndex];
    }
    return totalTime;
  };

  // Fungsi untuk menghitung fitness gabungan (jarak + waktu)
  const calculateFitness = (route) => {
    const totalDistance = calculateTotalDistance(route);
    const totalTime = calculateTotalTime(route);
    
    // Normalisasi dan bobot
    // Bobot: 60% jarak, 40% waktu
    const distanceWeight = 0.6;
    const timeWeight = 0.4;
    
    // Normalisasi dengan nilai maksimum yang mungkin
    const maxDistance = 360; // Estimasi jarak maksimum yang mungkin
    const maxTime = 588; // Estimasi waktu maksimum yang mungkin
    
    const normalizedDistance = totalDistance / maxDistance;
    const normalizedTime = totalTime / maxTime;
    
    // Gabungkan dengan bobot (semakin kecil semakin baik)
    const combinedScore = (distanceWeight * normalizedDistance) + (timeWeight * normalizedTime);
    
    // Return inverse untuk fitness (semakin tinggi semakin baik)
    return 1 / (combinedScore);
  };

  // Tournament Selection
  const tournamentSelection = (population, tournamentSize = 3) => {
    const tournament = [];
    for (let i = 0; i < tournamentSize; i++) {
      tournament.push(population[Math.floor(Math.random() * population.length)]);
    }
    return tournament.reduce((best, current) => 
      calculateFitness(current) > calculateFitness(best) ? current : best
    );
  };

  // Roulette Wheel Selection
  const rouletteWheelSelection = (population) => {
    const fitnessValues = population.map(calculateFitness);
    const totalFitness = fitnessValues.reduce((sum, fitness) => sum + fitness, 0);
    const randomValue = Math.random() * totalFitness;
    
    let cumulativeFitness = 0;
    for (let i = 0; i < population.length; i++) {
      cumulativeFitness += fitnessValues[i];
      if (cumulativeFitness >= randomValue) {
        return population[i];
      }
    }
    return population[population.length - 1];
  };

  // Rank Selection
  const rankSelection = (population) => {
    const sortedPopulation = [...population].sort((a, b) => 
      calculateFitness(b) - calculateFitness(a)
    );
    const totalRanks = (population.length * (population.length + 1)) / 2;
    const randomValue = Math.random() * totalRanks;
    
    let cumulativeRank = 0;
    for (let i = 0; i < sortedPopulation.length; i++) {
      cumulativeRank += (population.length - i);
      if (cumulativeRank >= randomValue) {
        return sortedPopulation[i];
      }
    }
    return sortedPopulation[sortedPopulation.length - 1];
  };

  // Swap Mutation
  const swapMutation = (route) => {
    const mutated = [...route];
    if (mutated.length < 3) return mutated;
    
    const i = Math.floor(Math.random() * (mutated.length - 1)) + 1;
    const j = Math.floor(Math.random() * (mutated.length - 1)) + 1;
    [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    return mutated;
  };

  // Inversion Mutation
  const inversionMutation = (route) => {
    const mutated = [...route];
    if (mutated.length < 4) return mutated;
    
    const start = Math.floor(Math.random() * (mutated.length - 2)) + 1;
    const end = Math.floor(Math.random() * (mutated.length - start - 1)) + start + 1;
    
    const segment = mutated.slice(start, end + 1).reverse();
    mutated.splice(start, segment.length, ...segment);
    return mutated;
  };

  // Scramble Mutation
  const scrambleMutation = (route) => {
    const mutated = [...route];
    if (mutated.length < 4) return mutated;
    
    const start = Math.floor(Math.random() * (mutated.length - 2)) + 1;
    const end = Math.floor(Math.random() * (mutated.length - start - 1)) + start + 1;
    
    const segment = mutated.slice(start, end + 1);
    for (let i = segment.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [segment[i], segment[j]] = [segment[j], segment[i]];
    }
    mutated.splice(start, segment.length, ...segment);
    return mutated;
  };

  // Algoritma Genetika untuk satu kombinasi
  const geneticAlgorithm = (startLocation, selectionType, mutationType) => {
    const otherLocations = locations.filter(loc => loc !== startLocation);
    const populationSize = 50;
    const generations = 100;
    const mutationRate = 0.1;

    // Inisialisasi populasi
    const population = [];
    for (let i = 0; i < populationSize; i++) {
      const shuffled = [...otherLocations].sort(() => Math.random() - 0.5);
      population.push([startLocation, ...shuffled]);
    }

    // Evolusi
    for (let gen = 0; gen < generations; gen++) {
      const newPopulation = [];
      
      // Elitism
      const sorted = [...population].sort((a, b) => calculateFitness(b) - calculateFitness(a));
      newPopulation.push(sorted[0]);

      // Generate populasi baru
      while (newPopulation.length < populationSize) {
        let parent1, parent2;
        
        // Seleksi parent
        switch (selectionType) {
          case 'tournament':
            parent1 = tournamentSelection(population);
            parent2 = tournamentSelection(population);
            break;
          case 'roulette':
            parent1 = rouletteWheelSelection(population);
            parent2 = rouletteWheelSelection(population);
            break;
          case 'rank':
            parent1 = rankSelection(population);
            parent2 = rankSelection(population);
            break;
        }

        // Crossover
        const crossoverPoint = Math.floor(parent1.length / 2);
        let child = [...parent1.slice(0, crossoverPoint)];
        
        for (let loc of parent2) {
          if (!child.includes(loc)) {
            child.push(loc);
          }
        }

        // Mutasi
        if (Math.random() < mutationRate) {
          switch (mutationType) {
            case 'swap':
              child = swapMutation(child);
              break;
            case 'inversion':
              child = inversionMutation(child);
              break;
            case 'scramble':
              child = scrambleMutation(child);
              break;
          }
        }

        newPopulation.push(child);
      }
      
      population.splice(0, population.length, ...newPopulation);
    }

    // Return solusi terbaik
    const bestSolution = population.reduce((best, current) => 
      calculateFitness(current) > calculateFitness(best) ? current : best
    );

    const totalDistance = calculateTotalDistance(bestSolution);
    const totalTime = calculateTotalTime(bestSolution);

    return {
      route: bestSolution,
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      totalTime: Math.round(totalTime),
      fitnessScore: parseFloat(calculateFitness(bestSolution).toFixed(4))
    };
  };

  // Fungsi untuk membandingkan apakah dua hasil sama
  const areResultsEqual = (result1, result2) => {
    return Math.round(result1.fitnessScore * 1000000) === Math.round(result2.fitnessScore * 1000000) &&
           Math.round(result1.totalDistance * 100) === Math.round(result2.totalDistance * 100) &&
           result1.totalTime === result2.totalTime;
  };

  // Menjalankan semua 9 kombinasi
  const handleCalculateAllRoutes = async () => {
    if (!startPoint) {
      alert('Pilih titik awal terlebih dahulu!');
      return;
    }

    setIsCalculating(true);
    setResults([]);
    setBestResults([]);
    
    const allResults = [];
    
    // Jalankan setiap kombinasi beberapa kali untuk mendapat hasil yang lebih stabil
    for (let i = 0; i < methodCombinations.length; i++) {
      const combination = methodCombinations[i];
      
      // Simulasi progress loading
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Jalankan algoritma 3 kali dan ambil hasil terbaik untuk mengurangi random variance
      let bestRun = null;
      for (let run = 0; run < 3; run++) {
        const result = geneticAlgorithm(startPoint, combination.selection, combination.mutation);
        if (!bestRun || result.fitnessScore > bestRun.fitnessScore) {
          bestRun = result;
        }
      }
      
      const combinationResult = {
        ...bestRun,
        combinationName: combination.name,
        selectionMethod: combination.selection,
        mutationMethod: combination.mutation,
        rank: 0, // Will be calculated later
        combinationIndex: i // Untuk tie-breaking
      };
      
      allResults.push(combinationResult);
      setResults([...allResults]); // Update UI progressively
    }

    // Sort hasil berdasarkan fitness score (descending - higher is better)
    allResults.sort((a, b) => {
      // Primary: fitness score (descending - higher is better) - presisi 6 desimal
      const fitnessA = Math.round(a.fitnessScore * 1000000);
      const fitnessB = Math.round(b.fitnessScore * 1000000);
      if (fitnessA !== fitnessB) {
        return fitnessB - fitnessA;
      }
      
      // Secondary: total distance (ascending - smaller is better) - presisi 2 desimal
      const distanceA = Math.round(a.totalDistance * 100);
      const distanceB = Math.round(b.totalDistance * 100);
      if (distanceA !== distanceB) {
        return distanceA - distanceB;
      }
      
      // Tertiary: total time (ascending - faster is better)
      if (a.totalTime !== b.totalTime) {
        return a.totalTime - b.totalTime;
      }
      
      // Quaternary: kombinasi index untuk konsistensi
      return a.combinationIndex - b.combinationIndex;
    });

    // Assign ranks berdasarkan nilai yang sama
    let currentRank = 1;
    for (let i = 0; i < allResults.length; i++) {
      if (i > 0) {
        const current = allResults[i];
        const previous = allResults[i - 1];
        
        // Jika nilai tidak sama dengan sebelumnya, update rank
        if (!areResultsEqual(current, previous)) {
          currentRank = i + 1;
        }
      }
      allResults[i].rank = currentRank;
    }

    // Temukan semua hasil terbaik (rank 1)
    const bestResultsList = allResults.filter(result => result.rank === 1);
    
    setBestResults(bestResultsList);
    setResults(allResults);
    setIsCalculating(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
          <h1 className="text-2xl font-bold mb-2">Wisata Route AI</h1>
          <p className="text-blue-100">Perbandingan 9 Kombinasi Algoritma Genetika</p>
          <p className="text-blue-200 text-sm mt-1">
            3 Metode Seleksi (Tournament, Roulette Wheel, and Rank Selection)</p>
          <p className="text-blue-200 text-sm mt-1">
            3 Metode Mutasi (Inversion, Swap, and Scrambel Mutation)</p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Pilih Titik Awal Perjalanan
            </label>
            <select
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
            disabled={!startPoint || isCalculating}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center"
          >
            {isCalculating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Menghitung 9 Kombinasi... ({results.length}/9)
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Hitung Semua Kombinasi Rute
              </>
            )}
          </button>
        </div>

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

       
      </div>
    </div>
  );
};

export default WisataRouteApp;