import React from 'react';
import { BarChart3, TrendingUp, Brain, Target, DollarSign, Clock } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Trading Dashboard</h1>
        <p className="text-muted-foreground">
          Your complete trading performance and psychology overview
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's P&L</p>
              <p className="text-2xl font-bold text-green-500">+$1,247.50</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-2xl font-bold text-foreground">68.5%</p>
            </div>
            <Target className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Trades</p>
              <p className="text-2xl font-bold text-foreground">3</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Psychology Score</p>
              <p className="text-2xl font-bold text-foreground">B+</p>
            </div>
            <Brain className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Quick Trade Entry</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Log your next trade with full psychology context
          </p>
          <button className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
            New Trade Entry
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Psychology Session</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start a coaching session to work through trading challenges
          </p>
          <button className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-lg hover:bg-secondary/80 transition-colors">
            Start Coaching
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Training Scenario</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Practice with realistic market scenarios
          </p>
          <button className="w-full bg-accent text-accent-foreground py-2 px-4 rounded-lg hover:bg-accent/80 transition-colors">
            Start Training
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">ES Long Position Closed</p>
              <p className="text-xs text-muted-foreground">+$325.50 • 15 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <Brain className="w-4 h-4 text-purple-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Psychology Session Completed</p>
              <p className="text-xs text-muted-foreground">Worked on revenge trading patterns • 1 hour ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <Target className="w-4 h-4 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Training Scenario Completed</p>
              <p className="text-xs text-muted-foreground">Bull Flag Pattern • 2 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}