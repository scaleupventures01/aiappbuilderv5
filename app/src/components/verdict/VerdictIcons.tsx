/**
 * Enhanced Verdict Icons - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.7-verdict-display-component.md
 * Task: T-verdict-001 - Design verdict icons and color schemes
 * 
 * High-quality SVG icons optimized for trading context with improved accessibility
 */

import React from 'react';

export interface IconProps {
  className?: string;
  size?: number;
  'aria-hidden'?: boolean;
}

/**
 * Diamond Icon - Premium Strong Buy Signal
 * Design rationale: Multi-faceted diamond with internal reflections
 * Symbolizes high-value, precious opportunity with clear geometric structure
 */
export const DiamondIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  'aria-hidden': ariaHidden = true 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden={ariaHidden}
    role="img"
  >
    {/* Main diamond shape with gradient fill */}
    <defs>
      <linearGradient id="diamond-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="50%" stopColor="currentColor" stopOpacity="0.8" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="diamond-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
        <stop offset="100%" stopColor="white" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    
    {/* Outer diamond silhouette */}
    <path 
      d="M6 4h12l4 5-10 11L2 9l4-5z" 
      fill="url(#diamond-gradient)"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Internal facet lines for depth */}
    <path 
      d="M6 4l6 5 6-5M2 9h20M8.5 9l3.5 11 3.5-11" 
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.6"
      fill="none"
    />
    
    {/* Highlight reflection */}
    <path 
      d="M8 6l4 3 4-3-2-2H10l-2 2z" 
      fill="url(#diamond-highlight)"
    />
    
    {/* Sparkle effect for premium feel */}
    <circle cx="7" cy="7" r="0.5" fill="white" opacity="0.8" />
    <circle cx="17" cy="6" r="0.3" fill="white" opacity="0.6" />
    <circle cx="15" cy="12" r="0.4" fill="white" opacity="0.7" />
  </svg>
);

/**
 * Fire Icon - High Energy Momentum Signal
 * Design rationale: Dynamic flame with energy particles
 * Symbolizes active market momentum and aggressive opportunity
 */
export const FireIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  'aria-hidden': ariaHidden = true 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden={ariaHidden}
    role="img"
  >
    <defs>
      <radialGradient id="fire-gradient" cx="50%" cy="70%" r="60%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="70%" stopColor="currentColor" stopOpacity="0.8" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
      </radialGradient>
      <radialGradient id="fire-core" cx="50%" cy="80%" r="40%">
        <stop offset="0%" stopColor="white" stopOpacity="0.8" />
        <stop offset="100%" stopColor="white" stopOpacity="0.2" />
      </radialGradient>
    </defs>
    
    {/* Main flame body */}
    <path 
      d="M12 2C8.5 2 8 5.5 8 8c0 2.5-2.5 3.5-2.5 6.5 0 3.6 3.4 6.5 7.5 6.5s7.5-2.9 7.5-6.5c0-3-2.5-4-2.5-6.5 0-2.5-.5-6-4.5-6z" 
      fill="url(#fire-gradient)"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    />
    
    {/* Inner flame core */}
    <path 
      d="M12 6c-1.5 0-2 1.5-2 3 0 1.5-1 2-1 3.5 0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.5-1-2-1-3.5 0-1.5-.5-3-2-3z" 
      fill="url(#fire-core)"
    />
    
    {/* Dynamic flame tips */}
    <path 
      d="M10 4c0 1 .5 2 1.5 2.5M14 4.5c0 .8-.3 1.5-1 2M16 7c.5.5 1 1.5 1 2.5" 
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />
    
    {/* Energy particles */}
    <circle cx="6" cy="10" r="0.5" fill="currentColor" opacity="0.6" />
    <circle cx="18.5" cy="12" r="0.3" fill="currentColor" opacity="0.5" />
    <circle cx="19" cy="8" r="0.4" fill="currentColor" opacity="0.4" />
    <circle cx="5.5" cy="13" r="0.3" fill="currentColor" opacity="0.5" />
  </svg>
);

/**
 * Skull Icon - High Risk Warning Signal
 * Design rationale: Clean, professional warning symbol
 * Symbolizes danger and risk without being overly dramatic
 */
export const SkullIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  'aria-hidden': ariaHidden = true 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden={ariaHidden}
    role="img"
  >
    <defs>
      <linearGradient id="skull-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
      </linearGradient>
    </defs>
    
    {/* Main skull shape */}
    <path 
      d="M12 2C8.1 2 5 5.1 5 9v4c0 2.2 1.8 4 4 4h1v3h1v-3h2v3h1v-3h1c2.2 0 4-1.8 4-4V9c0-3.9-3.1-7-7-7z" 
      fill="url(#skull-gradient)"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Eye sockets with depth */}
    <ellipse cx="9" cy="10" rx="1.5" ry="2" fill="white" />
    <ellipse cx="15" cy="10" rx="1.5" ry="2" fill="white" />
    
    {/* Eye pupils for life-like appearance */}
    <circle cx="9" cy="10.5" r="0.5" fill="currentColor" opacity="0.8" />
    <circle cx="15" cy="10.5" r="0.5" fill="currentColor" opacity="0.8" />
    
    {/* Nasal cavity */}
    <path 
      d="M12 12v2.5c0 .5-.2 1-.5 1s-.5-.5-.5-1v-1c0-.3.4-.5 1-.5z" 
      fill="white"
    />
    
    {/* Teeth/jaw line for professional appearance */}
    <rect x="10" y="15" width="1" height="2" fill="white" rx="0.2" />
    <rect x="11.5" y="15" width="1" height="2.5" fill="white" rx="0.2" />
    <rect x="13" y="15" width="1" height="2" fill="white" rx="0.2" />
    
    {/* Warning indicator triangle */}
    <path 
      d="M12 1L14 4h-4l2-3z" 
      fill="currentColor" 
      opacity="0.6"
    />
    <circle cx="12" cy="2.5" r="0.3" fill="white" />
  </svg>
);

/**
 * Verdict Icon Component Selector
 * Provides consistent interface for all verdict icons
 */
export interface VerdictIconProps extends IconProps {
  verdict: 'Diamond' | 'Fire' | 'Skull';
}

export const VerdictIcon: React.FC<VerdictIconProps> = ({ verdict, ...props }) => {
  const iconComponents = {
    Diamond: DiamondIcon,
    Fire: FireIcon,
    Skull: SkullIcon,
  };

  const IconComponent = iconComponents[verdict];
  return <IconComponent {...props} />;
};

export default VerdictIcon;