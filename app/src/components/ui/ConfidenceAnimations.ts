/**
 * ConfidenceAnimations - Elite Trading Coach AI
 * UI/UX Designer Implementation for PRD-1.2.8
 * 
 * Advanced animation system with custom easing functions, smooth transitions,
 * and accessibility-conscious motion design for confidence displays.
 */

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
  iterationCount?: number | 'infinite';
}

export interface MotionPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Custom easing functions designed for confidence displays
 * Each easing serves a specific UX purpose
 */
export const ConfidenceEasing = {
  // Smooth, professional entrance for confidence data
  confidenceReveal: 'cubic-bezier(0.16, 1, 0.3, 1)',
  
  // Bouncy, engaging feedback for user interactions
  confidenceBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Precise, technical progression for progress bars
  progressFill: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  
  // Gentle, calming motion for background elements
  backgroundShift: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Sharp, attention-grabbing for alerts/warnings
  alertPulse: 'cubic-bezier(0.76, 0, 0.24, 1)',
  
  // Elastic feedback for interactive elements
  elasticOut: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  
  // Smooth deceleration for hover states
  hoverEase: 'cubic-bezier(0.23, 1, 0.32, 1)'
};

/**
 * Animation duration specifications
 * Optimized for different confidence display contexts
 */
export const AnimationDurations = {
  // Quick feedback for immediate interactions
  instant: 0,
  micro: 150,   // Button hover, small state changes
  short: 300,   // Component entrance, quick transitions
  
  // Standard animations for primary interactions
  medium: 600,  // Progress bar fills, confidence updates
  long: 900,    // Complex state changes, data loading
  
  // Extended animations for dramatic effect
  extended: 1200, // Full confidence analysis reveal
  
  // Contextual durations
  progressFill: 1000,    // Progress bar animation
  confidenceUpdate: 800, // Confidence percentage change
  componentEntrance: 500, // Component fade-in
  hoverResponse: 200,    // Hover state transitions
  focusResponse: 150,    // Focus ring appearance
  
  // Reduced motion alternatives
  reducedMotion: {
    instant: 0,
    all: 50  // Minimal duration for reduced motion
  }
};

/**
 * Keyframe animations for confidence displays
 */
export const ConfidenceKeyframes = {
  // Progress bar fill animation with realistic easing
  progressFill: `
    @keyframes confidence-progress-fill {
      0% {
        width: 0%;
        opacity: 0.7;
      }
      20% {
        opacity: 1;
      }
      100% {
        width: var(--target-width);
        opacity: 1;
      }
    }
  `,

  // Circular progress animation
  circularProgress: `
    @keyframes confidence-circular-progress {
      0% {
        stroke-dashoffset: var(--circumference);
        opacity: 0.7;
      }
      20% {
        opacity: 1;
      }
      100% {
        stroke-dashoffset: var(--target-offset);
        opacity: 1;
      }
    }
  `,

  // Component entrance with stagger effect
  staggeredEntrance: `
    @keyframes confidence-staggered-entrance {
      0% {
        opacity: 0;
        transform: translateY(8px) scale(0.95);
      }
      60% {
        opacity: 0.8;
        transform: translateY(-2px) scale(1.02);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `,

  // Confidence level change animation
  levelTransition: `
    @keyframes confidence-level-transition {
      0% {
        transform: scale(1);
        filter: brightness(1);
      }
      50% {
        transform: scale(1.05);
        filter: brightness(1.1);
      }
      100% {
        transform: scale(1);
        filter: brightness(1);
      }
    }
  `,

  // Attention-grabbing pulse for critical confidence levels
  criticalPulse: `
    @keyframes confidence-critical-pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
    }
  `,

  // Subtle breathing animation for background elements
  backgroundBreath: `
    @keyframes confidence-background-breath {
      0%, 100% {
        opacity: 0.3;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(1.02);
      }
    }
  `,

  // Shimmer effect for loading states
  shimmer: `
    @keyframes confidence-shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
  `,

  // Elastic bounce for interactive feedback
  elasticBounce: `
    @keyframes confidence-elastic-bounce {
      0% {
        transform: scale(1);
      }
      30% {
        transform: scale(1.15);
      }
      60% {
        transform: scale(0.95);
      }
      80% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }
  `
};

/**
 * Animation configuration sets for different contexts
 */
export const AnimationPresets = {
  // Default confidence display animation
  default: {
    entrance: {
      animation: 'confidence-staggered-entrance',
      duration: AnimationDurations.medium,
      easing: ConfidenceEasing.confidenceReveal,
      fillMode: 'both' as const
    },
    progressFill: {
      animation: 'confidence-progress-fill',
      duration: AnimationDurations.progressFill,
      easing: ConfidenceEasing.progressFill,
      fillMode: 'forwards' as const
    }
  },

  // High-performance preset for mobile devices
  performance: {
    entrance: {
      duration: AnimationDurations.short,
      easing: ConfidenceEasing.backgroundShift
    },
    progressFill: {
      duration: AnimationDurations.medium,
      easing: ConfidenceEasing.progressFill
    }
  },

  // Accessibility-first preset
  accessible: {
    entrance: {
      duration: AnimationDurations.reducedMotion.all,
      easing: 'linear'
    },
    progressFill: {
      duration: AnimationDurations.reducedMotion.all,
      easing: 'linear'
    }
  },

  // Premium experience with enhanced animations
  premium: {
    entrance: {
      animation: 'confidence-staggered-entrance',
      duration: AnimationDurations.long,
      easing: ConfidenceEasing.elasticOut,
      fillMode: 'both' as const
    },
    progressFill: {
      animation: 'confidence-progress-fill',
      duration: AnimationDurations.extended,
      easing: ConfidenceEasing.confidenceBounce,
      fillMode: 'forwards' as const
    },
    levelChange: {
      animation: 'confidence-level-transition',
      duration: AnimationDurations.medium,
      easing: ConfidenceEasing.confidenceBounce
    }
  }
};

/**
 * Motion utilities for dynamic animation control
 */
export class ConfidenceMotionController {
  private motionPreferences: MotionPreferences;
  private activeAnimations: Map<string, Animation> = new Map();

  constructor(preferences?: Partial<MotionPreferences>) {
    this.motionPreferences = {
      prefersReducedMotion: this.detectReducedMotion(),
      prefersHighContrast: this.detectHighContrast(),
      deviceType: this.detectDeviceType(),
      ...preferences
    };
  }

  /**
   * Get appropriate animation configuration based on user preferences
   */
  getAnimationConfig(context: 'entrance' | 'progressFill' | 'levelChange' | 'hover'): AnimationConfig {
    if (this.motionPreferences.prefersReducedMotion) {
      return {
        duration: AnimationDurations.reducedMotion.all,
        easing: 'linear',
        fillMode: 'forwards'
      };
    }

    const preset = this.motionPreferences.deviceType === 'mobile' 
      ? AnimationPresets.performance 
      : AnimationPresets.default;

    return preset[context as keyof typeof preset] || {
      duration: AnimationDurations.medium,
      easing: ConfidenceEasing.confidenceReveal,
      fillMode: 'forwards'
    };
  }

  /**
   * Create and manage progress bar animation
   */
  animateProgressFill(
    element: HTMLElement, 
    targetWidth: number, 
    options?: Partial<AnimationConfig>
  ): Promise<void> {
    return new Promise((resolve) => {
      const config = { ...this.getAnimationConfig('progressFill'), ...options };
      
      if (this.motionPreferences.prefersReducedMotion) {
        element.style.width = `${targetWidth}%`;
        resolve();
        return;
      }

      // Set CSS custom property for animation
      element.style.setProperty('--target-width', `${targetWidth}%`);
      
      const animation = element.animate([
        { 
          width: '0%',
          opacity: '0.7'
        },
        { 
          width: `${targetWidth}%`,
          opacity: '1'
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        fill: config.fillMode
      });

      animation.addEventListener('finish', () => resolve());
      this.activeAnimations.set(`progress-${element.id}`, animation);
    });
  }

  /**
   * Create circular progress animation
   */
  animateCircularProgress(
    element: SVGCircleElement,
    circumference: number,
    targetOffset: number,
    options?: Partial<AnimationConfig>
  ): Promise<void> {
    return new Promise((resolve) => {
      const config = { ...this.getAnimationConfig('progressFill'), ...options };
      
      if (this.motionPreferences.prefersReducedMotion) {
        element.style.strokeDashoffset = `${targetOffset}px`;
        resolve();
        return;
      }

      const animation = element.animate([
        { 
          strokeDashoffset: `${circumference}px`,
          opacity: '0.7'
        },
        { 
          strokeDashoffset: `${targetOffset}px`,
          opacity: '1'
        }
      ], {
        duration: config.duration,
        easing: config.easing,
        fill: config.fillMode
      });

      animation.addEventListener('finish', () => resolve());
      this.activeAnimations.set(`circular-${element.id}`, animation);
    });
  }

  /**
   * Animate confidence level changes with visual feedback
   */
  animateLevelChange(
    element: HTMLElement,
    fromLevel: 'low' | 'medium' | 'high',
    toLevel: 'low' | 'medium' | 'high'
  ): Promise<void> {
    return new Promise((resolve) => {
      if (this.motionPreferences.prefersReducedMotion || fromLevel === toLevel) {
        resolve();
        return;
      }

      const config = this.getAnimationConfig('levelChange');
      const animation = element.animate([
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: 'scale(1.05)', filter: 'brightness(1.1)' },
        { transform: 'scale(1)', filter: 'brightness(1)' }
      ], {
        duration: config.duration,
        easing: config.easing
      });

      animation.addEventListener('finish', () => resolve());
    });
  }

  /**
   * Cancel all active animations
   */
  cancelAnimations(): void {
    this.activeAnimations.forEach(animation => animation.cancel());
    this.activeAnimations.clear();
  }

  /**
   * Detect user motion preferences
   */
  private detectReducedMotion(): boolean {
    return typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }

  private detectHighContrast(): boolean {
    return typeof window !== 'undefined'
      ? window.matchMedia('(prefers-contrast: high)').matches
      : false;
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
}

/**
 * CSS-in-JS animation styles for component integration
 */
export const AnimationStyles = {
  // Base animation styles
  base: `
    .confidence-display {
      --animation-duration: ${AnimationDurations.medium}ms;
      --animation-easing: ${ConfidenceEasing.confidenceReveal};
    }

    .confidence-display.reduce-motion {
      --animation-duration: ${AnimationDurations.reducedMotion.all}ms;
      --animation-easing: linear;
    }

    .confidence-progress-fill {
      transition: width var(--animation-duration) var(--animation-easing);
    }

    .confidence-circular-progress {
      transition: stroke-dashoffset var(--animation-duration) var(--animation-easing);
    }
  `,

  // Keyframe injections
  keyframes: Object.values(ConfidenceKeyframes).join('\n'),

  // Utility classes
  utilities: `
    .animate-confidence-entrance {
      animation: confidence-staggered-entrance ${AnimationDurations.medium}ms ${ConfidenceEasing.confidenceReveal} both;
    }

    .animate-confidence-fill {
      animation: confidence-progress-fill ${AnimationDurations.progressFill}ms ${ConfidenceEasing.progressFill} forwards;
    }

    .animate-confidence-pulse {
      animation: confidence-critical-pulse 2s ${ConfidenceEasing.alertPulse} infinite;
    }

    .animate-confidence-shimmer {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      background-size: 200% 100%;
      animation: confidence-shimmer 1.5s infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .animate-confidence-entrance,
      .animate-confidence-fill,
      .animate-confidence-pulse,
      .animate-confidence-shimmer {
        animation: none !important;
        transition: none !important;
      }
    }
  `
};

// Export singleton instance
export const motionController = new ConfidenceMotionController();

export default {
  ConfidenceEasing,
  AnimationDurations,
  ConfidenceKeyframes,
  AnimationPresets,
  ConfidenceMotionController,
  AnimationStyles,
  motionController
};