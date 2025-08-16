import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { MessageInputProps } from '@/types/chat';
import { EmojiPicker } from './EmojiPicker';
import { chatAPI } from '@/services/chatAPI';
import { SpeedMode } from '../SpeedSelector';
// Removed uploadMultipleFiles import as it's not used directly in this component

interface ExtendedMessageInputProps extends MessageInputProps {
  isTyping?: boolean;
  onTyping?: (_isTyping: boolean) => void;
  allowAttachments?: boolean;
  allowMentions?: boolean;
  allowRichText?: boolean;
  maxLength?: number;
  suggestions?: string[];
  conversationId?: string;
  onUploadFile?: (_file: File) => Promise<{ url: string; metadata: any }>;
  speedMode?: SpeedMode;
  onSpeedModeChange?: (_speed: SpeedMode) => void;
  showSpeedSelector?: boolean;
}

export const MessageInput: React.FC<ExtendedMessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Ask your AI trading coach anything...",
  className = '',
  isTyping = false,
  onTyping,
  allowAttachments = true,
  allowMentions = true,
  maxLength = 2000,
  suggestions = [],
  conversationId,
  onUploadFile,
  speedMode = 'balanced',
  onSpeedModeChange,
  showSpeedSelector = true
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [attachments, setAttachments] = useState<Array<{ file: File; preview: string; uploadId?: string }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (onTyping && !isTyping) {
      onTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (onTyping) {
        onTyping(false);
      }
    }, 3000);
  }, [onTyping, isTyping]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (onTyping && isTyping) {
      onTyping(false);
    }
  }, [onTyping, isTyping]);

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if ((!message.trim() && attachments.length === 0) || disabled || isSending) return;

    const messageContent = message.trim();
    const messageAttachments = [...attachments];
    
    setMessage('');
    setAttachments([]);
    setIsSending(true);
    handleTypingStop();

    try {
      // Upload images first using new backend API
      const uploadedAttachments = [];
      if (messageAttachments.length > 0) {
        setIsUploading(true);
        
        // Filter only image files for the new endpoint
        const imageFiles = messageAttachments.filter(attachment => 
          attachment.file.type.startsWith('image/')
        ).map(attachment => attachment.file);
        
        if (imageFiles.length > 0) {
          try {
            // Use new backend image upload API
            const uploadResult = await chatAPI.uploadImages(imageFiles, conversationId, 'chat');
            
            if (uploadResult.success && uploadResult.data) {
              uploadResult.data.uploads.forEach((upload: any, index: number) => {
                uploadedAttachments.push({
                  id: upload.id,
                  name: upload.originalName,
                  type: imageFiles[index].type,
                  size: imageFiles[index].size,
                  url: upload.secureUrl,
                  thumbnailUrl: upload.thumbnailUrl,
                  width: upload.width,
                  height: upload.height,
                  format: upload.format
                });
              });
            } else {
              throw new Error(uploadResult.error || 'Failed to upload images');
            }
          } catch (uploadError) {
            console.error('Image upload failed:', uploadError);
            throw uploadError;
          }
        }
        
        // Handle non-image files with legacy upload if onUploadFile is available
        const nonImageFiles = messageAttachments.filter(attachment => 
          !attachment.file.type.startsWith('image/')
        );
        
        if (nonImageFiles.length > 0 && onUploadFile) {
          for (const attachment of nonImageFiles) {
            const uploaded = await onUploadFile(attachment.file);
            uploadedAttachments.push({
              name: attachment.file.name,
              type: attachment.file.type,
              size: attachment.file.size,
              ...uploaded
            });
          }
        }
        
        setIsUploading(false);
      }

      // Send message with attachments and speed mode
      await onSendMessage(messageContent, {
        attachments: uploadedAttachments,
        timestamp: Date.now(),
        speedMode: speedMode,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message and attachments on error
      setMessage(messageContent);
      setAttachments(messageAttachments);
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  // Handle keyboard interactions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          break;
        case 'Tab':
        case 'Enter':
          if (selectedSuggestion >= 0) {
            e.preventDefault();
            applySuggestion(filteredSuggestions[selectedSuggestion]);
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedSuggestion(-1);
          setShowEmojiPicker(false);
          setShowSpeedDropdown(false);
          break;
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowEmojiPicker(false);
      setShowSpeedDropdown(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (value.length <= maxLength) {
      setMessage(value);
      adjustTextareaHeight();
      handleTypingStart();
      
      // Handle suggestions
      if (allowMentions && suggestions.length > 0) {
        handleSuggestions(value);
      }
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  // Handle suggestions
  const handleSuggestions = (value: string) => {
    clearTimeout(suggestionTimeoutRef.current);
    
    suggestionTimeoutRef.current = setTimeout(() => {
      const lastWord = value.split(' ').pop() || '';
      
      if (lastWord.length > 1) {
        const filtered = suggestions.filter(suggestion => 
          suggestion.toLowerCase().includes(lastWord.toLowerCase())
        );
        
        setFilteredSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedSuggestion(-1);
      } else {
        setShowSuggestions(false);
      }
    }, 300);
  };

  const applySuggestion = (suggestion: string) => {
    const words = message.split(' ');
    words[words.length - 1] = suggestion;
    setMessage(words.join(' ') + ' ');
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    textareaRef.current?.focus();
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      // Prioritize image files for backend endpoint (up to 15MB)
      if (file.type.startsWith('image/')) {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const isValidImageType = allowedImageTypes.includes(file.type);
        const isValidImageSize = file.size <= 15 * 1024 * 1024; // 15MB for images
        return isValidImageType && isValidImageSize;
      }
      
      // Other file types (legacy support)
      const isValidType = file.type.startsWith('video/') ||
                         file.type.startsWith('audio/') ||
                         file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB for other files
      return isValidType && isValidSize;
    });

    // Check if adding these files would exceed the 5-file limit for images
    const currentImageCount = attachments.filter(att => att.file.type.startsWith('image/')).length;
    const newImageFiles = validFiles.filter(file => file.type.startsWith('image/'));
    
    if (currentImageCount + newImageFiles.length > 5) {
      alert('Maximum 5 images allowed per message');
      return;
    }

    const newAttachments = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  // Emoji handling
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      
      if (newMessage.length <= maxLength) {
        setMessage(newMessage);
        
        // Move cursor after emoji
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 0);
      }
    } else {
      // Fallback: append emoji
      if ((message + emoji).length <= maxLength) {
        setMessage(prev => prev + emoji);
      }
    }
    
    setShowEmojiPicker(false);
    handleTypingStart();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      attachments.forEach(attachment => {
        if (attachment.preview) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const hasContent = message.trim() || attachments.length > 0;

  return (
    <div className={cn('relative p-4', className)}>
      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-32 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => applySuggestion(suggestion)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                index === selectedSuggestion && 'bg-blue-50 dark:bg-blue-900/50'
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative group">
              {attachment.preview ? (
                <img
                  src={attachment.preview}
                  alt={attachment.file.name}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 text-center">
                    {attachment.file.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove attachment"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Main input area */}
        <div 
          className={cn(
            'flex items-end space-x-3 transition-colors',
            dragOver && 'bg-blue-50 dark:bg-blue-900/20 rounded-lg'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSending || isUploading}
              maxLength={maxLength}
              className={cn(
                'w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                'px-4 py-3 pr-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'placeholder-gray-500 dark:placeholder-gray-400',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
                'transition-all duration-200'
              )}
              rows={1}
              style={{ minHeight: '48px', maxHeight: '150px' }}
            />
            
            {/* Character count */}
            {message.length > maxLength * 0.8 && (
              <div className={cn(
                'absolute bottom-2 right-16 text-xs',
                message.length > maxLength * 0.95 ? 'text-red-500' : 'text-gray-500'
              )}>
                {message.length}/{maxLength}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-end space-x-2">
            {/* Attachment button */}
            {allowAttachments && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/*,audio/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isSending || isUploading}
                  className={cn(
                    'p-2 sm:p-2 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto rounded-lg transition-colors touch-manipulation',
                    'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600',
                    'text-gray-600 dark:text-gray-400',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                  )}
                  aria-label="Attach file"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
              </>
            )}

            {/* Emoji button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled || isSending || isUploading}
                className={cn(
                  'p-2 sm:p-2 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto rounded-lg transition-colors touch-manipulation',
                  'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600',
                  'text-gray-600 dark:text-gray-400',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                  showEmojiPicker && 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                )}
                aria-label="Add emoji"
                aria-expanded={showEmojiPicker}
                aria-haspopup="dialog"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              {/* Emoji picker */}
              {showEmojiPicker && (
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>

            {/* Speed selector button */}
            {showSpeedSelector && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSpeedDropdown(!showSpeedDropdown)}
                  disabled={disabled || isSending || isUploading}
                  className={cn(
                    'p-2 sm:p-2 min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto rounded-lg transition-colors touch-manipulation',
                    'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600',
                    'text-gray-600 dark:text-gray-400',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                    showSpeedDropdown && 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  )}
                  aria-label="Select speed mode"
                  aria-expanded={showSpeedDropdown}
                  aria-haspopup="menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
                
                {/* Speed dropdown */}
                {showSpeedDropdown && (
                  <div className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Speed Mode</h3>
                        <button
                          onClick={() => setShowSpeedDropdown(false)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'super_fast' as SpeedMode, name: 'Super Fast', time: '1-3s', cost: '$0.01', color: 'bg-red-500' },
                          { id: 'fast' as SpeedMode, name: 'Fast', time: '3-8s', cost: '$0.03', color: 'bg-orange-500' },
                          { id: 'balanced' as SpeedMode, name: 'Balanced', time: '8-15s', cost: '$0.05', color: 'bg-blue-500' },
                          { id: 'high_accuracy' as SpeedMode, name: 'High Accuracy', time: '15-30s', cost: '$0.08', color: 'bg-green-500' }
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              onSpeedModeChange?.(option.id);
                              setShowSpeedDropdown(false);
                            }}
                            disabled={disabled || isSending || isUploading}
                            className={cn(
                              'p-2 rounded-lg text-left transition-colors',
                              'hover:bg-gray-50 dark:hover:bg-gray-700',
                              'disabled:opacity-50 disabled:cursor-not-allowed',
                              speedMode === option.id
                                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                : 'border border-gray-200 dark:border-gray-700'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={cn('w-3 h-3 rounded-full', option.color)} />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {option.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>{option.time}</span>
                                <span>{option.cost}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Send button */}
            <button
              type="submit"
              disabled={!hasContent || disabled || isSending || isUploading}
              className={cn(
                'flex-shrink-0 p-3 min-h-[44px] min-w-[44px] rounded-lg transition-all duration-200 touch-manipulation',
                hasContent && !disabled && !isSending && !isUploading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:transform-none'
              )}
              aria-label="Send message"
            >
              {isSending || isUploading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Footer with hints */}
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <div>
            Press Enter to send, Shift+Enter for new line
          </div>
          {isTyping && (
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              <span className="ml-2">AI is thinking...</span>
            </div>
          )}
        </div>
      </form>

      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center">
          <div className="text-blue-600 font-medium">Drop files here to attach</div>
        </div>
      )}
    </div>
  );
};