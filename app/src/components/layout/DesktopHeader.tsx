import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  User, 
  PanelRightClose,
  PanelRightOpen,
  BarChart3,
  Brain
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface DesktopHeaderProps {
  rightPanelType: 'psychology' | 'trade-context' | 'hidden';
  onRightPanelTypeChange: (type: 'psychology' | 'trade-context' | 'hidden') => void;
}

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/trading': 'Live Trading',
  '/psychology': 'Psychology Coaching',
  '/training': 'Training Trades',
  '/history': 'Trade History'
};

export function DesktopHeader({ rightPanelType, onRightPanelTypeChange }: DesktopHeaderProps) {
  const location = useLocation();
  const pageTitle = routeTitles[location.pathname] || 'Elite Trading Coach AI';

  return (
    <div className="flex items-center justify-between w-full">
      {/* Page Title and Breadcrumbs */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">
          {pageTitle}
        </h1>
        {location.pathname !== '/' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>/</span>
            <span className="capitalize">{pageTitle.toLowerCase()}</span>
          </div>
        )}
      </div>

      {/* Center - Search and Quick Actions */}
      <div className="flex items-center gap-4 flex-1 justify-center max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search trades, patterns, sessions..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="kbd text-xs">⌘K</span>
          </div>
        </div>
      </div>

      {/* Right Side - Panel Controls and User */}
      <div className="flex items-center gap-3">
        {/* Panel Toggle Controls */}
        <div className="flex items-center gap-1 border border-border rounded-lg p-1">
          <button
            onClick={() => onRightPanelTypeChange(rightPanelType === 'psychology' ? 'hidden' : 'psychology')}
            className={cn(
              "p-2 rounded text-xs font-medium transition-colors",
              rightPanelType === 'psychology' 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-accent hover:text-accent-foreground"
            )}
            title="Psychology Panel"
          >
            <Brain className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRightPanelTypeChange(rightPanelType === 'trade-context' ? 'hidden' : 'trade-context')}
            className={cn(
              "p-2 rounded text-xs font-medium transition-colors",
              rightPanelType === 'trade-context' 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-accent hover:text-accent-foreground"
            )}
            title="Trade Context Panel"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRightPanelTypeChange(rightPanelType === 'hidden' ? 'psychology' : 'hidden')}
            className="p-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
            title={rightPanelType === 'hidden' ? 'Show Panel' : 'Hide Panel'}
          >
            {rightPanelType === 'hidden' ? (
              <PanelRightOpen className="w-4 h-4" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium">Demo Trader</p>
            <p className="text-xs text-muted-foreground">Active Session</p>
          </div>
          <button className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}