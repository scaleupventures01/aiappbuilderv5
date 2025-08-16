/**
 * VerdictDisplay Component - Chat Integration
 * PRD Reference: PRD-1.2.7-verdict-display-component.md
 * 
 * Main component for displaying trading verdicts in chat messages
 * Supports Diamond, Fire, and Skull verdicts with animations and accessibility
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { VerdictIcon } from './VerdictIcon';
import { VerdictLabel } from './VerdictLabel';
import styles from './VerdictDisplay.module.css';

export type VerdictType = 'Diamond' | 'Fire' | 'Skull';

export interface VerdictDisplayProps {
  /** The verdict type to display */
  verdict: VerdictType;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show animations */
  animated?: boolean;
  /** Whether to show the text label */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Verdict configuration with colors, labels, and accessibility
 */
const verdictConfig = {
  Diamond: {
    icon: '🔸',
    color: '#10b981', // emerald-500
    bgColor: '#d1fae5', // emerald-100
    darkBgColor: '#064e3b', // emerald-900
    label: 'High Probability Setup',
    ariaLabel: 'Diamond verdict: High probability trading setup'
  },
  Fire: {
    icon: '🔥',
    color: '#f59e0b', // amber-500
    bgColor: '#fef3c7', // amber-100
    darkBgColor: '#78350f', // amber-900
    label: 'Aggressive Opportunity',
    ariaLabel: 'Fire verdict: Aggressive trading opportunity'
  },
  Skull: {
    icon: '💀',
    color: '#ef4444', // red-500
    bgColor: '#fee2e2', // red-100
    darkBgColor: '#7f1d1d', // red-900
    label: 'Avoid This Setup',
    ariaLabel: 'Skull verdict: Avoid this trading setup'
  }
} as const;

/**
 * Size configuration for responsive design
 */
const sizeConfig = {
  small: {
    container: styles.verdictSmall,
    spacing: 'gap-1'
  },
  medium: {
    container: styles.verdictMedium,
    spacing: 'gap-2'
  },
  large: {
    container: styles.verdictLarge,
    spacing: 'gap-3'
  }
} as const;

/**
 * Main VerdictDisplay component
 */
export const VerdictDisplay: React.FC<VerdictDisplayProps> = ({
  verdict,
  size = 'medium',
  animated = true,
  showLabel = true,
  className = '',
  onClick
}) => {
  const config = verdictConfig[verdict];
  const sizeStyles = sizeConfig[size];

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cn(
        styles.verdictDisplay,
        styles[`verdict${verdict}`],
        sizeStyles.container,
        sizeStyles.spacing,
        animated && styles.verdictAnimated,
        onClick && styles.verdictClickable,
        className
      )}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : 'img'}
      aria-label={config.ariaLabel}
    >
      <VerdictIcon
        verdict={verdict}
        size={size}
        animated={animated}
        className={styles.verdictIcon}
      />
      {showLabel && (
        <VerdictLabel
          verdict={verdict}
          size={size}
          className={styles.verdictLabel}
        />
      )}
    </div>
  );
};

export default VerdictDisplay;