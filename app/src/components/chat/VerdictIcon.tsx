/**
 * VerdictIcon Component
 * PRD Reference: PRD-1.2.7-verdict-display-component.md
 * 
 * Displays the icon for each verdict type with proper styling and animations
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { VerdictType } from './VerdictDisplay';
import styles from './VerdictDisplay.module.css';

export interface VerdictIconProps {
  /** The verdict type */
  verdict: VerdictType;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show animations */
  animated?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Custom SVG icons for each verdict type for better control and accessibility
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
 * Icon configuration for each verdict type
 */
const iconConfig = {
  Diamond: {
    component: DiamondIcon,
    emoji: '🔸',
    altText: 'Diamond icon representing high probability setup'
  },
  Fire: {
    component: FireIcon,
    emoji: '🔥',
    altText: 'Fire icon representing aggressive opportunity'
  },
  Skull: {
    component: SkullIcon,
    emoji: '💀',
    altText: 'Skull icon representing high risk warning'
  }
} as const;

/**
 * Size configuration for icons
 */
const sizeConfig = {
  small: styles.iconSmall,
  medium: styles.iconMedium,
  large: styles.iconLarge
} as const;

/**
 * VerdictIcon component
 */
export const VerdictIcon: React.FC<VerdictIconProps> = ({
  verdict,
  size = 'medium',
  animated = true,
  className = ''
}) => {
  const config = iconConfig[verdict];
  const IconComponent = config.component;
  const sizeClass = sizeConfig[size];

  return (
    <div
      className={cn(
        styles.iconContainer,
        sizeClass,
        animated && styles.iconAnimated,
        className
      )}
      aria-hidden="true"
    >
      <IconComponent
        className={cn(
          styles.iconSvg,
          styles[`icon${verdict}`]
        )}
      />
      {/* Emoji fallback for screen readers and older browsers */}
      <span className="sr-only">{config.emoji}</span>
    </div>
  );
};

export default VerdictIcon;