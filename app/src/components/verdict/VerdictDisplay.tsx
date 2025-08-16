/**
 * VerdictDisplay Component - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.7-verdict-display-system.md
 * 
 * Displays trade analysis verdicts with Diamond/Fire/Skull visualization
 * Includes animations, accessibility features, and responsive design
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { ConfidenceDisplay } from '../ui/ConfidenceDisplay';

export type VerdictType = 'Diamond' | 'Fire' | 'Skull';

export interface VerdictData {
  verdict: VerdictType;
  confidence: number;
  reasoning?: string;
  processingTime?: number;
  timestamp?: string;
}

interface VerdictDisplayProps {
  data: VerdictData;
  className?: string;
  animated?: boolean;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  compact?: boolean;
  onVerdictClick?: (verdict: VerdictData) => void;
}

/**
 * Verdict icon components with optimized SVGs
 */
const DiamondIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
    <path 
      d="M6 3l6 6 6-6M2 9h20M8 9l4 12 4-12" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeOpacity="0.3"
    />
  </svg>
);

const FireIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12 2C8.5 2 8 5.5 8 8c0 2.5-2 3.5-2 6 0 3.3 2.7 6 6 6s6-2.7 6-6c0-2.5-2-3.5-2-6 0-2.5-.5-6-4-6z" />
    <path 
      d="M10 8c0-1 1-2 2-2s2 1 2 2-1 2-2 2-2-1-2-2z" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeOpacity="0.3"
    />
  </svg>
);

const SkullIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12 2C8.7 2 6 4.7 6 8v4c0 1.1.9 2 2 2h1v2h2v-2h2v2h2v-2h1c1.1 0 2-.9 2-2V8c0-3.3-2.7-6-6-6z" />
    <circle cx="9" cy="9" r="1" fill="white" />
    <circle cx="15" cy="9" r="1" fill="white" />
    <path d="M10 13h4v1h-4z" fill="white" />
  </svg>
);

/**
 * Get verdict configuration including colors, icons, and labels
 */
const getVerdictConfig = (verdict: VerdictType) => {
  const configs = {
    Diamond: {
      icon: DiamondIcon,
      label: 'Strong Buy Signal',
      description: 'High potential for significant gains',
      colors: {
        primary: 'text-emerald-600 dark:text-emerald-400',
        background: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-900/50',
        ring: 'ring-emerald-500',
        glow: 'shadow-emerald-500/20',
        gradient: 'from-emerald-400 to-emerald-600',
      },
      emoji: '💎',
      ariaLabel: 'Diamond verdict: Strong buy signal'
    },
    Fire: {
      icon: FireIcon,
      label: 'Hot Opportunity',
      description: 'Moderate bullish momentum detected',
      colors: {
        primary: 'text-orange-600 dark:text-orange-400',
        background: 'bg-orange-50 dark:bg-orange-950/30',
        border: 'border-orange-200 dark:border-orange-900/50',
        ring: 'ring-orange-500',
        glow: 'shadow-orange-500/20',
        gradient: 'from-orange-400 to-orange-600',
      },
      emoji: '🔥',
      ariaLabel: 'Fire verdict: Hot opportunity'
    },
    Skull: {
      icon: SkullIcon,
      label: 'High Risk Warning',
      description: 'Potential bearish signals detected',
      colors: {
        primary: 'text-red-600 dark:text-red-400',
        background: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-900/50',
        ring: 'ring-red-500',
        glow: 'shadow-red-500/20',
        gradient: 'from-red-400 to-red-600',
      },
      emoji: '💀',
      ariaLabel: 'Skull verdict: High risk warning'
    }
  };

  return configs[verdict];
};

/**
 * Get size configuration for responsive design
 */
const getSizeConfig = (size: 'small' | 'medium' | 'large') => {
  const configs = {
    small: {
      container: 'p-2',
      icon: 'w-4 h-4',
      title: 'text-xs font-medium',
      confidence: 'text-xs',
      description: 'text-xs',
      spacing: 'space-y-1'
    },
    medium: {
      container: 'p-3',
      icon: 'w-6 h-6',
      title: 'text-sm font-semibold',
      confidence: 'text-sm',
      description: 'text-xs',
      spacing: 'space-y-2'
    },
    large: {
      container: 'p-4',
      icon: 'w-8 h-8',
      title: 'text-base font-bold',
      confidence: 'text-sm',
      description: 'text-sm',
      spacing: 'space-y-3'
    }
  };

  return configs[size];
};


/**
 * Main VerdictDisplay component
 */
export const VerdictDisplay: React.FC<VerdictDisplayProps> = ({
  data,
  className = '',
  animated = true,
  showDetails = true,
  size = 'medium',
  compact = false,
  onVerdictClick
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimationPlayed, setHasAnimationPlayed] = useState(false);

  const config = getVerdictConfig(data.verdict);
  const sizeConfig = getSizeConfig(size);
  const IconComponent = config.icon;

  // Handle entrance animation
  useEffect(() => {
    if (animated && !hasAnimationPlayed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasAnimationPlayed(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [animated, hasAnimationPlayed]);

  // Reduce motion preference support
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldAnimate = animated && !prefersReducedMotion;

  const handleClick = () => {
    if (onVerdictClick) {
      onVerdictClick(data);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border transition-all duration-300',
        config.colors.background,
        config.colors.border,
        sizeConfig.container,
        shouldAnimate && [
          'transform transition-all duration-500 ease-out',
          isVisible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-4 opacity-0 scale-95'
        ],
        onVerdictClick && [
          'cursor-pointer hover:shadow-lg',
          `hover:${config.colors.glow}`,
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          `focus:${config.colors.ring}`
        ],
        className
      )}
      onClick={onVerdictClick ? handleClick : undefined}
      onKeyDown={onVerdictClick ? handleKeyDown : undefined}
      tabIndex={onVerdictClick ? 0 : undefined}
      role={onVerdictClick ? 'button' : 'region'}
      aria-label={config.ariaLabel}
    >
      {/* Animated background gradient (optional enhancement) */}
      {shouldAnimate && (
        <div 
          className={cn(
            'absolute inset-0 rounded-lg opacity-20',
            `bg-gradient-to-br ${config.colors.gradient}`,
            'animate-pulse'
          )}
          aria-hidden="true"
        />
      )}

      <div className={cn('relative z-10', compact ? 'flex items-center space-x-2' : sizeConfig.spacing)}>
        {/* Header with icon and title */}
        <div className="flex items-center space-x-2">
          <div 
            className={cn(
              'flex-shrink-0',
              shouldAnimate && 'animate-bounce'
            )}
            style={{
              animationDelay: shouldAnimate ? '0.2s' : undefined,
              animationDuration: shouldAnimate ? '1s' : undefined,
              animationIterationCount: shouldAnimate ? '3' : undefined
            }}
          >
            <IconComponent 
              className={cn(
                sizeConfig.icon,
                config.colors.primary,
                'drop-shadow-sm'
              )}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              sizeConfig.title,
              config.colors.primary,
              'tracking-tight'
            )}>
              {config.emoji} {config.label}
            </h3>
            
            {!compact && showDetails && config.description && (
              <p className={cn(
                sizeConfig.description,
                'text-gray-600 dark:text-gray-400 mt-1'
              )}>
                {config.description}
              </p>
            )}
          </div>
        </div>

        {/* Confidence indicator */}
        {!compact && (
          <ConfidenceDisplay
            confidence={data.confidence}
            variant="bar"
            size={size}
            showLabel={true}
            animated={shouldAnimate}
            colorScheme="verdict"
            className="w-full"
          />
        )}

        {/* Compact confidence display */}
        {compact && (
          <ConfidenceDisplay
            confidence={data.confidence}
            variant="text"
            size={size}
            showLabel={false}
            animated={false}
            colorScheme="verdict"
            compact={true}
          />
        )}

        {/* Additional details */}
        {!compact && showDetails && data.reasoning && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <p className={cn(
              sizeConfig.description,
              'text-gray-700 dark:text-gray-300 leading-relaxed'
            )}>
              {data.reasoning}
            </p>
          </div>
        )}

        {/* Processing time and timestamp */}
        {!compact && showDetails && (data.processingTime || data.timestamp) && (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            {data.processingTime && (
              <span>Processed in {data.processingTime}ms</span>
            )}
            {data.timestamp && (
              <span>
                {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Screen reader only content */}
      <div className="sr-only">
        Verdict: {data.verdict}, Confidence: {data.confidence} percent.
        {data.reasoning && ` Reasoning: ${data.reasoning}`}
      </div>
    </div>
  );
};

export default VerdictDisplay;