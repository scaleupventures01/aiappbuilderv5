# Mobile UX Requirements: Message Input Component (PRD-1.1.4.4)

## 1. Executive Summary

This document defines comprehensive mobile user experience requirements for the Message Input Component, ensuring optimal functionality and usability across all mobile devices and form factors. The implementation focuses on touch-first interactions, responsive design, and mobile-specific optimizations.

## 2. Mobile-First Design Principles

### 2.1 Touch-First Interaction Design

#### Touch Target Specifications
```css
/* Primary touch targets - minimum 44px per iOS HIG and Material Design */
.mobile-touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
  margin: 4px;
  touch-action: manipulation;
}

/* Button specifications for mobile */
@media (max-width: 768px) {
  .attachment-button,
  .emoji-button,
  .send-button {
    min-height: 44px;
    min-width: 44px;
    padding: 10px;
    border-radius: 8px;
  }
  
  .send-button {
    /* Slightly larger for primary action */
    min-height: 48px;
    min-width: 48px;
    padding: 12px;
  }
  
  /* Emoji picker buttons */
  .emoji-grid-button {
    min-height: 44px;
    min-width: 44px;
    font-size: 1.25rem;
    border-radius: 6px;
  }
}

/* Tablet adjustments */
@media (min-width: 769px) and (max-width: 1024px) {
  .mobile-touch-target {
    min-height: 40px;
    min-width: 40px;
  }
}
```

#### Touch Interaction Feedback
```typescript
// Haptic feedback for iOS and Android
const useTouchFeedback = () => {
  const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy') => {
    // iOS Haptic Feedback
    if ('Haptics' in window && 'impact' in window.Haptics) {
      window.Haptics.impact({ style: intensity });
    }
    
    // Android Vibration API
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      navigator.vibrate(patterns[intensity]);
    }
  };
  
  return {
    onButtonPress: () => triggerHaptic('light'),
    onSendMessage: () => triggerHaptic('medium'),
    onError: () => triggerHaptic('heavy'),
    onFileAttach: () => triggerHaptic('light')
  };
};

// Visual touch feedback
const touchFeedbackStyles = `
  .touch-feedback {
    transition: all 100ms ease-out;
    position: relative;
    overflow: hidden;
  }
  
  .touch-feedback:active {
    transform: scale(0.96);
    background-color: var(--touch-active-bg);
  }
  
  .touch-feedback::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: translate(-50%, -50%);
    transition: width 0.3s, height 0.3s;
  }
  
  .touch-feedback:active::after {
    width: 200px;
    height: 200px;
  }
`;
```

### 2.2 Responsive Layout Strategy

#### Breakpoint System
```css
/* Mobile-first responsive design */
.message-input-container {
  /* Mobile (320px - 768px) */
  padding: 0.75rem;
  gap: 0.5rem;
}

/* Small tablets and large phones */
@media (min-width: 481px) {
  .message-input-container {
    padding: 1rem;
    gap: 0.75rem;
  }
}

/* Tablets */
@media (min-width: 769px) {
  .message-input-container {
    padding: 1rem;
    gap: 1rem;
    max-width: 800px;
    margin: 0 auto;
  }
}

/* Large tablets and small desktops */
@media (min-width: 1025px) {
  .message-input-container {
    padding: 1.5rem;
    gap: 1rem;
  }
}
```

#### Adaptive Component Layout
```typescript
interface ResponsiveLayout {
  mobile: {
    orientation: 'vertical' | 'horizontal';
    emojiPicker: 'fullscreen' | 'modal';
    attachmentPreview: 'carousel' | 'grid';
    inputHeight: 'fixed' | 'adaptive';
  };
  tablet: {
    orientation: 'horizontal';
    emojiPicker: 'popover';
    attachmentPreview: 'grid';
    inputHeight: 'adaptive';
  };
}

const useResponsiveLayout = (): ResponsiveLayout => {
  const [layout, setLayout] = useState<ResponsiveLayout>({
    mobile: {
      orientation: 'horizontal',
      emojiPicker: 'modal',
      attachmentPreview: 'carousel',
      inputHeight: 'adaptive'
    },
    tablet: {
      orientation: 'horizontal', 
      emojiPicker: 'popover',
      attachmentPreview: 'grid',
      inputHeight: 'adaptive'
    }
  });
  
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;
      
      if (width <= 768) {
        setLayout(prev => ({
          ...prev,
          mobile: {
            ...prev.mobile,
            orientation: isLandscape ? 'horizontal' : 'vertical',
            emojiPicker: width < 400 ? 'fullscreen' : 'modal'
          }
        }));
      }
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
    };
  }, []);
  
  return layout;
};
```

## 3. Virtual Keyboard Optimization

### 3.1 Keyboard Behavior Management

#### iOS Virtual Keyboard Handling
```css
/* Prevent zoom on input focus (iOS) */
.message-textarea {
  font-size: 16px; /* Minimum to prevent zoom */
  line-height: 1.4;
  transform-origin: top left;
}

/* iOS safe area handling */
.message-input-container {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* Handle iOS keyboard overlay */
@supports (height: 100dvh) {
  .message-input-container {
    /* Use dynamic viewport height when available */
    min-height: calc(100dvh - var(--keyboard-height, 0px));
  }
}
```

#### Android Virtual Keyboard Handling
```typescript
// Android keyboard detection and handling
const useVirtualKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  useEffect(() => {
    // Modern browsers with Visual Viewport API
    if ('visualViewport' in window) {
      const handleViewportChange = () => {
        const viewport = window.visualViewport!;
        const keyboardHeight = window.innerHeight - viewport.height;
        
        setKeyboardHeight(keyboardHeight);
        setIsKeyboardVisible(keyboardHeight > 150); // Threshold for keyboard
      };
      
      window.visualViewport!.addEventListener('resize', handleViewportChange);
      
      return () => {
        window.visualViewport!.removeEventListener('resize', handleViewportChange);
      };
    } else {
      // Fallback for older browsers
      const handleResize = () => {
        const heightDiff = window.innerHeight - document.documentElement.clientHeight;
        setIsKeyboardVisible(heightDiff > 150);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  return { keyboardHeight, isKeyboardVisible };
};

// Apply keyboard-aware styles
const KeyboardAwareContainer = ({ children }: { children: React.ReactNode }) => {
  const { keyboardHeight, isKeyboardVisible } = useVirtualKeyboard();
  
  return (
    <div 
      className="message-input-container"
      style={{
        paddingBottom: isKeyboardVisible ? keyboardHeight : undefined,
        transform: isKeyboardVisible ? 'translateY(-50px)' : undefined,
        transition: 'transform 300ms ease-out'
      }}
    >
      {children}
    </div>
  );
};
```

### 3.2 Input Type Optimization

#### Smart Input Types
```html
<!-- Optimized input types for mobile keyboards -->
<textarea
  inputMode="text"
  autoCapitalize="sentences"
  autoCorrect="on"
  spellCheck="true"
  enterKeyHint="send"
  placeholder="Ask your AI trading coach anything..."
/>

<!-- File input with mobile camera access -->
<input
  type="file"
  accept="image/*"
  capture="environment"
  multiple
/>

<!-- Search input for emoji picker -->
<input
  type="search"
  inputMode="search"
  autoComplete="off"
  autoCapitalize="none"
  autoCorrect="off"
  placeholder="Search emojis..."
/>
```

#### Keyboard Appearance Customization
```css
/* iOS keyboard appearance */
.message-textarea {
  -webkit-appearance: none;
  appearance: none;
  background-color: transparent;
  border-radius: 8px;
}

/* Android keyboard optimizations */
.message-textarea:focus {
  /* Prevent keyboard from covering input */
  scroll-margin-bottom: 300px;
}

/* Custom keyboard toolbar (iOS) */
.ios-keyboard-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  z-index: 1000;
}
```

## 4. Touch Gesture Support

### 4.1 Gesture Implementation

#### Swipe Gestures
```typescript
// Swipe gesture hook
const useSwipeGestures = (onSwipe: (direction: string) => void) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };
  
  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;
    
    if (isLeftSwipe) onSwipe('left');
    if (isRightSwipe) onSwipe('right');
    if (isUpSwipe) onSwipe('up');
    if (isDownSwipe) onSwipe('down');
  };
  
  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};

// Swipe to remove attachments
const SwipeableAttachment = ({ 
  file, 
  onRemove 
}: { 
  file: File; 
  onRemove: () => void; 
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const { triggerHaptic } = useTouchFeedback();
  
  const handleSwipe = (direction: string) => {
    if (direction === 'left') {
      triggerHaptic('medium');
      onRemove();
    }
  };
  
  const swipeHandlers = useSwipeGestures(handleSwipe);
  
  return (
    <div
      className="swipeable-attachment"
      {...swipeHandlers}
      style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: 'transform 0.2s ease-out'
      }}
    >
      <AttachmentPreview file={file} />
      <div className="swipe-action-hint">
        Swipe left to remove
      </div>
    </div>
  );
};
```

#### Long Press Gestures
```typescript
// Long press for context menus
const useLongPress = (
  onLongPress: () => void,
  delay: number = 500
) => {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const start = useCallback(() => {
    setIsPressed(true);
    timeoutRef.current = setTimeout(() => {
      onLongPress();
      setIsPressed(false);
    }, delay);
  }, [onLongPress, delay]);
  
  const stop = useCallback(() => {
    setIsPressed(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);
  
  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    isPressed
  };
};

// Usage in attachment context menu
const AttachmentWithContextMenu = ({ file }: { file: File }) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const { triggerHaptic } = useTouchFeedback();
  
  const longPressHandlers = useLongPress(() => {
    triggerHaptic('medium');
    setShowContextMenu(true);
  });
  
  return (
    <div className="attachment-container">
      <div {...longPressHandlers} className="attachment-preview">
        <AttachmentPreview file={file} />
      </div>
      
      {showContextMenu && (
        <ContextMenu
          items={[
            { label: 'Remove', action: () => removeFile(file) },
            { label: 'Replace', action: () => replaceFile(file) },
            { label: 'Preview', action: () => previewFile(file) }
          ]}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </div>
  );
};
```

### 4.2 Gesture Feedback System

#### Visual Gesture Indicators
```css
/* Swipe indicator animations */
.swipe-indicator {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.swipeable:active .swipe-indicator {
  opacity: 1;
}

.swipe-remove-action {
  background: linear-gradient(90deg, transparent, #ef4444);
  color: white;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
}

/* Long press visual feedback */
.long-press-target {
  position: relative;
  overflow: hidden;
}

.long-press-target::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: rgba(59, 130, 246, 0.2);
  transition: width 0.5s ease-out;
}

.long-press-target.pressing::before {
  width: 100%;
}
```

## 5. Mobile Performance Optimization

### 5.1 Rendering Performance

#### Touch Event Optimization
```typescript
// Passive touch event listeners for better scroll performance
const usePassiveTouchEvents = () => {
  useEffect(() => {
    const options = { passive: true };
    
    const touchHandler = (e: TouchEvent) => {
      // Handle touch without preventing default
    };
    
    document.addEventListener('touchstart', touchHandler, options);
    document.addEventListener('touchmove', touchHandler, options);
    
    return () => {
      document.removeEventListener('touchstart', touchHandler);
      document.removeEventListener('touchmove', touchHandler);
    };
  }, []);
};

// Debounced resize for performance
const useDebouncedResize = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = debounce(() => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return dimensions;
};
```

#### Memory Management for Mobile
```typescript
// Efficient image handling for attachments
const useOptimizedImages = () => {
  const [imageCache] = useState(new Map<string, string>());
  
  const createOptimizedPreview = useCallback(async (file: File): Promise<string> => {
    const cacheKey = `${file.name}-${file.size}`;
    
    if (imageCache.has(cacheKey)) {
      return imageCache.get(cacheKey)!;
    }
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Resize for mobile optimization
        const maxSize = 150;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const optimizedUrl = canvas.toDataURL('image/jpeg', 0.7);
        imageCache.set(cacheKey, optimizedUrl);
        resolve(optimizedUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, [imageCache]);
  
  const cleanupImageCache = useCallback(() => {
    imageCache.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    imageCache.clear();
  }, [imageCache]);
  
  return { createOptimizedPreview, cleanupImageCache };
};
```

### 5.2 Network Optimization

#### Progressive Loading for Mobile
```typescript
// Progressive file upload for mobile connections
const useProgressiveUpload = () => {
  const uploadFile = async (
    file: File,
    onProgress: (progress: number) => void
  ): Promise<UploadResult> => {
    const chunkSize = 1024 * 1024; // 1MB chunks for mobile
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      await uploadChunk(chunk, i, totalChunks);
      onProgress((i + 1) / totalChunks * 100);
    }
    
    return finalizeUpload(file.name);
  };
  
  return { uploadFile };
};

// Connection-aware uploads
const useConnectionAwareUpload = () => {
  const [connectionType, setConnectionType] = useState<string>('unknown');
  
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType);
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType);
      };
      
      connection.addEventListener('change', handleConnectionChange);
      return () => connection.removeEventListener('change', handleConnectionChange);
    }
  }, []);
  
  const getOptimalChunkSize = () => {
    switch (connectionType) {
      case 'slow-2g': return 64 * 1024; // 64KB
      case '2g': return 128 * 1024; // 128KB
      case '3g': return 512 * 1024; // 512KB
      case '4g': return 1024 * 1024; // 1MB
      default: return 512 * 1024; // Default 512KB
    }
  };
  
  return { connectionType, getOptimalChunkSize };
};
```

## 6. Orientation and Form Factor Support

### 6.1 Orientation Handling

#### Landscape Mode Optimization
```css
/* Landscape mode adjustments */
@media (orientation: landscape) and (max-height: 500px) {
  .message-input-container {
    /* Reduce padding in landscape on phones */
    padding: 0.5rem;
  }
  
  .message-textarea {
    /* Limit height in landscape */
    max-height: 80px;
  }
  
  /* Compact emoji picker for landscape */
  .emoji-picker {
    max-height: 200px;
    grid-template-columns: repeat(10, 1fr);
  }
  
  /* Hide unnecessary elements in landscape */
  .input-hints {
    display: none;
  }
}

/* Portrait mode optimizations */
@media (orientation: portrait) {
  .emoji-picker {
    max-height: 300px;
    grid-template-columns: repeat(8, 1fr);
  }
  
  .attachment-preview {
    max-height: 120px;
  }
}
```

#### Dynamic Layout Adjustment
```typescript
const useOrientationAwareLayout = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  useEffect(() => {
    const updateOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
      
      // Detect keyboard in landscape (height change > 150px)
      const heightRatio = window.innerHeight / screen.height;
      setIsKeyboardVisible(heightRatio < 0.6 && isLandscape);
    };
    
    updateOrientation();
    
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateOrientation, 100); // Delay for orientation change
    });
    
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);
  
  return { orientation, isKeyboardVisible };
};
```

### 6.2 Foldable Device Support

#### Flexible Layout for Foldables
```css
/* Samsung Galaxy Fold support */
@media (min-width: 280px) and (max-width: 653px) {
  .message-input-container {
    /* Narrow mode optimization */
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .input-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* Surface Duo dual-screen support */
@media (spanning: single-fold-vertical) {
  .message-input-container {
    /* Adapt to dual screen layout */
    max-width: calc(50vw - 1rem);
  }
}

@media (spanning: single-fold-horizontal) {
  .message-input-container {
    /* Bottom screen optimization */
    max-height: calc(50vh - 1rem);
  }
}
```

## 7. Platform-Specific Optimizations

### 7.1 iOS Optimizations

#### Safari-Specific Adjustments
```css
/* iOS Safari optimizations */
@supports (-webkit-touch-callout: none) {
  .message-textarea {
    /* Prevent iOS text selection callout on long press */
    -webkit-touch-callout: none;
    -webkit-user-select: text;
  }
  
  /* iOS safe area insets */
  .message-input-container {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
  
  /* Prevent iOS bounce scroll */
  .emoji-picker-scroll {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}

/* iOS 15+ viewport units */
@supports (height: 100dvh) {
  .full-height {
    height: 100dvh;
  }
}
```

#### iOS-Specific JavaScript
```typescript
// iOS version detection and optimization
const useIOSOptimizations = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [iOSVersion, setIOSVersion] = useState(0);
  
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    
    if (isIOSDevice) {
      setIsIOS(true);
      
      // Extract iOS version
      const match = userAgent.match(/OS (\d+)_/);
      if (match) {
        setIOSVersion(parseInt(match[1]));
      }
    }
  }, []);
  
  const applyIOSKeyboardFix = useCallback(() => {
    if (isIOS && iOSVersion >= 13) {
      // iOS 13+ keyboard handling
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
    }
  }, [isIOS, iOSVersion]);
  
  return { isIOS, iOSVersion, applyIOSKeyboardFix };
};
```

### 7.2 Android Optimizations

#### Chrome Mobile Optimizations
```css
/* Android Chrome optimizations */
@supports (display: -webkit-flex) {
  .android-input-container {
    /* Android keyboard overlay handling */
    min-height: calc(100vh - var(--keyboard-offset, 0px));
    transition: min-height 0.3s ease;
  }
}

/* Android specific touch improvements */
.android-touch-target {
  /* Improve touch responsiveness on Android */
  touch-action: manipulation;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
}
```

#### Android-Specific Features
```typescript
// Android intent integration
const useAndroidIntegration = () => {
  const openCameraIntent = () => {
    // Android camera intent
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.click();
  };
  
  const shareContent = async (content: string) => {
    if ('share' in navigator) {
      try {
        await navigator.share({
          title: 'Trading Analysis',
          text: content,
          url: window.location.href
        });
      } catch (error) {
        console.log('Sharing failed:', error);
      }
    }
  };
  
  return { openCameraIntent, shareContent };
};
```

## 8. Accessibility on Mobile

### 8.1 Mobile Screen Reader Support

#### TalkBack (Android) Optimization
```html
<!-- TalkBack-specific optimizations -->
<div role="region" aria-label="Message composition area">
  <textarea
    aria-label="Type message to AI trading coach"
    aria-describedby="input-hints"
    role="textbox"
    aria-multiline="true"
  />
  
  <div id="input-hints" aria-live="polite">
    Double tap to edit. Use explore by touch to navigate.
  </div>
</div>
```

#### VoiceOver (iOS) Optimization
```typescript
// VoiceOver gesture support
const useVoiceOverOptimizations = () => {
  useEffect(() => {
    // VoiceOver running detection
    const isVoiceOverRunning = () => {
      return window.speechSynthesis?.speaking || 
             document.body.getAttribute('aria-hidden') === 'true';
    };
    
    if (isVoiceOverRunning()) {
      // Optimize for VoiceOver
      document.body.classList.add('voiceover-active');
    }
  }, []);
};
```

### 8.2 Voice Input Support

#### Speech-to-Text Integration
```typescript
// Web Speech API integration
const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        setTranscript(transcript);
      };
      
      recognition.start();
      return recognition;
    }
  };
  
  return { isListening, transcript, startListening };
};

// Voice input button component
const VoiceInputButton = ({ onTranscript }: { onTranscript: (text: string) => void }) => {
  const { isListening, transcript, startListening } = useSpeechToText();
  
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);
  
  return (
    <button
      onClick={startListening}
      className={cn(
        'voice-input-button',
        isListening && 'listening'
      )}
      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
    >
      <MicrophoneIcon className={cn(
        'w-5 h-5',
        isListening && 'animate-pulse text-red-500'
      )} />
    </button>
  );
};
```

## 9. Testing and Validation

### 9.1 Mobile Testing Strategy

#### Device Testing Matrix
```typescript
const mobileTestingMatrix = {
  iOS: {
    devices: [
      'iPhone SE (2nd gen)', // Small screen
      'iPhone 12', // Standard size
      'iPhone 12 Pro Max', // Large screen
      'iPad Air', // Tablet
      'iPad Pro 12.9"' // Large tablet
    ],
    browsers: ['Safari', 'Chrome', 'Firefox'],
    orientations: ['portrait', 'landscape']
  },
  
  Android: {
    devices: [
      'Galaxy S21', // Standard Android
      'Pixel 5', // Pure Android
      'Galaxy Note 20', // Large screen
      'Galaxy Tab S7', // Tablet
      'Galaxy Fold' // Foldable
    ],
    browsers: ['Chrome', 'Samsung Internet', 'Firefox'],
    orientations: ['portrait', 'landscape']
  }
};
```

#### Performance Testing
```typescript
// Mobile performance monitoring
const useMobilePerformanceMonitoring = () => {
  useEffect(() => {
    // Touch event latency measurement
    let touchStartTime = 0;
    
    const measureTouchLatency = (e: TouchEvent) => {
      if (e.type === 'touchstart') {
        touchStartTime = performance.now();
      } else if (e.type === 'touchend') {
        const latency = performance.now() - touchStartTime;
        
        // Log if latency > 100ms (performance issue)
        if (latency > 100) {
          console.warn('Touch latency:', latency, 'ms');
        }
      }
    };
    
    document.addEventListener('touchstart', measureTouchLatency, { passive: true });
    document.addEventListener('touchend', measureTouchLatency, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', measureTouchLatency);
      document.removeEventListener('touchend', measureTouchLatency);
    };
  }, []);
};
```

### 9.2 Mobile-Specific Test Cases

#### Touch Interaction Tests
```typescript
const touchInteractionTests = [
  {
    name: 'Touch target size validation',
    test: 'All interactive elements ≥ 44px',
    criteria: 'Pass if all buttons meet minimum size'
  },
  {
    name: 'Swipe gesture functionality',
    test: 'Swipe left to remove attachments',
    criteria: 'Pass if gesture removes item with feedback'
  },
  {
    name: 'Long press context menu',
    test: 'Long press on attachments shows menu',
    criteria: 'Pass if menu appears after 500ms'
  },
  {
    name: 'Pinch zoom handling',
    test: 'Pinch to zoom on images',
    criteria: 'Pass if zoom works without breaking layout'
  }
];

const virtualKeyboardTests = [
  {
    name: 'Keyboard overlay handling',
    test: 'Input stays visible when keyboard appears',
    criteria: 'Pass if input scrolls into view'
  },
  {
    name: 'Keyboard dismissal',
    test: 'Tap outside input to dismiss keyboard',
    criteria: 'Pass if keyboard hides on outside tap'
  },
  {
    name: 'Auto-resize with keyboard',
    test: 'Textarea resizes properly with virtual keyboard',
    criteria: 'Pass if no layout breaking occurs'
  }
];
```

## 10. Implementation Guidelines

### 10.1 Development Priorities

#### Phase 1: Core Mobile Functionality (Week 1)
- Touch target sizing (44px minimum)
- Basic gesture support (tap, swipe)
- Virtual keyboard handling
- Responsive layout foundation

#### Phase 2: Enhanced Mobile Features (Week 2)
- Advanced gestures (long press, pinch)
- Platform-specific optimizations
- Performance optimizations
- Orientation handling

#### Phase 3: Accessibility and Polish (Week 3)
- Mobile screen reader support
- Voice input integration
- Haptic feedback implementation
- Cross-browser testing

#### Phase 4: Advanced Features (Week 4)
- Foldable device support
- Progressive Web App features
- Offline capability
- Performance monitoring

### 10.2 Quality Assurance

#### Mobile-Specific QA Checklist
- [ ] Touch targets meet 44px minimum requirement
- [ ] Gestures work consistently across devices
- [ ] Virtual keyboard doesn't break layout
- [ ] Performance meets mobile standards (<100ms touch response)
- [ ] Accessibility works with mobile screen readers
- [ ] Orientation changes handled gracefully
- [ ] Platform-specific features work correctly
- [ ] Battery usage is optimized
- [ ] Network usage is efficient
- [ ] Offline fallbacks function properly

## 11. Conclusion

The mobile UX requirements outlined in this document ensure the Message Input Component provides an optimal experience across all mobile devices and platforms. By implementing these specifications, we create a touch-first, accessible, and performant interface that meets the expectations of modern mobile users.

The focus on progressive enhancement, performance optimization, and platform-specific features ensures that all users receive the best possible experience regardless of their device or capabilities.

---

**Document Version**: 1.0  
**Last Updated**: August 14, 2025  
**Author**: UX Designer (Elite Trading Coach AI Team)  
**Mobile Platforms**: iOS 13+, Android 8+  
**Review Status**: Ready for Implementation