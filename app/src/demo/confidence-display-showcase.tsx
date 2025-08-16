/**
 * ConfidenceDisplay Component Showcase
 * PRD Reference: PRD-1.2.8-confidence-percentage-display.md
 * 
 * Simple demonstration component showing various use cases
 */

import React from 'react';
import { ConfidenceDisplay } from '../components/ui/ConfidenceDisplay';

export const ConfidenceDisplayShowcase: React.FC = () => {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Confidence Display Component
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enhanced confidence visualization from PRD 1.2.8
        </p>
      </div>

      {/* Basic Examples */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Basic Confidence Levels
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium text-red-600">Low Confidence (25%)</h3>
            <ConfidenceDisplay confidence={25} variant="bar" size="medium" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-orange-600">Medium Confidence (65%)</h3>
            <ConfidenceDisplay confidence={65} variant="bar" size="medium" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-emerald-600">High Confidence (90%)</h3>
            <ConfidenceDisplay confidence={90} variant="bar" size="medium" />
          </div>
        </div>
      </div>

      {/* Variant Examples */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          All Variants (75% Confidence)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Bar Variant</h3>
            <ConfidenceDisplay confidence={75} variant="bar" size="medium" />
          </div>
          
          <div className="space-y-2 flex flex-col items-center">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Circular Variant</h3>
            <ConfidenceDisplay confidence={75} variant="circular" size="medium" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Text Variant</h3>
            <ConfidenceDisplay confidence={75} variant="text" size="medium" />
          </div>
        </div>
      </div>

      {/* Size Examples */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Size Variations (Bar Variant, 80% Confidence)
        </h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Small</h3>
            <ConfidenceDisplay confidence={80} variant="bar" size="small" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Medium</h3>
            <ConfidenceDisplay confidence={80} variant="bar" size="medium" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Large</h3>
            <ConfidenceDisplay confidence={80} variant="bar" size="large" />
          </div>
        </div>
      </div>

      {/* Color Scheme Examples */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Color Schemes (85% Confidence)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Verdict Scheme (Trading)</h3>
            <ConfidenceDisplay confidence={85} variant="bar" colorScheme="verdict" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Standard Scheme</h3>
            <ConfidenceDisplay confidence={85} variant="bar" colorScheme="confidence" />
          </div>
        </div>
      </div>

      {/* Compact Examples */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Compact Mode Examples
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 dark:text-gray-300">Trading Signal:</span>
            <ConfidenceDisplay confidence={92} variant="text" compact={true} showLabel={false} />
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 dark:text-gray-300">Analysis Quality:</span>
            <ConfidenceDisplay confidence={68} variant="bar" compact={true} size="small" />
          </div>
        </div>
      </div>

      {/* Integration Example */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Integration with VerdictDisplay
        </h2>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The ConfidenceDisplay component has been successfully integrated into the existing 
            VerdictDisplay component, maintaining backward compatibility while providing enhanced 
            flexibility for standalone usage.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Before (Internal ConfidenceBar):</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Deprecated</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">After (ConfidenceDisplay):</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Component implemented according to PRD 1.2.8 specifications</p>
        <p>Supports accessibility, animations, and responsive design</p>
      </div>
    </div>
  );
};

export default ConfidenceDisplayShowcase;