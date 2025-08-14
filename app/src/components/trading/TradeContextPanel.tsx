import React from 'react';
import { TrendingUp, TrendingDown, Clock, DollarSign, Target, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ActiveTrade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  entryTime: Date;
  stopLoss?: number;
  takeProfit?: number;
}

const activeTrades: ActiveTrade[] = [
  {
    id: '1',
    symbol: 'ES',
    side: 'long',
    quantity: 2,
    entryPrice: 4125.50,
    currentPrice: 4132.25,
    pnl: 337.50,
    entryTime: new Date(Date.now() - 1800000), // 30 minutes ago
    stopLoss: 4118.00,
    takeProfit: 4140.00
  },
  {
    id: '2',
    symbol: 'NQ',
    side: 'short',
    quantity: 1,
    entryPrice: 14250.75,
    currentPrice: 14245.25,
    pnl: 110.00,
    entryTime: new Date(Date.now() - 900000), // 15 minutes ago
    stopLoss: 14265.00
  }
];

export function TradeContextPanel() {
  const totalPnL = activeTrades.reduce((sum, trade) => sum + trade.pnl, 0);

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Active Trades</h3>
          <div className={cn(
            "text-sm font-medium",
            totalPnL >= 0 ? "text-green-500" : "text-red-500"
          )}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <p className="text-muted-foreground">Positions</p>
            <p className="font-medium">{activeTrades.length}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Win Rate</p>
            <p className="font-medium">68%</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Avg Hold</p>
            <p className="font-medium">22m</p>
          </div>
        </div>
      </div>

      {/* Active Trades List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTrades.map((trade) => (
          <div key={trade.id} className="border border-border rounded-lg p-3">
            {/* Trade Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {trade.side === 'long' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="font-medium text-sm">
                  {trade.symbol} {trade.side.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {trade.quantity}x
                </span>
              </div>
              <div className={cn(
                "text-sm font-medium",
                trade.pnl >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
              </div>
            </div>

            {/* Price Info */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entry:</span>
                <span>{trade.entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current:</span>
                <span>{trade.currentPrice.toFixed(2)}</span>
              </div>
              {trade.stopLoss && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stop:</span>
                  <span className="text-red-500">{trade.stopLoss.toFixed(2)}</span>
                </div>
              )}
              {trade.takeProfit && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="text-green-500">{trade.takeProfit.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Trade Duration */}
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Open for {formatTime(trade.entryTime)}</span>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-2">
              <button className="flex-1 py-1 px-2 text-xs bg-secondary hover:bg-secondary/80 rounded transition-colors">
                Modify
              </button>
              <button className="flex-1 py-1 px-2 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 rounded transition-colors">
                Close
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Psychology Context */}
      <div className="p-4 border-t border-border">
        <h4 className="text-sm font-medium mb-2">Psychology Check</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="w-3 h-3 text-yellow-500" />
            <span>High conviction on ES position</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Target className="w-3 h-3 text-green-500" />
            <span>Following plan on NQ short</span>
          </div>
        </div>
        
        <button className="w-full mt-3 py-2 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
          Start Psychology Session
        </button>
      </div>
    </div>
  );
}