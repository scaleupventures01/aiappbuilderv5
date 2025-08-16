/**
 * ConfidenceDisplay Design System - Elite Trading Coach AI
 * UI/UX Designer Implementation for PRD-1.2.8
 * 
 * Comprehensive design tokens, visual specifications, and accessibility guidelines
 * for the Confidence Percentage Display component.
 */

export interface DesignTokens {
  colors: {
    confidence: {
      high: ColorSpec;
      medium: ColorSpec;
      low: ColorSpec;
    };
    verdict: {
      high: ColorSpec;
      medium: ColorSpec;
      low: ColorSpec;
    };
  };
  spacing: SpacingSpec;
  typography: TypographySpec;
  animation: AnimationSpec;
  accessibility: AccessibilitySpec;
}

interface ColorSpec {
  // Core colors with WCAG AA compliance
  primary: string;
  secondary: string;
  background: string;
  border: string;
  
  // Semantic colors for different contexts
  fill: string;
  track: string;
  glow: string;
  
  // Accessibility variations
  highContrast: {
    primary: string;
    background: string;
    border: string;
  };
  
  // Color blind friendly alternatives
  colorBlindSafe: {
    fill: string;
    pattern?: string; // For patterns/textures as alternatives
  };
  
  // Light/Dark mode variations
  light: ColorVariant;
  dark: ColorVariant;
}

interface ColorVariant {
  primary: string;
  secondary: string;
  background: string;
  border: string;
  fill: string;
}

interface SpacingSpec {
  variants: {
    small: {
      container: string;
      internal: string;
      iconText: string;
    };
    medium: {
      container: string;
      internal: string;
      iconText: string;
    };
    large: {
      container: string;
      internal: string;
      iconText: string;
    };
  };
  responsive: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

interface TypographySpec {
  fontFamily: string;
  weights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  sizes: {
    small: {
      percentage: string;
      label: string;
      lineHeight: string;
    };
    medium: {
      percentage: string;
      label: string;
      lineHeight: string;
    };
    large: {
      percentage: string;
      label: string;
      lineHeight: string;
    };
  };
}

interface AnimationSpec {
  transitions: {
    default: string;
    slow: string;
    fast: string;
  };
  easing: {
    easeOut: string;
    easeInOut: string;
    bounce: string;
  };
  durations: {
    fill: number;
    fadeIn: number;
    hover: number;
  };
  reducedMotion: {
    enabled: boolean;
    fallback: string;
  };
}

interface AccessibilitySpec {
  contrast: {
    minimum: number; // WCAG AA
    enhanced: number; // WCAG AAA
  };
  focusRing: {
    width: string;
    color: string;
    offset: string;
    style: string;
  };
  screenReader: {
    announcements: boolean;
    liveRegion: 'polite' | 'assertive';
  };
}

/**
 * Design Token Implementation
 * Enhanced color palette with full accessibility compliance
 */
export const confidenceDesignTokens: DesignTokens = {
  colors: {
    // Standard confidence color scheme (from PRD)
    confidence: {
      high: {
        primary: '#059669', // emerald-600 (enhanced for better contrast)
        secondary: '#10b981', // emerald-500  
        background: '#d1fae5', // emerald-100
        border: '#a7f3d0', // emerald-200
        fill: '#10b981',
        track: '#f3f4f6', // gray-100
        glow: 'rgba(16, 185, 129, 0.2)',
        
        highContrast: {
          primary: '#047857', // emerald-700 (higher contrast)
          background: '#ffffff',
          border: '#059669'
        },
        
        colorBlindSafe: {
          fill: '#10b981',
          pattern: 'diagonal-stripes' // Optional pattern overlay
        },
        
        light: {
          primary: '#059669',
          secondary: '#10b981',
          background: '#ecfdf5',
          border: '#d1fae5',
          fill: '#10b981'
        },
        
        dark: {
          primary: '#34d399', // emerald-400
          secondary: '#6ee7b7', // emerald-300
          background: 'rgba(6, 78, 59, 0.3)', // emerald-950/30
          border: 'rgba(6, 78, 59, 0.5)', // emerald-950/50
          fill: '#34d399'
        }
      },
      
      medium: {
        primary: '#d97706', // amber-600
        secondary: '#f59e0b', // amber-500
        background: '#fef3c7', // amber-100
        border: '#fed7aa', // amber-200
        fill: '#f59e0b',
        track: '#f3f4f6',
        glow: 'rgba(245, 158, 11, 0.2)',
        
        highContrast: {
          primary: '#b45309', // amber-700
          background: '#ffffff',
          border: '#d97706'
        },
        
        colorBlindSafe: {
          fill: '#f59e0b',
          pattern: 'dots'
        },
        
        light: {
          primary: '#d97706',
          secondary: '#f59e0b',
          background: '#fffbeb',
          border: '#fef3c7',
          fill: '#f59e0b'
        },
        
        dark: {
          primary: '#fbbf24', // amber-400
          secondary: '#fcd34d', // amber-300
          background: 'rgba(69, 26, 3, 0.3)', // amber-950/30
          border: 'rgba(69, 26, 3, 0.5)', // amber-950/50
          fill: '#fbbf24'
        }
      },
      
      low: {
        primary: '#dc2626', // red-600
        secondary: '#ef4444', // red-500
        background: '#fee2e2', // red-100
        border: '#fecaca', // red-200
        fill: '#ef4444',
        track: '#f3f4f6',
        glow: 'rgba(239, 68, 68, 0.2)',
        
        highContrast: {
          primary: '#b91c1c', // red-700
          background: '#ffffff',
          border: '#dc2626'
        },
        
        colorBlindSafe: {
          fill: '#ef4444',
          pattern: 'cross-hatch'
        },
        
        light: {
          primary: '#dc2626',
          secondary: '#ef4444',
          background: '#fef2f2',
          border: '#fee2e2',
          fill: '#ef4444'
        },
        
        dark: {
          primary: '#f87171', // red-400
          secondary: '#fca5a5', // red-300
          background: 'rgba(69, 10, 10, 0.3)', // red-950/30
          border: 'rgba(69, 10, 10, 0.5)', // red-950/50
          fill: '#f87171'
        }
      }
    },
    
    // Trading-semantic color scheme (from VerdictDisplay)
    verdict: {
      high: {
        primary: '#059669', // emerald-600 (consistent with trading green)
        secondary: '#10b981', // emerald-500
        background: '#ecfdf5', // emerald-50
        border: '#d1fae5', // emerald-100
        fill: '#10b981',
        track: '#f3f4f6',
        glow: 'rgba(16, 185, 129, 0.2)',
        
        highContrast: {
          primary: '#047857',
          background: '#ffffff',
          border: '#059669'
        },
        
        colorBlindSafe: {
          fill: '#10b981',
          pattern: 'diagonal-stripes'
        },
        
        light: {
          primary: '#059669',
          secondary: '#10b981',
          background: '#ecfdf5',
          border: '#d1fae5',
          fill: '#10b981'
        },
        
        dark: {
          primary: '#34d399',
          secondary: '#6ee7b7',
          background: 'rgba(6, 78, 59, 0.3)',
          border: 'rgba(6, 78, 59, 0.5)',
          fill: '#34d399'
        }
      },
      
      medium: {
        primary: '#ea580c', // orange-600 (trading orange)
        secondary: '#f97316', // orange-500
        background: '#fff7ed', // orange-50
        border: '#fed7aa', // orange-200
        fill: '#f97316',
        track: '#f3f4f6',
        glow: 'rgba(249, 115, 22, 0.2)',
        
        highContrast: {
          primary: '#c2410c', // orange-700
          background: '#ffffff',
          border: '#ea580c'
        },
        
        colorBlindSafe: {
          fill: '#f97316',
          pattern: 'dots'
        },
        
        light: {
          primary: '#ea580c',
          secondary: '#f97316',
          background: '#fff7ed',
          border: '#fed7aa',
          fill: '#f97316'
        },
        
        dark: {
          primary: '#fb923c', // orange-400
          secondary: '#fdba74', // orange-300
          background: 'rgba(67, 20, 7, 0.3)', // orange-950/30
          border: 'rgba(67, 20, 7, 0.5)', // orange-950/50
          fill: '#fb923c'
        }
      },
      
      low: {
        primary: '#dc2626', // red-600 (trading red)
        secondary: '#ef4444', // red-500
        background: '#fef2f2', // red-50
        border: '#fee2e2', // red-100
        fill: '#ef4444',
        track: '#f3f4f6',
        glow: 'rgba(239, 68, 68, 0.2)',
        
        highContrast: {
          primary: '#b91c1c',
          background: '#ffffff',
          border: '#dc2626'
        },
        
        colorBlindSafe: {
          fill: '#ef4444',
          pattern: 'cross-hatch'
        },
        
        light: {
          primary: '#dc2626',
          secondary: '#ef4444',
          background: '#fef2f2',
          border: '#fee2e2',
          fill: '#ef4444'
        },
        
        dark: {
          primary: '#f87171',
          secondary: '#fca5a5',
          background: 'rgba(69, 10, 10, 0.3)',
          border: 'rgba(69, 10, 10, 0.5)',
          fill: '#f87171'
        }
      }
    }
  },
  
  spacing: {
    variants: {
      small: {
        container: '0.375rem', // gap-1.5
        internal: '0.25rem', // gap-1
        iconText: '0.5rem' // gap-2
      },
      medium: {
        container: '0.5rem', // gap-2
        internal: '0.375rem', // gap-1.5
        iconText: '0.625rem' // gap-2.5
      },
      large: {
        container: '0.75rem', // gap-3
        internal: '0.5rem', // gap-2
        iconText: '0.75rem' // gap-3
      }
    },
    responsive: {
      mobile: '0.5rem',
      tablet: '0.625rem',
      desktop: '0.75rem'
    }
  },
  
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    sizes: {
      small: {
        percentage: '0.75rem', // text-xs
        label: '0.75rem', // text-xs
        lineHeight: '1rem'
      },
      medium: {
        percentage: '0.875rem', // text-sm
        label: '0.875rem', // text-sm
        lineHeight: '1.25rem'
      },
      large: {
        percentage: '1rem', // text-base
        label: '1rem', // text-base
        lineHeight: '1.5rem'
      }
    }
  },
  
  animation: {
    transitions: {
      default: 'all 0.3s ease-out',
      slow: 'all 0.6s ease-out',
      fast: 'all 0.15s ease-out'
    },
    easing: {
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
    durations: {
      fill: 1000, // Progress bar fill animation
      fadeIn: 300, // Component entrance
      hover: 150  // Hover state transitions
    },
    reducedMotion: {
      enabled: true,
      fallback: 'none' // No animation for reduced motion
    }
  },
  
  accessibility: {
    contrast: {
      minimum: 4.5, // WCAG AA
      enhanced: 7.0  // WCAG AAA
    },
    focusRing: {
      width: '2px',
      color: '#2563eb', // blue-600
      offset: '2px',
      style: 'solid'
    },
    screenReader: {
      announcements: true,
      liveRegion: 'polite'
    }
  }
};

/**
 * Component Variant Specifications
 * Detailed design specs for each variant
 */
export const variantSpecifications = {
  bar: {
    description: 'Horizontal progress bar with percentage text',
    useCases: [
      'Default confidence display',
      'Integration with verdict cards',
      'Detailed analysis screens'
    ],
    dimensions: {
      small: { width: '4rem', height: '0.375rem' }, // w-16 h-1.5
      medium: { width: '6rem', height: '0.5rem' }, // w-24 h-2
      large: { width: '8rem', height: '0.75rem' } // w-32 h-3
    },
    borderRadius: {
      small: '0.125rem', // rounded-sm
      medium: '0.25rem', // rounded
      large: '0.375rem' // rounded-md
    },
    animations: {
      fillDuration: '1000ms',
      fillEasing: 'cubic-bezier(0, 0, 0.2, 1)',
      hoverScale: '1.02'
    }
  },
  
  circular: {
    description: 'Circular progress indicator with centered percentage',
    useCases: [
      'Compact displays',
      'Dashboard widgets',
      'Mobile interfaces'
    ],
    dimensions: {
      small: { size: '2rem', stroke: '2px', radius: '14px' }, // w-8 h-8
      medium: { size: '3rem', stroke: '3px', radius: '18px' }, // w-12 h-12
      large: { size: '4rem', stroke: '4px', radius: '26px' } // w-16 h-16
    },
    animations: {
      strokeDasharray: 'calculated based on circumference',
      strokeDashoffset: 'animated to show progress',
      rotateStart: '-90deg' // Start from top
    }
  },
  
  text: {
    description: 'Text-only display with optional label',
    useCases: [
      'Inline confidence indicators',
      'Compact layouts',
      'List items'
    ],
    typography: {
      percentage: 'font-bold with semantic color',
      label: 'font-normal with muted color'
    },
    spacing: {
      betweenElements: '0.5rem' // gap-2
    }
  }
};

/**
 * Responsive Design Specifications
 */
export const responsiveSpecs = {
  breakpoints: {
    mobile: '< 640px',
    tablet: '640px - 1024px',
    desktop: '> 1024px'
  },
  
  behavior: {
    mobile: {
      preferredVariant: 'circular',
      maxWidth: '100%',
      fontSize: 'small',
      spacing: 'compact'
    },
    tablet: {
      preferredVariant: 'bar',
      maxWidth: '12rem',
      fontSize: 'medium',
      spacing: 'normal'
    },
    desktop: {
      preferredVariant: 'bar',
      maxWidth: '16rem',
      fontSize: 'medium',
      spacing: 'normal'
    }
  }
};

/**
 * Accessibility Guidelines
 */
export const accessibilityGuidelines = {
  colorContrast: {
    requirement: 'All color combinations must meet WCAG 2.1 AA standards (4.5:1)',
    testing: 'Use contrast checker tools for validation',
    alternatives: 'Provide pattern/texture alternatives for color-blind users'
  },
  
  screenReader: {
    labels: 'Descriptive ARIA labels for all interactive elements',
    announcements: 'Live region updates for confidence changes',
    context: 'Meaningful descriptions of confidence levels'
  },
  
  keyboard: {
    navigation: 'Tab order includes confidence displays when interactive',
    activation: 'Enter/Space key support for clickable variants',
    focus: 'Visible focus indicators that meet contrast requirements'
  },
  
  motion: {
    reducedMotion: 'Respect user preference for reduced motion',
    fallback: 'Instant state changes when animations disabled',
    essential: 'Only use motion that enhances understanding'
  }
};

/**
 * Integration Guidelines
 */
export const integrationGuidelines = {
  withVerdictDisplay: {
    placement: 'Below verdict title and description',
    spacing: 'Consistent with verdict card padding',
    colorScheme: 'Use "verdict" scheme for semantic consistency'
  },
  
  standalone: {
    placement: 'Any suitable container',
    spacing: 'Respect parent container constraints',
    colorScheme: 'Use "confidence" scheme for general use'
  },
  
  responsive: {
    mobile: 'Consider circular variant for space efficiency',
    tablet: 'Bar variant works well in card layouts',
    desktop: 'Full feature set available'
  }
};