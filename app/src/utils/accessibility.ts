/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 * Supporting NFR-3: Accessible navigation with keyboard and screen reader support
 */

export interface AccessibilityConfig {
  announcements: boolean;
  focusManagement: boolean;
  keyboardNavigation: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

/**
 * Screen reader utilities
 */
export const ScreenReader = {
  /**
   * Announce text to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('class', 'sr-only');
    announcer.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
    `;
    
    document.body.appendChild(announcer);
    announcer.textContent = message;
    
    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  /**
   * Announce navigation changes
   */
  announceNavigation: (from: string, to: string): void => {
    ScreenReader.announce(`Navigated from ${from} to ${to}`, 'assertive');
  },

  /**
   * Announce loading states
   */
  announceLoading: (isLoading: boolean, context?: string): void => {
    const message = isLoading 
      ? `Loading ${context || 'content'}...`
      : `${context || 'Content'} loaded`;
    ScreenReader.announce(message, 'polite');
  },
};

/**
 * Focus management utilities
 */
export const FocusManager = {
  /**
   * Set focus to element with fallback
   */
  setFocus: (
    selector: string | HTMLElement, 
    options: { 
      preventScroll?: boolean;
      fallback?: string | HTMLElement;
    } = {}
  ): boolean => {
    try {
      const element = typeof selector === 'string' 
        ? document.querySelector(selector) as HTMLElement
        : selector;
      
      if (element && typeof element.focus === 'function') {
        element.focus({ preventScroll: options.preventScroll });
        return true;
      }
      
      // Try fallback
      if (options.fallback) {
        return FocusManager.setFocus(options.fallback, { preventScroll: options.preventScroll });
      }
      
      return false;
    } catch (error) {
      console.warn('Focus management error:', error);
      return false;
    }
  },

  /**
   * Create focus trap for modals and dropdowns
   */
  createFocusTrap: (container: HTMLElement): (() => void) => {
    const focusableElements = container.querySelectorAll(
      'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Set initial focus
    firstFocusable?.focus();
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },

  /**
   * Skip link functionality
   */
  addSkipLinks: (): void => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  },
};

/**
 * Keyboard navigation utilities
 */
export const KeyboardNav = {
  /**
   * Handle arrow key navigation in menus
   */
  handleArrowNavigation: (
    event: KeyboardEvent, 
    items: HTMLElement[],
    currentIndex: number,
    options: {
      wrap?: boolean;
      orientation?: 'horizontal' | 'vertical';
    } = {}
  ): number => {
    const { wrap = true, orientation = 'vertical' } = options;
    const isVertical = orientation === 'vertical';
    const nextKeys = isVertical ? ['ArrowDown'] : ['ArrowRight'];
    const prevKeys = isVertical ? ['ArrowUp'] : ['ArrowLeft'];
    
    if (nextKeys.includes(event.key)) {
      event.preventDefault();
      const nextIndex = currentIndex + 1;
      const targetIndex = wrap && nextIndex >= items.length ? 0 : 
        Math.min(nextIndex, items.length - 1);
      items[targetIndex]?.focus();
      return targetIndex;
    }
    
    if (prevKeys.includes(event.key)) {
      event.preventDefault();
      const prevIndex = currentIndex - 1;
      const targetIndex = wrap && prevIndex < 0 ? items.length - 1 : 
        Math.max(prevIndex, 0);
      items[targetIndex]?.focus();
      return targetIndex;
    }
    
    return currentIndex;
  },

  /**
   * Handle escape key to close modals/dropdowns
   */
  handleEscapeKey: (event: KeyboardEvent, callback: () => void): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      callback();
    }
  },

  /**
   * Handle enter/space activation
   */
  handleActivation: (event: KeyboardEvent, callback: () => void): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  },
};

/**
 * Color contrast and visual utilities
 */
export const VisualAccessibility = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Check if user prefers high contrast
   */
  prefersHighContrast: (): boolean => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  /**
   * Calculate color contrast ratio
   */
  getContrastRatio: (color1: string, color2: string): number => {
    // Simplified contrast calculation
    // In production, use a proper color library
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.replace('#', ''), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };
    
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check WCAG compliance
   */
  checkWCAGCompliance: (ratio: number, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const threshold = level === 'AAA' ? 7 : 4.5;
    return ratio >= threshold;
  },
};

/**
 * ARIA utilities
 */
export const ARIAUtils = {
  /**
   * Generate unique IDs for ARIA relationships
   */
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Set ARIA expanded state
   */
  setExpanded: (element: HTMLElement, expanded: boolean): void => {
    element.setAttribute('aria-expanded', expanded.toString());
  },

  /**
   * Set ARIA pressed state for toggle buttons
   */
  setPressed: (element: HTMLElement, pressed: boolean): void => {
    element.setAttribute('aria-pressed', pressed.toString());
  },

  /**
   * Set ARIA current for navigation
   */
  setCurrent: (element: HTMLElement, current: 'page' | 'step' | 'location' | 'true' | 'false'): void => {
    if (current === 'false') {
      element.removeAttribute('aria-current');
    } else {
      element.setAttribute('aria-current', current);
    }
  },

  /**
   * Set ARIA live region
   */
  setLiveRegion: (element: HTMLElement, level: 'off' | 'polite' | 'assertive' = 'polite'): void => {
    element.setAttribute('aria-live', level);
    if (level !== 'off') {
      element.setAttribute('aria-atomic', 'true');
    }
  },
};

/**
 * Main accessibility class for managing all accessibility features
 */
export class AccessibilityManager {
  private config: AccessibilityConfig;
  private cleanupFunctions: (() => void)[] = [];

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      announcements: true,
      focusManagement: true,
      keyboardNavigation: true,
      reducedMotion: true,
      highContrast: true,
      ...config,
    };
    
    this.init();
  }

  private init(): void {
    if (this.config.focusManagement) {
      FocusManager.addSkipLinks();
    }

    // Add CSS classes based on user preferences
    if (VisualAccessibility.prefersReducedMotion()) {
      document.documentElement.classList.add('reduce-motion');
    }

    if (VisualAccessibility.prefersHighContrast()) {
      document.documentElement.classList.add('high-contrast');
    }

    // Listen for preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleMotionChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('reduce-motion', e.matches);
    };

    const handleContrastChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('high-contrast', e.matches);
    };

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);

    this.cleanupFunctions.push(() => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    });
  }

  public cleanup(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];
  }
}

// Export default instance
export default new AccessibilityManager();

// CSS utilities that should be added to global styles
export const accessibilityCSS = `
/* Screen reader only content */
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Focus visible styles */
.focus-visible:focus {
  outline: 2px solid #2563eb !important;
  outline-offset: 2px !important;
}

/* Skip link */
.skip-link:focus {
  position: absolute !important;
  top: 6px !important;
  left: 6px !important;
  background: #000 !important;
  color: #fff !important;
  padding: 8px 16px !important;
  text-decoration: none !important;
  border-radius: 4px !important;
  z-index: 10000 !important;
}

/* Reduced motion */
.reduce-motion *,
.reduce-motion *::before,
.reduce-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

/* High contrast */
.high-contrast {
  filter: contrast(1.2);
}

/* Focus management for modals */
[data-focus-trap] {
  isolation: isolate;
}
`;