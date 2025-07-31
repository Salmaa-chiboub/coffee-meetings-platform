import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

/**
 * High-performance virtual scrolling component for large lists
 * Only renders visible items to maintain smooth performance
 */
const VirtualScrollList = React.memo(({
  items = [],
  itemHeight = 80,
  containerHeight = 400,
  renderItem,
  overscan = 5, // Number of items to render outside visible area
  className = '',
  onScroll,
  getItemKey = (item, index) => item.id || index,
  estimatedItemHeight = null, // For dynamic heights
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollElementRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const itemCount = items.length;
    if (itemCount === 0) return { start: 0, end: 0 };

    const effectiveItemHeight = estimatedItemHeight || itemHeight;
    const visibleStart = Math.floor(scrollTop / effectiveItemHeight);
    const visibleEnd = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / effectiveItemHeight)
    );

    // Add overscan
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(itemCount - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, containerHeight, itemHeight, estimatedItemHeight, items.length, overscan]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return items.length * (estimatedItemHeight || itemHeight);
  }, [items.length, itemHeight, estimatedItemHeight]);

  // Calculate offset for visible items
  const offsetY = visibleRange.start * (estimatedItemHeight || itemHeight);

  // Handle scroll events
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    // Call external scroll handler
    if (onScroll) {
      onScroll(e);
    }
  }, [onScroll]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Generate visible items
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i < items.length) {
        result.push({
          index: i,
          item: items[i],
          key: getItemKey(items[i], i)
        });
      }
    }
    return result;
  }, [items, visibleRange, getItemKey]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      {...props}
    >
      {/* Total height container */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ index, item, key }) => (
            <div
              key={key}
              style={{
                height: estimatedItemHeight || itemHeight,
                overflow: 'hidden'
              }}
            >
              {renderItem({ item, index, isScrolling })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualScrollList.displayName = 'VirtualScrollList';

/**
 * Hook for managing virtual scroll state
 */
export const useVirtualScroll = ({
  items = [],
  itemHeight = 80,
  containerHeight = 400,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const visibleRange = useMemo(() => {
    const itemCount = items.length;
    if (itemCount === 0) return { start: 0, end: 0 };

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(itemCount - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    scrollTop,
    setScrollTop,
    isScrolling,
    setIsScrolling,
    visibleRange,
    totalHeight,
    offsetY
  };
};

/**
 * Grid virtual scrolling component for card layouts
 */
export const VirtualScrollGrid = React.memo(({
  items = [],
  itemWidth = 300,
  itemHeight = 200,
  containerWidth = '100%',
  containerHeight = 400,
  gap = 16,
  renderItem,
  overscan = 5,
  className = '',
  getItemKey = (item, index) => item.id || index,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  // Calculate columns based on container width
  const columns = useMemo(() => {
    if (typeof containerWidth === 'string') return 3; // Default fallback
    return Math.floor((containerWidth + gap) / (itemWidth + gap));
  }, [containerWidth, itemWidth, gap]);

  // Calculate rows
  const rows = Math.ceil(items.length / columns);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (rows === 0) return { startRow: 0, endRow: 0 };

    const rowHeight = itemHeight + gap;
    const visibleStartRow = Math.floor(scrollTop / rowHeight);
    const visibleEndRow = Math.min(
      rows - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight)
    );

    const startRow = Math.max(0, visibleStartRow - overscan);
    const endRow = Math.min(rows - 1, visibleEndRow + overscan);

    return { startRow, endRow };
  }, [scrollTop, containerHeight, itemHeight, gap, rows, overscan]);

  // Calculate total height
  const totalHeight = rows * (itemHeight + gap) - gap;

  // Handle scroll
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Generate visible items
  const visibleItems = useMemo(() => {
    const result = [];
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index < items.length) {
          result.push({
            index,
            item: items[index],
            key: getItemKey(items[index], index),
            row,
            col
          });
        }
      }
    }
    return result;
  }, [items, visibleRange, columns, getItemKey]);

  const offsetY = visibleRange.startRow * (itemHeight + gap);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      {...props}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
            gap: `${gap}px`,
            justifyContent: 'center'
          }}
        >
          {visibleItems.map(({ index, item, key, row, col }) => (
            <div key={key}>
              {renderItem({ item, index, row, col, isScrolling })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

VirtualScrollGrid.displayName = 'VirtualScrollGrid';

export default VirtualScrollList;
