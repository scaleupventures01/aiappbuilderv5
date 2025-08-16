/**
 * VerdictLabel Component
 * PRD Reference: PRD-1.2.7-verdict-display-component.md
 * 
 * Displays the text label for each verdict type with proper typography and styling
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { VerdictType } from './VerdictDisplay';
import styles from './VerdictDisplay.module.css';

export interface VerdictLabelProps {
  /** The verdict type */
  verdict: VerdictType;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Label configuration for each verdict type
 */
const labelConfig = {
  Diamond: {
    label: 'High Probability Setup',
    description: 'Strong buy signal with high potential for gains'
  },
  Fire: {
    label: 'Aggressive Opportunity', 
    description: 'Hot opportunity with moderate bullish momentum'
  },
  Skull: {
    label: 'Avoid This Setup',
    description: 'High risk warning with potential bearish signals'
  }
} as const;

/**
 * Size configuration for labels
 */
const sizeConfig = {
  small: {
    label: styles.labelSmall,
    text: 'text-xs'
  },
  medium: {
    label: styles.labelMedium,
    text: 'text-sm'
  },
  large: {
    label: styles.labelLarge,
    text: 'text-base'
  }
} as const;

/**
 * VerdictLabel component
 */
export const VerdictLabel: React.FC<VerdictLabelProps> = ({
  verdict,
  size = 'medium',
  className = ''
}) => {
  const config = labelConfig[verdict];
  const sizeStyles = sizeConfig[size];

  return (
    <div
      className={cn(
        styles.labelContainer,
        sizeStyles.label,
        className
      )}
    >
      <span
        className={cn(
          styles.labelText,
          styles[`label${verdict}`],
          sizeStyles.text,
          'font-semibold'
        )}
      >
        {config.label}
      </span>
      
      {/* Screen reader description */}
      <span className="sr-only">
        {config.description}
      </span>
    </div>
  );
};

export default VerdictLabel;