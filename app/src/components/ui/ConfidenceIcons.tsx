/**
 * ConfidenceIcons Component - Elite Trading Coach AI
 * UI/UX Designer Implementation for PRD-1.2.8
 * 
 * Custom SVG icons and visual elements for confidence display enhancement.
 * Designed for accessibility, scalability, and semantic meaning.
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface IconProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  'aria-hidden'?: boolean;
}

/**
 * Confidence level indicator icons
 * Designed to supplement color coding with visual shapes
 */
export const ConfidenceLevelIcons = {
  /**
   * High Confidence - Shield with checkmark
   * Represents security and validation
   */
  High: React.forwardRef<SVGSVGElement, IconProps>(({ 
    className, 
    size = 'medium', 
    color = 'currentColor',
    'aria-hidden': ariaHidden = true,
    ...props 
  }, ref) => {
    const sizeClasses = {
      small: 'w-3 h-3',
      medium: 'w-4 h-4', 
      large: 'w-5 h-5'
    };

    return (
      <svg
        ref={ref}
        className={cn(sizeClasses[size], className)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={ariaHidden}
        {...props}
      >
        {/* Shield background */}
        <path
          d="M12 2L4 6V12C4 16.5 7.36 20.29 12 21C16.64 20.29 20 16.5 20 12V6L12 2Z"
          fill={color}
          fillOpacity="0.1"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Checkmark */}
        <path
          d="M9 12L11 14L15 10"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }),

  /**
   * Medium Confidence - Balanced scales
   * Represents evaluation and moderate certainty
   */
  Medium: React.forwardRef<SVGSVGElement, IconProps>(({ 
    className, 
    size = 'medium', 
    color = 'currentColor',
    'aria-hidden': ariaHidden = true,
    ...props 
  }, ref) => {
    const sizeClasses = {
      small: 'w-3 h-3',
      medium: 'w-4 h-4',
      large: 'w-5 h-5'
    };

    return (
      <svg
        ref={ref}
        className={cn(sizeClasses[size], className)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={ariaHidden}
        {...props}
      >
        {/* Balance beam */}
        <path
          d="M12 3V21"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Left scale */}
        <path
          d="M8 9L4 13H12L8 9Z"
          fill={color}
          fillOpacity="0.1"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Right scale */}
        <path
          d="M16 9L12 13H20L16 9Z"
          fill={color}
          fillOpacity="0.1"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Balance point */}
        <circle
          cx="12"
          cy="8"
          r="1.5"
          fill={color}
        />
      </svg>
    );
  }),

  /**
   * Low Confidence - Warning triangle with exclamation
   * Represents caution and uncertainty
   */
  Low: React.forwardRef<SVGSVGElement, IconProps>(({ 
    className, 
    size = 'medium', 
    color = 'currentColor',
    'aria-hidden': ariaHidden = true,
    ...props 
  }, ref) => {
    const sizeClasses = {
      small: 'w-3 h-3',
      medium: 'w-4 h-4',
      large: 'w-5 h-5'
    };

    return (
      <svg
        ref={ref}
        className={cn(sizeClasses[size], className)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={ariaHidden}
        {...props}
      >
        {/* Triangle background */}
        <path
          d="M12 2L22 20H2L12 2Z"
          fill={color}
          fillOpacity="0.1"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Exclamation line */}
        <path
          d="M12 9V13"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Exclamation dot */}
        <circle
          cx="12"
          cy="16"
          r="1"
          fill={color}
        />
      </svg>
    );
  })
};

/**
 * Progress enhancement patterns
 * Alternative visual indicators for accessibility
 */
export const ProgressPatterns = {
  /**
   * Diagonal stripes pattern for color-blind accessibility
   */
  DiagonalStripes: React.forwardRef<SVGPatternElement, { id: string; color?: string }>(({ 
    id, 
    color = 'currentColor' 
  }, ref) => (
    <pattern
      ref={ref}
      id={id}
      patternUnits="userSpaceOnUse"
      width="8"
      height="8"
      patternTransform="rotate(45)"
    >
      <rect width="4" height="8" fill={color} fillOpacity="0.3" />
    </pattern>
  )),

  /**
   * Dots pattern for medium confidence
   */
  Dots: React.forwardRef<SVGPatternElement, { id: string; color?: string }>(({ 
    id, 
    color = 'currentColor' 
  }, ref) => (
    <pattern
      ref={ref}
      id={id}
      patternUnits="userSpaceOnUse"
      width="8"
      height="8"
    >
      <circle cx="4" cy="4" r="1.5" fill={color} fillOpacity="0.4" />
    </pattern>
  )),

  /**
   * Cross-hatch pattern for low confidence
   */
  CrossHatch: React.forwardRef<SVGPatternElement, { id: string; color?: string }>(({ 
    id, 
    color = 'currentColor' 
  }, ref) => (
    <pattern
      ref={ref}
      id={id}
      patternUnits="userSpaceOnUse"
      width="8"
      height="8"
    >
      <path
        d="M0,8 L8,0 M-2,2 L2,-2 M6,10 L10,6"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      <path
        d="M0,0 L8,8 M-2,6 L2,10 M6,-2 L10,2"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
    </pattern>
  ))
};

/**
 * Animated progress indicators
 */
export const AnimatedIndicators = {
  /**
   * Pulsing confidence indicator
   */
  Pulse: React.forwardRef<SVGSVGElement, IconProps & { 
    confidence: number;
    variant?: 'ring' | 'glow';
  }>(({ 
    className, 
    size = 'medium', 
    color = 'currentColor',
    confidence,
    variant = 'ring',
    'aria-hidden': ariaHidden = true,
    ...props 
  }, ref) => {
    const sizeClasses = {
      small: 'w-4 h-4',
      medium: 'w-6 h-6',
      large: 'w-8 h-8'
    };

    const animationDelay = `${(100 - confidence) * 10}ms`;

    return (
      <svg
        ref={ref}
        className={cn(sizeClasses[size], className)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={ariaHidden}
        {...props}
      >
        {variant === 'ring' && (
          <>
            {/* Outer ring */}
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke={color}
              strokeWidth="1"
              strokeOpacity="0.2"
              fill="none"
            />
            {/* Animated inner ring */}
            <circle
              cx="12"
              cy="12"
              r="6"
              stroke={color}
              strokeWidth="2"
              fill="none"
              className="animate-pulse"
              style={{ animationDelay }}
            />
          </>
        )}
        
        {variant === 'glow' && (
          <>
            {/* Core circle */}
            <circle
              cx="12"
              cy="12"
              r="4"
              fill={color}
              fillOpacity="0.8"
            />
            {/* Glow effect */}
            <circle
              cx="12"
              cy="12"
              r="8"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeOpacity="0.3"
              className="animate-ping"
              style={{ animationDelay }}
            />
          </>
        )}
      </svg>
    );
  }),

  /**
   * Confidence meter with animated fill
   */
  Meter: React.forwardRef<SVGSVGElement, IconProps & { 
    confidence: number;
    animated?: boolean;
  }>(({ 
    className, 
    size = 'medium', 
    color = 'currentColor',
    confidence,
    animated = true,
    'aria-hidden': ariaHidden = true,
    ...props 
  }, ref) => {
    const sizeClasses = {
      small: 'w-8 h-3',
      medium: 'w-12 h-4',
      large: 'w-16 h-5'
    };

    const fillWidth = Math.max(0, Math.min(100, confidence));

    return (
      <svg
        ref={ref}
        className={cn(sizeClasses[size], className)}
        viewBox="0 0 100 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={ariaHidden}
        {...props}
      >
        {/* Background track */}
        <rect
          x="2"
          y="2"
          width="96"
          height="16"
          rx="8"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.2"
        />
        
        {/* Animated fill */}
        <rect
          x="2"
          y="2"
          width={fillWidth * 0.96} // 96% of container for padding
          height="16"
          rx="8"
          fill={color}
          className={animated ? 'transition-all duration-1000 ease-out' : ''}
        />
        
        {/* Gradient overlay for depth */}
        <defs>
          <linearGradient id="meter-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.2" />
            <stop offset="100%" stopColor="black" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="2"
          width="96"
          height="16"
          rx="8"
          fill="url(#meter-gradient)"
        />
      </svg>
    );
  })
};

/**
 * Utility component for creating accessible icon sets
 */
export const IconSet: React.FC<{
  level: 'high' | 'medium' | 'low';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showBackground?: boolean;
}> = ({ level, size = 'medium', className, showBackground = false }) => {
  const IconComponent = ConfidenceLevelIcons[level === 'high' ? 'High' : level === 'medium' ? 'Medium' : 'Low'];
  
  const backgroundColors = {
    high: 'bg-emerald-100 dark:bg-emerald-950/30',
    medium: 'bg-amber-100 dark:bg-amber-950/30', 
    low: 'bg-red-100 dark:bg-red-950/30'
  };

  const textColors = {
    high: 'text-emerald-600 dark:text-emerald-400',
    medium: 'text-amber-600 dark:text-amber-400',
    low: 'text-red-600 dark:text-red-400'
  };

  return (
    <div 
      className={cn(
        'inline-flex items-center justify-center',
        showBackground && [
          'rounded-full p-1',
          backgroundColors[level]
        ],
        textColors[level],
        className
      )}
    >
      <IconComponent size={size} aria-hidden="true" />
    </div>
  );
};

// Named exports for individual components
export const HighConfidenceIcon = ConfidenceLevelIcons.High;
export const MediumConfidenceIcon = ConfidenceLevelIcons.Medium;
export const LowConfidenceIcon = ConfidenceLevelIcons.Low;

export const PulseIndicator = AnimatedIndicators.Pulse;
export const MeterIndicator = AnimatedIndicators.Meter;

export default {
  ConfidenceLevelIcons,
  ProgressPatterns,
  AnimatedIndicators,
  IconSet
};