/**
 * Structure Insight Web - UI Hooks
 * Hooks for UI and device-related functionality
 */

const { useState, useEffect, useRef, useCallback } = React;
const { Storage } = window.Utils;

//=============================================================================
// DEVICE DETECTION HOOKS MODULE
//=============================================================================

/**
 * Hook for detecting device type and managing mobile view state
 * @returns {Object} Device information and state
 */
const useDeviceDetection = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const [mobileView, setMobileView] = useState(Storage.load('mobileView', 'editor'));
    const [isTransitioning, setIsTransitioning] = useState(false);
    const mobileToggleRef = useRef(null);
    
    // Update device detection on resize
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            const newIsLandscape = window.innerWidth > window.innerHeight;
            
            setIsMobile(newIsMobile);
            setIsLandscape(newIsLandscape);
            
            // Special handling for tablets in landscape mode
            if (newIsMobile && newIsLandscape && window.innerWidth > 480) {
                document.documentElement.classList.add('tablet-landscape');
            } else {
                document.documentElement.classList.remove('tablet-landscape');
            }
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        // Initial run
        handleResize();
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);
    
    // Save current mobile view state
    useEffect(() => {
        if (isMobile) {
            Storage.save('mobileView', mobileView);
        }
    }, [mobileView, isMobile]);
    
    // Toggle mobile view handler
    const toggleMobileView = useCallback(() => {
        // Add animation class
        if (mobileToggleRef.current) {
            mobileToggleRef.current.classList.add('clicked');
            setTimeout(() => {
                if (mobileToggleRef.current) {
                    mobileToggleRef.current.classList.remove('clicked');
                }
            }, 300);
        }
        
        // Add animation effect
        setIsTransitioning(true);
        setTimeout(() => {
            setMobileView(prev => prev === 'editor' ? 'tree' : 'editor');
            // Delay ending animation state to match CSS transition time
            setTimeout(() => setIsTransitioning(false), 300);
        }, 50);
    }, []);
    
    return {
        isMobile, 
        isLandscape,
        mobileView,
        isTransitioning,
        mobileToggleRef,
        toggleMobileView,
        setMobileView,
        setIsTransitioning,
        isTabletLandscape: isMobile && isLandscape && window.innerWidth > 480
    };
};

//=============================================================================
// UI INTERACTIONS HOOKS MODULE
//=============================================================================

/**
 * Hook for UI interactions and scroll syncing
 * @returns {Object} UI interaction handlers and state
 */
const useUIInteractions = () => {
    const [leftPanelWidth, setLeftPanelWidth] = useState(Storage.load('leftPanelWidth', 75));
    const [scrollToTopVisible, setScrollToTopVisible] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    
    const containerRef = useRef(null);
    const editorScrollRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const appRef = useRef(null);
    
    // Save left panel width
    useEffect(() => {
        Storage.save('leftPanelWidth', leftPanelWidth);
    }, [leftPanelWidth]);
    
    // Handle panel resize update
    const handleResizeUpdate = useCallback((newPercentage) => {
        setLeftPanelWidth(newPercentage);
    }, []);
    
    // Sync line numbers with content scrolling
    useEffect(() => {
        const syncScroll = () => {
            if (editorScrollRef.current && lineNumbersRef.current) {
                lineNumbersRef.current.scrollTop = editorScrollRef.current.scrollTop;
            }
        };
        
        const editorElement = editorScrollRef.current;
        if (editorElement) {
            // Add scroll event listener
            editorElement.addEventListener('scroll', syncScroll);
            
            // Use ResizeObserver to monitor size changes
            if (typeof ResizeObserver !== 'undefined') {
                const observer = new ResizeObserver(syncScroll);
                observer.observe(editorElement);
                
                // Also observe container size changes
                if (containerRef.current) {
                    observer.observe(containerRef.current);
                }
                
                return () => {
                    editorElement.removeEventListener('scroll', syncScroll);
                    observer.disconnect();
                };
            } else {
                // Fallback: listen to window resize
                window.addEventListener('resize', syncScroll);
                return () => {
                    editorElement.removeEventListener('scroll', syncScroll);
                    window.removeEventListener('resize', syncScroll);
                };
            }
        }
    }, [editorScrollRef.current, lineNumbersRef.current, containerRef.current]);
    
    // Force sync scrolling after divider adjustment
    useEffect(() => {
        // Force sync scrolling
        if (editorScrollRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = editorScrollRef.current.scrollTop;
        }
    }, [leftPanelWidth]);
    
    // Mobile scroll event handling
    const handleMobileScroll = useCallback(() => {
        if (!editorScrollRef.current) return;
        
        // Show/hide scroll to top button
        const scrollPosition = editorScrollRef.current.scrollTop;
        const showScrollButton = scrollPosition > 300;
        
        if (showScrollButton !== scrollToTopVisible) {
            setScrollToTopVisible(showScrollButton);
        }
        
        // Track scrolling state
        if (!isScrolling) {
            setIsScrolling(true);
            setTimeout(() => setIsScrolling(false), 100);
        }
    }, [scrollToTopVisible, isScrolling]);
    
    // Scroll to top function
    const scrollToTop = useCallback(() => {
        if (editorScrollRef.current) {
            editorScrollRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, []);
    
    return {
        leftPanelWidth,
        scrollToTopVisible,
        containerRef,
        editorScrollRef,
        lineNumbersRef,
        appRef,
        handleResizeUpdate,
        handleMobileScroll,
        scrollToTop
    };
};

// Export hooks
window.Hooks = window.Hooks || {};
window.Hooks.useDeviceDetection = useDeviceDetection;
window.Hooks.useUIInteractions = useUIInteractions;