/**
 * ToastNotification Component - Elite Trading Coach AI
 * PRD Reference: PRD-1.2.11-basic-error-handling-system.md
 * Toast notification system for error feedback and status updates
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { ToastNotification as ToastType } from '@/types/error';
import { ScreenReader } from '@/utils/accessibility';

interface ToastNotificationProps {
  toast: ToastType;
  onDismiss?: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

/**
 * Toast container for managing multiple toasts
 */
interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss?: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

/**
 * Get icon and styling for toast type
 */
const getToastConfig = (type: ToastType['type']) => {
  const configs = {
    error: {
      icon: AlertTriangle,
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-600',
      iconColor: 'text-white'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-500',
      textColor: 'text-white',
      borderColor: 'border-yellow-600',
      iconColor: 'text-white'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      borderColor: 'border-green-600',
      iconColor: 'text-white'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      borderColor: 'border-blue-600',
      iconColor: 'text-white'
    }
  };

  return configs[type] || configs.info;
};

/**
 * Get position classes for toast placement
 */
const getPositionClasses = (position: string) => {
  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return positions[position as keyof typeof positions] || positions['top-right'];
};

/**
 * Individual toast notification component
 */
export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onDismiss,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(toast.duration || 5000);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const config = getToastConfig(toast.type);
  const IconComponent = config.icon;

  // Auto-dismiss timer
  useEffect(() => {
    if (!toast.autoClose || toast.duration === 0) return;

    const startTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, timeRemaining);
    };

    const startCountdown = () => {
      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          setTimeRemaining(prev => {
            if (prev <= 100) {
              handleDismiss();
              return 0;
            }
            return prev - 100;
          });
        }
      }, 100);
    };

    if (!isPaused) {
      startTimer();
      startCountdown();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timeRemaining, isPaused, toast.autoClose, toast.duration]);

  // Announce to screen readers
  useEffect(() => {
    const announcement = `${toast.type}: ${toast.title}. ${toast.message}`;
    ScreenReader.announce(announcement, toast.type === 'error' ? 'assertive' : 'polite');
  }, [toast.type, toast.title, toast.message]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onDismiss) {
        onDismiss(toast.id);
      }
      if (toast.onDismiss) {
        toast.onDismiss();
      }
    }, 200); // Animation duration
  };

  const handleRetry = () => {
    if (toast.onRetry) {
      toast.onRetry();
    }
    handleDismiss();
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (!isVisible) return null;

  const progressPercentage = toast.duration ? ((toast.duration - timeRemaining) / toast.duration) * 100 : 0;

  return (
    <div
      className={`fixed z-50 max-w-sm w-full transition-all duration-200 ease-in-out ${
        isExiting ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'
      } ${getPositionClasses(position)}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className={`rounded-lg shadow-lg border ${config.bgColor} ${config.borderColor} overflow-hidden`}>
        {/* Progress bar */}
        {toast.autoClose && toast.duration && toast.duration > 0 && (
          <div className="h-1 bg-black/20">
            <div
              className="h-full bg-white/30 transition-all duration-100 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        {/* Toast content */}
        <div className="p-4">
          <div className="flex items-start">
            {/* Icon */}
            <div className="flex-shrink-0">
              <IconComponent className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
            </div>

            {/* Content */}
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${config.textColor}`}>
                {toast.title}
              </p>
              {toast.message && (
                <p className={`mt-1 text-sm ${config.textColor} opacity-90`}>
                  {toast.message}
                </p>
              )}

              {/* Action buttons */}
              {(toast.retryable || toast.onRetry) && (
                <div className="mt-3 flex items-center space-x-3">
                  <button
                    onClick={handleRetry}
                    className={`text-sm font-medium ${config.textColor} hover:opacity-80 transition-opacity inline-flex items-center`}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Try Again
                  </button>
                </div>
              )}
            </div>

            {/* Dismiss button */}
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className={`inline-flex rounded-md p-1.5 ${config.textColor} hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white`}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Toast container for managing multiple notifications
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  position = 'top-right',
  maxToasts = 5
}) => {
  // Limit the number of displayed toasts
  const displayToasts = toasts.slice(-maxToasts);

  if (displayToasts.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {displayToasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{
            // Stack toasts with slight offset
            ...(position.includes('top') && {
              transform: `translateY(${index * 10}px)`
            }),
            ...(position.includes('bottom') && {
              transform: `translateY(${-index * 10}px)`
            })
          }}
        >
          <ToastNotification
            toast={toast}
            onDismiss={onDismiss}
            position={position}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Hook for managing toast notifications
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = (toast: Omit<ToastType, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastType = {
      id,
      autoClose: true,
      duration: 5000,
      ...toast
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  const showError = (title: string, message: string, options?: Partial<ToastType>) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 8000, // Longer duration for errors
      ...options
    });
  };

  const showSuccess = (title: string, message: string, options?: Partial<ToastType>) => {
    return addToast({
      type: 'success',
      title,
      message,
      duration: 4000,
      ...options
    });
  };

  const showWarning = (title: string, message: string, options?: Partial<ToastType>) => {
    return addToast({
      type: 'warning',
      title,
      message,
      duration: 6000,
      ...options
    });
  };

  const showInfo = (title: string, message: string, options?: Partial<ToastType>) => {
    return addToast({
      type: 'info',
      title,
      message,
      duration: 5000,
      ...options
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showError,
    showSuccess,
    showWarning,
    showInfo
  };
};

export default ToastNotification;