/**
 * ConfidenceDisplay Demo Component
 * PRD Reference: PRD-1.2.8-confidence-percentage-display.md
 * 
 * Demonstrates all variants, sizes, and configurations
 * For development and testing purposes
 */

import React, { useState } from 'react';
import { ConfidenceDisplay } from './ConfidenceDisplay';
import type { ConfidenceVariant, ConfidenceSize, ColorScheme } from './ConfidenceDisplay';

export const ConfidenceDisplayDemo: React.FC = () => {
  const [confidence, setConfidence] = useState(75);
  const [variant, setVariant] = useState<ConfidenceVariant>('bar');
  const [size, setSize] = useState<ConfidenceSize>('medium');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('verdict');
  const [showLabel, setShowLabel] = useState(true);
  const [animated, setAnimated] = useState(true);
  const [compact, setCompact] = useState(false);

  const confidenceOptions = [15, 35, 55, 75, 95];

  return (
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Confidence Display Component Demo
        </h1>

        {/* Interactive Controls */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Interactive Controls
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Confidence Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confidence Level: {confidence}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            {/* Variant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variant
              </label>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value as ConfidenceVariant)}
                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="bar">Bar</option>
                <option value="circular">Circular</option>
                <option value="text">Text</option>
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as ConfidenceSize)}
                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Color Scheme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color Scheme
              </label>
              <select
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="verdict">Verdict (Trading)</option>
                <option value="confidence">Standard</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="col-span-1 md:col-span-2 flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showLabel}
                  onChange={(e) => setShowLabel(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show Label</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={animated}
                  onChange={(e) => setAnimated(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Animated</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={compact}
                  onChange={(e) => setCompact(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Compact</span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Live Preview
          </h2>
          
          <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <ConfidenceDisplay
              confidence={confidence}
              variant={variant}
              size={size}
              colorScheme={colorScheme}
              showLabel={showLabel}
              animated={animated}
              compact={compact}
            />
          </div>
        </div>

        {/* Quick Confidence Examples */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Quick Confidence Examples
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {confidenceOptions.map((conf) => (
              <button
                key={conf}
                onClick={() => setConfidence(conf)}
                className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ConfidenceDisplay
                  confidence={conf}
                  variant="bar"
                  size="small"
                  colorScheme={colorScheme}
                  showLabel={false}
                  animated={false}
                />
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {conf}%
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* All Variants Showcase */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            All Variants & Sizes
          </h2>
          
          <div className="space-y-6">
            {(['small', 'medium', 'large'] as ConfidenceSize[]).map((sizeOption) => (
              <div key={sizeOption} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 capitalize">
                  {sizeOption} Size
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Bar Variant</h4>
                    <ConfidenceDisplay
                      confidence={75}
                      variant="bar"
                      size={sizeOption}
                      colorScheme={colorScheme}
                      animated={false}
                    />
                  </div>
                  
                  <div className="space-y-2 flex flex-col items-center">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Circular Variant</h4>
                    <ConfidenceDisplay
                      confidence={75}
                      variant="circular"
                      size={sizeOption}
                      colorScheme={colorScheme}
                      animated={false}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300">Text Variant</h4>
                    <ConfidenceDisplay
                      confidence={75}
                      variant="text"
                      size={sizeOption}
                      colorScheme={colorScheme}
                      animated={false}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Levels Showcase */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Confidence Levels by Color Scheme
          </h2>
          
          {(['verdict', 'confidence'] as ColorScheme[]).map((scheme) => (
            <div key={scheme} className="space-y-4 mb-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 capitalize">
                {scheme} Color Scheme
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600 dark:text-red-400">Low (25%)</h4>
                  <ConfidenceDisplay
                    confidence={25}
                    variant="bar"
                    size="medium"
                    colorScheme={scheme}
                    animated={false}
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-orange-600 dark:text-orange-400">Medium (65%)</h4>
                  <ConfidenceDisplay
                    confidence={65}
                    variant="bar"
                    size="medium"
                    colorScheme={scheme}
                    animated={false}
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-emerald-600 dark:text-emerald-400">High (90%)</h4>
                  <ConfidenceDisplay
                    confidence={90}
                    variant="bar"
                    size="medium"
                    colorScheme={scheme}
                    animated={false}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfidenceDisplayDemo;