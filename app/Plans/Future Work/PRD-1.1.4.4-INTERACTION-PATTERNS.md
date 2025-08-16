# Interaction Patterns Documentation: Message Input Component

## 1. Overview

This document defines the detailed interaction patterns for the Message Input Component, providing developers and designers with specific guidance on implementing consistent user interactions across the Elite Trading Coach AI platform.

## 2. Core Interaction Patterns

### 2.1 Text Input Interactions

#### Primary Text Input Behavior
```typescript
interface TextInputInteraction {
  // Auto-resize behavior
  onInput: {
    trigger: 'text change',
    response: 'immediate height adjustment',
    constraints: {
      minHeight: '48px',
      maxHeight: '150px',
      animationDuration: '150ms'
    }
  },
  
  // Character limit feedback
  onCharacterLimit: {
    trigger: 'approaching 80% of maxLength',
    response: 'show character counter',
    states: {
      normal: 'gray-500 text color',
      warning: 'amber-500 text color (>95%)',
      critical: 'red-500 text color (100%)'
    }
  }
}
```

#### Keyboard Shortcuts Pattern
```typescript
const keyboardInteractions = {
  'Enter': {
    condition: '!shiftKey && hasContent',
    action: 'sendMessage',
    preventDefault: true,
    feedback: 'immediate send animation'
  },
  
  'Shift + Enter': {
    condition: 'always',
    action: 'insertNewLine',
    preventDefault: false,
    feedback: 'cursor moves to new line'
  },
  
  'Escape': {
    condition: 'modalOpen || pickerOpen',
    action: 'closeModals',
    preventDefault: true,
    feedback: 'modal closes with animation'
  },
  
  'Tab': {
    condition: 'suggestionsVisible',
    action: 'applySuggestion',
    preventDefault: true,
    feedback: 'suggestion applied, focus returns'
  }
};
```

### 2.2 Button Interaction Patterns

#### State-Based Button Behavior
```typescript
interface ButtonInteractionStates {
  idle: {
    visual: 'default appearance',
    cursor: 'pointer',
    accessibility: 'actionable'
  },
  
  hover: {
    visual: 'background color change + scale(1.05)',
    cursor: 'pointer',
    transition: '200ms ease',
    haptic: 'none'
  },
  
  active: {
    visual: 'scale(0.95) + darker background',
    cursor: 'pointer',
    transition: '100ms ease',
    haptic: 'light' // mobile only
  },
  
  disabled: {
    visual: 'opacity 0.5 + gray background',
    cursor: 'not-allowed',
    accessibility: 'disabled state announced',
    interaction: 'blocked'
  },
  
  loading: {
    visual: 'spinner animation + reduced opacity',
    cursor: 'default',
    accessibility: 'loading announced',
    interaction: 'blocked'
  }
}
```

#### Send Button Specific Pattern
```typescript
const sendButtonPattern = {
  enableCondition: 'messageContent.trim() || attachments.length > 0',
  disableCondition: 'isSending || disabled || (!messageContent && !attachments)',
  
  states: {
    enabled: {
      background: 'bg-blue-600',
      hover: 'bg-blue-700 + shadow-lg + scale(1.05)',
      active: 'bg-blue-800 + scale(0.95)',
      icon: 'send icon',
      accessibility: 'Send message'
    },
    
    disabled: {
      background: 'bg-gray-300',
      hover: 'no change',
      active: 'no change',
      icon: 'send icon (dimmed)',
      accessibility: 'Send message - disabled, add content to enable'
    },
    
    sending: {
      background: 'bg-blue-600',
      hover: 'no change',
      active: 'no change',
      icon: 'spinning loader',
      accessibility: 'Sending message'
    }
  }
};
```

### 2.3 File Upload Interaction Patterns

#### Drag and Drop Interaction Flow
```typescript
const dragDropPattern = {
  // Phase 1: Drag Enter
  onDragEnter: {
    visual: 'container highlights with blue border',
    feedback: 'drag overlay appears',
    cursor: 'copy',
    accessibility: 'Drop zone activated'
  },
  
  // Phase 2: Drag Over
  onDragOver: {
    visual: 'maintain highlight state',
    feedback: 'overlay message "Drop files here"',
    cursor: 'copy',
    preventDefault: true
  },
  
  // Phase 3: Drag Leave
  onDragLeave: {
    visual: 'remove highlights',
    feedback: 'overlay disappears',
    cursor: 'default',
    accessibility: 'Drop zone deactivated'
  },
  
  // Phase 4: Drop
  onDrop: {
    visual: 'immediate feedback + file preview',
    feedback: 'files added to attachment list',
    validation: 'type and size checking',
    accessibility: 'X files added to message',
    errorHandling: 'invalid files rejected with message'
  }
};
```

#### File Selection Button Pattern
```typescript
const fileSelectionPattern = {
  buttonClick: {
    action: 'trigger hidden file input',
    feedback: 'system file picker opens',
    accessibility: 'File picker opened'
  },
  
  fileSelection: {
    validation: [
      'file type checking',
      'file size validation (10MB max)',
      'total files limit (5 max)'
    ],
    
    success: {
      feedback: 'file preview appears',
      accessibility: 'File added: filename.ext'
    },
    
    error: {
      feedback: 'error message display',
      accessibility: 'Error: invalid file type or size'
    }
  }
};
```

#### Attachment Management Pattern
```typescript
const attachmentPattern = {
  preview: {
    layout: 'horizontal scroll when > 3 files',
    components: ['thumbnail', 'filename', 'remove button'],
    accessibility: 'list of attachments with remove options'
  },
  
  removal: {
    desktop: {
      trigger: 'click remove button (X)',
      feedback: 'immediate removal + fade animation',
      confirmation: 'none (easily undoable)'
    },
    
    mobile: {
      trigger: 'swipe left on attachment',
      feedback: 'swipe animation + removal',
      fallback: 'remove button tap',
      haptic: 'medium feedback on removal'
    }
  }
};
```

### 2.4 Emoji Picker Interaction Patterns

#### Picker Activation Pattern
```typescript
const emojiPickerPattern = {
  activation: {
    trigger: 'emoji button click',
    animation: 'fade in + scale up from button',
    focus: 'search input receives focus',
    accessibility: 'Emoji picker opened'
  },
  
  navigation: {
    categories: {
      trigger: 'tab buttons or horizontal scroll',
      feedback: 'active category highlighted',
      accessibility: 'category name announced'
    },
    
    grid: {
      keyboard: 'arrow keys navigate grid',
      mouse: 'hover highlights emoji',
      touch: 'tap selects immediately',
      accessibility: 'emoji name announced on focus'
    }
  },
  
  selection: {
    trigger: 'click/tap emoji or Enter key',
    action: 'insert at cursor position',
    feedback: 'picker closes + cursor moves after emoji',
    accessibility: 'emoji inserted'
  },
  
  search: {
    input: 'real-time filtering as user types',
    feedback: 'grid updates immediately',
    noResults: 'helpful message with suggestions',
    accessibility: 'X emojis found'
  }
};
```

### 2.5 Suggestions Interaction Pattern

#### Auto-complete Behavior
```typescript
const suggestionsPattern = {
  trigger: {
    condition: 'word length > 1 character',
    delay: '300ms debounced',
    source: 'suggestions prop array'
  },
  
  display: {
    position: 'above input field',
    layout: 'dropdown list',
    maxItems: 5,
    accessibility: 'suggestions list with X items'
  },
  
  navigation: {
    keyboard: {
      'ArrowDown': 'move to next suggestion',
      'ArrowUp': 'move to previous suggestion',
      'Tab': 'accept selected suggestion',
      'Enter': 'accept selected suggestion',
      'Escape': 'close suggestions'
    },
    
    mouse: {
      hover: 'highlight suggestion',
      click: 'accept suggestion'
    }
  },
  
  application: {
    action: 'replace current word with suggestion',
    feedback: 'suggestions close + focus returns to input',
    cursor: 'positioned after completed word'
  }
};
```

## 3. Mobile-Specific Interaction Patterns

### 3.1 Touch Optimization

#### Touch Target Specifications
```typescript
const touchTargets = {
  minimum: {
    width: '44px',
    height: '44px',
    reasoning: 'iOS HIG and Material Design guidelines'
  },
  
  spacing: {
    between: '8px minimum',
    reasoning: 'prevent accidental touches'
  },
  
  feedback: {
    visual: 'immediate highlight on touch',
    haptic: 'appropriate to action weight',
    audio: 'system sounds when enabled'
  }
};
```

#### Virtual Keyboard Handling
```typescript
const virtualKeyboardPattern = {
  onShow: {
    behavior: 'resize viewport or scroll to keep input visible',
    ios: 'use env(keyboard-inset-height)',
    android: 'use visual viewport API when available'
  },
  
  inputFocus: {
    prevention: 'font-size: 16px to prevent zoom on iOS',
    behavior: 'smooth scroll to bring input into view',
    timing: 'after keyboard animation completes'
  },
  
  onHide: {
    behavior: 'restore original viewport',
    cleanup: 'reset any temporary styles'
  }
};
```

### 3.2 Gesture Support

#### Swipe Gestures
```typescript
const swipeGestures = {
  fileRemoval: {
    direction: 'left swipe on attachment',
    threshold: '100px movement',
    feedback: 'slide animation + haptic',
    cancellation: 'swipe back right',
    completion: 'file removed from list'
  },
  
  emojiCategories: {
    direction: 'horizontal swipe on emoji picker',
    behavior: 'change category',
    feedback: 'smooth transition animation'
  }
};
```

## 4. Accessibility Interaction Patterns

### 4.1 Screen Reader Navigation

#### Focus Management Flow
```typescript
const focusFlow = {
  messageInput: {
    role: 'textbox',
    multiline: true,
    describedBy: ['hints', 'character-count', 'error-message'],
    label: 'Message to AI trading coach'
  },
  
  attachmentButton: {
    role: 'button',
    label: 'Attach file',
    expanded: false,
    hasPopup: false
  },
  
  emojiButton: {
    role: 'button',
    label: 'Add emoji',
    expanded: emojiPickerOpen,
    hasPopup: 'dialog'
  },
  
  sendButton: {
    role: 'button',
    label: 'Send message',
    disabled: !hasContent,
    describedBy: ['send-hint']
  }
};
```

#### Live Region Announcements
```typescript
const liveRegions = {
  characterCount: {
    ariaLive: 'polite',
    ariaAtomic: true,
    condition: 'when approaching limit',
    message: '{count} characters remaining'
  },
  
  fileUpload: {
    ariaLive: 'polite',
    ariaAtomic: true,
    messages: {
      added: 'File {filename} added to message',
      removed: 'File {filename} removed',
      error: 'Error: {errorMessage}'
    }
  },
  
  sendStatus: {
    ariaLive: 'assertive',
    ariaAtomic: true,
    messages: {
      sending: 'Sending message',
      sent: 'Message sent',
      error: 'Failed to send message'
    }
  }
};
```

### 4.2 Keyboard Navigation Patterns

#### Tab Order
```typescript
const tabOrder = [
  'attachmentButton',     // 1
  'messageTextarea',      // 2
  'emojiButton',         // 3
  'sendButton',          // 4
  // When emoji picker open:
  'emojiSearchInput',    // 5 (trap focus in picker)
  'emojiGrid',           // 6 (arrow key navigation)
  'emojiCloseButton'     // 7
];
```

#### Focus Trap Implementation
```typescript
const focusTrap = {
  emojiPicker: {
    onOpen: 'focus search input',
    boundaries: ['searchInput', 'categoryTabs', 'emojiGrid', 'closeButton'],
    onEscape: 'close picker + return focus to emoji button',
    onClickOutside: 'close picker + return focus'
  },
  
  attachmentPreview: {
    navigation: 'arrow keys between attachments',
    action: 'Enter/Space to remove',
    escape: 'return focus to attachment button'
  }
};
```

## 5. Error State Interaction Patterns

### 5.1 Validation Error Handling

#### Input Validation Pattern
```typescript
const validationPattern = {
  characterLimit: {
    trigger: 'real-time as user types',
    visual: 'red border + error color',
    message: 'Message too long. {charactersOver} characters over limit.',
    accessibility: 'Error announced via aria-live',
    recovery: 'auto-remove excess characters or prevent input'
  },
  
  fileValidation: {
    triggers: ['invalid type', 'file too large', 'too many files'],
    visual: 'error state on file + error message',
    messages: {
      type: 'File type not supported. Please use images, PDFs, or text files.',
      size: 'File too large. Maximum size is 10MB.',
      count: 'Too many files. Maximum is 5 files per message.'
    },
    accessibility: 'Error announced immediately',
    recovery: 'remove invalid files + allow retry'
  }
};
```

### 5.2 Network Error Recovery

#### Connection Error Pattern
```typescript
const networkErrorPattern = {
  detection: {
    trigger: 'send failure or offline detection',
    visual: 'offline indicator + retry button',
    message: 'Connection lost. Message will be sent when connection is restored.',
    accessibility: 'Connection error announced'
  },
  
  retry: {
    automatic: 'exponential backoff (1s, 2s, 4s, 8s, max 30s)',
    manual: 'retry button with attempt counter',
    visual: 'loading state during retry',
    accessibility: 'Retrying... attempt {number}'
  },
  
  recovery: {
    success: 'normal state restored + success message',
    persistence: 'continue retrying in background',
    userControl: 'option to cancel or modify message'
  }
};
```

## 6. Performance Interaction Patterns

### 6.1 Optimistic Updates

#### Message Sending Pattern
```typescript
const optimisticPattern = {
  onSend: {
    immediate: [
      'clear input field',
      'add message to chat (pending state)',
      'show sending indicator'
    ],
    
    onSuccess: [
      'update message status to sent',
      'remove sending indicator',
      'focus returns to input'
    ],
    
    onError: [
      'restore message to input',
      'show error state',
      'offer retry options'
    ]
  }
};
```

### 6.2 Debounced Operations

#### Performance Optimizations
```typescript
const debouncedOperations = {
  autoResize: {
    delay: '16ms', // ~60fps
    reasoning: 'prevent layout thrashing'
  },
  
  typingIndicator: {
    delay: '300ms',
    reasoning: 'reduce network traffic'
  },
  
  suggestions: {
    delay: '300ms',
    reasoning: 'prevent excessive API calls'
  },
  
  search: {
    delay: '200ms',
    reasoning: 'improve search performance'
  }
};
```

## 7. Contextual Interaction Patterns

### 7.1 Adaptive Behavior

#### Context-Aware Patterns
```typescript
const adaptivePatterns = {
  conversationContext: {
    firstMessage: {
      placeholder: 'Ask your AI trading coach anything...',
      suggestions: ['market analysis', 'trading strategy', 'risk management']
    },
    
    ongoing: {
      placeholder: 'Continue your conversation...',
      suggestions: 'based on conversation history'
    }
  },
  
  deviceContext: {
    mobile: {
      emojiPicker: 'full-screen overlay',
      fileUpload: 'native picker preferred',
      keyboard: 'optimize for virtual keyboard'
    },
    
    desktop: {
      emojiPicker: 'floating panel',
      fileUpload: 'drag-drop preferred',
      keyboard: 'full keyboard shortcuts'
    }
  },
  
  userPreferences: {
    reducedMotion: 'disable animations',
    highContrast: 'enhanced visual indicators',
    largeText: 'increased touch targets'
  }
};
```

## 8. Testing Interaction Patterns

### 8.1 Interaction Testing Scenarios

#### Core Functionality Tests
```typescript
const interactionTests = {
  textInput: [
    'type message and press Enter to send',
    'use Shift+Enter for new line',
    'auto-resize works with long messages',
    'character limit prevents over-input'
  ],
  
  fileUpload: [
    'drag and drop files to attach',
    'click attachment button to select files',
    'remove attachments with remove button',
    'validation rejects invalid files'
  ],
  
  emojiPicker: [
    'open emoji picker with button',
    'navigate with keyboard and mouse',
    'search for specific emojis',
    'insert emoji at cursor position'
  ],
  
  accessibility: [
    'navigate with keyboard only',
    'work with screen reader',
    'respect user preferences',
    'provide appropriate feedback'
  ]
};
```

### 8.2 Edge Case Interaction Testing

#### Stress Test Scenarios
```typescript
const edgeCaseTests = {
  performance: [
    'rapid typing without lag',
    'large file uploads',
    'many emoji selections',
    'quick send button clicks'
  ],
  
  error: [
    'network disconnection during send',
    'invalid file drop',
    'character limit exceeded',
    'multiple validation errors'
  ],
  
  concurrent: [
    'typing while file uploading',
    'emoji picker open while dragging files',
    'suggestions shown while sending',
    'multiple users typing simultaneously'
  ]
};
```

## 9. Implementation Guidelines

### 9.1 Code Organization

#### Interaction Hook Structure
```typescript
// Custom hooks for interaction patterns
export const useMessageInput = () => {
  // Text input interactions
  const textInputHandlers = useTextInputInteractions();
  
  // File upload interactions  
  const fileUploadHandlers = useFileUploadInteractions();
  
  // Emoji picker interactions
  const emojiHandlers = useEmojiInteractions();
  
  // Keyboard shortcut handling
  const keyboardHandlers = useKeyboardShortcuts();
  
  return {
    ...textInputHandlers,
    ...fileUploadHandlers,
    ...emojiHandlers,
    ...keyboardHandlers
  };
};
```

### 9.2 Consistency Guidelines

#### Cross-Component Consistency
```typescript
const consistencyRules = {
  animations: {
    duration: 'use standard durations (150ms, 200ms, 300ms)',
    easing: 'use consistent easing functions',
    properties: 'animate transform and opacity for performance'
  },
  
  feedback: {
    timing: 'immediate visual feedback (<16ms)',
    accessibility: 'announce changes within 100ms',
    haptic: 'consistent haptic patterns across similar actions'
  },
  
  errorHandling: {
    visual: 'consistent error styling',
    messaging: 'clear, actionable error messages',
    recovery: 'always provide recovery path'
  }
};
```

## 10. Conclusion

These interaction patterns ensure a consistent, accessible, and delightful user experience across the Message Input Component. By following these specifications, developers can implement interactions that feel natural, respond appropriately to user actions, and work seamlessly across all devices and accessibility tools.

The patterns defined here should be used as a reference for implementing similar components throughout the Elite Trading Coach AI platform, ensuring a cohesive user experience across the entire application.

---

**Document Version**: 1.0  
**Last Updated**: August 14, 2025  
**Author**: UX Designer (Elite Trading Coach AI Team)  
**Review Status**: Ready for Implementation