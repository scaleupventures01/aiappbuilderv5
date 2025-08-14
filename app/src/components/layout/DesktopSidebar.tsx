import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Brain, 
  Target, 
  History, 
  Settings,
  TrendingUp,
  Trophy,
  BookOpen,
  Keyboard
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: BarChart3,
    description: 'Performance overview',
    shortcut: '⌘D'
  },
  {
    name: 'Live Trading',
    href: '/trading',
    icon: TrendingUp,
    description: 'Active trading interface',
    shortcut: '⌘T'
  },
  {
    name: 'Psychology Coaching',
    href: '/psychology',
    icon: Brain,
    description: 'Mental performance coaching',
    shortcut: '⌘P'
  },
  {
    name: 'Training Trades',
    href: '/training',
    icon: Target,
    description: 'Practice scenarios',
    shortcut: '⌘R'
  },
  {
    name: 'Trade History',
    href: '/history',
    icon: History,
    description: 'Historical performance',
    shortcut: '⌘H'
  }
];

const quickActions = [
  {
    name: 'Quick Trade Entry',
    icon: TrendingUp,
    shortcut: '⌘⇧T',
    action: () => console.log('Quick trade entry')
  },
  {
    name: 'Start Psychology Session',
    icon: Brain,
    shortcut: '⌘⇧P',
    action: () => console.log('Start psychology session')
  },
  {
    name: 'Begin Training Scenario',
    icon: Trophy,
    shortcut: '⌘⇧R',
    action: () => console.log('Begin training')
  }
];

export function DesktopSidebar() {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Elite Coach</h1>
            <p className="text-xs text-muted-foreground">Trading Psychology AI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Icon className="w-5 h-5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <span className="kbd text-xs">{item.shortcut}</span>
                  </div>
                  <p className={cn(
                    "text-xs mt-0.5",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    {item.description}
                  </p>
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              
              return (
                <button
                  key={action.name}
                  onClick={action.action}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{action.name}</span>
                  <span className="kbd text-xs">{action.shortcut}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-8 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Keyboard className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Keyboard Navigation</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Press <span className="kbd">?</span> to view all shortcuts
          </p>
        </div>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-border">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
}