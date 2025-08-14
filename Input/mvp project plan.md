# Trading Coach AI - MVP Project Plan

## Executive Summary

**Project**: Trading Coach AI - Plan Adherence Platform  
**Timeline**: 2 days to functional MVP  
**Goal**: Create a working prototype for 1 user that evaluates trades against their personal trading rules  
**Tech Stack**: Single HTML file, Tailwind CSS (CDN), Vanilla JavaScript, localStorage  
**Investment**: $0 (no infrastructure needed for MVP)

## Core Concept & Legal Positioning

### What This IS:
- Trading plan adherence tracker
- Rule compliance scorer
- Discipline accountability tool
- Educational psychology support

### What This IS NOT:
- Trading signal service
- Investment advisor
- Profit predictor
- Market analyzer

### Critical Language Rules:
- Always say "YOUR plan" not "our recommendation"
- Use "rule compliance" not "trade quality"
- Show "adherence score" not "profit probability"
- Provide "accountability" not "advice"

## MVP Features & Scope

### Phase 1: Core Features (Day 1)
1. **Trading Plan Wizard** (Mandatory first step)
2. **Chat Interface** (Trade analysis & psychology modes)
3. **Evaluation Engine** (Scores against user's rules)
4. **Basic Dashboard** (Time-aware prompts)
5. **localStorage Persistence**

### Phase 2: Enhancements (Day 2)
1. **Pattern Detection** (Language analysis)
2. **Daily Recap** (End of day summary)
3. **Visual Polish** (Animations, transitions)
4. **Test Data Generator**
5. **Export Capabilities**

### Out of Scope for MVP:
- User authentication
- Real AI integration
- Backend/database
- Payment processing
- Multi-user support
- Real-time market data

## Technical Architecture

### File Structure
```
/trading-coach-mvp
  ├── index.html           # Complete application
  ├── PLAN.md             # This file
  └── README.md           # Quick start guide
```

### Data Models

```javascript
// User Trading Plan (Required)
const tradingPlan = {
  id: 'plan_' + Date.now(),
  name: "My ES Scalping Strategy",
  createdAt: Date.now(),
  instrument: "MES", // MES, ES, NQ, etc.
  
  // Setup Types (user's playbook)
  setups: [
    "Bull Flag",
    "Bear Flag", 
    "Channel Breakout",
    "Range Reversal",
    "Trend Pullback"
  ],
  
  // Entry Rules per Setup
  entryRules: {
    "Bull Flag": "Wait for flag consolidation, enter on break of flag high with volume",
    "Bear Flag": "Enter on break of flag low with increased selling pressure",
    // ... etc for each setup
  },
  
  // Risk Management Rules
  riskRules: {
    maxContracts: 3,
    defaultStopPoints: 6,
    openRegimeStopPoints: 10, // 9:30-9:35 ET
    maxDailyLossAmount: 500,
    maxDailyLossPercent: 2,
    minRiskReward: 1.5,
    maxConsecutiveLosses: 3
  },
  
  // Psychology Rules
  psychRules: {
    noRevengeTrading: true,
    cooldownAfterLoss: 15, // minutes
    maxTradesPerDay: 10,
    requirePreMarketPrep: true
  }
};

// Trade Idea Evaluation
const tradeIdea = {
  id: 'trade_' + Date.now(),
  timestamp: Date.now(),
  mode: 'trade', // 'trade' or 'psychology'
  
  // User Input
  originalText: "Long MES at 5000, stop at 4994, target 5015",
  
  // Extracted Data
  extracted: {
    direction: "long",
    instrument: "MES",
    entry: 5000,
    stop: 4994,
    target: 5015,
    stopPoints: 6,
    targetPoints: 15,
    riskReward: 2.5,
    setup: "Bull Flag", // Detected or user-specified
  },
  
  // Evaluation Results
  evaluation: {
    score: 92,
    grade: "💎", // 💎 Diamond (90+), 🔥 Fire (80-89), ☠️ Skull (<80)
    
    violations: [],
    // Or if violations exist:
    // violations: [
    //   { rule: "minRiskReward", message: "R:R is 1.2, below your 1.5 minimum" }
    // ],
    
    coaching: [
      "Perfect alignment with your Bull Flag criteria",
      "Risk/Reward of 2.5:1 exceeds your minimum",
      "Consider trailing stop after 10 points"
    ]
  },
  
  // User Decision
  decision: {
    taken: true, // or false for skipped
    reason: "All rules met",
    timestamp: Date.now()
  }
};

// Chat Message
const chatMessage = {
  id: 'msg_' + Date.now(),
  timestamp: Date.now(),
  sender: 'user', // 'user' or 'coach'
  mode: 'trade', // 'trade' or 'psychology'
  text: "Long MES at 5000, stop 4994",
  evaluation: null // Link to evaluation if applicable
};

// Daily Statistics
const dailyStats = {
  date: '2024-01-15',
  tradesEvaluated: 12,
  tradesTaken: 5,
  tradesSkipped: 7,
  
  grades: {
    diamond: 3,
    fire: 6,
    skull: 3
  },
  
  averageScore: 84,
  complianceRate: 0.83,
  
  violations: {
    'minRiskReward': 2,
    'stopTooWide': 1,
    'noSetup': 1
  },
  
  psychologyChats: 3,
  emotionalStates: ['confident', 'anxious', 'focused']
};
```

## Implementation Guide

### Step 1: Project Setup (30 minutes)

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trading Coach AI - MVP</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Custom animations */
        @keyframes pulse-grade {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        .grade-animation {
            animation: pulse-grade 0.5s ease-in-out;
        }
    </style>
</head>
<body class="bg-gray-900 text-white min-h-screen">
    <div id="app" class="container mx-auto px-4 py-8 max-w-4xl">
        <!-- Application will be built here -->
    </div>
    <script>
        // Application code starts here
    </script>
</body>
</html>
```

### Step 2: Trading Plan Wizard (2 hours)

```javascript
// Trading Plan Wizard Implementation
class TradingPlanWizard {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.planData = {};
  }
  
  render() {
    return `
      <div class="bg-gray-800 rounded-lg p-6">
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-2xl font-bold">Create Your Trading Plan</h2>
            <span class="text-gray-400">Step ${this.currentStep} of ${this.totalSteps}</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                 style="width: ${(this.currentStep / this.totalSteps) * 100}%"></div>
          </div>
        </div>
        
        <div id="wizardContent">
          ${this.renderStep()}
        </div>
        
        <div class="flex justify-between mt-6">
          <button onclick="wizard.previousStep()" 
                  class="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 
                         ${this.currentStep === 1 ? 'invisible' : ''}">
            Previous
          </button>
          <button onclick="wizard.nextStep()" 
                  class="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600">
            ${this.currentStep === this.totalSteps ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    `;
  }
  
  renderStep() {
    switch(this.currentStep) {
      case 1:
        return this.renderBasicInfo();
      case 2:
        return this.renderSetupTypes();
      case 3:
        return this.renderEntryRules();
      case 4:
        return this.renderRiskRules();
      case 5:
        return this.renderReview();
    }
  }
  
  renderBasicInfo() {
    return `
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Plan Name</label>
          <input type="text" id="planName" 
                 class="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 
                        focus:border-blue-500 focus:outline-none"
                 placeholder="e.g., My ES Scalping Strategy">
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Primary Instrument</label>
          <select id="instrument" 
                  class="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 
                         focus:border-blue-500 focus:outline-none">
            <option value="MES">MES (Micro E-mini S&P)</option>
            <option value="ES">ES (E-mini S&P)</option>
            <option value="NQ">NQ (E-mini Nasdaq)</option>
            <option value="MNQ">MNQ (Micro E-mini Nasdaq)</option>
          </select>
        </div>
      </div>
    `;
  }
  
  renderSetupTypes() {
    const setups = [
      'Bull Flag', 'Bear Flag', 'Channel Breakout', 'Range Reversal',
      'Trend Pullback', 'Double Bottom', 'Double Top', 'Wedge',
      'Head and Shoulders', 'Cup and Handle'
    ];
    
    return `
      <div>
        <label class="block text-sm font-medium mb-4">Select Your Setup Types</label>
        <div class="grid grid-cols-2 gap-3">
          ${setups.map(setup => `
            <label class="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" value="${setup}" 
                     class="setup-checkbox w-4 h-4 text-blue-500 bg-gray-700 
                            border-gray-600 rounded focus:ring-blue-500">
              <span>${setup}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  savePlan() {
    localStorage.setItem('tradingPlan', JSON.stringify(this.planData));
  }
}
```

### Step 3: Chat Interface (2 hours)

```javascript
// Chat Interface Implementation
class ChatInterface {
  constructor() {
    this.mode = 'trade'; // 'trade' or 'psychology'
    this.messages = JSON.parse(localStorage.getItem('chatHistory')) || [];
  }
  
  render() {
    return `
      <div class="bg-gray-800 rounded-lg p-4 h-[600px] flex flex-col">
        <!-- Mode Toggle -->
        <div class="flex gap-2 mb-4">
          <button onclick="chat.setMode('trade')" 
                  class="flex-1 py-2 px-4 rounded transition-colors
                         ${this.mode === 'trade' ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}">
            📊 Trade Analysis
          </button>
          <button onclick="chat.setMode('psychology')" 
                  class="flex-1 py-2 px-4 rounded transition-colors
                         ${this.mode === 'psychology' ? 'bg-purple-500' : 'bg-gray-700 hover:bg-gray-600'}">
            🧠 Psychology
          </button>
        </div>
        
        <!-- Messages Container -->
        <div id="messages" class="flex-1 overflow-y-auto mb-4 space-y-3">
          ${this.renderMessages()}
        </div>
        
        <!-- Input Area -->
        <div class="flex gap-2">
          <input type="text" id="messageInput" 
                 class="flex-1 px-3 py-2 bg-gray-700 rounded border border-gray-600 
                        focus:border-blue-500 focus:outline-none"
                 placeholder="${this.mode === 'trade' ? 
                   'e.g., Long MES at 5000, stop 4994, target 5015' : 
                   'How are you feeling about your trading?'}"
                 onkeypress="if(event.key === 'Enter') chat.sendMessage()">
          <button onclick="chat.sendMessage()" 
                  class="px-6 py-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors">
            Send
          </button>
        </div>
      </div>
    `;
  }
  
  renderMessages() {
    return this.messages.map(msg => `
      <div class="flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[70%] px-4 py-2 rounded-lg ${
          msg.sender === 'user' 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-700 text-gray-100'
        }">
          <div class="text-sm">${msg.text}</div>
          ${msg.evaluation ? this.renderEvaluation(msg.evaluation) : ''}
        </div>
      </div>
    `).join('');
  }
  
  renderEvaluation(evaluation) {
    const gradeColors = {
      '💎': 'text-blue-400',
      '🔥': 'text-orange-400',
      '☠️': 'text-red-400'
    };
    
    return `
      <div class="mt-3 pt-3 border-t border-gray-600">
        <div class="flex items-center justify-between mb-2">
          <span class="text-3xl grade-animation">${evaluation.grade}</span>
          <span class="text-lg font-bold ${gradeColors[evaluation.grade]}">
            ${evaluation.score}%
          </span>
        </div>
        ${evaluation.violations.length > 0 ? `
          <div class="text-xs text-red-300 space-y-1">
            ${evaluation.violations.map(v => `<div>⚠️ ${v}</div>`).join('')}
          </div>
        ` : ''}
        ${evaluation.coaching.length > 0 ? `
          <div class="text-xs text-green-300 mt-2 space-y-1">
            ${evaluation.coaching.map(c => `<div>💡 ${c}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }
  
  sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text) return;
    
    // Add user message
    this.addMessage(text, 'user');
    
    // Process based on mode
    if (this.mode === 'trade') {
      this.processTradeMessage(text);
    } else {
      this.processPsychologyMessage(text);
    }
    
    input.value = '';
  }
}
```

### Step 4: Evaluation Engine (2 hours)

```javascript
// Trade Evaluation Engine
class EvaluationEngine {
  constructor(plan) {
    this.plan = plan;
  }
  
  extractTradeDetails(text) {
    const details = {
      direction: null,
      entry: null,
      stop: null,
      target: null,
      setup: null
    };
    
    // Extract direction
    if (/long|buy/i.test(text)) details.direction = 'long';
    if (/short|sell/i.test(text)) details.direction = 'short';
    
    // Extract prices (simplified regex - enhance for production)
    const prices = text.match(/\d+(?:\.\d+)?/g);
    if (prices && prices.length >= 2) {
      details.entry = parseFloat(prices[0]);
      details.stop = parseFloat(prices[1]);
      if (prices[2]) details.target = parseFloat(prices[2]);
    }
    
    // Detect setup type
    this.plan.setups.forEach(setup => {
      if (text.toLowerCase().includes(setup.toLowerCase())) {
        details.setup = setup;
      }
    });
    
    // Calculate derived values
    if (details.entry && details.stop) {
      details.stopPoints = Math.abs(details.entry - details.stop);
    }
    
    if (details.entry && details.target && details.stop) {
      const reward = Math.abs(details.target - details.entry);
      const risk = Math.abs(details.entry - details.stop);
      details.riskReward = (reward / risk).toFixed(2);
    }
    
    return details;
  }
  
  evaluate(tradeDetails) {
    let score = 100;
    const violations = [];
    const coaching = [];
    
    // Check 1: Setup in plan? (-30 points if not)
    if (!tradeDetails.setup || !this.plan.setups.includes(tradeDetails.setup)) {
      score -= 30;
      violations.push('Setup not in your defined playbook');
      coaching.push('Stick to your proven setups: ' + this.plan.setups.join(', '));
    } else {
      coaching.push(`✓ ${tradeDetails.setup} is in your playbook`);
    }
    
    // Check 2: Risk/Reward (-20 points if below minimum)
    if (tradeDetails.riskReward && tradeDetails.riskReward < this.plan.riskRules.minRiskReward) {
      score -= 20;
      violations.push(`R:R is ${tradeDetails.riskReward}, below your ${this.plan.riskRules.minRiskReward} minimum`);
    } else if (tradeDetails.riskReward) {
      coaching.push(`✓ R:R of ${tradeDetails.riskReward} exceeds your minimum`);
    }
    
    // Check 3: Stop size (-20 points if too wide)
    const maxStop = this.isOpenRegime() ? 
      this.plan.riskRules.openRegimeStopPoints : 
      this.plan.riskRules.defaultStopPoints;
      
    if (tradeDetails.stopPoints > maxStop) {
      score -= 20;
      violations.push(`Stop is ${tradeDetails.stopPoints}pts, exceeds your ${maxStop}pt limit`);
    } else if (tradeDetails.stopPoints) {
      coaching.push(`✓ Stop of ${tradeDetails.stopPoints}pts within your rules`);
    }
    
    // Check 4: Open regime special rules (-15 points)
    if (this.isOpenRegime() && tradeDetails.stopPoints < 8) {
      score -= 15;
      violations.push('Open regime (9:30-9:35) requires 8-10pt stops');
    }
    
    // Generate grade
    const grade = score >= 90 ? '💎' : score >= 80 ? '🔥' : '☠️';
    
    // Add contextual coaching
    if (score === 100) {
      coaching.push('Perfect alignment with your trading plan! 🎯');
    } else if (score >= 80) {
      coaching.push('Solid setup with minor adjustments needed');
    } else {
      coaching.push('Multiple rule violations - consider skipping this trade');
      