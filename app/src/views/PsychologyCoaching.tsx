import React from 'react';
import { ChatContainer } from '../components/chat/ChatContainer';
import { TradeAnalysisErrorBoundary } from '../components/chat/TradeAnalysisErrorBoundary';

export function PsychologyCoaching() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">AI Trading Coach</h1>
        <p className="text-muted-foreground">
          Get personalized trading psychology coaching and market insights
        </p>
      </div>
      
      <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden">
        <TradeAnalysisErrorBoundary context="chat">
          <ChatContainer className="h-full" />
        </TradeAnalysisErrorBoundary>
      </div>
    </div>
  );
}