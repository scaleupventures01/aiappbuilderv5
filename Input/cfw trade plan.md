# Product Requirements Document
## Trading Wizard - Personal Trading System Manager

### Version 2.0
**Date:** January 2025  
**Status:** Development Ready

---

## 1. Executive Summary

### 1.1 Product Vision
Create a comprehensive web-based trading plan manager that enables traders to document, track, and execute their personal trading strategies with precision. The system will serve as a digital trading coach, ensuring adherence to predefined rules and setups while preventing emotional trading decisions.

### 1.2 Key Objectives
- **Systematize Trading:** Convert discretionary trading patterns into rule-based systems
- **Risk Management:** Enforce strict position sizing and stop-loss rules
- **Pattern Recognition:** Document and track specific chart patterns and setups
- **Performance Tracking:** Monitor trade execution against the trading plan
- **Behavioral Control:** Implement safeguards against revenge trading and overtrading

---

## 2. Core Features

### 2.1 Trading Setup Library

#### 2.1.1 Momentum Setups
**Price EMA Cross-Over (Full-Body)**
- Detection: Full-body candle crossing both 5-EMA and 20-EMA
- Volume requirement: Spike ≥ tallest of past 20 bars
- Entry: Stop order 1 tick past candle close
- Stop: 0.30-0.40 pts beyond extreme
- Targets: +0.50 pt → B/E; +0.75 pt trim; runner to 2R+

**Hammer Cross EMAs**
- Detection: Wick ≥ 50% of total bar piercing both EMAs
- Body position: Sits back on trend side of EMAs
- Entry: Buy/sell-stop above/below hammer high/low
- Stop: Just past wick tail/head
- Targets: 0.50/0.75/runner ladder

#### 2.1.2 Continuation Patterns
**Bull Flag**
- Impulse: 3-6 wide green candles (≈1 pt move)
- Flag: 3-8 small red/inside candles drifting down 20-40°
- Volume: Fades during flag, spikes ≥1.3x on breakout
- Entry: Buy-stop 1 tick above breakout close
- Stop: Below flag low or 20-EMA (max 0.40 pt)
- Targets: 25% at +0.50 pt → B/E; 25% at +0.75 pt; trail rest

**Bear Flag**
- Mirror of Bull Flag in opposite direction
- Same entry/exit mechanics

**Channel Breakout**
- Setup: 6-20 bars in defined channel
- Volume: Contracts in channel, jumps ≥30% on breakout
- EMA behavior: 5-EMA kisses 15-EMA before breakout
- Entry: Stop order 1 tick beyond breakout close
- Stop: Last swing inside channel or past 15-EMA
- Targets: 1R → B/E; 2R trim; trail remainder on 5-EMA

**Micro Pull-Back**
- Context: Strong trend channel (20-30° slope)
- Dip: 1-3 tiny red candles tagging 5-EMA
- Signal: Hammer/long-wick bar with shadow ≥50% height
- Entry: Buy-stop 1 tick above hammer high
- Stop: 0.25-0.40 pt below hammer low
- Targets: Standard 0.50/0.75/runner ladder

#### 2.1.3 Reversal Patterns
**Double Bottom/Top**
- Structure: Two equal swing lows/highs separated by 5-20 bars
- Volume: Second test shows lower volume
- Neckline: Horizontal line connecting swing highs/lows
- Entry: Stop order beyond breakout/rejection candle
- Stop: Under second bottom/above second top
- Targets: Neckline or 1R → B/E; 2R trim; trail with 5-EMA

**Head and Shoulders**
- Formation: Three peaks with middle highest
- Right shoulder: Fails to break head high
- Volume: Decreases on right shoulder
- Entry/Exit: Same as Double Bottom/Top

**Ending Wedge**
- Pattern: Converging trend lines
- Bars: Get progressively smaller toward tip
- Volume: Contracts then pops on breakout
- Management: Same as other reversal patterns

**Exhaustion-Wick Reversal**
- Context: Price ≥1.5x ATR from 20-EMA or ≥8 consecutive same-color candles
- Signal: Range expansion ≥1.8x average, volume spike ≥1.5x
- Wick: ≥50% of candle range
- Body: Closes in upper/lower 30% of range
- Entry: Buy/sell-stop 1 tick beyond climax bar
- Stop: 0.10-0.40 pt beyond wick (max 0.40 pt or 1% risk)
- Targets: +0.50 pt (25% trim) → B/E; +0.75 pt (25% trim); runner to 2R+

#### 2.1.4 EMA Cross Patterns
**Bullish/Bearish Pennant**
- Impulse: Steep move on high volume
- Pennant: 5-15 candles forming symmetrical triangle
- Volume: Compresses toward apex
- Breakout: Wide candle with ≥30% volume surge
- Management: Same as flag patterns

### 2.2 Risk Management System

#### 2.2.1 Position Sizing Rules
- **Max Contracts Per Trade:** User-defined (1-100)
- **Max Daily Trades:** User-defined (1-50)
- **Max Concurrent Positions:** User-defined (1-10)
- **Account Risk Per Trade:** Max 1% of account equity
- **Max Dollar Risk:** User-defined absolute dollar amount

#### 2.2.2 Stop Loss Management
- **Default Stop:** User-defined points (typical: 6 pts)
- **Open Regime Stop:** User-defined (typical: 10 pts)
- **Max Stop:** User-defined (typical: 15 pts)
- **Time-Based Stops:** Optional trailing after X minutes
- **Volatility Adjustments:** ATR-based stop modifications

#### 2.2.3 Profit Target System
- **Minimum R:R Ratio:** User-defined (minimum 1.5:1)
- **Target 1:** Partial profit at defined points
- **Target 2:** Secondary trim level
- **Target 3:** Runner management rules
- **Breakeven Management:** Automatic stop adjustment after Target 1

### 2.3 Trading Rules Engine

#### 2.3.1 Time Restrictions
- **Open Regime Block:** No trades first 5 minutes (9:30-9:35 ET)
- **Close Block:** No trades last 15 minutes (3:45-4:00 ET)
- **Custom Time Windows:** User-defined trading hours
- **Session Management:** Pre-market, regular, after-hours rules

#### 2.3.2 Loss Prevention
- **Consecutive Loss Limit:** Stop after X losses (default: 3)
- **Daily Loss Limit:** Dollar or percentage based
- **Cooldown Period:** Mandatory wait after loss (default: 15 min)
- **Revenge Trade Block:** No trades within 5 min of loss
- **Weekly/Monthly Limits:** Extended timeframe controls

#### 2.3.3 Trade Validation
- **Setup Checklist:** Pre-trade confirmation requirements
- **Volume Confirmation:** Minimum volume thresholds
- **EMA Alignment:** Trend confirmation rules
- **Support/Resistance:** Level validation
- **Multi-Timeframe Confirmation:** Higher timeframe alignment

### 2.4 User Interface Requirements

#### 2.4.1 Dashboard View
- **Active Plan Summary:** Current rules and setups
- **Today's Statistics:** Trades taken, P&L, rule compliance
- **Setup Scanner:** Which patterns are currently active
- **Risk Monitor:** Current exposure and limits
- **Performance Metrics:** Win rate, average R, streak info

#### 2.4.2 Setup Configuration
- **Visual Pattern Editor:** Drag-and-drop pattern builder
- **Parameter Inputs:** Numerical fields with validation
- **Template Library:** Pre-built setup templates
- **Custom Setup Creator:** User-defined patterns
- **Backtesting Preview:** Historical pattern examples

#### 2.4.3 Trade Execution Interface
- **Pre-Trade Checklist:** Mandatory confirmation steps
- **Position Calculator:** Automatic sizing based on risk
- **Entry/Exit Planner:** Visual stop and target placement
- **Trade Journal:** Post-trade notes and screenshots
- **Alert System:** Pattern detection notifications

### 2.5 Data Management

#### 2.5.1 Storage Architecture
- **Local Storage:** Primary data persistence
- **Export Formats:** JSON, CSV, PDF
- **Import Capability:** Restore from backup
- **Version Control:** Plan history and rollback
- **Data Encryption:** Optional password protection

#### 2.5.2 Integration Points
- **Broker APIs:** Future integration capability
- **Chart Platforms:** TradingView, ThinkOrSwim webhooks
- **Analytics Tools:** Export to Excel/Google Sheets
- **Cloud Backup:** Optional sync to cloud storage

---

## 3. Technical Specifications

### 3.1 Frontend Requirements
- **Framework:** Vanilla JavaScript (no dependencies)
- **Styling:** Tailwind CSS via CDN
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Responsive Design:** Desktop-first, tablet compatible
- **Performance:** <2s initial load, <100ms interactions

### 3.2 Data Schema

```javascript
{
  plan: {
    id: "plan_timestamp",
    version: "2.0",
    name: "string",
    description: "string",
    instrument: "MES|ES|MNQ|NQ|etc",
    marketTimezone: "ET|CT|PT",
    userTimezone: "IANA_timezone",
    createdAt: timestamp,
    lastModified: timestamp,
    status: "active|archived"
  },
  setups: {
    momentum: [
      {
        name: "Price EMA Cross-Over",
        enabled: boolean,
        parameters: {
          emaFast: 5,
          emaSlow: 20,
          volumeMultiplier: 1.3,
          stopDistance: 0.35,
          targets: [0.50, 0.75, "runner"]
        }
      }
    ],
    continuation: [...],
    reversal: [...],
    custom: [...]
  },
  riskRules: {
    position: {
      maxContractsPerTrade: number,
      maxDailyTrades: number,
      maxConcurrentPositions: number,
      maxAccountRiskPercent: 1.0,
      maxDollarRisk: number
    },
    stops: {
      defaultStop: number,
      openRegimeStop: number,
      maxStop: number,
      useATRStops: boolean,
      atrMultiplier: number
    },
    targets: {
      minRiskReward: 1.5,
      target1Points: number,
      target2Points: number,
      target3Points: number,
      moveToBreakeven: boolean,
      trailStop: boolean
    }
  },
  tradingRules: {
    timeRestrictions: {
      noOpenRegimeTrades: boolean,
      openRegimeMinutes: 5,
      noCloseTrades: boolean,
      closeMinutes: 15,
      customWindows: []
    },
    lossPrevention: {
      stopAfterConsecutiveLosses: boolean,
      consecutiveLossLimit: 3,
      dailyLossLimit: number,
      cooldownAfterLoss: boolean,
      cooldownMinutes: 15,
      noRevengeTrades: boolean,
      revengeBlockMinutes: 5
    }
  },
  performance: {
    trades: [],
    statistics: {
      totalTrades: number,
      winRate: number,
      averageR: number,
      profitFactor: number,
      currentStreak: number
    }
  }
}
```

### 3.3 Validation Rules

#### 3.3.1 Input Validation
- Numerical inputs: Type checking, range validation
- String inputs: Length limits, character restrictions
- Pattern parameters: Logical consistency checks
- Risk parameters: Maximum exposure calculations

#### 3.3.2 Business Logic Validation
- Setup conflicts: Prevent contradictory rules
- Risk limits: Ensure total risk < account size
- Time windows: No overlapping restrictions
- Target sequences: T1 < T2 < T3

---

## 4. User Workflows

### 4.1 Initial Setup Flow
1. **Welcome Screen** → Trading experience questionnaire
2. **Instrument Selection** → Primary market selection
3. **Risk Profile** → Account size, risk tolerance
4. **Setup Selection** → Choose from pattern library
5. **Parameter Tuning** → Customize setup parameters
6. **Rule Configuration** → Set trading restrictions
7. **Review & Confirm** → Final validation
8. **Save & Activate** → Begin using plan

### 4.2 Daily Trading Flow
1. **Morning Checklist** → Pre-market preparation
2. **Pattern Scanner** → Identify active setups
3. **Trade Validation** → Confirm setup criteria
4. **Position Sizing** → Calculate contracts
5. **Execution Tracking** → Log entry/exit
6. **Post-Trade Review** → Journal and analyze
7. **End-of-Day Report** → Performance summary

### 4.3 Plan Modification Flow
1. **Performance Review** → Identify needed changes
2. **Edit Mode** → Unlock plan for changes
3. **Parameter Adjustment** → Modify rules/setups
4. **Validation Check** → Ensure consistency
5. **Save Version** → Create new version
6. **Activate Changes** → Switch to new plan

---

## 5. Success Metrics

### 5.1 User Engagement
- Daily active users
- Average session duration
- Feature utilization rates
- Plan modification frequency

### 5.2 Trading Performance
- Rule compliance rate
- Reduction in revenge trades
- Improvement in R:R achieved
- Consistency of execution

### 5.3 System Performance
- Page load times
- Error rates
- Data integrity
- Browser compatibility

---

## 6. Future Enhancements

### Phase 2 (Q2 2025)
- Mobile responsive design
- Cloud synchronization
- Broker API integration
- Real-time pattern alerts

### Phase 3 (Q3 2025)
- AI-powered setup optimization
- Community setup sharing
- Advanced analytics dashboard
- Multi-account support

### Phase 4 (Q4 2025)
- Automated trade execution
- Machine learning pattern recognition
- Performance coaching AI
- Team/prop firm features

---

## 7. Appendices

### A. Glossary
- **ATR:** Average True Range
- **B/E:** Breakeven
- **EMA:** Exponential Moving Average
- **R:** Risk unit (1R = initial risk amount)
- **Open Regime:** First 5 minutes after market open

### B. References
- Trading pattern documentation (see PDF attachments)
- Risk management best practices
- Market microstructure research
- Behavioral finance principles

### C. Change Log
- v2.0: Complete system rewrite with pattern library
- v1.1: Added custom setup capability
- v1.0: Initial MVP release
