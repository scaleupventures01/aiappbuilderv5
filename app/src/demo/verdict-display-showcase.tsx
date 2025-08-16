/**
 * VerdictDisplay Component Showcase
 * PRD Reference: PRD-1.2.7-verdict-display-component.md
 * 
 * Demo page to showcase all verdict display variants and features
 */

import React, { useState } from 'react';
import { VerdictDisplay, VerdictType } from '../components/chat/VerdictDisplay';

const VerdictDisplayShowcase: React.FC = () => {
  const [selectedVerdict, setSelectedVerdict] = useState<VerdictType>('Diamond');
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showLabel, setShowLabel] = useState(true);
  const [animated, setAnimated] = useState(true);

  const verdicts: VerdictType[] = ['Diamond', 'Fire', 'Skull'];
  const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

  const handleVerdictClick = (verdict: VerdictType) => {
    alert(`Clicked ${verdict} verdict!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Verdict Display Component Showcase
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive demo of the trading verdict display system
          </p>
        </header>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Controls
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Verdict Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verdict Type
              </label>
              <select
                value={selectedVerdict}
                onChange={(e) => setSelectedVerdict(e.target.value as VerdictType)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
              >
                {verdicts.map(verdict => (
                  <option key={verdict} value={verdict}>{verdict}</option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value as 'small' | 'medium' | 'large')}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white"
              >
                {sizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            {/* Show Label */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showLabel}
                  onChange={(e) => setShowLabel(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Show Label
                </span>
              </label>
            </div>

            {/* Animated */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={animated}
                  onChange={(e) => setAnimated(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Animated
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Interactive Demo
          </h2>
          
          <div className="flex justify-center">
            <VerdictDisplay
              verdict={selectedVerdict}
              size={selectedSize}
              showLabel={showLabel}
              animated={animated}
              onClick={() => handleVerdictClick(selectedVerdict)}
            />
          </div>
        </div>

        {/* All Variants Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            All Verdict Types
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {verdicts.map(verdict => (
              <div key={verdict} className="text-center">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                  {verdict}
                </h3>
                <VerdictDisplay
                  verdict={verdict}
                  size="medium"
                  showLabel={true}
                  animated={true}
                  onClick={() => handleVerdictClick(verdict)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Size Variants */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Size Variants
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sizes.map(size => (
              <div key={size} className="text-center">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                  {size}
                </h3>
                <VerdictDisplay
                  verdict="Diamond"
                  size={size}
                  showLabel={true}
                  animated={true}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Accessibility Features
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                Keyboard Navigation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click and then use Tab, Enter, and Space to navigate and activate verdicts.
              </p>
              <div className="flex gap-4">
                {verdicts.map(verdict => (
                  <VerdictDisplay
                    key={verdict}
                    verdict={verdict}
                    size="small"
                    showLabel={true}
                    animated={false}
                    onClick={() => handleVerdictClick(verdict)}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                High Contrast Mode
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Components maintain visibility in high contrast mode.
              </p>
              <div className="border-2 border-gray-900 dark:border-white p-4 rounded">
                {verdicts.map(verdict => (
                  <VerdictDisplay
                    key={verdict}
                    verdict={verdict}
                    size="small"
                    showLabel={true}
                    animated={false}
                    className="mb-2 last:mb-0"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Usage Examples
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <h3 className="font-medium mb-2 text-gray-900 dark:text-white">
                Basic Usage
              </h3>
              <code className="text-sm text-gray-700 dark:text-gray-300">
                {`<VerdictDisplay verdict="Diamond" />`}
              </code>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <h3 className="font-medium mb-2 text-gray-900 dark:text-white">
                With Click Handler
              </h3>
              <code className="text-sm text-gray-700 dark:text-gray-300">
                {`<VerdictDisplay verdict="Fire" onClick={handleClick} />`}
              </code>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <h3 className="font-medium mb-2 text-gray-900 dark:text-white">
                Customized
              </h3>
              <code className="text-sm text-gray-700 dark:text-gray-300">
                {`<VerdictDisplay 
  verdict="Skull" 
  size="large" 
  animated={false} 
  showLabel={false} 
/>`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerdictDisplayShowcase;