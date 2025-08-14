import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MicOff, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PsychologyMessage } from './PsychologyMessage';
import { TradeContextCard } from './TradeContextCard';
import { PatternTracker } from './PatternTracker';

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

export function PsychologyPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'coach',
      content: "Hello! I'm your psychology coach. I can see you've been trading ES today. How are you feeling about your performance so far?",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      patterns: ['pre-session-check']
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentTradeContext, setCurrentTradeContext] = useState({
    activeTradesCount: 2,
    todaysPnL: 150.75,
    winRate: 0.65,
    avgHoldTime: '12m'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate coach response
    setTimeout(() => {
      const coachResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: generateCoachResponse(newMessage),
        timestamp: new Date(),
        patterns: detectPatterns(newMessage)
      };
      setMessages(prev => [...prev, coachResponse]);
    }, 1000);
  };

  const generateCoachResponse = (userInput: string): string => {
    // Simple response generation based on keywords
    if (userInput.toLowerCase().includes('stress') || userInput.toLowerCase().includes('anxiety')) {
      return "I can sense some stress in your message. Let's take a moment to address this. What specific aspect of your current trades is causing you the most concern?";
    }
    if (userInput.toLowerCase().includes('loss') || userInput.toLowerCase().includes('losing')) {
      return "Losses are part of trading. What's important is how we learn from them. Can you walk me through your decision-making process for that trade?";
    }
    return "I understand. Can you tell me more about what you're experiencing right now? I'm here to help you work through any trading psychology challenges.";
  };

  const detectPatterns = (message: string): string[] => {
    const patterns = [];
    if (message.toLowerCase().includes('stress')) patterns.push('stress-response');
    if (message.toLowerCase().includes('loss')) patterns.push('loss-processing');
    if (message.toLowerCase().includes('win')) patterns.push('success-processing');
    return patterns;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Psychology Session Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Psychology Coach</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Active Session</span>
          </div>
        </div>

        {/* Current Trade Context Summary */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-secondary/50 p-2 rounded">
            <span className="text-muted-foreground">Active Trades</span>
            <p className="font-medium">{currentTradeContext.activeTradesCount}</p>
          </div>
          <div className={cn(
            "p-2 rounded",
            currentTradeContext.todaysPnL >= 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
          )}>
            <span className="text-muted-foreground">Today's P&L</span>
            <p className="font-medium">
              {currentTradeContext.todaysPnL >= 0 ? '+' : ''}${currentTradeContext.todaysPnL}
            </p>
          </div>
        </div>
      </div>

      {/* Pattern Tracker */}
      <div className="p-4 border-b border-border">
        <PatternTracker />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <PsychologyMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button className="p-2 text-xs bg-secondary/50 hover:bg-secondary rounded transition-colors text-left">
            💭 "I'm feeling anxious about this position"
          </button>
          <button className="p-2 text-xs bg-secondary/50 hover:bg-secondary rounded transition-colors text-left">
            📈 "Let's review my last trade"
          </button>
        </div>

        {/* Message Input */}
        <div className="relative">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you're feeling or thinking about your trades..."
            className="w-full p-3 pr-12 bg-background border border-border rounded-lg resize-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            rows={3}
          />
          
          {/* Input Controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              onClick={() => setIsListening(!isListening)}
              className={cn(
                "p-1.5 rounded transition-colors",
                isListening 
                  ? "bg-red-500 text-white" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              title={isListening ? "Stop voice input" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={cn(
                "p-1.5 rounded transition-colors",
                newMessage.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Usage Hint */}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press <span className="kbd">Enter</span> to send, <span className="kbd">Shift+Enter</span> for new line
        </p>
      </div>
    </div>
  );
}