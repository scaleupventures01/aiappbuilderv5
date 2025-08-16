/**
 * VerdictDisplay Demo Component
 * PRD Reference: PRD-1.2.7-verdict-display-system.md
 * 
 * Demo component to showcase verdict display functionality
 */

import React, { useState } from 'react';
import { VerdictDisplay, VerdictData, VerdictType } from './VerdictDisplay';

const VerdictDisplayDemo: React.FC = () => {
  const [selectedVerdict, setSelectedVerdict] = useState<VerdictType>('Diamond');
  const [confidence, setConfidence] = useState(85);
  const [animated, setAnimated] = useState(true);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [compact, setCompact] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const sampleVerdicts: Record<VerdictType, VerdictData> = {
    Diamond: {
      verdict: 'Diamond',
      confidence: 92,
      reasoning: 'Strong bullish indicators with high volume breakout above key resistance levels. Multiple technical indicators align for significant upward momentum.',
      processingTime: 1250,
      timestamp: new Date().toISOString()
    },
    Fire: {
      verdict: 'Fire',
      confidence: 75,
      reasoning: 'Moderate bullish momentum detected with increasing volume. Price action shows positive trend continuation patterns.',
      processingTime: 980,
      timestamp: new Date().toISOString()
    },
    Skull: {
      verdict: 'Skull',
      confidence: 88,
      reasoning: 'Bearish divergence signals with breakdown below critical support. Risk of further downside movement is elevated.',
      processingTime: 1100,
      timestamp: new Date().toISOString()
    }
  };

  const currentData: VerdictData = {
    ...sampleVerdicts[selectedVerdict],
    confidence
  };

  const handleVerdictClick = (data: VerdictData) => {
    console.log('Verdict clicked:', data);
    alert(`Clicked: ${data.verdict} with ${data.confidence}% confidence`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Verdict Display System Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Interactive demonstration of the Diamond/Fire/Skull verdict display component
        </p>
      </div>

      {/* Controls */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Verdict Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verdict Type
            </label>
            <div className="space-y-2">
              {(['Diamond', 'Fire', 'Skull'] as VerdictType[]).map((verdict) => (
                <label key={verdict} className="flex items-center">
                  <input
                    type="radio"
                    value={verdict}
                    checked={selectedVerdict === verdict}
                    onChange={(e) => setSelectedVerdict(e.target.value as VerdictType)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {verdict === 'Diamond' && '💎'} 
                    {verdict === 'Fire' && '🔥'} 
                    {verdict === 'Skull' && '💀'} 
                    {verdict}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Confidence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confidence: {confidence}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Size
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as 'small' | 'medium' | 'large')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
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
              <span className="text-sm text-gray-700 dark:text-gray-300">Compact Mode</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show Details</span>
            </label>
          </div>
        </div>
      </div>

      {/* Demo Display */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Live Preview</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interactive Version */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              Interactive (Clickable)
            </h3>
            <VerdictDisplay
              data={currentData}
              animated={animated}
              size={size}
              compact={compact}
              showDetails={showDetails}
              onVerdictClick={handleVerdictClick}
              className="max-w-md"
            />
          </div>

          {/* Static Version */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              Static (Non-interactive)
            </h3>
            <VerdictDisplay
              data={currentData}
              animated={animated}
              size={size}
              compact={compact}
              showDetails={showDetails}
              className="max-w-md"
            />
          </div>
        </div>
      </div>

      {/* All Verdicts Showcase */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">All Verdict Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['Diamond', 'Fire', 'Skull'] as VerdictType[]).map((verdict) => (
            <VerdictDisplay
              key={verdict}
              data={sampleVerdicts[verdict]}
              animated={true}
              size="medium"
              showDetails={true}
              onVerdictClick={handleVerdictClick}
            />
          ))}
        </div>
      </div>

      {/* Size Comparison */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Size Comparison</h2>
        <div className="space-y-4">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <div key={size}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                {size} Size
              </h3>
              <VerdictDisplay
                data={sampleVerdicts.Diamond}
                size={size}
                animated={false}
                showDetails={size !== 'small'}
                className="max-w-md"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Compact vs Full */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Layout Comparison</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compact Layout
            </h3>
            <VerdictDisplay
              data={sampleVerdicts.Fire}
              compact={true}
              animated={false}
              size="medium"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Layout
            </h3>
            <VerdictDisplay
              data={sampleVerdicts.Fire}
              compact={false}
              animated={false}
              size="medium"
              showDetails={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerdictDisplayDemo;