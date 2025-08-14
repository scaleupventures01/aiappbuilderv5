import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopHeader } from './DesktopHeader';
import { PsychologyPanel } from '../psychology/PsychologyPanel';
import { TradeContextPanel } from '../trading/TradeContextPanel';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  const location = useLocation();
  const [rightPanelType, setRightPanelType] = useState<'psychology' | 'trade-context' | 'hidden'>('psychology');

  // Determine which right panel to show based on current route
  const getRightPanelContent = () => {
    switch (rightPanelType) {
      case 'psychology':
        return <PsychologyPanel />;
      case 'trade-context':
        return <TradeContextPanel />;
      case 'hidden':
        return null;
      default:
        return <PsychologyPanel />;
    }
  };

  const isPsychologyRoute = location.pathname === '/psychology';
  const isTradingRoute = location.pathname === '/trading' || location.pathname === '/training';

  return (
    <div className="desktop-layout">
      {/* Desktop Sidebar */}
      <aside className="desktop-sidebar">
        <DesktopSidebar />
      </aside>

      {/* Desktop Header */}
      <header className="desktop-header">
        <DesktopHeader 
          rightPanelType={rightPanelType}
          onRightPanelTypeChange={setRightPanelType}
        />
      </header>

      {/* Main Content Area */}
      <main className="desktop-main">
        <div className="h-full p-6">
          {children}
        </div>
      </main>

      {/* Right Panel Header */}
      {rightPanelType !== 'hidden' && (
        <header className="desktop-chat-header">
          <div className="flex items-center justify-between w-full">
            <h3 className="font-semibold text-sm">
              {rightPanelType === 'psychology' ? 'Psychology Coach' : 'Trade Context'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRightPanelType(rightPanelType === 'psychology' ? 'trade-context' : 'psychology')}
                className="p-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Switch panel"
              >
                Switch
              </button>
              <button
                onClick={() => setRightPanelType('hidden')}
                className="p-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Hide panel"
              >
                Hide
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Right Panel Content */}
      {rightPanelType !== 'hidden' && (
        <aside className="desktop-chat-panel">
          {getRightPanelContent()}
        </aside>
      )}
    </div>
  );
}