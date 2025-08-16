# AI Implementation - Elite Trading Coach AI

This directory contains the complete AI implementation for the Elite Trading Coach AI platform, implementing all requirements from PRD-1.1.1.4 (Messages Table) for AI-powered trading analysis and psychology coaching.

## 📁 Directory Structure

```
ai/
├── verdict/
│   └── classifier.js          # Diamond/Fire/Skull verdict classification
├── psychology/
│   └── pattern-detector.js    # Emotional state and pattern detection
├── core/
│   └── model-selector.js      # Intelligent AI model selection
├── formatting/
│   └── response-formatter.js  # Structured response formatting
├── prompts/
│   └── trade-analysis-prompts.js # Context-aware prompt templates
├── index.js                   # Main AI orchestration module
├── simple-test.js             # Component testing script
├── test-integration.js        # Comprehensive integration tests
└── README.md                  # This file
```

## 🚀 Quick Start

### 1. Test AI Components (without API key)
```bash
node ai/simple-test.js
```

### 2. Set up OpenAI API Key
```bash
# Add to your .env file
OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Test with Real AI Calls
```bash
node ai/test-integration.js
```

## 🎯 Core Components

### 1. Verdict Classifier (`verdict/classifier.js`)
**Task ID:** AI-MSG-001

Implements the Diamond/Fire/Skull trading setup classification system:
- **Diamond 💎**: Perfect setup, high confidence trade (80%+ confidence)
- **Fire 🔥**: Good setup with considerations (50-79% confidence)  
- **Skull 💀**: Poor setup, avoid trade (<50% confidence)

**Features:**
- Technical factor analysis with weighted scoring
- Risk and positive factor adjustments
- Confidence scoring algorithms
- Detailed reasoning breakdown
- Analytics and performance tracking

**Usage:**
```javascript
import { classifyTradingSetup } from './ai/verdict/classifier.js';

const result = await classifyTradingSetup({
  description: "EURUSD 1H strong support bounce at 1.0850"
}, {
  includeReasoning: true,
  riskFactors: ['lowVolume'],
  positiveFactors: ['institutionalSupport']
});

console.log(result.verdict, result.confidence, result.reasoning);
```

### 2. Psychology Pattern Detector (`psychology/pattern-detector.js`)
**Task ID:** AI-MSG-002

Analyzes trader psychology and emotional states:

**Emotional States:** confident, anxious, revenge, disciplined, fearful, greedy, impatient, focused, overwhelmed, calm

**Pattern Detection:**
- Overtrading, revenge trading, FOMO
- Analysis paralysis, risk aversion
- Good discipline, proper risk management
- And more behavioral patterns

**Features:**
- NLP-based emotional analysis
- Pattern recognition with confidence scoring
- Coaching type recommendations
- Historical trend analysis
- Risk level assessment

**Usage:**
```javascript
import { analyzeTraderPsychology } from './ai/psychology/pattern-detector.js';

const result = await analyzeTraderPsychology({
  content: "I'm feeling anxious about this trade after yesterday's loss"
}, {
  includeInsights: true
});

console.log(result.emotionalState, result.coachingType, result.patternTags);
```

### 3. Model Selector (`core/model-selector.js`)
**Task ID:** AI-MSG-004

Intelligently selects the optimal AI model based on:
- Content type (text vs chart analysis)
- Complexity requirements
- Cost sensitivity preferences
- Performance requirements

**Supported Models:**
- GPT-4, GPT-4 Turbo, GPT-4 Vision (OpenAI)
- Claude 3.5 Sonnet, Claude 3 Opus (Anthropic)

**Features:**
- Automatic model selection based on requirements
- Cost estimation and optimization
- Performance vs cost balancing
- Capability matching

**Usage:**
```javascript
import { selectOptimalModel } from './ai/core/model-selector.js';

const result = await selectOptimalModel({
  content: "Analyze this chart",
  image_url: "https://example.com/chart.jpg"
}, {
  costSensitivity: 'medium',
  includeReasoning: true
});

console.log(result.selectedModel, result.estimatedCost, result.reasoning);
```

### 4. Response Formatter (`formatting/response-formatter.js`)
**Task ID:** AI-MSG-006

Formats AI responses into structured, display-ready output:

**Response Types:**
- Trade Analysis (with verdict display)
- Psychology Coaching (with emotional state)
- Chart Analysis (with technical levels)
- General Guidance
- Error Responses

**Features:**
- Structured component system
- Markdown and plain text output
- Emoji and visual formatting
- Metadata tracking
- Display customization options

**Usage:**
```javascript
import { formatAiResponse, RESPONSE_FORMATS } from './ai/formatting/response-formatter.js';

const formatted = await formatAiResponse(
  aiAnalysisData,
  RESPONSE_FORMATS.TRADE_ANALYSIS,
  { includeDisplayText: true }
);

console.log(formatted.displayText);
```

### 5. Prompt Generator (`prompts/trade-analysis-prompts.js`)
**Task ID:** AI-MSG-007

Generates context-aware prompts for different analysis types:

**Prompt Types:**
- Trade Analysis
- Chart Analysis (GPT-4 Vision)
- Psychology Coaching
- Risk Assessment
- General Guidance

**Features:**
- Experience level adaptation (beginner to professional)
- Market condition awareness
- Context injection
- Specialized scenario prompts
- Multi-provider compatibility

**Usage:**
```javascript
import { generateOptimalPrompt } from './ai/prompts/trade-analysis-prompts.js';

const prompt = await generateOptimalPrompt({
  content: "Looking at this chart setup",
  image_url: "chart.jpg"
}, {
  experienceLevel: 'intermediate',
  marketCondition: 'trending'
});

console.log(prompt.system, prompt.user, prompt.promptType);
```

## 🔧 Main Integration Module (`index.js`)

The main orchestration module that ties all components together:

**Key Features:**
- Complete AI processing pipeline
- Error handling and fallback responses
- Usage tracking and analytics
- Health monitoring
- Multi-provider support

**Usage:**
```javascript
import { processMessage } from './ai/index.js';

const result = await processMessage({
  content: "What do you think about this EURUSD setup?",
  image_url: "chart.jpg",
  user_id: "user123"
}, {
  includeVerdictClassification: true,
  includePsychologyAnalysis: true,
  includeFormatting: true
});

console.log(result.results.displayText);
```

## 📊 Testing and Validation

### Component Testing
```bash
# Test individual components
node ai/simple-test.js
```

### Integration Testing
```bash
# Full integration test (requires API key)
node ai/test-integration.js
```

### Health Check
```javascript
import { healthCheck } from './ai/index.js';
const health = await healthCheck();
console.log(health.status, health.services);
```

## 🎯 Integration with Messages System

The AI components integrate seamlessly with the messages table schema:

```sql
-- AI processing fields in messages table
verdict VARCHAR(20),              -- Diamond/Fire/Skull
confidence INTEGER,               -- 0-100 confidence score
emotional_state VARCHAR(50),      -- Detected emotional state
coaching_type VARCHAR(50),        -- Recommended coaching type
pattern_tags JSONB,               -- Psychology pattern array
ai_model VARCHAR(50),             -- Model used for processing
ai_tokens_used INTEGER,           -- Token usage tracking
ai_cost_cents INTEGER,            -- Cost tracking
processing_time_ms INTEGER        -- Performance metrics
```

## 💡 Usage Examples

### Basic Trade Analysis
```javascript
const message = {
  content: "EURUSD looking bullish at support",
  user_id: "user123",
  conversation_id: "conv456"
};

const analysis = await processMessage(message);
// Returns: verdict, confidence, reasoning, formatted response
```

### Chart Analysis with GPT-4 Vision
```javascript
const message = {
  content: "Please analyze this 1H chart",
  image_url: "https://charts.com/eurusd.png",
  user_id: "user123"
};

const analysis = await processMessage(message);
// Returns: technical levels, patterns, entry/exit points
```

### Psychology Coaching
```javascript
const message = {
  content: "I'm feeling anxious after my last loss",
  user_id: "user123",
  analysis_mode: "psychology"
};

const coaching = await processMessage(message);
// Returns: emotional state, patterns, coaching recommendations
```

## 🔄 Error Handling

The system includes comprehensive error handling:
- Graceful fallbacks when AI services are unavailable
- Retry mechanisms for transient failures
- Detailed error reporting and logging
- User-friendly error messages

## 📈 Performance Monitoring

Built-in analytics and monitoring:
- Token usage tracking
- Cost optimization
- Response time monitoring
- Success/failure rates
- Model performance comparison

## 🚀 Deployment Considerations

### Environment Variables
```bash
OPENAI_API_KEY=your-openai-api-key
# Optional: Claude API key for future use
# ANTHROPIC_API_KEY=your-anthropic-key
```

### Production Optimizations
- Implement request queuing for rate limiting
- Add caching for repeated analysis
- Set up monitoring and alerting
- Configure cost limits and budgets
- Add comprehensive logging

## 🔮 Future Enhancements

1. **Claude Integration**: Full Anthropic Claude API integration
2. **Caching Layer**: Redis caching for improved performance
3. **Advanced Analytics**: Detailed verdict accuracy tracking
4. **Custom Models**: Fine-tuned models for trading-specific analysis
5. **Real-time Updates**: WebSocket integration for live analysis
6. **Multi-language**: Support for multiple languages
7. **Voice Integration**: Audio analysis for voice trading notes

## 🛠️ Technical Architecture

The AI system follows a modular, extensible architecture:

```
User Message → Model Selection → Prompt Generation → AI Processing → 
Analysis (Verdict + Psychology) → Response Formatting → Display
```

Each component is independently testable and can be used standalone or as part of the complete pipeline.

## 📚 API Reference

See individual component files for detailed API documentation. Each module exports clear, well-documented functions with TypeScript-like parameter definitions.

---

**Status**: ✅ Implementation Complete  
**PRD Tasks**: AI-MSG-001 through AI-MSG-007 (All Complete)  
**Last Updated**: 2025-08-14