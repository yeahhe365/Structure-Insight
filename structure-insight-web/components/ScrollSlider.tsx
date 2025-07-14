import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollSliderProps {
  scrollRef: React.RefObject<HTMLElement>;
}

const ScrollSlider: React.FC<ScrollSliderProps> = ({ scrollRef }) => {
  const [thumbPosition, setThumbPosition] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const updateSlider = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;

    if (scrollHeight <= clientHeight) {
      if (isVisible) setIsVisible(false);
      return;
    }
    if (!isVisible) setIsVisible(true);

    const trackHeight = trackRef.current?.clientHeight || 0;
    const newThumbHeight = Math.max(20, (clientHeight / scrollHeight) * trackHeight);
    const scrollableDist = scrollHeight - clientHeight;
    const newThumbPosition = scrollableDist > 0 ? (scrollTop / scrollableDist) * (trackHeight - newThumbHeight) : 0;
    
    setThumbHeight(newThumbHeight);
    setThumbPosition(newThumbPosition);
  }, [scrollRef, isVisible]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    
    const handleScroll = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(updateSlider);
    };

    updateSlider();

    scrollEl.addEventListener('scroll', handleScroll, { passive: true });
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(scrollEl);
    if(trackRef.current) {
        resizeObserver.observe(trackRef.current);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      scrollEl.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [scrollRef, updateSlider]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !trackRef.current || !scrollRef.current) return;

    const trackRect = trackRef.current.getBoundingClientRect();
    let newY = e.clientY - trackRect.top;

    const trackHeight = trackRef.current.clientHeight;
    const scrollEl = scrollRef.current;
    const currentThumbHeight = Math.max(20, (scrollEl.clientHeight / scrollEl.scrollHeight) * trackHeight);

    const newThumbPosition = Math.max(0, Math.min(newY - currentThumbHeight / 2, trackHeight - currentThumbHeight));
    
    const scrollableDist = trackHeight - currentThumbHeight;
    if(scrollableDist <= 0) return;

    const scrollPercentage = newThumbPosition / scrollableDist;
    scrollEl.scrollTop = scrollPercentage * (scrollEl.scrollHeight - scrollEl.clientHeight);
  }, [isDragging, scrollRef]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    if(isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  const handleTrackMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== trackRef.current) return;

    if (!trackRef.current || !scrollRef.current) return;
    
    const trackRect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;

    const trackHeight = trackRef.current.clientHeight;
    const scrollEl = scrollRef.current;
    
    const currentThumbHeight = (scrollEl.clientHeight / scrollEl.scrollHeight) * trackHeight;
    const newThumbPosition = clickY - currentThumbHeight / 2;
    
    const scrollableDist = trackHeight - currentThumbHeight;
    if(scrollableDist <= 0) return;

    const scrollPercentage = newThumbPosition / scrollableDist;
    
    scrollEl.scrollTop = scrollPercentage * (scrollEl.scrollHeight - scrollEl.clientHeight);
    
    // Also initiate dragging from here for a better UX
    handleMouseDown(e);
  }, [scrollRef, handleMouseDown]);

  return (
    <AnimatePresence>
    {isVisible && (
        <motion.div
            ref={trackRef}
            className="absolute top-0 right-0 h-full w-5 bg-transparent z-20 group"
            onMouseDown={handleTrackMouseDown}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div
                className="absolute w-2.5 left-1/2 -translate-x-1/2 bg-light-subtle-text/30 dark:bg-dark-subtle-text/30 rounded-full transition-colors duration-200 group-hover:bg-light-subtle-text/50 dark:group-hover:bg-dark-subtle-text/50"
                style={{
                    height: `${thumbHeight}px`,
                    top: `${thumbPosition}px`,
                    cursor: 'grab',
                }}
                onMouseDown={handleMouseDown}
            />
        </motion.div>
    )}
    </AnimatePresence>
  );
};

export default ScrollSlider;
