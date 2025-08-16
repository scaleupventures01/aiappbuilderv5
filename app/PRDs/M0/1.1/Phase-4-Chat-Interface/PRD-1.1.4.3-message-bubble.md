# PRD: Message Bubble Component

## 1. Overview

This PRD defines the message bubble component for individual chat messages in the Elite Trading Coach AI application, providing distinct visual styling for user messages, AI responses, and system notifications.

## 2. Feature Requirements

### 2.1 Functional Requirements
- **FR-1**: Render individual message bubbles with content and metadata
- **FR-2**: Support different visual styles for user, AI, and system messages
- **FR-3**: Display message timestamps and read status indicators
- **FR-4**: Handle rich content including text, images, and attachments
- **FR-5**: Implement copy-to-clipboard functionality for messages

### 2.2 Non-Functional Requirements
- **NFR-1**: Render messages in < 50ms each
- **NFR-2**: Support messages up to 10,000 characters
- **NFR-3**: Responsive design for all screen sizes
- **NFR-4**: Accessible markup with ARIA labels

## 3. User Stories

### 3.1 Primary User Stories
- **US-1**: As a user, I want my messages visually distinct from AI responses so I can easily follow the conversation
- **US-2**: As a user, I want to see timestamps so I know when messages were sent
- **US-3**: As a user, I want to copy AI responses so I can save important trading advice

### 3.2 Edge Cases
- **EC-1**: Handling extremely long messages that require text wrapping
- **EC-2**: Managing messages with image attachments
- **EC-3**: Dealing with special characters and emoji in message content

## 4. Technical Specifications

### 4.1 Message Bubble Component
```typescript
// src/components/chat/MessageBubble.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Copy, Check, Image as ImageIcon, Download } from 'lucide-react';
import { Message } from '@types/index';
import { cn } from '@utils/cn';

interface MessageBubbleProps {
  message: Message;
  showTimestamp?: boolean;
  showAvatar?: boolean;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showTimestamp = false,
  showAvatar = true,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'MMM d, h:mm a');
  };

  return (
    <div className={cn(
      'flex items-start space-x-3 px-4 py-2',
      isUser ? 'justify-end' : 'justify-start',
      className
    )}>
      {/* Avatar for non-user messages */}
      {!isUser && showAvatar && (
        <div className="flex-shrink-0">
          {isSystem ? (
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">SYS</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">AI</span>
            </div>
          )}
        </div>
      )}

      {/* Message content container */}
      <div className={cn(
        'flex flex-col max-w-xs lg:max-w-md',
        isUser ? 'items-end' : 'items-start'
      )}>
        {/* Message bubble */}
        <div
          className={cn(
            'relative px-4 py-2 rounded-2xl text-sm break-words',
            isUser && 'bg-primary-600 text-white',
            !isUser && !isSystem && 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100',
            isSystem && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          )}
        >
          {/* Message content */}
          <MessageContent message={message} />

          {/* Copy button for non-user messages */}
          {!isUser && !isSystem && (
            <button
              onClick={handleCopy}
              className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Copy className="w-3 h-3 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          )}
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formatTimestamp(message.createdAt)}
          </span>
        )}

        {/* Message status indicators */}
        {isUser && (
          <div className="flex items-center mt-1 space-x-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'failed' && '✗'}
            </span>
          </div>
        )}
      </div>

      {/* Avatar for user messages */}
      {isUser && showAvatar && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-medium">ME</span>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 4.2 Message Content Component
```typescript
// src/components/chat/MessageContent.tsx
import React from 'react';
import { Message } from '@types/index';
import { ImageAttachment } from './ImageAttachment';
import { LinkPreview } from './LinkPreview';

interface MessageContentProps {
  message: Message;
}

export const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  const hasImages = message.metadata?.images?.length > 0;
  const hasLinks = detectLinks(message.content);

  return (
    <div className="space-y-2">
      {/* Text content */}
      <div className="whitespace-pre-wrap">
        <FormattedText content={message.content} />
      </div>

      {/* Image attachments */}
      {hasImages && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {message.metadata.images.map((image: any, index: number) => (
            <ImageAttachment 
              key={index}
              src={image.url}
              alt={image.alt || `Image ${index + 1}`}
              className="rounded-lg"
            />
          ))}
        </div>
      )}

      {/* Link previews */}
      {hasLinks && (
        <div className="mt-2 space-y-2">
          {extractLinks(message.content).map((link, index) => (
            <LinkPreview key={index} url={link} />
          ))}
        </div>
      )}

      {/* File attachments */}
      {message.metadata?.files?.length > 0 && (
        <div className="mt-2 space-y-1">
          {message.metadata.files.map((file: any, index: number) => (
            <FileAttachment key={index} file={file} />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper component for formatted text
const FormattedText: React.FC<{ content: string }> = ({ content }) => {
  // Convert URLs to clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline"
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
};

// Helper functions
const detectLinks = (content: string): boolean => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return urlRegex.test(content);
};

const extractLinks = (content: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.match(urlRegex) || [];
};
```

### 4.3 Image Attachment Component
```typescript
// src/components/chat/ImageAttachment.tsx
import React, { useState } from 'react';
import { ImageIcon, Download, Maximize2 } from 'lucide-react';

interface ImageAttachmentProps {
  src: string;
  alt: string;
  className?: string;
}

export const ImageAttachment: React.FC<ImageAttachmentProps> = ({
  src,
  alt,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFullSize, setShowFullSize] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = alt || 'image';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  if (hasError) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center space-x-2 ${className}`}>
        <ImageIcon className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-500">Failed to load image</span>
      </div>
    );
  }

  return (
    <>
      <div className={`relative group ${className}`}>
        {isLoading && (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse h-32 w-full" />
        )}
        
        <img
          src={src}
          alt={alt}
          className={`rounded-lg max-w-full h-auto cursor-pointer ${isLoading ? 'hidden' : 'block'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={() => setShowFullSize(true)}
        />

        {/* Image overlay buttons */}
        {!isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFullSize(true)}
                className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                title="View full size"
              >
                <Maximize2 className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                title="Download image"
              >
                <Download className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full size modal */}
      {showFullSize && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowFullSize(false)}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
};
```

## 5. Acceptance Criteria

### 5.1 Definition of Done
- [ ] Message bubble component renders correctly for all message types
- [ ] Visual distinction between user, AI, and system messages
- [ ] Timestamp display working properly
- [ ] Copy-to-clipboard functionality implemented
- [ ] Image attachment display functional
- [ ] Link detection and formatting working
- [ ] Mobile responsive design
- [ ] Accessibility features implemented

### 5.2 Testing Requirements
- [ ] Message rendering for different content types
- [ ] Copy functionality across browsers
- [ ] Image loading and error handling
- [ ] Link detection and preview
- [ ] Mobile layout and touch interactions
- [ ] Performance testing (< 50ms render target)
- [ ] Security testing (XSS protection)
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Visual regression testing
- [ ] Cross-browser compatibility validation
- [ ] Error boundary testing
- [ ] Internationalization support

## 6. Dependencies

### 6.1 Technical Dependencies
- Date formatting library (date-fns)
- Lucide React for icons
- TailwindCSS for styling
- Message type definitions
- Utility functions for text processing

### 6.2 Business Dependencies
- Message content requirements
- Visual design specifications
- Accessibility standards

## 7. Risks and Mitigations

### 7.1 Technical Risks
- **Risk**: Poor performance with complex message content
  - **Mitigation**: Optimize rendering and use React.memo
- **Risk**: Image loading issues affecting UX
  - **Mitigation**: Implement proper error handling and loading states

### 7.2 Business Risks
- **Risk**: Unclear message distinction affecting usability
  - **Mitigation**: Clear visual design and user testing

### 7.3 QA Artifacts
- Test cases file: `QA/1.1.4.3-message-bubble/test-cases.md`
- Latest results: `QA/1.1.4.3-message-bubble/test-results-2025-08-14.md` (Overall Status: Pass required)


## 8. Success Metrics

### 8.1 Technical Metrics
- < 50ms render time per message
- Support for 10,000+ character messages
- 100% accessibility compliance
- Smooth image loading and display

### 8.2 Business Metrics
- Clear conversation flow visualization
- Easy message content interaction
- Positive user feedback on chat design

## 9. Implementation Timeline

### 9.1 Development Phases
- **Phase 1**: Fix type system integration and imports (2 hours)
- **Phase 2**: Basic bubble structure with accessibility (4 hours)
- **Phase 3**: Performance optimizations and memoization (3 hours)
- **Phase 4**: Rich content with security measures (5 hours)
- **Phase 5**: Mobile optimization and touch interactions (4 hours)
- **Phase 6**: Testing and visual regression setup (4 hours)

### 9.2 Milestones
- **M1**: Type system aligned with codebase (Day 1)
- **M2**: Accessible message bubbles working (Day 1)
- **M3**: Rich content with security implemented (Day 2)
- **M4**: Mobile optimizations complete (Day 3)
- **M5**: All tests passing with QA validation (Day 3)

#### Execution Plan (Decomposed Tasks)

| Task ID | Owner (Role) | Description | Preconditions/Dependencies | Outputs (Files/PRD sections) | Risks/Issues | Status |
| --- | --- | --- | --- | --- | --- | --- |
| ORCH-TBD | Implementation Owner | Populate tasks per PRD | — | PRD §9.3 updated | — | Planned |


## 10. Agent-Generated Implementation Tasks

### Frontend Engineering Tasks

#### **FE-001: Fix Type System Integration**
- **Priority**: Critical
- **Owner**: Frontend Engineer
- **Issue**: Import paths and metadata structure don't match codebase
- **Changes**: Update to use `@/types/chat` imports and `attachments` array
- **Expected**: Consistent type system across components
- **Agent Analysis**: Must align with existing MessageBubbleProps interface

#### **FE-002: Implement Performance Optimizations**
- **Priority**: High
- **Owner**: Frontend Engineer
- **Issue**: String processing in render and missing memoization
- **Changes**: Add useMemo for URL regex, implement intersection observer for images
- **Expected**: < 50ms render time per message
- **Agent Analysis**: Critical for 10,000+ character message support

#### **FE-003: Add Content Security**
- **Priority**: Critical
- **Owner**: Frontend Engineer
- **Issue**: User-generated content not sanitized
- **Changes**: Implement DOMPurify for content sanitization
- **Expected**: XSS protection for all message content
- **Agent Analysis**: Security requirement for production

#### **FE-004: Create Missing Components**
- **Priority**: High
- **Owner**: Frontend Engineer
- **Issue**: LinkPreview and FileAttachment components not implemented
- **Changes**: Build LinkPreview with security, create FileAttachment component
- **Expected**: Complete rich content support
- **Agent Analysis**: Required for feature completeness

#### **FE-005: Add Error Boundaries**
- **Priority**: Medium
- **Owner**: Frontend Engineer
- **Issue**: No error handling for content rendering failures
- **Changes**: Wrap MessageContent in error boundary
- **Expected**: Graceful degradation for rendering errors
- **Agent Analysis**: Improves stability

### UX Design Tasks

#### **UX-001: Fix Accessibility Issues**
- **Priority**: Critical
- **Owner**: UX Designer + Frontend Engineer
- **Focus**: ARIA labels, keyboard navigation, screen reader support
- **Changes**: Add semantic markup, proper roles, keyboard handlers
- **Expected**: WCAG 2.1 AA compliance
- **Agent Analysis**: Legal/compliance requirement

#### **UX-002: Mobile Touch Interactions**
- **Priority**: High
- **Owner**: UX Designer + Frontend Engineer
- **Focus**: Touch-friendly copy button and interactions
- **Changes**: Long-press for copy, 44px touch targets, swipe gestures
- **Expected**: Seamless mobile experience
- **Agent Analysis**: Copy button unusable on mobile without this

#### **UX-003: Visual Hierarchy Enhancement**
- **Priority**: Medium
- **Owner**: UX Designer
- **Focus**: Non-color indicators for message types
- **Changes**: Add icons, borders, typography variations
- **Expected**: Message types distinguishable without color
- **Agent Analysis**: Accessibility requirement

#### **UX-004: Content Layout Optimization**
- **Priority**: Medium
- **Owner**: UX Designer + Frontend Engineer
- **Focus**: Smart image grids and content truncation
- **Changes**: Adaptive grid (1-4 images), read more for long messages
- **Expected**: Better content presentation
- **Agent Analysis**: Improves readability

#### **UX-005: Loading and Error States**
- **Priority**: High
- **Owner**: UX Designer
- **Focus**: Visual feedback for all async operations
- **Changes**: Loading skeletons, error messages, retry options
- **Expected**: Clear user feedback
- **Agent Analysis**: Essential for UX

### QA Validation Tasks

#### **QA-001: Performance Testing Suite**
- **Priority**: Critical
- **Owner**: QA Engineer
- **Focus**: < 50ms render target validation
- **Tests**: Render time, memory usage, large message handling
- **Environment**: Performance monitoring tools
- **Success**: Meets all performance benchmarks
- **Agent Analysis**: Core requirement validation

#### **QA-002: Security Testing**
- **Priority**: Critical
- **Owner**: QA Engineer
- **Focus**: XSS protection and content sanitization
- **Tests**: Injection attempts, malicious content, URL validation
- **Environment**: Security testing tools
- **Success**: No security vulnerabilities
- **Agent Analysis**: Production security requirement

#### **QA-003: Accessibility Compliance Testing**
- **Priority**: High
- **Owner**: QA Engineer
- **Focus**: WCAG 2.1 AA compliance
- **Tests**: Screen reader, keyboard navigation, color contrast
- **Environment**: NVDA, JAWS, axe-core
- **Success**: Full accessibility compliance
- **Agent Analysis**: Legal requirement

#### **QA-004: Visual Regression Testing**
- **Priority**: Medium
- **Owner**: QA Engineer
- **Focus**: Component appearance consistency
- **Tests**: All message types, states, and themes
- **Environment**: Playwright, Percy
- **Success**: No unexpected visual changes
- **Agent Analysis**: Maintains UI consistency

#### **QA-005: Cross-Browser Testing**
- **Priority**: High
- **Owner**: QA Engineer
- **Focus**: Browser compatibility validation
- **Tests**: Chrome, Firefox, Safari, Edge functionality
- **Environment**: BrowserStack or similar
- **Success**: Consistent behavior across browsers
- **Agent Analysis**: Production readiness

#### **QA-006: Mobile Device Testing**
- **Priority**: High
- **Owner**: QA Engineer
- **Focus**: Touch interactions and responsive design
- **Tests**: iOS Safari, Android Chrome, touch gestures
- **Environment**: Real devices and emulators
- **Success**: Seamless mobile experience
- **Agent Analysis**: Mobile user support

#### **QA-007: Edge Case Testing**
- **Priority**: Medium
- **Owner**: QA Engineer
- **Focus**: Extreme content scenarios
- **Tests**: 10,000+ char messages, multiple images, special characters
- **Environment**: Test data generators
- **Success**: Graceful handling of all edge cases
- **Agent Analysis**: Robustness validation

## 11. Appendices

### 10.1 Message Status Types
```typescript
// Message status enumeration
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

// Status indicators
const statusIcons = {
  sending: '⏳',
  sent: '✓',
  delivered: '✓✓',
  failed: '✗'
};
```

### 10.2 Performance Optimizations
```typescript
// Memoized message bubble for performance
export const MessageBubble = React.memo<MessageBubbleProps>(
  ({ message, showTimestamp, showAvatar, className }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    return prevProps.message.id === nextProps.message.id &&
           prevProps.showTimestamp === nextProps.showTimestamp &&
           prevProps.showAvatar === nextProps.showAvatar;
  }
);
```

### 10.3 Accessibility Features
- ARIA labels for message bubbles
- Screen reader support for timestamps
- Keyboard navigation for interactive elements
- High contrast mode support
- Alternative text for images
## 8. Changelog
- - orch: scaffold + QA links updated on 2025-08-14. on 2025-08-14.
