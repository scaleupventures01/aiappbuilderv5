import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TradeContext {
  tradeId: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice?: number;
  pnl?: number;
}

interface TradeContextCardProps {
  tradeContext: TradeContext;
  variant?: 'default' | 'compact';
}

export function TradeContextCard({ tradeContext, variant = 'default' }: TradeContextCardProps) {
  const isProfit = (tradeContext.pnl ?? 0) >= 0;

  return (
    <div className={cn(
      "border border-border rounded-lg",
      variant === 'compact' ? "p-2" : "p-3"
    )}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          {tradeContext.side === 'long' ? (
            <TrendingUp className="w-3 h-3 text-green-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
          <span className="text-xs font-medium">
            {tradeContext.symbol} {tradeContext.side.toUpperCase()}
          </span>
        </div>
        {tradeContext.pnl !== undefined && (
          <span className={cn(
            "text-xs font-medium",
            isProfit ? "text-green-500" : "text-red-500"
          )}>
            {isProfit ? '+' : ''}${tradeContext.pnl}
          </span>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        Entry: ${tradeContext.entryPrice}
        {tradeContext.currentPrice && (
          <> • Current: ${tradeContext.currentPrice}</>
        )}
      </div>
    </div>
  );
}