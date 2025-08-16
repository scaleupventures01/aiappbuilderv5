# Accessibility Guidelines: Message Input Component (PRD-1.1.4.4)

## 1. Executive Summary

This document provides comprehensive accessibility guidelines for the Message Input Component, ensuring full compliance with WCAG 2.1 AA standards and creating an inclusive experience for all users, including those using assistive technologies.

## 2. WCAG 2.1 AA Compliance Requirements

### 2.1 Perceivable Guidelines

#### 2.1.1 Text Alternatives (A)
```html
<!-- All interactive elements have appropriate labels -->
<button aria-label="Attach file to message" title="Attach file">
  <svg aria-hidden="true" role="img">
    <!-- Paperclip icon -->
  </svg>
</button>

<button 
  aria-label="Add emoji to message" 
  aria-expanded={showEmojiPicker}
  aria-haspopup="dialog"
  title="Add emoji"
>
  <svg aria-hidden="true" role="img">
    <!-- Smile icon -->
  </svg>
</button>

<button aria-label="Send message" title="Send message (Enter)">
  <svg aria-hidden="true" role="img">
    <!-- Send icon -->
  </svg>
</button>
```

#### 2.1.2 Captions and Other Alternatives (A)
```html
<!-- File attachments include descriptive information -->
<div role="listitem" aria-label="Attachment: trading-chart.png, 2.3 MB">
  <img src="preview.jpg" alt="Preview of trading chart showing upward trend" />
  <span class="sr-only">Trading chart image, 2.3 megabytes</span>
  <button aria-label="Remove trading-chart.png attachment">×</button>
</div>
```

#### 2.1.3 Adaptable Content (A)
```html
<!-- Proper semantic structure -->
<form role="form" aria-label="Send message to AI trading coach">
  <div role="group" aria-labelledby="message-input-label">
    <label id="message-input-label" class="sr-only">
      Message Content
    </label>
    
    <!-- Suggestions dropdown -->
    <div role="listbox" aria-label="Message suggestions">
      <div role="option" aria-selected="true">
        What's the market outlook?
      </div>
    </div>
    
    <!-- Attachments -->
    <div role="group" aria-label="File attachments">
      <div role="list" aria-label="Attached files">
        <!-- Attachment items -->
      </div>
    </div>
    
    <!-- Main input controls -->
    <div role="group" aria-label="Message input controls">
      <textarea 
        aria-label="Type your message to the AI trading coach"
        aria-describedby="input-help character-count"
        role="textbox"
        aria-multiline="true"
      />
    </div>
  </div>
</form>
```

#### 2.1.4 Distinguishable Content (AA)
```css
/* Color contrast requirements */
.message-input {
  /* Text contrast ratio ≥ 4.5:1 */
  color: #111827; /* Against white background = 16.74:1 */
  background: white;
}

.placeholder-text {
  /* Placeholder contrast ratio ≥ 4.5:1 */
  color: #6b7280; /* Against white background = 7.07:1 */
}

.error-text {
  /* Error text contrast ratio ≥ 4.5:1 */
  color: #dc2626; /* Against white background = 5.03:1 */
}

.focus-indicator {
  /* Focus indicator contrast ratio ≥ 3:1 */
  outline: 3px solid #2563eb; /* Against white background = 8.59:1 */
  outline-offset: 2px;
}

/* Dark mode compliance */
.dark .message-input {
  color: #f9fafb; /* Against dark background = 15.3:1 */
  background: #1f2937;
}

.dark .placeholder-text {
  color: #9ca3af; /* Against dark background = 4.54:1 */
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .message-input {
    border: 2px solid currentColor;
    background: ButtonFace;
    color: ButtonText;
  }
  
  .focus-indicator {
    outline: 4px solid Highlight;
    outline-offset: 2px;
  }
}
```

### 2.2 Operable Guidelines

#### 2.2.1 Keyboard Accessible (A)
```typescript
// Complete keyboard navigation support
const keyboardHandlers = {
  messageTextarea: {
    'Enter': '!shiftKey ? sendMessage() : insertNewLine()',
    'Escape': 'closeModals()',
    'Tab': 'suggestionsVisible ? applySuggestion() : defaultTab()',
    'ArrowUp': 'suggestionsVisible ? navigateUp() : defaultBehavior()',
    'ArrowDown': 'suggestionsVisible ? navigateDown() : defaultBehavior()'
  },
  
  emojiPicker: {
    'Escape': 'closePicker() && focusEmojiButton()',
    'ArrowLeft': 'navigateGrid(-1)',
    'ArrowRight': 'navigateGrid(+1)',
    'ArrowUp': 'navigateGrid(-cols)',
    'ArrowDown': 'navigateGrid(+cols)',
    'Enter': 'selectEmoji() && closePicker()',
    'Space': 'selectEmoji() && closePicker()'
  },
  
  attachmentList: {
    'ArrowLeft': 'previousAttachment()',
    'ArrowRight': 'nextAttachment()',
    'Delete': 'removeCurrentAttachment()',
    'Backspace': 'removeCurrentAttachment()'
  }
};

// Focus trap implementation
const implementFocusTrap = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  firstElement?.focus();
  
  return () => container.removeEventListener('keydown', handleTabKey);
};
```

#### 2.2.2 No Seizures (A)
```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .message-input * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Disable auto-resize animation */
  .message-textarea {
    transition: none !important;
  }
  
  /* Disable emoji picker animations */
  .emoji-picker-enter,
  .emoji-picker-exit {
    transition: none !important;
  }
  
  /* Disable button hover animations */
  .button-hover {
    transform: none !important;
  }
}

/* Ensure no flashing content */
.loading-animation {
  /* Spinner rotation is safe (continuous, no flashing) */
  animation: spin 1s linear infinite;
}

.typing-dots {
  /* Gentle pulsing animation, no rapid flashing */
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

#### 2.2.3 Navigable (A)
```html
<!-- Clear page structure and navigation -->
<main id="main-content">
  <section aria-label="Chat conversation">
    <!-- Chat messages -->
  </section>
  
  <section aria-label="Message composition">
    <form role="form" aria-label="Send message to AI trading coach">
      <!-- Message input component -->
    </form>
  </section>
</main>

<!-- Skip links for keyboard users -->
<a href="#main-content" class="skip-link">Skip to main content</a>
<a href="#message-input" class="skip-link">Skip to message input</a>

<!-- Proper heading structure -->
<h1>Elite Trading Coach AI</h1>
<h2>Chat Conversation</h2>
<h3 id="message-composition-heading">Compose Message</h3>

<!-- Landmark roles -->
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    <!-- Navigation items -->
  </nav>
</header>

<main role="main">
  <!-- Main content -->
</main>

<footer role="contentinfo">
  <!-- Footer content -->
</footer>
```

### 2.3 Understandable Guidelines

#### 2.3.1 Readable (A)
```html
<!-- Language identification -->
<html lang="en">
<head>
  <title>Elite Trading Coach AI - Chat</title>
</head>

<!-- Text direction for international users -->
<div dir="auto" lang="en">
  <textarea 
    placeholder="Ask your AI trading coach anything..."
    aria-label="Message input in English"
  />
</div>

<!-- Unusual words and abbreviations -->
<abbr title="Artificial Intelligence">AI</abbr> trading coach
<span title="Product Requirements Document">PRD</span>
```

#### 2.3.2 Predictable (A)
```typescript
// Consistent navigation and behavior
const consistentBehavior = {
  focusOrder: [
    'attachmentButton',
    'messageTextarea', 
    'emojiButton',
    'sendButton'
  ],
  
  // Consistent button behavior across app
  buttonPatterns: {
    primary: 'blue background, white text, consistent sizing',
    secondary: 'gray background, dark text, consistent sizing',
    disabled: 'gray background, lighter text, cursor not-allowed'
  },
  
  // Predictable state changes
  stateChanges: {
    'button click': 'immediate visual feedback',
    'form submission': 'loading state shown',
    'error occurrence': 'error message displayed with clear action'
  }
};

// No unexpected context changes
const preventUnexpectedChanges = {
  onFocus: 'no automatic form submission or navigation',
  onInput: 'no automatic submission until user explicitly sends',
  onChange: 'no surprise modal opening or page navigation'
};
```

#### 2.3.3 Input Assistance (A)
```html
<!-- Clear labels and instructions -->
<div>
  <label for="message-input" class="sr-only">
    Message to AI trading coach
  </label>
  <textarea
    id="message-input"
    aria-describedby="input-help character-count error-message"
    aria-invalid={hasError}
    required={false}
  />
  
  <!-- Helpful instructions -->
  <div id="input-help" class="sr-only">
    Type your question about trading strategies, market analysis, or risk management. 
    Press Enter to send, Shift+Enter for new line.
  </div>
  
  <!-- Character counter -->
  <div id="character-count" aria-live="polite" aria-atomic="true">
    {charactersRemaining} characters remaining
  </div>
  
  <!-- Error messages -->
  <div id="error-message" role="alert" aria-live="assertive">
    {errorMessage}
  </div>
</div>

<!-- File upload assistance -->
<div>
  <input
    type="file"
    id="file-input"
    aria-describedby="file-help file-error"
    accept="image/*,.pdf,.txt"
    multiple
  />
  
  <div id="file-help">
    Supported files: Images (PNG, JPG, GIF), PDFs, and text files. 
    Maximum size: 10MB per file. Maximum 5 files total.
  </div>
  
  <div id="file-error" role="alert" aria-live="assertive">
    {fileErrorMessage}
  </div>
</div>
```

### 2.4 Robust Guidelines

#### 2.4.1 Compatible (A)
```html
<!-- Valid HTML structure -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Message Input - Elite Trading Coach AI</title>
</head>
<body>
  <!-- Proper ARIA usage -->
  <div role="application" aria-label="Trading Coach Chat Interface">
    <form role="form">
      <div role="group" aria-labelledby="input-group-label">
        <h3 id="input-group-label" class="sr-only">Message Composition</h3>
        
        <!-- Proper form controls -->
        <textarea 
          role="textbox"
          aria-multiline="true"
          aria-required="false"
          aria-invalid="false"
        ></textarea>
        
        <button type="submit" role="button">Send</button>
      </div>
    </form>
  </div>
</body>
</html>
```

## 3. Screen Reader Optimization

### 3.1 Screen Reader Testing Results

#### NVDA (Windows)
```typescript
const nvdaOptimizations = {
  announcements: {
    onLoad: "Message composition form, type your message to the AI trading coach",
    onFocus: "Edit, message input, type in text",
    onCharacterLimit: "Warning: approaching character limit, 50 characters remaining",
    onFileAttach: "File attached: trading-chart.png, 2.3 megabytes",
    onSend: "Message sent to AI trading coach"
  },
  
  navigation: {
    headings: "H key navigates between sections",
    forms: "F key jumps to form controls",
    buttons: "B key cycles through buttons",
    landmarks: "D key navigates page landmarks"
  }
};
```

#### JAWS (Windows)
```typescript
const jawsOptimizations = {
  virtualCursor: {
    enabled: true,
    navigation: "arrow keys read content linearly",
    interaction: "Enter activates forms mode for input"
  },
  
  formsMode: {
    trigger: "focus on form controls",
    behavior: "direct interaction with controls",
    exit: "Escape returns to virtual cursor"
  },
  
  customizations: {
    roleAnnouncement: "clear role identification",
    stateChanges: "immediate announcement of state changes",
    errorHandling: "assertive error announcements"
  }
};
```

#### VoiceOver (macOS/iOS)
```typescript
const voiceOverOptimizations = {
  rotor: {
    headings: "navigate by heading level",
    forms: "quick access to form controls",
    landmarks: "navigate by ARIA landmarks"
  },
  
  gestures: {
    swipeRight: "next element",
    swipeLeft: "previous element",
    doubleTap: "activate element",
    twoFingerScroll: "scroll content"
  },
  
  announcements: {
    onFocus: "clear element identification",
    onStateChange: "immediate state announcements",
    onError: "clear error descriptions"
  }
};
```

### 3.2 Live Region Implementation

```html
<!-- Status announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only" id="status-announcements">
  <!-- Dynamically updated with status messages -->
</div>

<!-- Error announcements -->
<div aria-live="assertive" aria-atomic="true" class="sr-only" id="error-announcements">
  <!-- Dynamically updated with error messages -->
</div>

<!-- Character count updates -->
<div aria-live="polite" aria-atomic="false" id="character-count-live">
  {characterCount} characters
</div>
```

```typescript
// Live region management
const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = document.getElementById(
    priority === 'assertive' ? 'error-announcements' : 'status-announcements'
  );
  
  if (announcer) {
    announcer.textContent = message;
    
    // Clear after announcement to prevent re-reading
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
};

// Usage examples
announceToScreenReader('File attached: chart.png');
announceToScreenReader('Error: file too large', 'assertive');
announceToScreenReader('Message sent successfully');
```

## 4. Cognitive Accessibility

### 4.1 Clear Language and Instructions

```html
<!-- Simple, clear instructions -->
<div id="input-instructions">
  <h3>How to send a message:</h3>
  <ol>
    <li>Type your question in the text box</li>
    <li>Add files if needed (optional)</li>
    <li>Press Enter or click Send</li>
  </ol>
</div>

<!-- Error messages in plain language -->
<div role="alert">
  <strong>Error:</strong> Your file is too big. 
  Please choose a file smaller than 10MB.
  <a href="#file-help">Learn about supported files</a>
</div>

<!-- Progress indicators -->
<div aria-live="polite">
  Step 1 of 3: Type your message
</div>
```

### 4.2 Consistent Interface Patterns

```css
/* Consistent visual hierarchy */
.primary-action {
  background: #2563eb;
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
}

.secondary-action {
  background: #f3f4f6;
  color: #374151;
  font-weight: 500;
  padding: 12px 24px;
  border-radius: 8px;
}

.destructive-action {
  background: #dc2626;
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
}

/* Consistent spacing */
.form-group {
  margin-bottom: 1.5rem;
}

.form-control {
  margin-bottom: 0.5rem;
}
```

### 4.3 Memory and Attention Support

```typescript
// Auto-save draft messages
const useDraftSaving = () => {
  const [draft, setDraft] = useState('');
  
  useEffect(() => {
    const savedDraft = localStorage.getItem('message-draft');
    if (savedDraft) {
      setDraft(savedDraft);
      announceToScreenReader('Previous draft restored');
    }
  }, []);
  
  const saveDraft = useCallback(
    debounce((text: string) => {
      localStorage.setItem('message-draft', text);
    }, 1000),
    []
  );
  
  const clearDraft = () => {
    localStorage.removeItem('message-draft');
  };
  
  return { draft, saveDraft, clearDraft };
};

// Confirmation for destructive actions
const useConfirmation = (action: string) => {
  const confirm = (callback: () => void) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${action}? This cannot be undone.`
    );
    
    if (confirmed) {
      callback();
    }
  };
  
  return confirm;
};
```

## 5. Motor Accessibility

### 5.1 Large Touch Targets

```css
/* Minimum 44px touch targets */
@media (pointer: coarse) {
  .touch-target {
    min-width: 44px;
    min-height: 44px;
    padding: 12px;
  }
  
  .emoji-button {
    min-width: 44px;
    min-height: 44px;
    font-size: 1.5rem;
  }
  
  .attachment-remove {
    min-width: 44px;
    min-height: 44px;
    position: absolute;
    top: -8px;
    right: -8px;
  }
}

/* Desktop can use smaller targets */
@media (pointer: fine) {
  .touch-target {
    min-width: 32px;
    min-height: 32px;
    padding: 8px;
  }
}
```

### 5.2 Drag and Drop Alternatives

```html
<!-- Always provide alternative to drag-and-drop -->
<div>
  <div 
    class="dropzone"
    onDrop={handleDrop}
    onDragOver={handleDragOver}
  >
    <p>Drag files here</p>
    <p>or</p>
    <button type="button" onClick={openFilePicker}>
      Choose Files
    </button>
  </div>
  
  <input
    type="file"
    ref={fileInputRef}
    onChange={handleFileSelect}
    style={{ display: 'none' }}
    multiple
    accept="image/*,.pdf,.txt"
  />
</div>
```

### 5.3 Timeout Extensions

```typescript
// Generous timeouts for users who need more time
const timeoutSettings = {
  typing: 5000, // 5 seconds before stopping typing indicator
  autoSave: 10000, // 10 seconds for auto-save
  sessionWarning: 300000, // 5 minutes before session warning
  sessionTimeout: 1800000, // 30 minutes total session
};

// Allow users to extend timeouts
const extendTimeout = () => {
  announceToScreenReader('Session extended for 30 more minutes');
  // Reset timeout timers
};
```

## 6. Visual Accessibility

### 6.1 High Contrast Support

```css
/* Windows High Contrast Mode */
@media (-ms-high-contrast: active) {
  .message-input {
    background: ButtonFace;
    color: ButtonText;
    border: 1px solid ButtonText;
  }
  
  .send-button {
    background: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonText;
  }
  
  .send-button:hover {
    background: Highlight;
    color: HighlightText;
  }
  
  .focus-indicator {
    outline: 2px solid WindowText;
  }
}

/* CSS forced-colors mode */
@media (forced-colors: active) {
  .message-input {
    background: Field;
    color: FieldText;
    border: 1px solid FieldText;
  }
  
  .send-button {
    background: ButtonFace;
    color: ButtonText;
    border: 1px solid ButtonText;
    forced-color-adjust: none;
  }
}

/* User preference for high contrast */
@media (prefers-contrast: high) {
  .message-input {
    border-width: 2px;
    border-color: currentColor;
  }
  
  .focus-indicator {
    outline-width: 4px;
  }
  
  .button-hover {
    filter: contrast(1.2);
  }
}
```

### 6.2 Font Size and Zoom Support

```css
/* Support up to 200% zoom */
.message-input {
  /* Use relative units */
  font-size: 1rem;
  line-height: 1.5;
  padding: 0.75rem;
  
  /* Prevent horizontal scrolling */
  max-width: 100%;
  word-wrap: break-word;
}

/* Support user font size preferences */
@media (min-font-size: 18px) {
  .message-input {
    font-size: max(1rem, 18px);
  }
}

/* Large text support */
@media (prefers-font-size: large) {
  .message-input {
    font-size: 1.125rem;
    line-height: 1.6;
  }
  
  .touch-target {
    min-height: 48px;
    min-width: 48px;
  }
}
```

## 7. Testing and Validation

### 7.1 Automated Testing

```javascript
// axe-core accessibility testing
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Message Input Accessibility', () => {
  test('should not have accessibility violations', async () => {
    const { container } = render(<MessageInput />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  test('should have proper ARIA labels', () => {
    const { getByLabelText } = render(<MessageInput />);
    expect(getByLabelText('Type your message to the AI trading coach')).toBeInTheDocument();
    expect(getByLabelText('Attach file')).toBeInTheDocument();
    expect(getByLabelText('Add emoji')).toBeInTheDocument();
    expect(getByLabelText('Send message')).toBeInTheDocument();
  });
  
  test('should support keyboard navigation', () => {
    const { container } = render(<MessageInput />);
    const focusableElements = container.querySelectorAll(
      'button, input, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // Test tab order
    focusableElements[0].focus();
    fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    expect(document.activeElement).toBe(focusableElements[1]);
  });
});
```

### 7.2 Manual Testing Checklist

#### Screen Reader Testing
- [ ] NVDA (Windows) - All content readable, proper navigation
- [ ] JAWS (Windows) - Forms mode works correctly
- [ ] VoiceOver (macOS) - Rotor navigation functional
- [ ] VoiceOver (iOS) - Mobile gestures work
- [ ] TalkBack (Android) - Touch exploration works

#### Keyboard Testing
- [ ] All functionality accessible via keyboard
- [ ] Tab order is logical and predictable
- [ ] Focus indicators are clearly visible
- [ ] Keyboard shortcuts work as expected
- [ ] Focus trap works in modals/pickers

#### Color and Contrast Testing
- [ ] 4.5:1 contrast ratio for normal text
- [ ] 3:1 contrast ratio for large text and graphics
- [ ] Color is not the only way to convey information
- [ ] High contrast mode works properly

#### Motor Accessibility Testing
- [ ] Touch targets are minimum 44px
- [ ] Drag-and-drop has keyboard alternatives
- [ ] No fine motor control required
- [ ] Generous click targets and timing

#### Cognitive Accessibility Testing
- [ ] Clear, simple language used
- [ ] Consistent interface patterns
- [ ] Error messages are helpful
- [ ] Auto-save prevents data loss

## 8. Implementation Recommendations

### 8.1 Priority Implementation Order

1. **Critical (Week 1)**
   - ARIA labels and roles
   - Keyboard navigation
   - Focus management
   - Color contrast compliance

2. **High Priority (Week 2)**
   - Screen reader optimization
   - Error message clarity
   - Touch target sizing
   - Live region announcements

3. **Medium Priority (Week 3)**
   - High contrast mode support
   - Reduced motion preferences
   - Auto-save functionality
   - Timeout extensions

4. **Enhancement (Week 4)**
   - Advanced screen reader features
   - Cognitive accessibility aids
   - Custom user preferences
   - Performance optimizations

### 8.2 Ongoing Maintenance

```typescript
// Regular accessibility auditing
const accessibilityAudit = {
  automated: {
    tool: 'axe-core',
    frequency: 'every CI build',
    coverage: 'all components'
  },
  
  manual: {
    screenReader: 'monthly testing',
    keyboard: 'every feature release',
    userTesting: 'quarterly with disabled users'
  },
  
  compliance: {
    standard: 'WCAG 2.1 AA',
    validation: 'third-party audit annually',
    certification: 'accessibility statement updated'
  }
};
```

## 9. Conclusion

This comprehensive accessibility implementation ensures the Message Input Component meets WCAG 2.1 AA standards and provides an inclusive experience for all users. Regular testing and user feedback will help maintain and improve accessibility over time.

The guidelines provided here should be extended to all components in the Elite Trading Coach AI platform to ensure consistent accessibility across the entire application.

---

**Document Version**: 1.0  
**Last Updated**: August 14, 2025  
**Author**: UX Designer (Elite Trading Coach AI Team)  
**Accessibility Compliance**: WCAG 2.1 AA  
**Review Status**: Ready for Implementation