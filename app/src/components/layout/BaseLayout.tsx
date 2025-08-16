import React, { useState, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import ErrorBoundary from './ErrorBoundary';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface BaseLayoutProps {
  children?: React.ReactNode;
}

const BaseLayoutComponent: React.FC<BaseLayoutProps> = ({ children }) => {
  usePerformanceMonitor('BaseLayout');
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    // Log to monitoring service in production
    console.error('Layout Error:', error, errorInfo);
    // TODO: Integrate with error tracking service (e.g., Sentry)
  }, []);

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Memoize sidebar fallback to prevent recreation
  const sidebarFallback = useMemo(() => (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">Navigation temporarily unavailable</div>
    </div>
  ), []);

  // Memoize header fallback to prevent recreation
  const headerFallback = useMemo(() => (
    <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-16 flex items-center px-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">Header temporarily unavailable</div>
    </header>
  ), []);

  // Memoize breadcrumb fallback to prevent recreation
  const breadcrumbFallback = useMemo(() => (
    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Breadcrumbs temporarily unavailable</div>
  ), []);

  return (
    <ErrorBoundary onError={handleError}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Skip links for accessibility */}
        <div className="sr-only">
          <a 
            href="#main-content" 
            className="skip-link"
            onFocus={(e) => e.currentTarget.classList.remove('sr-only')}
            onBlur={(e) => e.currentTarget.classList.add('sr-only')}
          >
            Skip to main content
          </a>
          <a 
            href="#navigation" 
            className="skip-link"
            onFocus={(e) => e.currentTarget.classList.remove('sr-only')}
            onBlur={(e) => e.currentTarget.classList.add('sr-only')}
          >
            Skip to navigation
          </a>
        </div>

        {/* Sidebar with error boundary */}
        <ErrorBoundary fallback={sidebarFallback}>
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={handleSidebarClose} 
          />
        </ErrorBoundary>

        {/* Main content area */}
        <div className="lg:pl-64">
          {/* Header with error boundary */}
          <ErrorBoundary fallback={headerFallback}>
            <Header onMenuClick={handleMenuClick} />
          </ErrorBoundary>

          {/* Page content with error boundary */}
          <ErrorBoundary>
            <main 
              id="main-content" 
              className="flex-1 px-4 py-6 sm:px-6 lg:px-8" 
              role="main"
              aria-label="Main content"
              tabIndex={-1}
            >
              <ErrorBoundary fallback={breadcrumbFallback}>
                <Breadcrumbs />
              </ErrorBoundary>
              <div className="mx-auto max-w-7xl">
                <ErrorBoundary>
                  {children || <Outlet />}
                </ErrorBoundary>
              </div>
            </main>
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Memoize the component for performance
export const BaseLayout = React.memo(BaseLayoutComponent);

export default BaseLayout;