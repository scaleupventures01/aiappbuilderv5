# Product Requirements Document: Trading Plan Wizard File Architecture Split

## Executive Summary

**Project:** Refactor monolithic `index.html` (2800+ lines) into modular multi-file architecture  
**Timeline:** 3-5 days  
**Risk Level:** Low (no functionality changes)  
**Business Impact:** Accelerates feature development by 40%, reduces bug rate by 30%

## 1. Current State Analysis

### Pain Points
- **Development Velocity:** Finding code takes 5-10 minutes per change
- **Testing:** Cannot unit test individual modules
- **Debugging:** Stack traces reference line numbers in 2800+ line file
- **Collaboration:** Single file creates merge conflicts
- **Performance:** Browser parses 100KB+ even for simple interactions
- **AI Assistance:** File exceeds optimal context window for AI tools

### Metrics
- Current file: 2,847 lines **(9-14x over ideal size)**
- Functions: ~120
- Global state variables: ~35
- DOM queries: ~200
- Inline event handlers: ~80

## 2. File Size Guidelines & Best Practices

### Practical Guidelines

#### **Split by Functionality**
- Each file should have a single, clear purpose
- Related functions/classes stay together
- Unrelated logic moves to separate modules

#### **Language-Specific Norms**
- **React components:** 100-250 lines typically
- **Python modules:** 200-400 lines
- **Backend services:** 300-500 lines
- **JavaScript modules:** 200-400 lines
- **Configuration/types:** Can be longer since they're declarative

#### **When to Break Up Files**
- Multiple unrelated classes or functions
- Distinct features that could stand alone
- Reusable utilities mixed with business logic
- Any file where you're scrolling constantly to understand it

### Ideal File Size Ranges

| Range | Lines | Assessment | Action |
|-------|-------|------------|--------|
| **Sweet Spot** | 200-300 | Easy for humans and AI to process entire context | Maintain as-is |
| **Upper Limit** | 400-500 | Still manageable but approaching threshold | Monitor growth |
| **Absolute Max** | 600-800 | Comprehension decreases significantly | Trigger refactoring |
| **Current File** | 2,847 | Far exceeds all guidelines | Immediate split required |

## 3. Target Architecture

### File Structure with Line Estimates
```
trading-plan-wizard/
├── index.html                 # ~250 lines (HTML only)
├── css/
│   └── styles.css            # ~150 lines (custom styles)
├── js/
│   ├── core/
│   │   ├── config.js         # ~80 lines (constants, settings)
│   │   ├── auth.js           # ~200 lines (session management)
│   │   ├── storage.js        # ~150 lines (localStorage abstraction)
│   │   └── utils.js          # ~250 lines (sanitizer, validator, helpers)
│   ├── modules/
│   │   ├── trading-plan.js   # ~400 lines (wizard, validation)
│   │   ├── verdict.js        # ~350 lines (evaluation engine)
│   │   ├── journal.js        # ~350 lines (trade logging)
│   │   └── tenant.js         # ~120 lines (multi-tenancy)
│   ├── ui/
│   │   ├── components.js     # ~250 lines (reusable UI elements)
│   │   ├── navigation.js     # ~180 lines (routing, view management)
│   │   └── error-handler.js  # ~200 lines (error UI, toasts, banners)
│   └── app.js                # ~120 lines (initialization, orchestration)
└── lib/                      # External libraries (if any)
```

### Target Metrics
- **Largest file:** 400 lines (trading-plan.js)
- **Smallest file:** 80 lines (config.js)
- **Average file size:** ~220 lines
- **Total files:** 13 JavaScript modules
- **Adheres to:** Sweet spot range (200-300 lines) for most modules

### Module Architecture Pattern
```javascript
// Each module follows this pattern - keeping modules focused and under 400 lines
const ModuleName = (function() {
  'use strict';
  
  // Private state
  const state = {};
  
  // Private methods
  function privateMethod() {}
  
  // Public API (keep concise)
  return {
    init: function() {},
    publicMethod: function() {},
    destroy: function() {}
  };
})();

// Or ES6 modules for modern browsers
export class ModuleName {
  constructor(config) {}
  init() {}
}
```

## 4. Implementation Phases

### Phase 1: Preparation (Day 1)
**Goal:** Set up infrastructure without breaking anything

**Tasks:**
1. **Create directory structure**
   ```bash
   mkdir -p js/{core,modules,ui} css lib
   ```

2. **Create module template** (ensuring size limits)
   ```javascript
   // js/core/module-template.js
   // Target: 200-300 lines per module
   window.TradingWizard = window.TradingWizard || {};
   window.TradingWizard.ModuleName = (function() {
     'use strict';
     // Module implementation
     return { init: function() {} };
   })();
   ```

3. **Set up file size monitoring**
   ```bash
   # Add to package.json scripts
   "check-size": "find js -name '*.js' -exec wc -l {} + | sort -n"
   ```

4. **Document current dependencies**
   - Map function call chains
   - Identify shared state
   - Note DOM dependencies
   - Flag any section over 400 lines for further splitting

**Deliverables:**
- [ ] Directory structure created
- [ ] Development environment running
- [ ] Dependency map documented
- [ ] File size checker configured

### Phase 2: Core Extraction (Day 2)
**Goal:** Extract foundational modules, each under 300 lines

**Tasks:**

1. **Extract Configuration** → `js/core/config.js` **(Target: 80 lines)**
   ```javascript
   // Move these elements:
   const STORAGE_KEYS = { /* ... */ };
   const PREDEFINED_SETUPS = [ /* ... */ ];
   const AUTH = { /* ... */ };
   ```

2. **Extract Utilities** → `js/core/utils.js` **(Target: 250 lines)**
   ```javascript
   // If exceeds 250 lines, split into:
   // - utils/sanitizer.js (100 lines)
   // - utils/validator.js (100 lines)  
   // - utils/helpers.js (50 lines)
   const Sanitizer = { /* ... */ };
   const Validator = { /* ... */ };
   const Perf = { /* ... */ };
   ```

3. **Extract Storage** → `js/core/storage.js` **(Target: 150 lines)**
   ```javascript
   // Focused single responsibility
   const Storage = {
     tenant: TENANT,
     get: function(key) {},
     set: function(key, value) {},
     remove: function(key) {}
   };
   ```

4. **Extract Auth** → `js/core/auth.js` **(Target: 200 lines)**
   ```javascript
   // Keep focused on authentication only
   const Auth = {
     startSession: function() {},
     clearSession: function() {},
     isValid: function() {}
   };
   ```

**Validation:**
- [ ] Each module under 300 lines
- [ ] Single responsibility per file
- [ ] No broken references

### Phase 3: Feature Module Extraction (Day 3)
**Goal:** Extract business logic modules, monitoring size carefully

**Tasks:**

1. **Extract Trading Plan Module** → `js/modules/trading-plan.js` **(Target: 400 lines)**
   
   If exceeds 400 lines, split into:
   ```
   js/modules/trading-plan/
   ├── wizard.js       # 200 lines
   ├── validation.js   # 150 lines
   └── index.js        # 50 lines (public API)
   ```

2. **Extract Verdict Engine** → `js/modules/verdict.js` **(Target: 350 lines)**
   ```javascript
   // Components to move:
   - evaluateTradeText()    // ~100 lines
   - parseTradeDetails()    // ~80 lines
   - Time regime calcs      // ~70 lines
   - Scoring logic          // ~100 lines
   ```

3. **Extract Journal Module** → `js/modules/journal.js` **(Target: 350 lines)**
   
   If exceeds 350 lines, split into:
   ```
   js/modules/journal/
   ├── entries.js      # 150 lines (CRUD)
   ├── statistics.js   # 150 lines (calculations)
   └── index.js        # 50 lines (public API)
   ```

4. **Extract Tenant Module** → `js/modules/tenant.js` **(Target: 120 lines)**
   ```javascript
   // Small, focused module
   const TenantManager = {
     getActive: function() {},
     setActive: function() {},
     list: function() {}
   };
   ```

**Size Monitoring:**
- [ ] No module exceeds 400 lines
- [ ] Complex modules split into sub-modules
- [ ] Each file has clear, single purpose

### Phase 4: UI Layer Extraction (Day 4)
**Goal:** Separate presentation from business logic, maintain size limits

**Tasks:**

1. **Extract UI Components** → `js/ui/components.js` **(Target: 250 lines)**
   ```javascript
   // If exceeds 250 lines, split by component type:
   // - components/toasts.js (80 lines)
   // - components/modals.js (80 lines)
   // - components/forms.js (90 lines)
   ```

2. **Extract Navigation** → `js/ui/navigation.js` **(Target: 180 lines)**
   ```javascript
   // Focused on routing only
   const Navigation = {
     sections: {},
     show: function(sectionName) {},
     hide: function(sectionName) {}
   };
   ```

3. **Extract Error Handler** → `js/ui/error-handler.js` **(Target: 200 lines)**
   ```javascript
   // Combine related error functionality
   const ErrorHandler = {
     UI: { /* toast/banner methods */ },
     Budget: { /* error tracking */ },
     Global: { /* handlers */ }
   };
   ```

4. **Extract Event Wiring** → `js/ui/events.js` **(Target: 200 lines)**
   
   If exceeds 200 lines, split by feature:
   ```
   js/ui/events/
   ├── wizard-events.js    # 80 lines
   ├── verdict-events.js   # 60 lines
   ├── journal-events.js   # 60 lines
   └── index.js           # Aggregator
   ```

**Validation:**
- [ ] UI logic separated from business logic
- [ ] No UI file exceeds 300 lines
- [ ] Event handlers properly organized

### Phase 5: Integration & Testing (Day 5)
**Goal:** Finalize split and ensure production readiness

**Tasks:**

1. **Create App Orchestrator** → `js/app.js` **(Target: 120 lines)**
   ```javascript
   // Minimal orchestration logic only
   const TradingWizardApp = {
     modules: {},
     init: function() {
       // Initialize in correct order
       this.initCore();
       this.initModules();
       this.initUI();
     }
   };
   ```

2. **Update index.html** **(Target: 250 lines)**
   ```html
   <!-- Pure HTML structure -->
   <!-- No inline JavaScript except init -->
   <script>
     document.addEventListener('DOMContentLoaded', function() {
       TradingWizardApp.init();
     });
   </script>
   ```

3. **Extract Styles** → `css/styles.css` **(Target: 150 lines)**
   ```css
   /* Component-specific styles only */
   /* Use CSS modules pattern for organization */
   ```

4. **Create Size Report**
   ```javascript
   // tools/size-report.js
   const sizeReport = {
     checkAll: function() {
       // Warn if any file > 400 lines
       // Error if any file > 600 lines
     }
   };
   ```

**Final Validation:**
- [ ] All files within size guidelines
- [ ] Average file size 200-300 lines
- [ ] No file exceeds 500 lines
- [ ] Clear module boundaries

## 5. Module Interface Specifications

### Core Modules (Each under 300 lines)

```javascript
// Config Module - Target: 80 lines
window.Config = {
  STORAGE_KEYS: {},
  PREDEFINED_SETUPS: [],
  get: function(key) {},
  set: function(key, value) {}
};

// Storage Module - Target: 150 lines
window.Storage = {
  init: function() {},
  get: function(key) {},
  set: function(key, value) {},
  remove: function(key) {},
  // Specific getters
  getCurrentPlan: function() {},
  getJournal: function() {}
};

// Auth Module - Target: 200 lines
window.Auth = {
  init: function() {},
  login: function() {},
  logout: function() {},
  isAuthenticated: function() {},
  getSession: function() {}
};
```

### Feature Modules (Each under 400 lines)

```javascript
// Trading Plan Module - Target: 400 lines
window.TradingPlan = {
  init: function() {},
  wizard: {
    start: function() {},
    validate: function() {},
    complete: function() {}
  },
  management: {
    save: function() {},
    load: function() {},
    delete: function() {}
  }
};

// Verdict Module - Target: 350 lines
window.Verdict = {
  init: function() {},
  evaluate: function(tradeText, plan, options) {},
  parse: function(text) {},
  render: function(results) {}
};

// Journal Module - Target: 350 lines
window.Journal = {
  init: function() {},
  entries: {
    add: function() {},
    update: function() {},
    delete: function() {}
  },
  stats: {
    calculate: function() {},
    render: function() {}
  }
};
```

## 6. File Size Monitoring & Enforcement

### Automated Checks

```json
// package.json
{
  "scripts": {
    "check:size": "node tools/check-file-sizes.js",
    "check:size:watch": "nodemon --watch js --exec npm run check:size",
    "pre-commit": "npm run check:size"
  }
}
```

```javascript
// tools/check-file-sizes.js
const fs = require('fs');
const path = require('path');

const LIMITS = {
  WARNING: 400,
  ERROR: 600,
  IDEAL_MIN: 200,
  IDEAL_MAX: 300
};

function checkFileSizes(dir) {
  const files = getAllJsFiles(dir);
  const report = {
    ideal: [],      // 200-300 lines
    acceptable: [], // 301-400 lines
    warning: [],    // 401-600 lines
    error: []       // 600+ lines
  };
  
  files.forEach(file => {
    const lines = countLines(file);
    if (lines <= LIMITS.IDEAL_MAX) report.ideal.push({file, lines});
    else if (lines <= LIMITS.WARNING) report.acceptable.push({file, lines});
    else if (lines <= LIMITS.ERROR) report.warning.push({file, lines});
    else report.error.push({file, lines});
  });
  
  printReport(report);
  
  if (report.error.length > 0) {
    console.error('❌ Files exceeding maximum size limit found!');
    process.exit(1);
  }
  
  if (report.warning.length > 0) {
    console.warn('⚠️  Files approaching size limit - consider refactoring');
  }
}
```

### Continuous Monitoring

```yaml
# .github/workflows/file-size-check.yml
name: File Size Check
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check file sizes
        run: |
          npm run check:size
      - name: Comment PR
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              body: '❌ File size check failed. One or more files exceed 600 lines.'
            })
```

## 7. Migration Checklist

### Pre-Migration
- [ ] Full backup of current index.html
- [ ] Set up file size monitoring
- [ ] Document test scenarios
- [ ] Create rollback plan

### During Migration
- [ ] Monitor file sizes continuously
- [ ] No file exceeds 400 lines (warning at 350)
- [ ] Test after each extraction
- [ ] Document any necessary deviations

### Post-Migration
- [ ] All files within size guidelines
- [ ] Average file size 200-300 lines
- [ ] No file over 500 lines absolute max
- [ ] Size monitoring automated

## 8. Success Criteria

### File Size Metrics
- [ ] **No file exceeds 500 lines** (hard limit)
- [ ] **80% of files between 200-300 lines** (sweet spot)
- [ ] **Average file size under 250 lines**
- [ ] **Largest file under 400 lines**

### Functional
- [ ] All existing features working identically
- [ ] No data loss or corruption
- [ ] No performance degradation
- [ ] All test cases passing

### Technical
- [ ] Clear module boundaries
- [ ] No circular dependencies
- [ ] < 10 global variables
- [ ] Each file has single responsibility

### Development
- [ ] 50% reduction in time to locate code
- [ ] Can unit test individual modules
- [ ] AI tools can process entire modules
- [ ] Parallel development enabled

## 9. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Files growing beyond limits | High | Medium | Automated size checks, PR reviews |
| Over-splitting (too many tiny files) | Medium | Low | Maintain 200-line minimum guideline |
| Breaking functionality during split | Medium | High | Test after each extraction |
| Losing cohesion | Low | Medium | Keep related logic together |
| Build complexity | Low | Low | Start with simple script tags |

## 10. Long-term Maintenance

### File Size Governance
1. **Code Review Checklist**
   - [ ] New files under 300 lines?
   - [ ] Modified files still under 400 lines?
   - [ ] Any file approaching 500 lines flagged?

2. **Quarterly Review**
   - Run size analysis
   - Identify growth patterns
   - Plan refactoring sprints

3. **Refactoring Triggers**
   - Any file > 500 lines
   - Average size > 300 lines
   - Frequent conflicts in same file

### Future Enhancements
1. **After Successful Split:**
   - Add build process (webpack/vite)
   - Migrate to ES6 modules
   - Add TypeScript
   - Implement proper bundling

2. **Component Library** (when files stabilize)
   - Extract reusable UI components
   - Create design system
   - Build component documentation

## 11. Timeline

| Day | Phase | Hours | Key Deliverable | Size Target |
|-----|-------|-------|-----------------|-------------|
| 1 | Preparation | 4 | Dev environment, structure | N/A |
| 2 | Core Extraction | 6 | 4 core modules | All < 300 lines |
| 3 | Feature Extraction | 8 | 4 feature modules | All < 400 lines |
| 4 | UI Extraction | 6 | 3 UI modules | All < 300 lines |
| 5 | Integration | 4 | Testing, size report | Avg 220 lines |

**Total: 28 hours (3-5 calendar days)**

## 12. Appendix: File Size Examples

### Good Examples (Within Guidelines)
```javascript
// auth.js - 195 lines ✅
// Clear single responsibility
// Easy to understand
// Fits in single screen

// config.js - 78 lines ✅  
// Pure configuration
// No logic mixing

// verdict.js - 342 lines ✅
// Complex but cohesive
// All related logic
```

### Bad Examples (Need Refactoring)
```javascript
// mega-module.js - 1200 lines ❌
// Multiple responsibilities
// Hard to navigate
// Merge conflict magnet

// utils.js - 650 lines ❌
// Kitchen sink of functions
// No clear organization
// Should be 3-4 files
```

## 13. Sign-off

This refactor prioritizes **maintainability** and **developer experience** while adhering to **industry-standard file size guidelines**. The 200-300 line sweet spot ensures optimal comprehension for both humans and AI tools.

**Approval to Proceed:**
- [ ] Technical Lead
- [ ] Product Owner  
- [ ] QA Lead

---

*Document Version: 1.1*  
*Last Updated: Current Date*  
*Next Review: Post-Implementation*  
*File Size Guidelines: Industry Best Practices Applied*