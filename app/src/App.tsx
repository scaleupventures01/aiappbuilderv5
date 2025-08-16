import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DesktopLayout } from './components/layout/DesktopLayout';
import { Dashboard } from './views/Dashboard';
import { TradingView } from './views/TradingView';
import { PsychologyCoaching } from './views/PsychologyCoaching';
import { TrainingTrades } from './views/TrainingTrades';
import { TradeHistory } from './views/TradeHistory';
import Settings from './views/Settings';
import { ConfidenceTestPage } from './views/ConfidenceTestPage';
import { useAuthStore } from './stores/authStore';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastContainer, useToast } from './components/ui/ToastNotification';
import { ErrorBoundary } from './components/layout/ErrorBoundary';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { toasts, removeToast } = useToast();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        {!isAuthenticated ? (
          // For MVP, we'll focus on authenticated experience
          // Authentication UI can be added later
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Elite Trading Coach AI
              </h1>
              <p className="text-muted-foreground mb-8">
                Desktop-first psychology coaching for elite traders
              </p>
              <button 
                onClick={() => useAuthStore.getState().login({ email: 'demo@trader.com', id: '1' })}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Continue as Demo User
              </button>
            </div>
          </div>
        ) : (
          <DesktopLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/trading" element={<TradingView />} />
              <Route path="/psychology" element={<PsychologyCoaching />} />
              <Route path="/training" element={<TrainingTrades />} />
              <Route path="/history" element={<TradeHistory />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/confidence-test" element={<ConfidenceTestPage />} />
            </Routes>
          </DesktopLayout>
        )}
        
        {/* Global Toast Notifications */}
        <ToastContainer 
          toasts={toasts} 
          onDismiss={removeToast} 
          position="top-right"
          maxToasts={5}
        />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;