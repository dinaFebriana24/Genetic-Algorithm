// App.jsx
// Main application component

import React from 'react';
import { useGeneticAlgorithm } from './hooks/useGeneticAlgorithm.js';
import Header from './components/Header.jsx';
import InputSection from './components/InputSection.jsx';
import BestResultHighlight from './components/BestResultHighlight.jsx';
import ResultsGrid from './components/ResultsGrid.jsx';
import MethodInformation from './components/MethodInformation.jsx';

const WisataRouteApp = () => {
  const {
    // State
    startPoint,
    isCalculating,
    results,
    bestResult,
    
    // Actions
    setStartPoint,
    calculateAllRoutes,
    recalculateCombination,
    
    // Computed values
    hasResults,
    calculationProgress
  } = useGeneticAlgorithm();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <Header />

        {/* Input Section */}
        <InputSection
          startPoint={startPoint}
          setStartPoint={setStartPoint}
          onCalculate={calculateAllRoutes}
          isCalculating={isCalculating}
          calculationProgress={calculationProgress}
        />

        {/* Best Result Highlight */}
        <BestResultHighlight bestResult={bestResult} />

        {/* Results Grid */}
        {hasResults && (
          <ResultsGrid 
            results={results} 
            onRecalculate={recalculateCombination}
          />
        )}

        {/* Method Information */}
        <MethodInformation />
        
      </div>
    </div>
  );
};

export default WisataRouteApp;