# Manual Testing Evidence Collection Guide - PRD 1.2.7

## Evidence Collection Instructions

This document provides instructions for QA engineers to collect evidence during manual browser testing of the VerdictDisplay component.

### Required Screenshots and Evidence

#### 1. Component Functionality Evidence

**Screenshot Requirements:**
- [ ] Diamond verdict displayed in default state
- [ ] Fire verdict displayed in default state  
- [ ] Skull verdict displayed in default state
- [ ] All three verdicts shown side by side
- [ ] Confidence bar animation in progress (mid-animation)
- [ ] Different size variations (small, medium, large)
- [ ] Compact mode vs full mode comparison

**Console Evidence:**
- [ ] Browser console showing no errors on component load
- [ ] Network tab showing successful resource loading
- [ ] Performance tab showing smooth 60fps animations

#### 2. Accessibility Evidence

**Screen Reader Testing:**
- [ ] Screen reader output reading verdict information
- [ ] ARIA label announcements
- [ ] Progress bar value announcements
- [ ] Keyboard navigation flow recording

**Accessibility Tool Results:**
- [ ] axe-core extension results (0 violations expected)
- [ ] Lighthouse accessibility score (90+ expected)
- [ ] Wave tool analysis results
- [ ] Color contrast analyzer results

**Browser Dev Tools:**
- [ ] Accessibility tree in Chrome DevTools
- [ ] Focus indicators visible on Tab navigation
- [ ] Keyboard event responses (Enter/Space)

#### 3. Responsive Design Evidence

**Viewport Screenshots:**
- [ ] Mobile view (375px width) - all verdicts
- [ ] Tablet view (768px width) - all verdicts  
- [ ] Desktop view (1200px+ width) - all verdicts
- [ ] Ultra-wide view (1920px+ width) - all verdicts

**Responsive Behavior:**
- [ ] Component scaling smoothly during resize
- [ ] Text readability maintained at all sizes
- [ ] Layout integrity preserved
- [ ] Horizontal scrolling avoided

#### 4. Animation Evidence

**Animation Screenshots/Videos:**
- [ ] Entrance animation sequence (before/during/after)
- [ ] Icon bounce animation
- [ ] Confidence bar fill animation
- [ ] Reduced motion preference respected

**Performance Evidence:**
- [ ] Chrome DevTools Performance tab during animations
- [ ] Frame rate consistency (60fps target)
- [ ] CPU usage during animations
- [ ] Memory usage stability

#### 5. Browser Compatibility Evidence

**Cross-Browser Screenshots:**
- [ ] Chrome - all verdicts rendered correctly
- [ ] Firefox - all verdicts rendered correctly
- [ ] Safari - all verdicts rendered correctly
- [ ] Edge - all verdicts rendered correctly

**Compatibility Testing:**
- [ ] Feature detection results for each browser
- [ ] Console logs for any browser-specific issues
- [ ] Polyfill requirements verification

#### 6. Dark Mode Evidence

**Theme Screenshots:**
- [ ] Light mode - all verdicts
- [ ] Dark mode - all verdicts
- [ ] Theme transition smoothness
- [ ] Color contrast maintenance

#### 7. Integration Evidence

**Chat Interface Integration:**
- [ ] Verdict component within chat message bubble
- [ ] Click interaction working in chat context
- [ ] Multiple verdicts in conversation view
- [ ] Scroll performance with multiple verdicts

### Testing Commands

**Browser Console Commands:**
```javascript
// Run automated QA validation
verdictQA.runFull()

// Test user interactions
verdictQA.testInteractions()

// Get detailed results
verdictQA.getResults()
```

**Accessibility Testing Commands:**
```javascript
// Test with axe-core (if available)
axe.run()

// Check color contrast
// Use browser extension or dev tools

// Test keyboard navigation
// Use Tab, Enter, Space keys manually
```

### Evidence Collection Checklist

#### Setup Phase
- [ ] Development server running on localhost:5174
- [ ] Verdict demo page accessible at /verdict-demo
- [ ] Browser dev tools open
- [ ] Screen recording software ready
- [ ] Accessibility testing tools installed

#### Testing Phase
- [ ] All verdict types tested individually
- [ ] All size variations tested
- [ ] All animation states captured
- [ ] All viewport sizes tested
- [ ] All browser compatibility verified
- [ ] All accessibility features validated

#### Documentation Phase
- [ ] Screenshots organized and labeled
- [ ] Console outputs captured
- [ ] Performance metrics recorded
- [ ] Issues documented with reproduction steps
- [ ] Evidence uploaded to QA directory

### Evidence File Naming Convention

```
screenshot_[component]_[feature]_[browser]_[timestamp].png
video_[component]_[animation]_[browser]_[timestamp].mp4
console_[component]_[test_type]_[browser]_[timestamp].txt
report_[component]_[tool_name]_[timestamp].json
```

Examples:
- `screenshot_verdict_diamond_chrome_20250815.png`
- `video_verdict_animations_firefox_20250815.mp4`
- `console_verdict_errors_safari_20250815.txt`
- `report_verdict_lighthouse_20250815.json`

### Test Data for Manual Testing

Use these sample verdict data objects for consistent testing:

```javascript
const testVerdicts = {
  diamond: {
    verdict: 'Diamond',
    confidence: 92,
    reasoning: 'Strong bullish indicators with high volume breakout above key resistance levels.',
    processingTime: 1250,
    timestamp: new Date().toISOString()
  },
  fire: {
    verdict: 'Fire', 
    confidence: 75,
    reasoning: 'Moderate bullish momentum detected with increasing volume.',
    processingTime: 980,
    timestamp: new Date().toISOString()
  },
  skull: {
    verdict: 'Skull',
    confidence: 88, 
    reasoning: 'Bearish divergence signals with breakdown below critical support.',
    processingTime: 1100,
    timestamp: new Date().toISOString()
  }
};
```

### Expected Results Summary

- **Functionality:** All verdict types display correctly with proper styling
- **Accessibility:** Screen readers announce all content, keyboard navigation works
- **Performance:** Animations run at 60fps, no memory leaks
- **Responsive:** Adapts to all viewport sizes gracefully
- **Compatibility:** Works identically across all modern browsers
- **Integration:** Fits seamlessly into chat interface design

### Deliverables

1. **Evidence Package:** Screenshots, videos, console outputs
2. **Test Results:** Detailed pass/fail status for each test case
3. **Issue Report:** Any bugs or inconsistencies found
4. **Recommendations:** Suggestions for improvements
5. **Sign-off:** Final approval for production deployment

---

**Note:** This evidence collection should be performed by a human QA engineer using actual browsers. The automated validation script provides a foundation, but manual verification ensures real-world usability and accessibility.

Save all evidence in the `/QA/1.2.7-verdict-display-system/evidence/` directory with appropriate file naming and organization.