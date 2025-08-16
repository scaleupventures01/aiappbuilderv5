/**
 * UI Components Index - Elite Trading Coach AI
 * Barrel exports for reusable UI components
 */

// Core UI Components
export { default as ErrorMessage } from './ErrorMessage';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as ToastNotification } from './ToastNotification';

// Confidence Display Components
export { 
  ConfidenceDisplay, 
  getConfidenceLevel,
  type ConfidenceDisplayProps,
  type ConfidenceLevel,
  type ConfidenceVariant,
  type ConfidenceSize,
  type ColorScheme
} from './ConfidenceDisplay';