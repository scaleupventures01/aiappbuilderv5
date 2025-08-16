import React from 'react';
import { cn } from '@/utils/cn';

export type SpeedMode = 'super_fast' | 'fast' | 'balanced' | 'high_accuracy';

export interface SpeedOption {
  id: SpeedMode;
  name: string;
  description: string;
  estimatedTime: string;
  estimatedCost: string;
  reasoningEffort: number;
  icon: React.ReactNode;
  color: string;
}

interface SpeedSelectorProps {
  selected?: SpeedMode;
  // eslint-disable-next-line no-unused-vars
  onSelect?: (speed: SpeedMode) => void;
  className?: string;
  showDetails?: boolean;
  disabled?: boolean;
}

const speedOptions: SpeedOption[] = [
  {
    id: 'super_fast',
    name: 'Super Fast',
    description: 'Quick responses for simple questions',
    estimatedTime: '1-3s',
    estimatedCost: '$0.01',
    reasoningEffort: 1,
    color: 'bg-red-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    id: 'fast',
    name: 'Fast',
    description: 'Good balance of speed and quality',
    estimatedTime: '3-8s',
    estimatedCost: '$0.03',
    reasoningEffort: 2,
    color: 'bg-orange-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Best overall performance (recommended)',
    estimatedTime: '8-15s',
    estimatedCost: '$0.05',
    reasoningEffort: 3,
    color: 'bg-blue-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  {
    id: 'high_accuracy',
    name: 'High Accuracy',
    description: 'Maximum quality for complex analysis',
    estimatedTime: '15-30s',
    estimatedCost: '$0.08',
    reasoningEffort: 4,
    color: 'bg-green-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export const SpeedSelector: React.FC<SpeedSelectorProps> = ({
  selected = 'balanced',
  onSelect,
  className = '',
  showDetails = true,
  disabled = false
}) => {
  const selectedOption = speedOptions.find(option => option.id === selected) || speedOptions[2];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Compact selector for message input */}
      {!showDetails && (
        <div className="flex items-center space-x-2">
          <div className={cn('w-3 h-3 rounded-full', selectedOption.color)} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedOption.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({selectedOption.estimatedTime})
          </span>
        </div>
      )}

      {/* Detailed selector for settings */}
      {showDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {speedOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect?.(option.id)}
              disabled={disabled}
              className={cn(
                'p-4 rounded-lg border-2 transition-all duration-200 text-left',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                selected === option.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <div className="flex items-start space-x-3">
                <div className={cn('p-2 rounded-lg text-white', option.color)}>
                  {option.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {option.name}
                    </h3>
                    {selected === option.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {option.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 dark:text-gray-400">Time:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {option.estimatedTime}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 dark:text-gray-400">Cost:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {option.estimatedCost}
                      </span>
                    </div>
                  </div>
                  
                  {/* Reasoning effort indicator */}
                  <div className="mt-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Quality:</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              'w-2 h-2 rounded-full',
                              level <= option.reasoningEffort
                                ? option.color
                                : 'bg-gray-200 dark:bg-gray-600'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Additional info for detailed view */}
      {showDetails && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Speed Mode Tips:</p>
              <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• Use Super Fast for quick questions or confirmations</li>
                <li>• Use Balanced (recommended) for most trading analysis</li>
                <li>• Use High Accuracy for complex chart analysis or critical decisions</li>
                <li>• Costs are estimated and may vary based on message complexity</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeedSelector;