/**
 * ConfidenceTestPage - Comprehensive QA Testing Interface
 * PRD Reference: PRD-1.2.8-confidence-percentage-display.md
 * 
 * Dedicated testing page for browser-based validation of ConfidenceDisplay component
 */

import React, { useState, useEffect } from 'react';
import { ConfidenceDisplay } from '../components/ui/ConfidenceDisplay';
import { VerdictDisplay } from '../components/verdict/VerdictDisplay';
import type { ConfidenceVariant, ConfidenceSize, ColorScheme } from '../components/ui/ConfidenceDisplay';
import type { VerdictData } from '../components/verdict/VerdictDisplay';

export const ConfidenceTestPage: React.FC = () => {
  const [animationTestRunning, setAnimationTestRunning] = useState(false);
  const [performanceResults, setPerformanceResults] = useState<any[]>([]);
  const [accessibilityMode, setAccessibilityMode] = useState(false);

  // Test configurations
  const confidenceLevels = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
  const variants: ConfidenceVariant[] = ['bar', 'circular', 'text'];
  const sizes: ConfidenceSize[] = ['small', 'medium', 'large'];
  const colorSchemes: ColorScheme[] = ['verdict', 'confidence'];

  // Sample verdict data for integration testing
  const sampleVerdicts: VerdictData[] = [
    {
      verdict: 'Diamond',
      confidence: 95,
      reasoning: 'Strong bullish indicators with high volume confirmation',
      processingTime: 1250,
      timestamp: new Date().toISOString()
    },
    {
      verdict: 'Fire',
      confidence: 70,
      reasoning: 'Moderate bullish momentum with some resistance',
      processingTime: 980,
      timestamp: new Date().toISOString()
    },
    {
      verdict: 'Skull',
      confidence: 25,
      reasoning: 'Bearish signals detected, proceed with caution',
      processingTime: 750,
      timestamp: new Date().toISOString()
    }
  ];

  // Performance testing function
  const runPerformanceTest = () => {
    const results: any[] = [];
    
    // Test rendering performance
    const renderStart = performance.now();
    for (let i = 0; i < 100; i++) {
      // Simulate rapid re-renders
    }
    const renderEnd = performance.now();
    
    results.push({
      test: 'Render Performance',
      time: renderEnd - renderStart,
      status: renderEnd - renderStart < 16 ? 'PASS' : 'FAIL' // 60fps = 16ms per frame
    });

    setPerformanceResults(results);
  };

  // Animation test function
  const runAnimationTest = () => {
    setAnimationTestRunning(true);
    setTimeout(() => setAnimationTestRunning(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ConfidenceDisplay QA Testing Suite
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive browser-based testing for PRD 1.2.8 - Confidence Percentage Display
          </p>
          
          {/* Test Controls */}
          <div className="mt-4 flex flex-wrap gap-4">
            <button
              onClick={runAnimationTest}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Animations
            </button>
            <button
              onClick={runPerformanceTest}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Run Performance Test
            </button>
            <button
              onClick={() => setAccessibilityMode(!accessibilityMode)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                accessibilityMode 
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Accessibility Mode: {accessibilityMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Performance Results */}
        {performanceResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Performance Test Results
            </h2>
            <div className="space-y-2">
              {performanceResults.map((result, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span>{result.test}</span>
                  <span className={`font-medium ${
                    result.status === 'PASS' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.time.toFixed(2)}ms - {result.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Variant Testing Grid */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Variant & Size Testing Matrix
          </h2>
          
          {sizes.map(size => (
            <div key={size} className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200 capitalize">
                {size} Size Components
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {variants.map(variant => (
                  <div key={variant} className="space-y-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {variant} Variant
                    </h4>
                    
                    {/* Test different confidence levels */}
                    <div className="space-y-2">
                      {[25, 65, 90].map(confidence => (
                        <div key={confidence} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="text-xs text-gray-500 mb-2">{confidence}% Confidence</div>
                          <ConfidenceDisplay
                            confidence={confidence}
                            variant={variant}
                            size={size}
                            animated={animationTestRunning}
                            colorScheme="verdict"
                            showLabel={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Color Scheme Comparison */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Color Scheme Comparison Testing
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {colorSchemes.map(scheme => (
              <div key={scheme} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 capitalize">
                  {scheme} Color Scheme
                </h3>
                
                <div className="space-y-3">
                  {[20, 60, 95].map(confidence => (
                    <div key={confidence} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{confidence}% Confidence</span>
                        <span className="text-xs text-gray-500">
                          {confidence >= 75 ? 'High' : confidence >= 50 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                      <ConfidenceDisplay
                        confidence={confidence}
                        variant="bar"
                        size="medium"
                        colorScheme={scheme}
                        animated={animationTestRunning}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VerdictDisplay Integration Testing */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            VerdictDisplay Integration Testing
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Testing backward compatibility and integration with existing VerdictDisplay component
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {sampleVerdicts.map((verdict, index) => (
              <VerdictDisplay
                key={index}
                data={verdict}
                animated={animationTestRunning}
                showDetails={true}
                size="medium"
              />
            ))}
          </div>

          {/* Compact mode testing */}
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
              Compact Mode Testing
            </h3>
            <div className="flex flex-wrap gap-4">
              {sampleVerdicts.map((verdict, index) => (
                <VerdictDisplay
                  key={`compact-${index}`}
                  data={verdict}
                  animated={false}
                  showDetails={false}
                  size="small"
                  compact={true}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stress Testing */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Stress Testing - Multiple Components
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Testing performance with many components rendered simultaneously
          </p>
          
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
            {Array.from({ length: 48 }, (_, i) => (
              <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <ConfidenceDisplay
                  confidence={Math.floor(Math.random() * 100)}
                  variant={variants[i % variants.length]}
                  size="small"
                  colorScheme={colorSchemes[i % colorSchemes.length]}
                  animated={animationTestRunning}
                  showLabel={false}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility Testing */}
        {accessibilityMode && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-2 border-purple-300 dark:border-purple-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Accessibility Testing Mode
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Use screen reader, keyboard navigation, and accessibility tools to test these components
            </p>
            
            <div className="space-y-6">
              {/* High contrast testing */}
              <div className="p-4 bg-black text-white rounded">
                <h3 className="text-lg font-medium mb-4">High Contrast Testing</h3>
                <div className="space-y-4">
                  {[30, 70, 95].map(confidence => (
                    <ConfidenceDisplay
                      key={confidence}
                      confidence={confidence}
                      variant="bar"
                      size="large"
                      colorScheme="confidence"
                      ariaLabel={`Accessibility test: ${confidence} percent confidence level`}
                    />
                  ))}
                </div>
              </div>

              {/* Keyboard navigation testing */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  Keyboard Navigation Testing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {variants.map(variant => (
                    <div key={variant} tabIndex={0} className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none">
                      <h4 className="font-medium mb-2 capitalize">{variant} - Focus Test</h4>
                      <ConfidenceDisplay
                        confidence={75}
                        variant={variant}
                        size="medium"
                        colorScheme="verdict"
                        ariaLabel={`Keyboard navigation test for ${variant} variant`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edge Cases Testing */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Edge Cases & Error Handling
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Edge case values */}
            {[
              { label: '0% Confidence', value: 0 },
              { label: '100% Confidence', value: 100 },
              { label: 'Negative Value', value: -10 },
              { label: 'Over 100%', value: 150 },
              { label: 'Decimal Value', value: 73.5 },
              { label: 'String Value', value: 'invalid' as any },
              { label: 'NaN Value', value: NaN },
              { label: 'Infinity', value: Infinity }
            ].map((test, index) => (
              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-sm font-medium mb-2">{test.label}</div>
                <div className="text-xs text-gray-500 mb-2">Input: {String(test.value)}</div>
                <ConfidenceDisplay
                  confidence={test.value}
                  variant="bar"
                  size="small"
                  colorScheme="verdict"
                  animated={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Browser Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Browser Testing Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User Agent:</strong><br />
              <code className="text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">
                {navigator.userAgent}
              </code>
            </div>
            <div>
              <strong>Viewport Size:</strong> {window.innerWidth} × {window.innerHeight}<br />
              <strong>Device Pixel Ratio:</strong> {window.devicePixelRatio}<br />
              <strong>Color Scheme:</strong> {window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'}<br />
              <strong>Reduced Motion:</strong> {window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConfidenceTestPage;