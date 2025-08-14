import React from 'react';
import { TrendingUp, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Pattern {
  id: string;
  name: string;
  frequency: number;
  trend: 'improving' | 'declining' | 'stable';
  lastOccurrence: string;
  severity: 'low' | 'medium' | 'high';
}

const currentPatterns: Pattern[] = [
  {
    id: '1',
    name: 'Revenge Trading',
    frequency: 3,
    trend: 'declining',
    lastOccurrence: '2 days ago',
    severity: 'medium'
  },
  {
    id: '2',
    name: 'FOMO Entries',
    frequency: 7,
    trend: 'improving',
    lastOccurrence: '5 hours ago',
    severity: 'high'
  },
  {
    id: '3',
    name: 'Early Exits',
    frequency: 12,
    trend: 'stable',
    lastOccurrence: '1 hour ago',
    severity: 'medium'
  }
];

export function PatternTracker() {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'declining':
        return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
      default:
        return <BarChart3 className="w-3 h-3 text-yellow-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-green-500 bg-green-500/10 border-green-500/20';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Target className="w-4 h-4" />
          Pattern Tracker
        </h4>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-2">
        {currentPatterns.map((pattern) => (
          <div
            key={pattern.id}
            className={cn(
              "p-2 rounded border",
              getSeverityColor(pattern.severity)
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{pattern.name}</span>
                {getTrendIcon(pattern.trend)}
              </div>
              <span className="text-xs opacity-75">
                {pattern.frequency}x
              </span>
            </div>
            <div className="text-xs opacity-75">
              Last: {pattern.lastOccurrence}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full mt-3 p-2 text-xs bg-secondary/50 hover:bg-secondary rounded transition-colors">
        Start Pattern Analysis Session
      </button>
    </div>
  );
}