import { useState, useEffect, useCallback, useMemo } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  throttleMs?: number;
}

interface VirtualScrollResult {
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    size: number;
  }>;
  totalSize: number;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end' | 'auto') => void;
  scrollToOffset: (offset: number) => void;
  setScrollElement: (element: HTMLElement | null) => void;
  scrollOffset: number;
  isScrolling: boolean;
}

export const useVirtualScroll = (
  itemCount: number,
  options: VirtualScrollOptions
): VirtualScrollResult => {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    throttleMs = 16
  } = options;

  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Calculate total size
  const totalSize = useMemo(() => itemCount * itemHeight, [itemCount, itemHeight]);

  // Calculate visible range
  const range = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan);
    const end = Math.min(
      itemCount,
      Math.ceil((scrollOffset + containerHeight) / itemHeight) + overscan
    );
    return { start, end };
  }, [scrollOffset, itemHeight, containerHeight, itemCount, overscan]);

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const items = [];
    for (let i = range.start; i < range.end; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        size: itemHeight
      });
    }
    return items;
  }, [range, itemHeight]);

  // Scroll to specific index
  const scrollToIndex = useCallback((
    index: number,
    align: 'start' | 'center' | 'end' | 'auto' = 'auto'
  ) => {
    if (!scrollElement) return;

    const itemStart = index * itemHeight;
    const itemEnd = itemStart + itemHeight;
    const currentStart = scrollOffset;
    const currentEnd = scrollOffset + containerHeight;

    let targetOffset = scrollOffset;

    switch (align) {
      case 'start':
        targetOffset = itemStart;
        break;
      case 'end':
        targetOffset = itemEnd - containerHeight;
        break;
      case 'center':
        targetOffset = itemStart - (containerHeight - itemHeight) / 2;
        break;
      case 'auto':
        if (itemStart < currentStart) {
          targetOffset = itemStart;
        } else if (itemEnd > currentEnd) {
          targetOffset = itemEnd - containerHeight;
        }
        break;
    }

    targetOffset = Math.max(0, Math.min(targetOffset, totalSize - containerHeight));
    scrollElement.scrollTop = targetOffset;
  }, [scrollElement, itemHeight, containerHeight, scrollOffset, totalSize]);

  // Scroll to specific offset
  const scrollToOffset = useCallback((offset: number) => {
    if (!scrollElement) return;
    const clampedOffset = Math.max(0, Math.min(offset, totalSize - containerHeight));
    scrollElement.scrollTop = clampedOffset;
  }, [scrollElement, totalSize, containerHeight]);

  // Handle scroll events with throttling
  useEffect(() => {
    if (!scrollElement) return;

    let timeoutId: NodeJS.Timeout;
    let isScrollingTimeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      setScrollOffset(scrollElement.scrollTop);
      setIsScrolling(true);

      // Clear existing timeout
      clearTimeout(isScrollingTimeoutId);
      
      // Set new timeout to detect scroll end
      isScrollingTimeoutId = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    const throttledHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, throttleMs);
    };

    scrollElement.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', throttledHandleScroll);
      clearTimeout(timeoutId);
      clearTimeout(isScrollingTimeoutId);
    };
  }, [scrollElement, throttleMs]);

  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToOffset,
    setScrollElement,
    scrollOffset,
    isScrolling
  };
};