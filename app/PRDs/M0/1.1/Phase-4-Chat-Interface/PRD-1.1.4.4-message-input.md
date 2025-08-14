# PRD: Message Input Component

## 1. Overview

This PRD defines the message input component for the Elite Trading Coach AI chat interface, providing users with a comprehensive input system for sending text messages, uploading images, and interacting with the AI trading coach.

## 2. Feature Requirements

### 2.1 Functional Requirements
- **FR-1**: Text input field with auto-resize and multiline support
- **FR-2**: Send button with keyboard shortcut (Enter) functionality
- **FR-3**: File upload capability for images and documents
- **FR-4**: Typing indicator broadcasting to other clients
- **FR-5**: Input validation and character limit enforcement

### 2.2 Non-Functional Requirements
- **NFR-1**: Responsive design for mobile and desktop
- **NFR-2**: Input lag < 100ms for typing feedback
- **NFR-3**: Support for 10,000 character messages
- **NFR-4**: Accessible keyboard navigation and screen reader support

## 3. User Stories

### 3.1 Primary User Stories
- **US-1**: As a user, I want an intuitive input field so I can easily type my trading questions
- **US-2**: As a user, I want to send messages quickly using Enter key so I can have fluid conversations
- **US-3**: As a user, I want to upload chart screenshots so I can get specific trading advice
- **US-4**: As a mobile user, I want the input to work seamlessly on my touch device

### 3.2 Edge Cases
- **EC-1**: Handling very long messages that approach character limits
- **EC-2**: Managing multiple file uploads simultaneously
- **EC-3**: Dealing with network interruptions during message sending

## 4. Technical Specifications

### 4.1 Message Input Component
```typescript
// src/components/chat/MessageInput.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, Image, Smile, X } from 'lucide-react';
import { FileDropzone } from './FileDropzone';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '@utils/cn';

interface MessageInputProps {
  onSendMessage: (content: string, metadata?: any) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  maxLength = 10000,
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileDropzone, setShowFileDropzone] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Handle typing indicators
  useEffect(() => {
    const isTyping = message.trim().length > 0;
    // Emit typing indicator via Socket.IO
    // This would be handled by the parent component or a hook
  }, [message]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!message.trim() && attachments.length === 0) return;
    if (isSending || disabled) return;

    setIsSending(true);
    
    try {
      const metadata: any = {};
      
      if (attachments.length > 0) {
        // Upload attachments first
        const uploadedFiles = await uploadAttachments(attachments);
        metadata.attachments = uploadedFiles;
      }

      await onSendMessage(message.trim(), metadata);
      
      // Clear input after successful send
      setMessage('');
      setAttachments([]);
      adjustTextareaHeight();
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      // Validate file type and size
      const isValidType = file.type.startsWith('image/') || 
                         file.type === 'application/pdf' ||
                         file.type.startsWith('text/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      
      return isValidType && isValidSize;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const uploadAttachments = async (files: File[]): Promise<any[]> => {
    // Implementation would depend on upload service (Cloudinary, etc.)
    const uploads = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      return response.json();
    });
    
    return Promise.all(uploads);
  };

  const isMessageValid = message.trim().length > 0 || attachments.length > 0;
  const charactersLeft = maxLength - message.length;

  return (
    <div className={cn('bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700', className)}>
      {/* File dropzone overlay */}
      {showFileDropzone && (
        <FileDropzone
          onFilesSelected={handleFileSelect}
          onClose={() => setShowFileDropzone(false)}
        />
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-2 text-sm"
              >
                <Paperclip className="w-4 h-4 mr-2 text-gray-500" />
                <span className="max-w-32 truncate">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main input area */}
      <div className="flex items-end space-x-3 p-4">
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.doc,.docx"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Text input area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Character counter */}
          {charactersLeft < 100 && (
            <div className="absolute -bottom-6 right-0 text-xs text-gray-500">
              {charactersLeft} characters left
            </div>
          )}
        </div>

        {/* Emoji button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isMessageValid || isSending || disabled}
          className={cn(
            'flex-shrink-0 p-2 rounded-lg transition-colors',
            isMessageValid && !isSending && !disabled
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
          )}
          title="Send message (Enter)"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="px-4 pb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
```

### 4.2 Emoji Picker Component
```typescript
// src/components/chat/EmojiPicker.tsx
import React from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
  '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
  '💰', '💎', '📈', '📉', '📊', '💹', '🚀', '🎯', '🔥', '💯'
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  onClose
}) => {
  return (
    <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 w-64 z-10">
      <div className="grid grid-cols-8 gap-1">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className="p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
      
      <button
        onClick={onClose}
        className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        Close
      </button>
    </div>
  );
};
```

## 5. Acceptance Criteria

### 5.1 Definition of Done
- [ ] Text input with auto-resize functionality
- [ ] Send button with Enter key shortcut
- [ ] File attachment capability
- [ ] Character limit enforcement
- [ ] Typing indicator integration
- [ ] Emoji picker functionality
- [ ] Mobile responsive design
- [ ] Accessibility features implemented
- [ ] Loading states for message sending

### 5.2 Testing Requirements
- [ ] Text input and auto-resize behavior
- [ ] Keyboard shortcuts (Enter, Shift+Enter)
- [ ] File upload and attachment display
- [ ] Character limit validation
- [ ] Mobile touch interactions
- [ ] Accessibility compliance

## 6. Dependencies

### 6.1 Technical Dependencies
- File dropzone component (PRD-1.1.5.3)
- Image upload functionality (PRD-1.1.5.2)
- Socket.IO for typing indicators
- File upload service integration

### 6.2 Business Dependencies
- Message length requirements
- File upload specifications
- User experience guidelines

## 7. Risks and Mitigations

### 7.1 Technical Risks
- **Risk**: File upload failures affecting user experience
  - **Mitigation**: Robust error handling and retry mechanisms
- **Risk**: Input lag on slower devices
  - **Mitigation**: Optimize rendering and debounce input events

### 7.2 Business Risks
- **Risk**: Complex input interface confusing users
  - **Mitigation**: Simple, intuitive design with clear visual cues

## 8. Success Metrics

### 8.1 Technical Metrics
- < 100ms input response time
- Support for 10,000 character messages
- 99% successful file upload rate
- Smooth auto-resize behavior

### 8.2 Business Metrics
- Intuitive message composition experience
- High user adoption of file sharing features
- Positive feedback on input functionality

## 9. Implementation Timeline

### 9.1 Development Phases
- **Phase 1**: Basic text input and auto-resize (4 hours)
- **Phase 2**: Send functionality and keyboard shortcuts (3 hours)
- **Phase 3**: File attachment and emoji picker (5 hours)
- **Phase 4**: Mobile optimization and testing (4 hours)

### 9.2 Milestones
- **M1**: Basic text input working (Day 1)
- **M2**: Send functionality implemented (Day 1)
- **M3**: File attachments functional (Day 2)
- **M4**: Mobile optimization completed (Day 2)

## 10. Appendices

### 10.1 Keyboard Shortcuts
```typescript
// Supported keyboard shortcuts
const shortcuts = {
  'Enter': 'Send message',
  'Shift + Enter': 'New line',
  'Ctrl/Cmd + Enter': 'Send message (alternative)',
  'Escape': 'Close emoji picker/file dropzone'
};
```

### 10.2 File Validation
```typescript
// File upload validation rules
const fileValidation = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  maxFiles: 5
};
```

### 10.3 Accessibility Features
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements for file attachments
- Focus management for modals and pickers
- High contrast mode support