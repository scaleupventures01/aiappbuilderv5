# Technical Architecture Plan
## Elite Trading Coach AI - Complete System Design

**Document Version**: 1.0  
**Date**: December 2024  
**Authority**: Master technical document for Phase 0 development  
**Purpose**: Define complete architecture for Founder MVP Sprint (27 days)

---

## 🎯 Architecture Objectives

**Primary Goal**: Build a chat-first trading coach that works on Day 1 and scales incrementally over 27 days

**Key Requirements**:
- Real-time chat interface with image uploads
- GPT-4 Vision integration for trade analysis
- Enhanced psychology coaching with trade context
- Training trade system with database storage
- Desktop-first responsive design
- Daily deployments for founder testing

---

## 🏗️ High-Level System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  External APIs  │
│   (React SPA)   │◄──►│  (Node.js)      │◄──►│  (OpenAI GPT-4) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   PostgreSQL    │              │
         │              │   Database      │              │
         │              └─────────────────┘              │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│  Static Assets  │                            │ Image Storage   │
│   (Railway)     │                            │  (Cloudinary)   │
└─────────────────┘                            └─────────────────┘
```

**Architecture Principles**:
- **Chat-First Design**: Everything revolves around conversation interface
- **Real-time Communication**: WebSocket connections for instant messaging
- **Incremental Development**: Each sub-milestone builds on previous work
- **Desktop-First Responsive**: Optimized for desktop with responsive design
- **Psychology Coaching Integration**: Trade-aware coaching with performance context
- **Training Trade Support**: Same data structure for training and real trades
- **Cost-Conscious**: Optimize for MVP budget constraints

---

## 🛠️ Technology Stack

### Frontend Stack
```typescript
// Core Framework
React 18 + TypeScript + Vite
TailwindCSS for styling
Framer Motion for animations

// Real-time Communication
Socket.io-client for WebSocket connections
Zustand for lightweight state management
React Query for server state

// UI Components
React Hook Form for forms
React Dropzone for file uploads
Date-fns for time formatting

// Desktop Optimization
Desktop-first responsive design
Keyboard shortcuts and navigation
CSS Grid layout with fixed panels
```

### Backend Stack
```javascript
// Core Server
Node.js + Express.js
Socket.io for WebSocket handling
TypeScript for type safety

// Database & ORM
PostgreSQL (managed by Railway)
Native pg driver (simple, fast)

// External Services
OpenAI SDK for GPT-4 Vision
Cloudinary for image processing
JWT for authentication

// Infrastructure
Railway for hosting
GitHub Actions for CI/CD
```

### Development Tools
```yaml
Testing: Vitest + Playwright
Linting: ESLint + Prettier
Monitoring: Winston logging
Security: Helmet.js + Rate limiting
```

---

## 📊 Database Schema Design

### Core Tables for MVP
```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- Conversation Management
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255), -- Auto-generated from first message
  mode VARCHAR(20) DEFAULT 'analysis' CHECK (mode IN ('analysis', 'psychology')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE,
  
  -- Indexes for performance
  INDEX idx_conversations_user_id (user_id),
  INDEX idx_conversations_created_at (created_at DESC),
  INDEX idx_conversations_updated_at (updated_at DESC)
);

-- Messages with Chat History
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES messages(id), -- For AI responses
  
  -- Message content
  content TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'ai', 'system')),
  
  -- AI-specific fields
  verdict VARCHAR(20) CHECK (verdict IN ('diamond', 'fire', 'skull')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  mode VARCHAR(20) DEFAULT 'trade' CHECK (mode IN ('trade', 'psychology')),
  
  -- File attachments
  image_url TEXT,
  image_filename VARCHAR(255),
  image_size INTEGER,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  error BOOLEAN DEFAULT FALSE,
  
  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED,
  
  -- Indexes
  INDEX idx_messages_conversation_id (conversation_id),
  INDEX idx_messages_user_id (user_id),
  INDEX idx_messages_created_at (created_at DESC),
  INDEX idx_messages_type (type),
  INDEX idx_messages_search (search_vector) USING gin
);

-- Enhanced Trade Logging with Training Support
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  message_id UUID REFERENCES messages(id), -- Link to analysis message
  
  -- Trade details
  instrument VARCHAR(10) NOT NULL, -- ES, NQ, etc.
  direction VARCHAR(5) NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price DECIMAL(10,2) NOT NULL,
  exit_price DECIMAL(10,2),
  position_size INTEGER NOT NULL,
  entry_time TIMESTAMP NOT NULL,
  exit_time TIMESTAMP,
  
  -- P&L calculation
  pnl DECIMAL(10,2),
  pnl_percentage DECIMAL(5,2),
  
  -- Training vs Real trade support
  trade_type VARCHAR(20) DEFAULT 'real' CHECK (trade_type IN ('real', 'training')),
  scenario_id VARCHAR(50), -- For training scenarios
  training_objective TEXT, -- What this training trade teaches
  
  -- Psychology coaching integration
  coaching_notes TEXT,
  emotional_state VARCHAR(50), -- 'confident', 'anxious', 'revenge', 'disciplined'
  pattern_tags JSONB, -- Array of pattern identifiers
  
  -- Trade plan reference
  trade_plan_id UUID REFERENCES trade_plans(id),
  plan_adherence_score INTEGER CHECK (plan_adherence_score >= 0 AND plan_adherence_score <= 100),
  
  -- Status and metadata
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_trades_user_id (user_id),
  INDEX idx_trades_entry_time (entry_time DESC),
  INDEX idx_trades_instrument (instrument),
  INDEX idx_trades_pnl (pnl DESC),
  INDEX idx_trades_training ON trades(user_id, trade_type, created_at DESC) WHERE trade_type = 'training',
  INDEX idx_trades_real ON trades(user_id, trade_type, created_at DESC) WHERE trade_type = 'real'
);

-- Trade Plans (Sub-Milestone 9)
CREATE TABLE trade_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  
  -- Plan details
  title VARCHAR(255) NOT NULL,
  setup_description TEXT NOT NULL,
  entry_criteria JSONB NOT NULL, -- Array of criteria strings
  stop_loss_level DECIMAL(10,2) NOT NULL,
  stop_loss_reasoning TEXT,
  take_profit_targets JSONB NOT NULL, -- Array of price targets
  position_size INTEGER NOT NULL,
  risk_amount DECIMAL(10,2) NOT NULL,
  invalidation_criteria TEXT,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled', 'expired')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Indexes
  INDEX idx_trade_plans_user_id (user_id),
  INDEX idx_trade_plans_status (status),
  INDEX idx_trade_plans_created_at (created_at DESC)
);

-- Coaching Sessions with Trade Context
CREATE TABLE coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  session_type VARCHAR(20) DEFAULT 'psychology' CHECK (session_type IN ('psychology', 'discipline', 'risk_management')),
  patterns_identified JSONB, -- Store identified emotional/behavioral patterns
  recommendations_given JSONB, -- Store coaching recommendations
  trade_context JSONB, -- Snapshot of relevant trade data at time of coaching
  effectiveness_score INTEGER CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_coaching_sessions_user_id (user_id),
  INDEX idx_coaching_sessions_type (session_type),
  INDEX idx_coaching_sessions_created_at (created_at DESC)
);

-- Coaching Patterns for Memory System
CREATE TABLE coaching_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50) NOT NULL, -- 'revenge_trading', 'position_size_violation', 'fomo', etc.
  pattern_description TEXT NOT NULL,
  first_identified TIMESTAMP DEFAULT NOW(),
  last_occurrence TIMESTAMP DEFAULT NOW(),
  frequency_count INTEGER DEFAULT 1,
  severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
  resolution_status VARCHAR(20) DEFAULT 'active' CHECK (resolution_status IN ('active', 'improving', 'resolved')),
  
  INDEX idx_coaching_patterns_user_id (user_id),
  INDEX idx_coaching_patterns_type (pattern_type),
  UNIQUE(user_id, pattern_type)
);

-- Training Scenarios
CREATE TABLE training_scenarios (
  id VARCHAR(50) PRIMARY KEY, -- 'breakout_fakeout', 'momentum_continuation', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  chart_url TEXT NOT NULL,
  setup_description TEXT NOT NULL,
  learning_objectives JSONB NOT NULL, -- Array of learning goals
  ideal_entry_price DECIMAL(10,2),
  ideal_stop_loss DECIMAL(10,2),
  ideal_targets JSONB, -- Array of target prices
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_training_scenarios_difficulty (difficulty_level)
);

-- Tutorial Progress Tracking
CREATE TABLE tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tutorial_type VARCHAR(50) NOT NULL, -- 'training_trades', 'psychology_demo'
  step_number INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, tutorial_type, step_number)
);
```

### Database Performance Optimizations
```sql
-- Additional indexes for specific queries
CREATE INDEX idx_messages_conversation_recent ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_trades_user_recent ON trades(user_id, entry_time DESC);
CREATE INDEX idx_user_active_conversations ON conversations(user_id, updated_at DESC) WHERE archived = FALSE;

-- Partial indexes for common filters
CREATE INDEX idx_messages_ai_responses ON messages(conversation_id, created_at) WHERE type = 'ai';
CREATE INDEX idx_open_trades ON trades(user_id, entry_time DESC) WHERE status = 'open';
CREATE INDEX idx_pending_plans ON trade_plans(user_id, created_at DESC) WHERE status = 'pending';
```

---

## 🔄 Real-Time Chat Infrastructure

### WebSocket Architecture with Socket.IO
```javascript
// server/websocket-server.mjs
import { Server } from 'socket.io';
import { authenticateSocket } from './middleware/auth.mjs';
import { queueAIAnalysis } from './services/ai-queue.mjs';
import { saveMessage } from './db/conversations.mjs';

export function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'], // Fallback support
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`);
    
    // Handle new messages
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, imageUrl, mode = 'analysis' } = data;
        
        // Save user message
        const message = await saveMessage({
          userId: socket.userId,
          conversationId,
          content,
          imageUrl,
          type: 'user'
        });

        // Confirm message received
        socket.emit('message_saved', message);
        
        // Queue AI processing
        if (content || imageUrl) {
          socket.emit('ai_thinking', { conversationId });
          await queueAIAnalysis(socket.userId, message.id, imageUrl, content, mode);
        }
      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    // Handle conversation management
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle mode switching
    socket.on('switch_mode', async (data) => {
      const { mode } = data;
      await updateConversationContext(socket.userId, { mode });
      socket.emit('mode_changed', { mode });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      updateConversationContext(socket.userId, {
        onlineStatus: 'offline',
        lastSeen: new Date().toISOString()
      });
    });
  });

  return io;
}
```

### Message Queue for AI Processing
```javascript
// services/ai-queue.mjs
import Bull from 'bull';
import { processTradeAnalysis, processPsychologyCoaching } from './ai-processor.mjs';
import { saveMessage } from '../db/conversations.mjs';

export const aiAnalysisQueue = new Bull('ai-analysis', {
  redis: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// AI Analysis Worker
aiAnalysisQueue.process('trade-analysis', async (job) => {
  const { userId, messageId, imageUrl, content, mode } = job.data;
  
  try {
    let response;
    
    if (mode === 'psychology') {
      response = await processPsychologyCoaching(content, userId);
    } else {
      response = await processTradeAnalysis(imageUrl, content, userId);
    }
    
    // Save AI response
    const aiMessage = await saveMessage({
      userId,
      content: response.content,
      type: 'ai',
      verdict: response.verdict,
      confidence: response.confidence,
      parentMessageId: messageId
    });
    
    // Send to user via WebSocket
    global.io.to(`user:${userId}`).emit('ai_response', aiMessage);
    
    return aiMessage;
  } catch (error) {
    console.error('AI processing failed:', error);
    
    // Send error message to user
    const errorMessage = await saveMessage({
      userId,
      content: "I'm experiencing technical difficulties. Please try again in a moment.",
      type: 'ai',
      error: true
    });
    
    global.io.to(`user:${userId}`).emit('ai_response', errorMessage);
    throw error;
  }
});

export async function queueAIAnalysis(userId, messageId, imageUrl, content, mode = 'trade') {
  return aiAnalysisQueue.add('trade-analysis', {
    userId,
    messageId,
    imageUrl,
    content,
    mode
  }, {
    priority: mode === 'psychology' ? 1 : 5, // Psychology gets higher priority
    delay: 0
  });
}
```

---

## 🎨 Frontend Architecture

### React Component Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── DesktopLayout.tsx         # Main desktop grid layout
│   │   ├── DesktopSidebar.tsx        # Navigation with keyboard shortcuts
│   │   └── DesktopHeader.tsx         # Header with panel controls
│   ├── chat/
│   │   ├── ChatContainer.tsx         # Desktop-optimized chat wrapper
│   │   ├── MessageList.tsx           # Enhanced with trade context display
│   │   ├── MessageInput.tsx          # Desktop-focused input with trade context
│   │   ├── Message.tsx               # Individual message component
│   │   ├── VerdictCard.tsx          # Diamond/Fire/Skull display
│   │   ├── ImagePreview.tsx         # Chart image display
│   │   ├── TypingIndicator.tsx      # AI thinking indicator
│   │   └── ModeSelector.tsx         # Analysis/Psychology toggle
│   ├── psychology/
│   │   ├── PsychologyPanel.tsx      # Trade-aware psychology interface
│   │   ├── PsychologyMessage.tsx    # Message components with trade context
│   │   ├── PatternTracker.tsx       # Visual pattern identification
│   │   ├── TradeContextCard.tsx     # Trade reference cards
│   │   ├── CoachingDashboard.tsx    # Overview of coaching progress
│   │   ├── CoachingMemoryDisplay.tsx # Shows identified patterns and progress
│   │   └── CoachingInsights.tsx     # AI insights with trade context
│   ├── training/
│   │   ├── TrainingMode.tsx         # Training trade interface
│   │   ├── ScenarioSelector.tsx     # Choose training scenarios
│   │   ├── TrainingProgress.tsx     # Track training completion
│   │   ├── TrainingComparison.tsx   # Compare training vs real performance
│   │   ├── FakeTradeTutorial.tsx    # Interactive tutorial
│   │   └── TutorialStep.tsx         # Individual tutorial steps
│   ├── trading/
│   │   ├── TradeContextPanel.tsx    # Active trades with psychology insights
│   │   ├── TradeHistory.tsx         # Trade log view with training filter
│   │   ├── TradeCard.tsx            # Individual trade display
│   │   ├── TradeAnalytics.tsx       # Performance metrics (training vs real)
│   │   ├── TradeLogForm.tsx         # Quick trade logging
│   │   └── TradePlanForm.tsx        # Trade plan creation
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx        # Desktop trading dashboard
│   │   │   ├── PerformanceCard.tsx  # P&L display with training comparison
│   │   │   └── ActiveTrades.tsx     # Current positions
│   │   └── forms/
│   │       └── FormComponents.tsx   # Reusable form elements
│   └── common/
│       ├── Button.tsx               # Reusable button component
│       ├── Modal.tsx                # Modal wrapper
│       ├── LoadingSpinner.tsx       # Loading states
│       ├── ErrorBoundary.tsx        # Error handling
│       └── ProgressiveImage.tsx     # Optimized image loading
```

### State Management with Zustand
```typescript
// stores/useChatStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatState {
  messages: Message[];
  currentConversationId: string | null;
  currentMode: 'analysis' | 'psychology';
  isLoading: boolean;
  isConnected: boolean;
  typingIndicator: boolean;
}

interface ChatActions {
  addMessage: (message: Message) => void;
  setMode: (mode: 'analysis' | 'psychology') => void;
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  setTyping: (typing: boolean) => void;
  clearMessages: () => void;
  loadConversationHistory: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, image?: File) => Promise<void>;
}

export const useChatStore = create<ChatState & ChatActions>()(
  persist(
    (set, get) => ({
      // State
      messages: [],
      currentConversationId: null,
      currentMode: 'analysis',
      isLoading: false,
      isConnected: false,
      typingIndicator: false,
      
      // Actions
      addMessage: (message) => {
        set(state => ({
          messages: [...state.messages, message]
        }));
      },
      
      setMode: (mode) => {
        set({ currentMode: mode });
        // Emit to socket
        get().socket?.emit('switch_mode', { mode });
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
      setConnected: (connected) => set({ isConnected: connected }),
      setTyping: (typing) => set({ typingIndicator: typing }),
      clearMessages: () => set({ messages: [] }),
      
      loadConversationHistory: async (conversationId) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`/api/conversations/${conversationId}/messages`);
          const data = await response.json();
          set({ 
            messages: data.messages,
            currentConversationId: conversationId,
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to load conversation:', error);
          set({ isLoading: false });
        }
      },
      
      sendMessage: async (content, image) => {
        const socket = get().socket;
        if (!socket) return;
        
        const messageData = {
          conversationId: get().currentConversationId,
          content,
          imageUrl: image ? await uploadImage(image) : undefined,
          mode: get().currentMode
        };
        
        socket.emit('send_message', messageData);
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        messages: state.messages.slice(-100), // Keep last 100 messages
        currentMode: state.currentMode
      }),
    }
  )
);
```

### WebSocket Integration
```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../stores/useChatStore';

export const useWebSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { addMessage, setConnected, setTyping } = useChatStore();
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    socketRef.current = io(process.env.VITE_WEBSOCKET_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    const socket = socketRef.current;
    
    // Connection events
    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      setConnected(true);
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    });
    
    // Message events
    socket.on('message_saved', (message) => {
      // Message confirmed received by server
    });
    
    socket.on('ai_thinking', () => {
      setTyping(true);
    });
    
    socket.on('ai_response', (message) => {
      setTyping(false);
      addMessage(message);
    });
    
    socket.on('message_error', (error) => {
      console.error('Message error:', error);
      setTyping(false);
    });
    
    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, []);
  
  return socketRef.current;
};
```

---

## 🤖 AI Integration Architecture

### OpenAI GPT-4 Vision Integration
```javascript
// services/ai-processor.mjs
import OpenAI from 'openai';
import { getCachedResponse, setCachedResponse } from './ai-cache.mjs';
import { trackAICosts } from './cost-tracker.mjs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3
});

export async function processTradeAnalysis(imageUrl, textContent, userId) {
  try {
    // Check cache first
    const cacheKey = generateCacheKey(imageUrl, textContent);
    const cached = await getCachedResponse(cacheKey);
    if (cached) return cached;
    
    // Build comprehensive context with trade history
    const context = await buildTradeContext(userId);
    const prompt = buildTradeAnalysisPrompt(textContent, context);
    
    const messages = [
      {
        role: "system",
        content: `You are an expert trading coach analyzing trade setups with full context of the trader's history.
        
        TRADER CONTEXT: ${JSON.stringify(context)}
        
        Provide analysis in this format:
        
        Verdict: [Diamond/Fire/Skull]
        Confidence: [0-100]%
        
        Analysis: [Detailed analysis referencing their patterns and performance]
        
        Key Points:
        • [Point 1 - reference their trading history if relevant]
        • [Point 2 - consider their psychology patterns]
        • [Point 3 - relate to their risk management]
        
        Psychology Note: [Brief note about emotional/discipline factors based on their patterns]`
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...(imageUrl ? [{ type: "image_url", image_url: { url: imageUrl } }] : [])
        ]
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages,
      max_tokens: 600,
      temperature: 0.3 // Lower temperature for more consistent analysis
    });

    const result = parseTradeAnalysisResponse(response.choices[0].message.content);
    
    // Store coaching insights if any patterns were identified
    await storeTradeAnalysisInsights(userId, result, context);
    
    // Track costs
    await trackAICosts(response.usage, userId);
    
    // Cache result
    await setCachedResponse(cacheKey, result, 3600); // 1 hour cache
    
    return result;
  } catch (error) {
    console.error('Trade analysis failed:', error);
    throw new Error('Failed to analyze trade setup');
  }
}

export async function processPsychologyCoaching(content, userId, conversationId) {
  try {
    // Pull comprehensive trade context for psychology coaching
    const tradeContext = await getUserTradeContext(userId);
    const coachingHistory = await getCoachingHistory(userId);
    const identifiedPatterns = await getUserPatterns(userId);
    
    // Build trade-aware psychology prompt
    const prompt = buildTradeAwarePsychologyPrompt(
      content, 
      tradeContext, 
      coachingHistory, 
      identifiedPatterns
    );
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a professional trading psychology coach with full context of the trader's history. 
          
          TRADE CONTEXT: ${JSON.stringify(tradeContext)}
          COACHING HISTORY: ${JSON.stringify(coachingHistory)}
          PATTERNS: ${JSON.stringify(identifiedPatterns)}
          
          Provide specific, actionable coaching that references their actual trades and patterns.
          Focus on trading psychology (not general emotional support). Reference specific trades,
          performance patterns, and risk management behaviors. Help improve trading discipline
          and emotional control in trading contexts.`
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.7
    });

    const result = {
      content: response.choices[0].message.content,
      type: 'psychology',
      emotional_analysis: detectEmotionalState(content),
      suggestions: extractSuggestions(response.choices[0].message.content),
      patterns_addressed: extractAddressedPatterns(response.choices[0].message.content)
    };
    
    // Store coaching session with trade context
    await storeCoachingSession({
      userId,
      conversationId,
      content: result.content,
      tradeContext: tradeContext,
      patternsAddressed: result.patterns_addressed
    });
    
    await trackAICosts(response.usage, userId);
    
    return result;
  } catch (error) {
    console.error('Psychology coaching failed:', error);
    throw new Error('Failed to provide coaching');
  }
}

function parseTradeAnalysisResponse(content) {
  const verdictMatch = content.match(/Verdict:\s*(Diamond|Fire|Skull)/i);
  const confidenceMatch = content.match(/Confidence:\s*(\d+)%/);
  
  return {
    content,
    verdict: verdictMatch ? verdictMatch[1].toLowerCase() : 'fire',
    confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 50,
    analysis: content,
    timestamp: new Date().toISOString()
  };
}
```

### AI Cost Management
```javascript
// services/cost-tracker.mjs
const dailyCosts = new Map();
const userLimits = {
  founder: 100, // $100 per day
  beta: 10,     // $10 per day
  free: 2       // $2 per day
};

export async function trackAICosts(usage, userId) {
  const cost = calculateCost(usage);
  const today = new Date().toISOString().split('T')[0];
  const key = `${userId}:${today}`;
  
  const currentCost = dailyCosts.get(key) || 0;
  const newCost = currentCost + cost;
  
  dailyCosts.set(key, newCost);
  
  // Check limits
  const userTier = await getUserTier(userId);
  const limit = userLimits[userTier] || userLimits.free;
  
  if (newCost > limit) {
    throw new Error(`Daily AI cost limit exceeded: $${newCost.toFixed(2)}/$${limit}`);
  }
  
  // Log usage
  await logUsage(userId, usage, cost);
  
  return { cost, dailyTotal: newCost, limit };
}

function calculateCost(usage) {
  const inputCost = (usage.prompt_tokens || 0) * 0.00001; // $0.01/1K tokens
  const outputCost = (usage.completion_tokens || 0) * 0.00003; // $0.03/1K tokens
  return inputCost + outputCost;
}
```

---

## 📱 Mobile-First Architecture

### Responsive Design System
```css
/* styles/design-system.css */
:root {
  /* Spacing Scale */
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  
  /* Typography Scale */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  
  /* Colors */
  --color-bg-primary: #0F172A;
  --color-bg-secondary: #1E293B;
  --color-bg-tertiary: #334155;
  --color-text-primary: #F8FAFC;
  --color-text-secondary: #CBD5E1;
  --color-text-muted: #64748B;
  
  /* Verdict Colors */
  --color-diamond: #10B981;
  --color-fire: #F59E0B;
  --color-skull: #EF4444;
  
  /* Interactive */
  --color-primary: #3B82F6;
  --color-primary-hover: #2563EB;
  --color-danger: #EF4444;
  --color-success: #10B981;
  
  /* Mobile Safe Areas */
  --safe-area-top: env(safe-area-inset-top);
  --safe-area-bottom: env(safe-area-inset-bottom);
  --safe-area-left: env(safe-area-inset-left);
  --safe-area-right: env(safe-area-inset-right);
}

/* Mobile-first responsive utilities */
.mobile-container {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport height */
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
  padding-left: var(--safe-area-left);
  padding-right: var(--safe-area-right);
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  max-width: 100%;
}

.message-input-area {
  padding-bottom: calc(var(--safe-area-bottom) + var(--space-4));
}

/* Responsive breakpoints */
@media (min-width: 768px) {
  .chat-container {
    max-width: 768px;
    margin: 0 auto;
    border-radius: var(--space-3);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
}

@media (min-width: 1024px) {
  .chat-container {
    max-width: 1024px;
  }
}
```

### Progressive Web App Configuration
```json
// public/manifest.json
{
  "name": "Elite Trading Coach AI",
  "short_name": "Trading Coach",
  "description": "AI-powered trading coach and psychology support",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#3B82F6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["finance", "productivity"],
  "screenshots": [
    {
      "src": "/screenshots/mobile-chat.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

---

## 🚀 Deployment Infrastructure

### Railway Platform Configuration
```toml
# railway.toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"

[[services]]
name = "api"
source = "./server"

[[services]]
name = "web"
source = "./client"

[environments.staging]
variables = { NODE_ENV = "staging" }

[environments.production]
variables = { NODE_ENV = "production" }
```

### Environment Variables Setup
```bash
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=$RAILWAY_DATABASE_URL
DATABASE_SSL=true

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-vision-preview
OPENAI_MAX_TOKENS=500

# Image Storage
CLOUDINARY_CLOUD_NAME=elitetradingcoach
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# WebSocket
WEBSOCKET_URL=wss://api.elitetradingcoach.railway.app
FRONTEND_URL=https://app.elitetradingcoach.railway.app

# Security
JWT_SECRET=...
ALLOWED_ORIGINS=https://app.elitetradingcoach.railway.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Cost Controls
MAX_DAILY_AI_COST_FOUNDER=100
MAX_DAILY_AI_COST_BETA=10
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Type checking
        run: npm run type-check

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway Staging
        run: |
          npm install -g @railway/cli
          railway login --token ${{ secrets.RAILWAY_TOKEN }}
          railway deploy --service staging --environment staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway Production
        run: |
          railway deploy --service production --environment production
```

---

## 🔒 Security Architecture

### Authentication & Authorization
```javascript
// middleware/auth.mjs
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

// JWT Authentication
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Socket.IO Authentication
export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = user.id;
    socket.userEmail = user.email;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
};

// Rate Limiting
export const chatRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: 'Too many messages sent, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip
});

export const imageUploadLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 images per 5 minutes
  message: 'Too many image uploads, please wait'
});
```

### Input Validation & Sanitization
```javascript
// middleware/validation.mjs
import { body, validationResult } from 'express-validator';
import { createHash } from 'crypto';

export const validateMessage = [
  body('content')
    .optional()
    .isLength({ max: 5000 })
    .trim()
    .escape(),
  body('imageUrl')
    .optional()
    .isURL()
    .matches(/^https:\/\/res\.cloudinary\.com\//),
  body('mode')
    .optional()
    .isIn(['analysis', 'psychology']),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }
    
    // Require either content or imageUrl
    if (!req.body.content && !req.body.imageUrl) {
      return res.status(400).json({ 
        error: 'Message must contain content or image' 
      });
    }
    
    next();
  }
];

export const validateTradeData = [
  body('instrument').isIn(['ES', 'NQ', 'YM', 'RTY', 'CL', 'GC']),
  body('direction').isIn(['long', 'short']),
  body('entryPrice').isFloat({ min: 0 }),
  body('positionSize').isInt({ min: 1 }),
  body('entryTime').isISO8601()
];

// Content filtering
export function filterContent(content) {
  const inappropriatePatterns = [
    /\b(suicide|kill myself|end it all)\b/i,
    /\b(insider trading|market manipulation)\b/i,
    /\b(pump and dump)\b/i
  ];
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(content)) {
      return {
        filtered: true,
        reason: 'Content violates community guidelines',
        hash: createHash('sha256').update(content).digest('hex')
      };
    }
  }
  
  return { filtered: false, content };
}
```

---

## 📊 Monitoring & Analytics

### Application Monitoring
```javascript
// services/monitoring.mjs
import winston from 'winston';
import { performance } from 'perf_hooks';

// Structured logging
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Performance tracking
export class PerformanceTracker {
  static trackApiCall(endpoint, userId) {
    const start = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - start;
        logger.info('api_call', {
          endpoint,
          userId,
          duration_ms: Math.round(duration),
          timestamp: new Date().toISOString()
        });
        return duration;
      }
    };
  }
  
  static trackAIRequest(type, userId, tokens) {
    logger.info('ai_request', {
      type, // 'trade_analysis' or 'psychology'
      userId,
      tokens,
      timestamp: new Date().toISOString()
    });
  }
  
  static trackUserAction(action, userId, metadata = {}) {
    logger.info('user_action', {
      action,
      userId,
      metadata,
      timestamp: new Date().toISOString()
    });
  }
}

// Health check endpoint
export const healthCheck = async (req, res) => {
  try {
    // Check database connection
    const dbCheck = await checkDatabase();
    
    // Check external services
    const aiCheck = await checkOpenAI();
    const imageCheck = await checkCloudinary();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: dbCheck,
        openai: aiCheck,
        cloudinary: imageCheck
      }
    };
    
    const allHealthy = Object.values(health.services).every(s => s.status === 'healthy');
    const statusCode = allHealthy ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

async function checkDatabase() {
  try {
    await pool.query('SELECT 1');
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

### Founder-Specific Analytics
```javascript
// analytics/founder-metrics.mjs
export class FounderMetrics {
  static async trackDailyUsage(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const metrics = {
      trades_analyzed: await countTodayTrades(userId),
      psychology_sessions: await countTodayPsychology(userId),
      total_messages: await countTodayMessages(userId),
      session_duration: await calculateSessionDuration(userId),
      mobile_usage_percentage: await getMobileUsagePercentage(userId),
      feature_usage: await getFeatureUsage(userId)
    };
    
    // Store for dashboard
    await storeFounderMetrics(userId, today, metrics);
    
    return metrics;
  }
  
  static async generateDailyReport(userId) {
    const metrics = await this.trackDailyUsage(userId);
    
    return {
      summary: `Analyzed ${metrics.trades_analyzed} trades, ${metrics.psychology_sessions} psychology sessions`,
      insights: this.generateInsights(metrics),
      recommendations: this.generateRecommendations(metrics)
    };
  }
  
  static generateInsights(metrics) {
    const insights = [];
    
    if (metrics.trades_analyzed > 10) {
      insights.push('High trading activity - consider psychology support');
    }
    
    if (metrics.psychology_sessions === 0 && metrics.trades_analyzed > 5) {
      insights.push('No psychology sessions despite active trading');
    }
    
    if (metrics.mobile_usage_percentage > 70) {
      insights.push('Primarily mobile usage - ensure mobile features are optimal');
    }
    
    return insights;
  }
}
```

---

## 🎯 Development Timeline & Implementation Order

### Week 1: Foundation (Days 1-7)
**Day 1: Basic Infrastructure**
```bash
# Setup commands
railway init
npm create vite@latest client -- --template react-ts
mkdir server && cd server && npm init -y
```

**Day 2: Database & WebSocket**
```sql
-- Create basic tables
CREATE TABLE users (...);
CREATE TABLE conversations (...);
CREATE TABLE messages (...);
```

**Day 3: Chat Interface**
```typescript
// Basic ChatContainer component
// Message sending/receiving
// WebSocket connection
```

**Days 4-5: AI Integration**
```javascript
// OpenAI GPT-4 Vision setup
// Basic trade analysis
// Image upload to Cloudinary
```

**Days 6-7: Psychology Mode**
```typescript
// Mode switching
// Psychology prompts
// Emotional detection
```

### Week 2: Enhancement (Days 8-14)
**Days 8-10: Tutorial System**
```typescript
// Fake trade scenarios
// Guided onboarding
// Progress tracking
```

**Days 11-14: Memory & Search**
```sql
-- Full-text search setup
-- Conversation indexing
-- Performance optimization
```

### Week 3: Enhanced Features (Days 15-21)
**Days 15-18: Conversation Memory & Search**
```sql
-- Enhanced conversation indexing
-- Advanced search capabilities
-- Psychology coaching memory
```

**Days 19-21: Context Awareness**
```javascript
// Market hours detection
// Trading state management
// Proactive coaching features
// Training vs real trade analytics
```

### Week 4: Advanced Trading Features (Days 22-27)
**Days 22-24: Enhanced Trade Storage**
```sql
-- Training + Real trade unified storage
-- Psychology coaching integration
-- Performance comparison analytics
```

**Days 25-27: Trade Planning with Psychology**
```typescript
// Plan creation with psychology integration
// AI validation with trade context
// Psychology-aware adherence tracking
```

---

## 🔧 Quality Assurance & Testing

### Testing Strategy
```typescript
// tests/api/chat.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { testClient } from '../utils/test-client';

describe('Chat API', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  it('should send and receive messages', async () => {
    const response = await testClient
      .post('/api/messages')
      .send({
        content: 'Test trade analysis',
        conversationId: 'test-conv-id'
      })
      .expect(200);

    expect(response.body.message.content).toBe('Test trade analysis');
  });

  it('should handle image uploads', async () => {
    const response = await testClient
      .post('/api/messages')
      .attach('image', 'tests/fixtures/chart.png')
      .field('content', 'Analyze this chart')
      .expect(200);

    expect(response.body.message.imageUrl).toBeDefined();
  });
});

// tests/components/Chat.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ChatContainer } from '../src/components/chat/ChatContainer';

vi.mock('../src/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    sendMessage: vi.fn(),
    isConnected: true
  })
}));

describe('ChatContainer', () => {
  it('renders chat interface', () => {
    render(<ChatContainer />);
    expect(screen.getByPlaceholderText(/describe your trade/i)).toBeInTheDocument();
  });

  it('sends message on form submit', () => {
    const mockSend = vi.fn();
    render(<ChatContainer />);
    
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'ES long setup' }
    });
    fireEvent.click(screen.getByText(/send/i));
    
    // Assert message was sent
  });
});
```

### Performance Testing
```javascript
// tests/performance/load.test.js
import { check } from 'k6';
import http from 'k6/http';
import ws from 'k6/ws';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 concurrent users
    { duration: '2m', target: 0 },  // Ramp down
  ],
};

export default function () {
  // Test WebSocket connections
  const url = 'ws://localhost:3001/socket.io/?EIO=4&transport=websocket';
  const response = ws.connect(url, function (socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        type: 'send_message',
        data: { content: 'Load test message' }
      }));
    });

    socket.on('message', (data) => {
      check(data, {
        'received response': (data) => data !== null,
      });
    });
  });
}
```

---

## 📈 Performance Optimization

### Caching Strategy
```javascript
// services/cache.mjs
import Redis from 'redis';

const redis = Redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    return Math.min(options.attempt * 100, 3000);
  }
});

export class CacheManager {
  static async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key, value, ttl = 3600) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async invalidate(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  // AI response caching
  static async cacheAIResponse(prompt, imageHash, response) {
    const key = `ai:${createHash('sha256').update(prompt + imageHash).digest('hex')}`;
    await this.set(key, response, 3600); // 1 hour cache
  }

  static async getCachedAIResponse(prompt, imageHash) {
    const key = `ai:${createHash('sha256').update(prompt + imageHash).digest('hex')}`;
    return await this.get(key);
  }
}
```

### Database Optimization
```sql
-- Query optimization indexes
CREATE INDEX CONCURRENTLY idx_messages_conversation_recent 
ON messages(conversation_id, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '7 days';

CREATE INDEX CONCURRENTLY idx_trades_user_performance 
ON trades(user_id, entry_time DESC) 
WHERE status = 'closed';

-- Materialized view for dashboard metrics
CREATE MATERIALIZED VIEW user_daily_metrics AS
SELECT 
  user_id,
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE type = 'user') as messages_sent,
  COUNT(*) FILTER (WHERE type = 'ai' AND verdict IS NOT NULL) as trades_analyzed,
  COUNT(*) FILTER (WHERE mode = 'psychology') as psychology_sessions
FROM messages 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, DATE(created_at);

-- Refresh materialized view daily
CREATE OR REPLACE FUNCTION refresh_daily_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_daily_metrics;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚨 Critical Success Factors

### Day 1 Must-Haves
- [ ] Basic chat interface loads and works
- [ ] Messages persist in database
- [ ] Image upload functional
- [ ] WebSocket connection stable
- [ ] Deployed and accessible to founder

### Week 1 Must-Haves
- [ ] AI analysis returns verdicts
- [ ] Psychology mode functional
- [ ] Mobile interface usable
- [ ] No critical bugs
- [ ] Founder using daily

### Week 4 Must-Haves
- [ ] Complete trading workflow with psychology integration
- [ ] 60+ trades analyzed (training + real)
- [ ] Training trade system with coaching baseline
- [ ] Psychology coaching with trade context
- [ ] Trade planning with psychology factors
- [ ] Performance tracking (training vs real)
- [ ] Ready for beta users

---

## 📋 Implementation Checklist

### Pre-Development Setup
- [ ] Railway account created
- [ ] GitHub repository initialized
- [ ] OpenAI API key obtained
- [ ] Cloudinary account configured
- [ ] Domain name registered
- [ ] Team access configured

### Development Environment
- [ ] Node.js 18+ installed
- [ ] PostgreSQL running locally
- [ ] Redis installed (optional for local dev)
- [ ] IDE configured with TypeScript
- [ ] Git hooks configured
- [ ] Environment variables set

### Deployment Readiness
- [ ] Production environment variables set
- [ ] Database migrations tested
- [ ] SSL certificates configured
- [ ] Monitoring setup
- [ ] Backup procedures tested
- [ ] Error tracking configured

---

## 🎯 Success Metrics

### Technical Metrics
- **Response Time**: <3 seconds for AI analysis
- **Uptime**: >99% availability
- **Message Delivery**: >99% success rate
- **Desktop Performance**: <2 second load time
- **Error Rate**: <1% of requests

### User Experience Metrics
- **Daily Usage**: Founder uses platform daily
- **Feature Adoption**: All 9 sub-milestones used
- **Satisfaction**: >8/10 rating from founder
- **Bug Reports**: <5 critical issues per week
- **Performance**: No blocking issues

### Business Metrics
- **Cost Control**: <$100/month total infrastructure
- **AI Costs**: <$50/month OpenAI usage
- **Development Speed**: New feature every 2-3 days
- **Quality**: Zero data loss incidents
- **Readiness**: Platform ready for beta users by Day 27

---

**This architecture provides a solid foundation for rapid development while maintaining the flexibility to scale as the platform grows. Every component is designed with the founder's immediate needs in mind while building toward the larger vision of a revolutionary AI trading coach platform.**

---

**Document Control**
- **Version**: 1.0 (Complete Architecture)
- **Status**: Ready for Implementation
- **Next Review**: End of Week 1 (Architecture Validation)
- **Owner**: Technical Team Lead
- **Distribution**: All Engineering Team Members