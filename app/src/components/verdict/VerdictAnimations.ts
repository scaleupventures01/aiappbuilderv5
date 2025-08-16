/**
 * Verdict Animation Specifications - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.7-verdict-display-component.md
 * Task: T-verdict-003 - Design animations and visual effects
 * 
 * Comprehensive animation system with accessibility support and performance optimization
 */

/**
 * Animation timing functions based on design principles
 */
export const AnimationTimings = {
  // Entrance animations - quick and engaging
  entrance: {
    duration: 600,
    ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy ease-out
    delay: 100,
  },
  
  // Hover animations - subtle and responsive
  hover: {
    duration: 200,
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)', // Standard ease-out
    delay: 0,
  },
  
  // Focus animations - accessible and clear
  focus: {
    duration: 150,
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 0,
  },
  
  // Confidence bar animation - satisfying progress
  progress: {
    duration: 1000,
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 200,
  },
  
  // Pulse animation for attention
  pulse: {
    duration: 2000,
    ease: 'cubic-bezier(0.4, 0, 0.6, 1)',
    iterations: 3,
  },
} as const;

/**
 * Keyframe definitions for CSS animations
 */
export const KeyframeDefinitions = {
  verdictEntrance: `
    @keyframes verdict-entrance {
      0% {
        transform: scale(0.8) translateY(8px);
        opacity: 0;
      }
      50% {
        transform: scale(1.05) translateY(-2px);
        opacity: 0.8;
      }
      100% {
        transform: scale(1) translateY(0);
        opacity: 1;
      }
    }
  `,
  
  iconBounce: `
    @keyframes icon-bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0) scale(1);
      }
      40% {
        transform: translateY(-4px) scale(1.1);
      }
      60% {
        transform: translateY(-2px) scale(1.05);
      }
    }
  `,
  
  progressFill: `
    @keyframes progress-fill {
      0% {
        width: 0%;
        opacity: 0.8;
      }
      100% {
        width: var(--progress-width);
        opacity: 1;
      }
    }
  `,
  
  pulseGlow: `
    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 0 0 0 var(--pulse-color);
        opacity: 1;
      }
      50% {
        box-shadow: 0 0 0 8px transparent;
        opacity: 0.8;
      }
    }
  `,
  
  shimmer: `
    @keyframes shimmer {
      0% {
        background-position: -100% 0;
      }
      100% {
        background-position: 100% 0;
      }
    }
  `,
  
  // Reduced motion alternatives
  fadeIn: `
    @keyframes fade-in {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }
  `,
  
  slideIn: `
    @keyframes slide-in {
      0% {
        transform: translateY(4px);
        opacity: 0;
      }
      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
} as const;

/**
 * Animation classes for different verdict types
 */
export const VerdictAnimationClasses = {
  Diamond: {
    entrance: 'animate-verdict-entrance-diamond',
    icon: 'animate-diamond-sparkle',
    hover: 'hover:animate-diamond-shine',
    focus: 'focus:animate-ring-pulse',
  },
  Fire: {
    entrance: 'animate-verdict-entrance-fire',
    icon: 'animate-fire-flicker',
    hover: 'hover:animate-fire-intensity',
    focus: 'focus:animate-ring-pulse',
  },
  Skull: {
    entrance: 'animate-verdict-entrance-skull',
    icon: 'animate-skull-warn',
    hover: 'hover:animate-skull-emphasis',
    focus: 'focus:animate-ring-pulse',
  },
} as const;

/**
 * CSS animation definitions with accessibility support
 */
export const AnimationCSS = `
/* Base keyframes */
${KeyframeDefinitions.verdictEntrance}
${KeyframeDefinitions.iconBounce}
${KeyframeDefinitions.progressFill}
${KeyframeDefinitions.pulseGlow}
${KeyframeDefinitions.shimmer}
${KeyframeDefinitions.fadeIn}
${KeyframeDefinitions.slideIn}

/* Verdict entrance animations */
.animate-verdict-entrance {
  animation: verdict-entrance ${AnimationTimings.entrance.duration}ms ${AnimationTimings.entrance.ease} ${AnimationTimings.entrance.delay}ms both;
}

/* Icon-specific animations */
.animate-diamond-sparkle {
  animation: icon-bounce ${AnimationTimings.entrance.duration}ms ${AnimationTimings.entrance.ease} ${AnimationTimings.entrance.delay + 200}ms both;
}

.animate-fire-flicker {
  animation: pulse-glow ${AnimationTimings.pulse.duration}ms ${AnimationTimings.pulse.ease} infinite;
  --pulse-color: rgba(245, 158, 11, 0.3);
}

.animate-skull-warn {
  animation: pulse-glow ${AnimationTimings.pulse.duration}ms ${AnimationTimings.pulse.ease} ${AnimationTimings.pulse.iterations};
  --pulse-color: rgba(220, 38, 38, 0.3);
}

/* Hover animations */
.animate-diamond-shine:hover {
  animation: shimmer 1500ms linear infinite;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
  background-size: 200% 100%;
}

.animate-fire-intensity:hover {
  animation: pulse-glow ${AnimationTimings.hover.duration}ms ${AnimationTimings.hover.ease} infinite;
  --pulse-color: rgba(245, 158, 11, 0.5);
}

.animate-skull-emphasis:hover {
  animation: pulse-glow ${AnimationTimings.hover.duration}ms ${AnimationTimings.hover.ease} 2;
  --pulse-color: rgba(220, 38, 38, 0.4);
}

/* Focus animations */
.animate-ring-pulse:focus {
  animation: pulse-glow ${AnimationTimings.focus.duration}ms ${AnimationTimings.focus.ease} 3;
}

/* Progress bar animation */
.animate-progress-fill {
  animation: progress-fill ${AnimationTimings.progress.duration}ms ${AnimationTimings.progress.ease} ${AnimationTimings.progress.delay}ms both;
}

/* Loading shimmer effect */
.animate-loading-shimmer {
  animation: shimmer 2000ms linear infinite;
  background: linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%);
  background-size: 200% 100%;
}

/* Accessibility: Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .animate-verdict-entrance {
    animation: fade-in 300ms ease-out;
  }
  
  .animate-diamond-sparkle,
  .animate-fire-flicker,
  .animate-skull-warn {
    animation: none;
  }
  
  .animate-diamond-shine:hover,
  .animate-fire-intensity:hover,
  .animate-skull-emphasis:hover {
    animation: none;
  }
  
  .animate-ring-pulse:focus {
    animation: none;
    outline: 2px solid var(--focus-color);
    outline-offset: 2px;
  }
  
  .animate-progress-fill {
    animation: slide-in 300ms ease-out;
  }
  
  .animate-loading-shimmer {
    animation: none;
  }
}

/* High contrast mode adjustments */
@media (prefers-contrast: high) {
  .animate-ring-pulse:focus {
    outline-width: 3px;
    outline-offset: 3px;
  }
  
  /* Ensure animations don't interfere with high contrast */
  .animate-diamond-shine:hover,
  .animate-fire-intensity:hover,
  .animate-skull-emphasis:hover {
    filter: none;
    opacity: 1;
  }
}

/* Performance optimizations */
.verdict-display-animated {
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
}

.verdict-display-animated.animation-complete {
  will-change: auto;
}
`;

/**
 * Animation configuration for different interaction states
 */
export const AnimationStates = {
  initial: {
    scale: 0.95,
    opacity: 0,
    y: 8,
  },
  animate: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: AnimationTimings.entrance.duration / 1000,
      ease: [0.34, 1.56, 0.64, 1],
      delay: AnimationTimings.entrance.delay / 1000,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: AnimationTimings.hover.duration / 1000,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  focus: {
    scale: 1.01,
    transition: {
      duration: AnimationTimings.focus.duration / 1000,
      ease: [0.4, 0, 0.2, 1],
    },
  },
} as const;

/**
 * Performance monitoring for animations
 */
export const AnimationPerformance = {
  // Check if animations should be disabled for performance
  shouldReduceAnimations: (): boolean => {
    // Check user preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    
    // Check device capabilities
    const connection = (navigator as any).connection;
    if (connection && connection.saveData) {
      return true;
    }
    
    // Check for low-end devices
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return true;
    }
    
    return false;
  },
  
  // Monitor animation performance
  trackAnimationPerformance: (animationName: string, duration: number) => {
    if (performance && performance.mark) {
      performance.mark(`animation-${animationName}-start`);
      setTimeout(() => {
        performance.mark(`animation-${animationName}-end`);
        performance.measure(
          `animation-${animationName}`,
          `animation-${animationName}-start`,
          `animation-${animationName}-end`
        );
      }, duration);
    }
  },
} as const;

/**
 * Accessibility-aware animation hook configuration
 */
export const AccessibleAnimationConfig = {
  // Default animation settings
  default: {
    duration: AnimationTimings.entrance.duration,
    easing: AnimationTimings.entrance.ease,
    respectReducedMotion: true,
  },
  
  // Reduced motion alternatives
  reducedMotion: {
    duration: 300,
    easing: 'ease-out',
    disableComplexAnimations: true,
  },
  
  // Animation presets by context
  presets: {
    entrance: {
      duration: AnimationTimings.entrance.duration,
      delay: AnimationTimings.entrance.delay,
      respectMotionPreference: true,
    },
    interaction: {
      duration: AnimationTimings.hover.duration,
      delay: 0,
      respectMotionPreference: false, // Keep subtle interactions
    },
    feedback: {
      duration: AnimationTimings.focus.duration,
      delay: 0,
      respectMotionPreference: false, // Important for accessibility
    },
  },
} as const;

export default {
  AnimationTimings,
  KeyframeDefinitions,
  VerdictAnimationClasses,
  AnimationCSS,
  AnimationStates,
  AnimationPerformance,
  AccessibleAnimationConfig,
};