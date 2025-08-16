/**
 * ConfidenceResponsive - Elite Trading Coach AI
 * UI/UX Designer Implementation for PRD-1.2.8
 * 
 * Comprehensive responsive design system for confidence displays.
 * Optimized for mobile-first design with desktop enhancements.
 */

export interface ResponsiveConfig {
  breakpoints: Breakpoints;
  layouts: ResponsiveLayouts;
  typography: ResponsiveTypography;
  spacing: ResponsiveSpacing;
  interactions: ResponsiveInteractions;
}

export interface Breakpoints {
  xs: number;    // Extra small devices (phones)
  sm: number;    // Small devices (large phones)
  md: number;    // Medium devices (tablets)
  lg: number;    // Large devices (desktops)
  xl: number;    // Extra large devices
  '2xl': number; // Extra extra large devices
}

export interface ResponsiveLayouts {
  mobile: LayoutConfig;
  tablet: LayoutConfig;
  desktop: LayoutConfig;
}

export interface LayoutConfig {
  preferredVariant: 'bar' | 'circular' | 'text';
  maxWidth: string;
  orientation: 'horizontal' | 'vertical';
  stackOrder: 'icon-first' | 'progress-first' | 'text-first';
  showLabels: boolean;
  compactMode: boolean;
}

export interface ResponsiveTypography {
  mobile: TypographyScale;
  tablet: TypographyScale;
  desktop: TypographyScale;
}

export interface TypographyScale {
  percentage: {
    size: string;
    weight: string;
    lineHeight: string;
  };
  label: {
    size: string;
    weight: string;
    lineHeight: string;
  };
  description: {
    size: string;
    weight: string;
    lineHeight: string;
  };
}

export interface ResponsiveSpacing {
  mobile: SpacingScale;
  tablet: SpacingScale;
  desktop: SpacingScale;
}

export interface SpacingScale {
  container: string;
  internal: string;
  iconGap: string;
  textGap: string;
  marginVertical: string;
  marginHorizontal: string;
}

export interface ResponsiveInteractions {
  mobile: InteractionConfig;
  tablet: InteractionConfig;
  desktop: InteractionConfig;
}

export interface InteractionConfig {
  touchTargetSize: string;
  hoverEffects: boolean;
  gestureSupport: boolean;
  contextMenus: boolean;
  tooltips: boolean;
}

/**
 * Elite Trading Coach AI Responsive Configuration
 */
export const confidenceResponsiveConfig: ResponsiveConfig = {
  breakpoints: {
    xs: 0,      // 0px+
    sm: 640,    // 640px+
    md: 768,    // 768px+
    lg: 1024,   // 1024px+
    xl: 1280,   // 1280px+
    '2xl': 1536 // 1536px+
  },

  layouts: {
    mobile: {
      preferredVariant: 'circular',
      maxWidth: '100%',
      orientation: 'vertical',
      stackOrder: 'progress-first',
      showLabels: false,
      compactMode: true
    },
    tablet: {
      preferredVariant: 'bar',
      maxWidth: '16rem', // 256px
      orientation: 'horizontal',
      stackOrder: 'icon-first',
      showLabels: true,
      compactMode: false
    },
    desktop: {
      preferredVariant: 'bar',
      maxWidth: '20rem', // 320px
      orientation: 'horizontal',
      stackOrder: 'icon-first',
      showLabels: true,
      compactMode: false
    }
  },

  typography: {
    mobile: {
      percentage: {
        size: '0.875rem', // 14px
        weight: '600',
        lineHeight: '1.25'
      },
      label: {
        size: '0.75rem', // 12px
        weight: '500',
        lineHeight: '1'
      },
      description: {
        size: '0.75rem', // 12px
        weight: '400',
        lineHeight: '1.25'
      }
    },
    tablet: {
      percentage: {
        size: '1rem', // 16px
        weight: '600',
        lineHeight: '1.5'
      },
      label: {
        size: '0.875rem', // 14px
        weight: '500',
        lineHeight: '1.25'
      },
      description: {
        size: '0.875rem', // 14px
        weight: '400',
        lineHeight: '1.5'
      }
    },
    desktop: {
      percentage: {
        size: '1rem', // 16px
        weight: '600',
        lineHeight: '1.5'
      },
      label: {
        size: '0.875rem', // 14px
        weight: '500',
        lineHeight: '1.25'
      },
      description: {
        size: '0.875rem', // 14px
        weight: '400',
        lineHeight: '1.5'
      }
    }
  },

  spacing: {
    mobile: {
      container: '0.5rem', // 8px
      internal: '0.25rem', // 4px
      iconGap: '0.375rem', // 6px
      textGap: '0.25rem', // 4px
      marginVertical: '0.5rem', // 8px
      marginHorizontal: '0.75rem' // 12px
    },
    tablet: {
      container: '0.75rem', // 12px
      internal: '0.5rem', // 8px
      iconGap: '0.5rem', // 8px
      textGap: '0.375rem', // 6px
      marginVertical: '0.75rem', // 12px
      marginHorizontal: '1rem' // 16px
    },
    desktop: {
      container: '1rem', // 16px
      internal: '0.75rem', // 12px
      iconGap: '0.75rem', // 12px
      textGap: '0.5rem', // 8px
      marginVertical: '1rem', // 16px
      marginHorizontal: '1.25rem' // 20px
    }
  },

  interactions: {
    mobile: {
      touchTargetSize: '44px', // Apple's recommended minimum
      hoverEffects: false,
      gestureSupport: true,
      contextMenus: false,
      tooltips: false
    },
    tablet: {
      touchTargetSize: '40px',
      hoverEffects: true,
      gestureSupport: true,
      contextMenus: true,
      tooltips: true
    },
    desktop: {
      touchTargetSize: '32px',
      hoverEffects: true,
      gestureSupport: false,
      contextMenus: true,
      tooltips: true
    }
  }
};

/**
 * Responsive variant recommendations based on context
 */
export const VariantRecommendations = {
  // Card layouts (common in trading interfaces)
  card: {
    mobile: {
      variant: 'circular' as const,
      size: 'medium' as const,
      placement: 'top-right',
      showLabel: false
    },
    tablet: {
      variant: 'bar' as const,
      size: 'medium' as const,
      placement: 'bottom',
      showLabel: true
    },
    desktop: {
      variant: 'bar' as const,
      size: 'medium' as const,
      placement: 'bottom',
      showLabel: true
    }
  },

  // List items (for trade analysis lists)
  listItem: {
    mobile: {
      variant: 'text' as const,
      size: 'small' as const,
      placement: 'inline',
      showLabel: false
    },
    tablet: {
      variant: 'bar' as const,
      size: 'small' as const,
      placement: 'inline',
      showLabel: false
    },
    desktop: {
      variant: 'bar' as const,
      size: 'small' as const,
      placement: 'inline',
      showLabel: true
    }
  },

  // Modal/dialog displays
  modal: {
    mobile: {
      variant: 'circular' as const,
      size: 'large' as const,
      placement: 'center',
      showLabel: true
    },
    tablet: {
      variant: 'bar' as const,
      size: 'large' as const,
      placement: 'center',
      showLabel: true
    },
    desktop: {
      variant: 'bar' as const,
      size: 'large' as const,
      placement: 'center',
      showLabel: true
    }
  },

  // Dashboard widgets
  dashboard: {
    mobile: {
      variant: 'circular' as const,
      size: 'medium' as const,
      placement: 'center',
      showLabel: false
    },
    tablet: {
      variant: 'circular' as const,
      size: 'large' as const,
      placement: 'center',
      showLabel: true
    },
    desktop: {
      variant: 'bar' as const,
      size: 'medium' as const,
      placement: 'center',
      showLabel: true
    }
  }
};

/**
 * CSS Grid and Flexbox layout patterns
 */
export const ResponsiveLayoutPatterns = {
  // Horizontal layout (desktop-first)
  horizontal: {
    mobile: `
      .confidence-display-horizontal {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: ${confidenceResponsiveConfig.spacing.mobile.container};
        max-width: 100%;
      }
    `,
    tablet: `
      .confidence-display-horizontal {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: ${confidenceResponsiveConfig.spacing.tablet.container};
        max-width: ${confidenceResponsiveConfig.layouts.tablet.maxWidth};
      }
    `,
    desktop: `
      .confidence-display-horizontal {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: ${confidenceResponsiveConfig.spacing.desktop.container};
        max-width: ${confidenceResponsiveConfig.layouts.desktop.maxWidth};
      }
    `
  },

  // Vertical layout (mobile-first)
  vertical: {
    mobile: `
      .confidence-display-vertical {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: ${confidenceResponsiveConfig.spacing.mobile.internal};
        width: 100%;
      }
    `,
    tablet: `
      .confidence-display-vertical {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: ${confidenceResponsiveConfig.spacing.tablet.internal};
        width: auto;
      }
    `,
    desktop: `
      .confidence-display-vertical {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: ${confidenceResponsiveConfig.spacing.desktop.internal};
        width: auto;
      }
    `
  },

  // Grid-based layout for complex displays
  grid: {
    mobile: `
      .confidence-display-grid {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto;
        gap: ${confidenceResponsiveConfig.spacing.mobile.container};
        justify-items: center;
        grid-template-areas: 
          "progress"
          "percentage" 
          "label";
      }
    `,
    tablet: `
      .confidence-display-grid {
        display: grid;
        grid-template-columns: auto 1fr auto;
        grid-template-rows: auto auto;
        gap: ${confidenceResponsiveConfig.spacing.tablet.container};
        align-items: center;
        grid-template-areas: 
          "icon progress percentage"
          "icon . label";
      }
    `,
    desktop: `
      .confidence-display-grid {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        grid-template-rows: auto;
        gap: ${confidenceResponsiveConfig.spacing.desktop.container};
        align-items: center;
        grid-template-areas: "icon progress percentage label";
      }
    `
  }
};

/**
 * Responsive breakpoint utilities
 */
export class ResponsiveManager {
  private currentBreakpoint: string = 'mobile';
  private observers: ((breakpoint: string) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.updateBreakpoint();
      window.addEventListener('resize', () => this.updateBreakpoint());
    }
  }

  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint(): string {
    return this.currentBreakpoint;
  }

  /**
   * Get configuration for current breakpoint
   */
  getCurrentConfig(): LayoutConfig & TypographyScale & SpacingScale & InteractionConfig {
    const breakpoint = this.getCurrentBreakpoint() as keyof ResponsiveLayouts;
    const layout = confidenceResponsiveConfig.layouts[breakpoint] || confidenceResponsiveConfig.layouts.mobile;
    const typography = confidenceResponsiveConfig.typography[breakpoint] || confidenceResponsiveConfig.typography.mobile;
    const spacing = confidenceResponsiveConfig.spacing[breakpoint] || confidenceResponsiveConfig.spacing.mobile;
    const interactions = confidenceResponsiveConfig.interactions[breakpoint] || confidenceResponsiveConfig.interactions.mobile;

    return {
      ...layout,
      ...typography,
      ...spacing,
      ...interactions
    };
  }

  /**
   * Get variant recommendation for context
   */
  getVariantRecommendation(context: keyof typeof VariantRecommendations) {
    const breakpoint = this.getCurrentBreakpoint() as keyof ResponsiveLayouts;
    return VariantRecommendations[context][breakpoint] || VariantRecommendations[context].mobile;
  }

  /**
   * Subscribe to breakpoint changes
   */
  subscribe(callback: (breakpoint: string) => void): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Update current breakpoint based on window width
   */
  private updateBreakpoint(): void {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const breakpoints = confidenceResponsiveConfig.breakpoints;
    
    let newBreakpoint = 'mobile';
    
    if (width >= breakpoints['2xl']) {
      newBreakpoint = 'desktop';
    } else if (width >= breakpoints.xl) {
      newBreakpoint = 'desktop';
    } else if (width >= breakpoints.lg) {
      newBreakpoint = 'desktop';
    } else if (width >= breakpoints.md) {
      newBreakpoint = 'tablet';
    } else if (width >= breakpoints.sm) {
      newBreakpoint = 'tablet';
    }

    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint;
      this.observers.forEach(callback => callback(newBreakpoint));
    }
  }
}

/**
 * CSS Media Query Utilities
 */
export const MediaQueries = {
  mobile: `@media (max-width: ${confidenceResponsiveConfig.breakpoints.sm - 1}px)`,
  tablet: `@media (min-width: ${confidenceResponsiveConfig.breakpoints.sm}px) and (max-width: ${confidenceResponsiveConfig.breakpoints.lg - 1}px)`,
  desktop: `@media (min-width: ${confidenceResponsiveConfig.breakpoints.lg}px)`,
  
  // Utility queries
  small: `@media (max-width: ${confidenceResponsiveConfig.breakpoints.md - 1}px)`,
  large: `@media (min-width: ${confidenceResponsiveConfig.breakpoints.lg}px)`,
  
  // Touch device detection
  touch: '@media (hover: none) and (pointer: coarse)',
  noTouch: '@media (hover: hover) and (pointer: fine)',
  
  // High DPI displays
  highDPI: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  
  // Reduced motion
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  
  // High contrast
  highContrast: '@media (prefers-contrast: high)',
  
  // Dark mode
  darkMode: '@media (prefers-color-scheme: dark)'
};

/**
 * Responsive CSS utilities
 */
export const ResponsiveCSS = {
  // Generate responsive classes
  generateClasses: (): string => {
    return `
      /* Mobile-first responsive confidence display */
      .confidence-responsive {
        width: 100%;
        max-width: ${confidenceResponsiveConfig.layouts.mobile.maxWidth};
      }

      ${MediaQueries.tablet} {
        .confidence-responsive {
          max-width: ${confidenceResponsiveConfig.layouts.tablet.maxWidth};
        }
      }

      ${MediaQueries.desktop} {
        .confidence-responsive {
          max-width: ${confidenceResponsiveConfig.layouts.desktop.maxWidth};
        }
      }

      /* Typography scaling */
      .confidence-text {
        font-size: ${confidenceResponsiveConfig.typography.mobile.percentage.size};
        font-weight: ${confidenceResponsiveConfig.typography.mobile.percentage.weight};
        line-height: ${confidenceResponsiveConfig.typography.mobile.percentage.lineHeight};
      }

      ${MediaQueries.tablet} {
        .confidence-text {
          font-size: ${confidenceResponsiveConfig.typography.tablet.percentage.size};
          font-weight: ${confidenceResponsiveConfig.typography.tablet.percentage.weight};
          line-height: ${confidenceResponsiveConfig.typography.tablet.percentage.lineHeight};
        }
      }

      ${MediaQueries.desktop} {
        .confidence-text {
          font-size: ${confidenceResponsiveConfig.typography.desktop.percentage.size};
          font-weight: ${confidenceResponsiveConfig.typography.desktop.percentage.weight};
          line-height: ${confidenceResponsiveConfig.typography.desktop.percentage.lineHeight};
        }
      }

      /* Touch targets for mobile */
      ${MediaQueries.touch} {
        .confidence-interactive {
          min-height: ${confidenceResponsiveConfig.interactions.mobile.touchTargetSize};
          min-width: ${confidenceResponsiveConfig.interactions.mobile.touchTargetSize};
        }
      }

      /* Layout adaptations */
      ${ResponsiveLayoutPatterns.horizontal.mobile}
      ${MediaQueries.tablet} { ${ResponsiveLayoutPatterns.horizontal.tablet} }
      ${MediaQueries.desktop} { ${ResponsiveLayoutPatterns.horizontal.desktop} }
    `;
  }
};

// Export singleton instance
export const responsiveManager = new ResponsiveManager();

export default {
  confidenceResponsiveConfig,
  VariantRecommendations,
  ResponsiveLayoutPatterns,
  ResponsiveManager,
  MediaQueries,
  ResponsiveCSS,
  responsiveManager
};