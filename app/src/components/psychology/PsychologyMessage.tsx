import React from 'react';
import { Brain, User, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  type: 'user' | 'coach';
  content: string;
  timestamp: Date;
  tradeContext?: {
    tradeId: string;
    symbol: string;
    side: 'long' | 'short';
    entryPrice: number;
    currentPrice?: number;
    pnl?: number;
  };
  patterns?: string[];
}

interface PsychologyMessageProps {
  message: Message;
}

export function PsychologyMessage({ message }: PsychologyMessageProps) {
  const isCoach = message.type === 'coach';

  return (
    <div className={cn(
      "flex gap-3",
      isCoach ? "justify-start" : "justify-end"
    )}>
      {/* Avatar */}
      {isCoach && (
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "max-w-[280px] rounded-lg p-3",
        isCoach 
          ? "bg-card border border-border" 
          : "bg-primary text-primary-foreground"
      )}>
        {/* Trade Context Card (if present) */}
        {message.tradeContext && (
          <div className={cn(
            "mb-3 p-2 rounded border",
            isCoach 
              ? "bg-secondary/50 border-border" 
              : "bg-primary-foreground/10 border-primary-foreground/20"
          )}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                {message.tradeContext.side === 'long' ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className="text-xs font-medium">
                  {message.tradeContext.symbol} {message.tradeContext.side.toUpperCase()}
                </span>
              </div>
              {message.tradeContext.pnl !== undefined && (
                <span className={cn(
                  "text-xs font-medium",
                  message.tradeContext.pnl >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {message.tradeContext.pnl >= 0 ? '+' : ''}${message.tradeContext.pnl}
                </span>
              )}
            </div>
            <div className="text-xs opacity-75">
              Entry: ${message.tradeContext.entryPrice}
              {message.tradeContext.currentPrice && (
                <> • Current: ${message.tradeContext.currentPrice}</>
              )}
            </div>
          </div>
        )}

        {/* Message Text */}
        <p className="text-sm leading-relaxed">{message.content}</p>

        {/* Patterns (for coach messages) */}
        {isCoach && message.patterns && message.patterns.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.patterns.map((pattern) => (
              <span
                key={pattern}
                className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full"
              >
                {pattern.replace('-', ' ').toLowerCase()}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={cn(
          "flex items-center gap-1 mt-2 text-xs",
          isCoach ? "text-muted-foreground" : "text-primary-foreground/70"
        )}>
          <Clock className="w-3 h-3" />
          <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
        </div>
      </div>

      {/* User Avatar */}
      {!isCoach && (
        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}