import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { FocusManager, KeyboardNav, ARIAUtils } from '@/utils/accessibility';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

// Trading-focused emoji categories
const EMOJI_CATEGORIES = {
  trading: {
    name: 'Trading',
    emojis: ['📈', '📉', '📊', '💹', '💰', '💎', '🚀', '🎯', '🔥', '💯', '⚡', '🏆', '🎉', '💪', '👑']
  },
  emotions: {
    name: 'Emotions',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘']
  },
  gestures: {
    name: 'Gestures',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '👏']
  },
  expressions: {
    name: 'Expressions',
    emojis: ['😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏']
  }
};

const COMMON_EMOJIS = [
  '📈', '📉', '💰', '🚀', '💯', '🔥', '👍', '👎', '😀', '😅', 
  '😊', '🤔', '😎', '💪', '🎯'
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  onClose,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmojis, setFilteredEmojis] = useState<string[]>([]);
  const [focusedEmojiIndex, setFocusedEmojiIndex] = useState(-1);
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const emojiGridRef = useRef<HTMLDivElement>(null);
  const pickerId = useRef(ARIAUtils.generateId('emoji-picker'));

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Focus trap and initial focus management
  useEffect(() => {
    if (pickerRef.current) {
      const cleanup = FocusManager.createFocusTrap(pickerRef.current);
      return cleanup;
    }
  }, []);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Handle search filtering
  useEffect(() => {
    if (searchQuery.trim()) {
      const allEmojis = Object.values(EMOJI_CATEGORIES).flatMap(cat => cat.emojis);
      const query = searchQuery.toLowerCase();
      
      // Simple emoji name mapping for search
      const emojiNames: Record<string, string[]> = {
        '📈': ['chart', 'up', 'growth', 'bull', 'bullish', 'profit', 'gain'],
        '📉': ['chart', 'down', 'bear', 'bearish', 'loss', 'decline'],
        '💰': ['money', 'cash', 'profit', 'wealth', 'rich'],
        '💎': ['diamond', 'diamond hands', 'hold', 'hodl', 'precious'],
        '🚀': ['rocket', 'moon', 'pump', 'surge', 'skyrocket'],
        '📊': ['bar chart', 'analysis', 'data', 'stats'],
        '💹': ['stock', 'market', 'trading', 'exchange'],
        '🎯': ['target', 'goal', 'aim', 'bullseye'],
        '🔥': ['fire', 'hot', 'trending', 'burning'],
        '💯': ['hundred', 'perfect', 'complete', 'full'],
        '👍': ['thumbs up', 'good', 'yes', 'approve', 'like'],
        '👎': ['thumbs down', 'bad', 'no', 'disapprove', 'dislike'],
        '😀': ['happy', 'smile', 'joy', 'grin'],
        '😅': ['laugh', 'sweat', 'nervous', 'relief'],
        '😊': ['smile', 'happy', 'content', 'pleased'],
        '🤔': ['think', 'wondering', 'confused', 'considering'],
        '😎': ['cool', 'sunglasses', 'confident', 'awesome'],
        '💪': ['strong', 'muscle', 'power', 'strength'],
        '🏆': ['trophy', 'winner', 'champion', 'victory'],
        '⚡': ['lightning', 'fast', 'quick', 'energy', 'power']
      };

      const filtered = allEmojis.filter(emoji => {
        const names = emojiNames[emoji] || [];
        return names.some(name => name.includes(query));
      });

      setFilteredEmojis(filtered);
    } else {
      setFilteredEmojis([]);
    }
  }, [searchQuery]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    // Handle arrow navigation in emoji grid
    if (emojiGridRef.current && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const emojiButtons = Array.from(emojiGridRef.current.querySelectorAll('button')) as HTMLElement[];
      const currentEmojis = getCurrentEmojis();
      
      if (emojiButtons.length === 0) return;
      
      const cols = 8;
      let newIndex = focusedEmojiIndex;

      switch (e.key) {
        case 'ArrowRight':
          newIndex = Math.min(focusedEmojiIndex + 1, currentEmojis.length - 1);
          break;
        case 'ArrowLeft':
          newIndex = Math.max(focusedEmojiIndex - 1, 0);
          break;
        case 'ArrowDown':
          newIndex = Math.min(focusedEmojiIndex + cols, currentEmojis.length - 1);
          break;
        case 'ArrowUp':
          newIndex = Math.max(focusedEmojiIndex - cols, 0);
          break;
      }

      if (newIndex !== focusedEmojiIndex && emojiButtons[newIndex]) {
        setFocusedEmojiIndex(newIndex);
        emojiButtons[newIndex].focus();
      }
    }

    // Handle Enter/Space for emoji selection
    if ((e.key === 'Enter' || e.key === ' ') && focusedEmojiIndex >= 0) {
      e.preventDefault();
      const currentEmojis = getCurrentEmojis();
      const emoji = currentEmojis[focusedEmojiIndex];
      if (emoji) {
        handleEmojiClick(emoji);
      }
    }
  };

  const getCurrentEmojis = () => {
    if (searchQuery.trim()) {
      return filteredEmojis;
    }
    
    if (selectedCategory === 'common') {
      return COMMON_EMOJIS;
    }
    
    return EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES]?.emojis || [];
  };

  return (
    <div
      ref={pickerRef}
      className={cn(
        'absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg',
        'w-80 max-w-[90vw] sm:max-w-[95vw] md:w-80 z-50',
        'max-h-[70vh] overflow-hidden flex flex-col',
        className
      )}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Emoji picker"
      id={pickerId.current}
      data-focus-trap
    >
      {/* Header with search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search emojis..."
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     touch-manipulation"
          aria-label="Search emojis"
          aria-describedby={`${pickerId.current}-help`}
          autoComplete="off"
        />
      </div>

      {/* Category tabs */}
      {!searchQuery.trim() && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto" role="tablist" aria-label="Emoji categories">
          <button
            onClick={() => setSelectedCategory('common')}
            className={cn(
              'flex-1 min-w-max px-3 py-3 text-xs font-medium transition-colors touch-manipulation',
              'hover:bg-gray-50 dark:hover:bg-gray-700/50',
              selectedCategory === 'common'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            )}
            role="tab"
            aria-selected={selectedCategory === 'common'}
            aria-controls={`${pickerId.current}-panel`}
          >
            Common
          </button>
          {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                'flex-1 min-w-max px-3 py-3 text-xs font-medium transition-colors touch-manipulation',
                'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                selectedCategory === key
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
              role="tab"
              aria-selected={selectedCategory === key}
              aria-controls={`${pickerId.current}-panel`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="p-3 flex-1 overflow-y-auto" role="tabpanel" id={`${pickerId.current}-panel`}>
        {getCurrentEmojis().length > 0 ? (
          <div 
            ref={emojiGridRef}
            className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2"
            role="grid"
            aria-label={searchQuery.trim() ? 'Search results' : selectedCategory === 'common' ? 'Common emojis' : EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES]?.name}
          >
            {getCurrentEmojis().map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                onFocus={() => setFocusedEmojiIndex(index)}
                className={cn(
                  'w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-lg rounded touch-manipulation',
                  'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
                  'active:bg-gray-200 dark:active:bg-gray-600',
                  focusedEmojiIndex === index && 'ring-2 ring-blue-500'
                )}
                title={emoji}
                aria-label={`Insert ${emoji} emoji`}
                role="gridcell"
                tabIndex={focusedEmojiIndex === index ? 0 : -1}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm">No emojis found</div>
            <div className="text-xs mt-1">Try searching for "bull", "bear", or "money"</div>
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            <div className="text-sm">Select a category above</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
        <div className="flex justify-between items-center">
          <div 
            className="text-xs text-gray-500 dark:text-gray-400"
            id={`${pickerId.current}-help`}
          >
            Use arrow keys to navigate, Enter to select
          </div>
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                       px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
                       touch-manipulation min-h-[44px] sm:min-h-auto sm:px-2 sm:py-1"
            aria-label="Close emoji picker"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};