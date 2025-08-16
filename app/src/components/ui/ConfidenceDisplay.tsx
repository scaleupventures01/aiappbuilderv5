/**
 * ConfidenceDisplay Component - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.8-confidence-percentage-display.md
 * 
 * Extracted and enhanced from VerdictDisplay ConfidenceBar component.
 * Provides flexible confidence level visualization with multiple variants,
 * accessibility features, and integration with the existing design system.
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type ConfidenceVariant = 'bar' | 'circular' | 'text';
export type ConfidenceSize = 'small' | 'medium' | 'large';
export type ColorScheme = 'verdict' | 'confidence';

export interface ConfidenceDisplayProps {
  /** Confidence percentage (0-100) */
  confidence: number;
  /** Display variant */
  variant?: ConfidenceVariant;
  /** Component size */
  size?: ConfidenceSize;
  /** Show descriptive label */
  showLabel?: boolean;
  /** Enable animations */
  animated?: boolean;
  /** Color scheme to use */
  colorScheme?: ColorScheme;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode for inline display */
  compact?: boolean;
  /** Custom aria label */
  ariaLabel?: string;
}

/**
 * Get confidence level based on percentage
 */
export const getConfidenceLevel = (confidence: number): ConfidenceLevel => {
  if (confidence >= 75) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
};

/**
 * Trading-semantic color scheme (from VerdictDisplay)
 */
const verdictColorScheme = {
  high: {
    primary: 'text-emerald-600 dark:text-emerald-400',
    background: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-900/50',
    gradient: 'from-emerald-400 to-emerald-600',
    ring: 'ring-emerald-500',
    fill: '#10b981', // emerald-500
    bgFill: '#d1fae5', // emerald-100
    label: 'High Confidence',
    description: 'Strong signal quality'
  },
  medium: {
    primary: 'text-orange-600 dark:text-orange-400',
    background: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-900/50',
    gradient: 'from-orange-400 to-orange-600',
    ring: 'ring-orange-500',
    fill: '#f59e0b', // orange-500
    bgFill: '#fef3c7', // orange-100
    label: 'Medium Confidence',
    description: 'Moderate signal quality'
  },
  low: {
    primary: 'text-red-600 dark:text-red-400',
    background: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-900/50',
    gradient: 'from-red-400 to-red-600',
    ring: 'ring-red-500',
    fill: '#dc2626', // red-600
    bgFill: '#fee2e2', // red-100
    label: 'Low Confidence',
    description: 'Weak signal quality'
  }
};

/**
 * Standard confidence color scheme (from PRD)
 */
const confidenceColorScheme = {
  high: {
    primary: 'text-green-600 dark:text-green-400',
    background: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-900/50',
    gradient: 'from-green-400 to-green-600',
    ring: 'ring-green-500',
    fill: '#10b981', // green-500
    bgFill: '#d1fae5', // green-100
    label: 'High Confidence',
    description: 'Strong signal quality'
  },
  medium: {
    primary: 'text-amber-600 dark:text-amber-400',
    background: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-900/50',
    gradient: 'from-amber-400 to-amber-600',
    ring: 'ring-amber-500',
    fill: '#f59e0b', // amber-500
    bgFill: '#fef3c7', // amber-100
    label: 'Medium Confidence',
    description: 'Moderate signal quality'
  },
  low: {
    primary: 'text-red-600 dark:text-red-400',
    background: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-900/50',
    gradient: 'from-red-400 to-red-600',
    ring: 'ring-red-500',
    fill: '#ef4444', // red-500
    bgFill: '#fee2e2', // red-100
    label: 'Low Confidence',
    description: 'Weak signal quality'
  }
};

/**
 * Size configuration for responsive design
 */
const sizeConfigs = {
  small: {
    container: 'gap-1.5',
    text: 'text-xs font-medium',
    label: 'text-xs',
    bar: {
      height: 'h-1.5',
      width: 'w-16',
      radius: 'rounded-sm'
    },
    circular: {
      size: 'w-8 h-8',
      stroke: '2',
      radius: '14'
    }
  },
  medium: {
    container: 'gap-2',
    text: 'text-sm font-semibold',
    label: 'text-sm',
    bar: {
      height: 'h-2',
      width: 'w-24',
      radius: 'rounded'
    },
    circular: {
      size: 'w-12 h-12',
      stroke: '3',
      radius: '18'
    }
  },
  large: {
    container: 'gap-3',
    text: 'text-base font-bold',
    label: 'text-base',
    bar: {
      height: 'h-3',
      width: 'w-32',
      radius: 'rounded-md'
    },
    circular: {
      size: 'w-16 h-16',
      stroke: '4',
      radius: '26'
    }
  }
};

/**
 * Progress Bar Variant Component
 */
const ProgressBar: React.FC<{
  confidence: number;
  level: ConfidenceLevel;
  colors: any;
  size: any;
  animated: boolean;
  ariaLabel: string;
}> = ({ confidence, level, colors, size, animated, ariaLabel }) => {
  const [displayConfidence, setDisplayConfidence] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayConfidence(confidence), 200);
      return () => clearTimeout(timer);
    } else {
      setDisplayConfidence(confidence);
    }
  }, [confidence, animated]);

  return (
    <div 
      className={cn('bg-gray-200 dark:bg-gray-700 overflow-hidden', size.bar.height, size.bar.width, size.bar.radius)}
      role="progressbar"
      aria-valuenow={confidence}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          'h-full transition-all duration-1000 ease-out',
          `bg-gradient-to-r ${colors.gradient}`,
          size.bar.radius
        )}
        style={{ width: `${displayConfidence}%` }}
      />
    </div>
  );
};

/**
 * Circular Indicator Variant Component
 */
const CircularIndicator: React.FC<{
  confidence: number;
  level: ConfidenceLevel;
  colors: any;
  size: any;
  animated: boolean;
  ariaLabel: string;
}> = ({ confidence, level, colors, size, animated, ariaLabel }) => {
  const [displayConfidence, setDisplayConfidence] = useState(0);
  const radius = parseInt(size.circular.radius);
  const strokeWidth = parseInt(size.circular.stroke);
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (displayConfidence / 100) * circumference;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayConfidence(confidence), 200);
      return () => clearTimeout(timer);
    } else {
      setDisplayConfidence(confidence);
    }
  }, [confidence, animated]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className={size.circular.size}
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        role="progressbar"
        aria-valuenow={confidence}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        {/* Background circle */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          stroke={colors.fill}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={cn(
            'transition-all duration-1000 ease-out',
            animated && 'animate-in'
          )}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('font-bold', colors.primary, size.text)}>
          {confidence}%
        </span>
      </div>
    </div>
  );
};

/**
 * Text Only Variant Component
 */
const TextDisplay: React.FC<{
  confidence: number;
  level: ConfidenceLevel;
  colors: any;
  size: any;
  showLabel: boolean;
  compact: boolean;
}> = ({ confidence, level, colors, size, showLabel, compact }) => {
  return (
    <div className={cn('flex items-center', size.container)}>
      <span className={cn('font-bold', colors.primary, size.text)}>
        {confidence}%
      </span>
      {showLabel && !compact && (
        <span className={cn('text-gray-600 dark:text-gray-400', size.label)}>
          {colors.label}
        </span>
      )}
    </div>
  );
};

/**
 * Main ConfidenceDisplay Component
 */
export const ConfidenceDisplay: React.FC<ConfidenceDisplayProps> = ({
  confidence,
  variant = 'bar',
  size = 'medium',
  showLabel = true,
  animated = true,
  colorScheme = 'verdict',
  className = '',
  compact = false,
  ariaLabel
}) => {
  // Validate confidence range
  const normalizedConfidence = Math.max(0, Math.min(100, confidence));
  const level = getConfidenceLevel(normalizedConfidence);
  
  // Select color scheme
  const colorSchemes = colorScheme === 'verdict' ? verdictColorScheme : confidenceColorScheme;
  const colors = colorSchemes[level];
  const sizeConfig = sizeConfigs[size];

  // Reduce motion preference support
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;
  const shouldAnimate = animated && !prefersReducedMotion;

  // Default aria label
  const defaultAriaLabel = `AI confidence: ${normalizedConfidence}% - ${colors.label}`;
  const finalAriaLabel = ariaLabel || defaultAriaLabel;

  return (
    <div 
      className={cn(
        'flex items-center',
        compact ? 'gap-2' : sizeConfig.container,
        className
      )}
      role="region"
      aria-label="Confidence display"
    >
      {/* Progress indicator */}
      {variant === 'bar' && (
        <ProgressBar
          confidence={normalizedConfidence}
          level={level}
          colors={colors}
          size={sizeConfig}
          animated={shouldAnimate}
          ariaLabel={finalAriaLabel}
        />
      )}

      {variant === 'circular' && (
        <CircularIndicator
          confidence={normalizedConfidence}
          level={level}
          colors={colors}
          size={sizeConfig}
          animated={shouldAnimate}
          ariaLabel={finalAriaLabel}
        />
      )}

      {/* Percentage text */}
      {variant !== 'text' && (
        <span className={cn('font-bold', colors.primary, sizeConfig.text)}>
          {normalizedConfidence}%
        </span>
      )}

      {variant === 'text' && (
        <TextDisplay
          confidence={normalizedConfidence}
          level={level}
          colors={colors}
          size={sizeConfig}
          showLabel={showLabel}
          compact={compact}
        />
      )}

      {/* Label */}
      {showLabel && !compact && variant !== 'text' && (
        <span className={cn('text-gray-600 dark:text-gray-400', sizeConfig.label)}>
          {colors.label}
        </span>
      )}

      {/* Screen reader only content */}
      <div className="sr-only">
        {finalAriaLabel}. {colors.description}.
      </div>
    </div>
  );
};

export default ConfidenceDisplay;