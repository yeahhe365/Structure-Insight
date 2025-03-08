/**
 * Structure Insight Web - UI Components
 * Dialogs, resizers, and UI utility components
 */

const { useState, useEffect, useRef, useCallback } = React;

//=============================================================================
// UI UTILITY COMPONENTS
//=============================================================================

/**
 * Resizable panel divider component
 * @param {Object} props Component props
 * @param {Function} props.onResize Callback when resize completes
 * @param {number} props.position Current position percentage
 * @param {boolean} props.isVertical Whether resizer is vertical
 */
const Resizer = ({ onResize, position, isVertical = true }) => {
    const [isDragging, setIsDragging] = useState(false);
    const resizerRef = useRef(null);
    const leftPanelRef = useRef(null);
    const rightPanelRef = useRef(null);
    const initialPositionRef = useRef(0);
    const initialLeftWidthRef = useRef(0);
    const initialRightWidthRef = useRef(0);
    
    // Get references to panels
    useEffect(() => {
        const container = resizerRef.current?.parentElement;
        if (container) {
            leftPanelRef.current = container.querySelector('.left-panel');
            rightPanelRef.current = container.querySelector('.right-panel');
        }
    }, []);
    
    // Start resizing
    const startResize = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsDragging(true);
        
        // Get initial position
        const clientPosition = e.touches ? e.touches[0][isVertical ? 'clientX' : 'clientY'] : e[isVertical ? 'clientX' : 'clientY'];
        initialPositionRef.current = clientPosition;
        
        // Get initial widths
        if (leftPanelRef.current && rightPanelRef.current) {
            initialLeftWidthRef.current = leftPanelRef.current.getBoundingClientRect()[isVertical ? 'width' : 'height'];
            initialRightWidthRef.current = rightPanelRef.current.getBoundingClientRect()[isVertical ? 'width' : 'height'];
        }
        
        // Add global resizing style
        document.body.classList.add('resizing');
        document.body.classList.add(isVertical ? 'vertical' : 'horizontal');
    };
    
    // Handle mouse movement during resize
    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !leftPanelRef.current || !rightPanelRef.current) return;
        
        // Calculate delta
        const clientPosition = e.touches ? e.touches[0][isVertical ? 'clientX' : 'clientY'] : e[isVertical ? 'clientX' : 'clientY'];
        const delta = clientPosition - initialPositionRef.current;
        
        // Get container size
        const containerSize = leftPanelRef.current.parentElement.getBoundingClientRect()[isVertical ? 'width' : 'height'];
        
        // Calculate new left size
        let newLeftSize = initialLeftWidthRef.current + delta;
        
        // Calculate percentage
        const leftPercent = Math.max(20, Math.min(85, (newLeftSize / containerSize) * 100));
        const rightPercent = 100 - leftPercent;
        
        // Set DOM element styles directly
        leftPanelRef.current.style[isVertical ? 'width' : 'height'] = `${leftPercent}%`;
        rightPanelRef.current.style[isVertical ? 'width' : 'height'] = `${rightPercent}%`;
        
        // Update resizer position
        if (resizerRef.current) {
            resizerRef.current.style[isVertical ? 'left' : 'top'] = `${leftPercent}%`;
        }
        
        // Sync scroll positions
        const editorScroll = document.querySelector('.highlighted-content');
        const lineNumbers = document.querySelector('.line-numbers');
        if (editorScroll && lineNumbers) {
            lineNumbers.scrollTop = editorScroll.scrollTop;
        }
    }, [isDragging, isVertical]);
    
    // Use same handler for touch events
    const handleTouchMove = handleMouseMove;
    
    // End resizing
    const stopResize = useCallback(() => {
        if (!isDragging) return;
        
        // Remove resizing state
        setIsDragging(false);
        document.body.classList.remove('resizing');
        document.body.classList.remove('vertical');
        document.body.classList.remove('horizontal');
        
        // Trigger React state update to save current position
        if (leftPanelRef.current) {
            const containerSize = leftPanelRef.current.parentElement.getBoundingClientRect()[isVertical ? 'width' : 'height'];
            const leftSize = leftPanelRef.current.getBoundingClientRect()[isVertical ? 'width' : 'height'];
            const leftPercent = (leftSize / containerSize) * 100;
            
            // Call callback to update React state
            onResize(leftPercent);
        }
    }, [isDragging, onResize, isVertical]);
    
    // Add and remove event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove, { passive: false });
            document.addEventListener('mouseup', stopResize);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', stopResize);
            document.addEventListener('touchcancel', stopResize);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', stopResize);
            document.removeEventListener('touchcancel', stopResize);
        }
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', stopResize);
            document.removeEventListener('touchcancel', stopResize);
            document.body.classList.remove('resizing');
            document.body.classList.remove('vertical');
            document.body.classList.remove('horizontal');
        };
    }, [isDragging, handleMouseMove, stopResize, handleTouchMove]);
    
    return (
        <div 
            ref={resizerRef}
            className={`resizer ${isDragging ? 'active' : ''} ${isVertical ? 'vertical' : 'horizontal'}`}
            style={{ [isVertical ? 'left' : 'top']: `${position}%` }}
            onMouseDown={startResize}
            onTouchStart={startResize}
            title={isVertical ? "拖动调整宽度" : "拖动调整高度"}
        >
            <div className="resizer-handle"></div>
        </div>
    );
};

/**
 * Scroll to top button component
 * @param {Object} props Component props
 * @param {Object} props.targetRef Reference to scrollable element
 */
const ScrollToTop = ({ targetRef }) => {
    const [isVisible, setIsVisible] = useState(false);
    const buttonRef = useRef(null);

    // Check scroll position to show/hide button
    useEffect(() => {
        const handleScroll = () => {
            if (!targetRef.current) return;
            
            const scrollY = targetRef.current.scrollTop;
            setIsVisible(scrollY > 300);
        };
        
        const scrollableElement = targetRef.current;
        if (scrollableElement) {
            scrollableElement.addEventListener('scroll', handleScroll);
            
            // Initial check
            handleScroll();
            
            return () => scrollableElement.removeEventListener('scroll', handleScroll);
        }
    }, [targetRef]);
    
    // Handle scroll to top action
    const scrollToTop = () => {
        if (!targetRef.current) return;
        
        // Smooth scroll to top
        targetRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Add click animation
        if (buttonRef.current) {
            buttonRef.current.classList.add('clicked');
            setTimeout(() => {
                if (buttonRef.current) {
                    buttonRef.current.classList.remove('clicked');
                }
            }, 300);
        }
    };
    
    return (
        <button 
            ref={buttonRef}
            className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
            onClick={scrollToTop}
            aria-label="回到顶部"
            title="回到顶部"
        >
            <i className="fas fa-arrow-up"></i>
        </button>
    );
};

//=============================================================================
// SEARCH COMPONENTS
//=============================================================================

/**
 * Search dialog component
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether dialog is open
 * @param {Function} props.onClose Close dialog callback
 * @param {Function} props.onSearch Execute search callback
 * @param {Function} props.onNext Go to next match callback
 * @param {Function} props.onPrevious Go to previous match callback
 * @param {number} props.resultCount Number of search results
 * @param {number} props.currentMatchIndex Current match index
 * @param {string} props.initialQuery Initial search query
 */
const SearchDialog = ({ 
    isOpen, 
    onClose, 
    onSearch, 
    onNext, 
    onPrevious,
    resultCount,
    currentMatchIndex,
    initialQuery = ''
}) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [useRegex, setUseRegex] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const inputRef = useRef(null);
    const dialogRef = useRef(null);
    const [position, setPosition] = useState({ right: 16, bottom: 80 });
    const positionRef = useRef({ right: 16, bottom: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef(null);
    
    // When position state changes, update position reference
    useEffect(() => {
        positionRef.current = position;
    }, [position]);
    
    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current.focus();
                inputRef.current.select();
            }, 100);
        }
        
        // Reset dragging state when dialog closes
        if (!isOpen) {
            setIsDragging(false);
        }
    }, [isOpen]);
    
    // Handle keyboard shortcuts
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                onPrevious(); // Shift+Enter to find previous
            } else {
                onSearch(searchQuery, { caseSensitive, useRegex, wholeWord }); // Enter to search
            }
        } else if (e.key === 'Escape') {
            onClose(); // Esc to close dialog
        } else if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
            e.preventDefault();
            if (e.shiftKey) {
                onPrevious(); // Shift+F3 to find previous
            } else {
                onNext(); // F3 to find next
            }
        }
    };
    
    // Execute search
    const doSearch = () => {
        onSearch(searchQuery, { caseSensitive, useRegex, wholeWord });
    };
    
    // Start drag
    const handleDragStart = (e) => {
        e.preventDefault();
        if (document.body.classList.contains('settings-dragging')) return;
        
        setIsDragging(true);
        
        // Add global dragging style
        document.body.classList.add('search-dragging');
        
        // Record initial position
        if (e.type === 'touchstart') {
            dragStartRef.current = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY,
                position: { ...positionRef.current }
            };
        } else {
            dragStartRef.current = { 
                x: e.clientX, 
                y: e.clientY,
                position: { ...positionRef.current }
            };
        }
        
        // Add global event listeners
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
    };
    
    // Handle drag movement
    const handleDragMove = (e) => {
        if (!isDragging || !dragStartRef.current) return;
        
        e.preventDefault();
        
        // Calculate movement
        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const deltaX = clientX - dragStartRef.current.x;
        const deltaY = clientY - dragStartRef.current.y;
        
        // Update position (calculate right/bottom inversely)
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        const newRight = Math.max(0, Math.min(viewportWidth - 60, dragStartRef.current.position.right - deltaX));
        const newBottom = Math.max(0, Math.min(viewportHeight - 60, dragStartRef.current.position.bottom - deltaY));
        
        setPosition({
            right: newRight,
            bottom: newBottom
        });
    };
    
    // End drag
    const handleDragEnd = () => {
        setIsDragging(false);
        
        // Remove global dragging styles
        document.body.classList.remove('search-dragging');
        
        // Remove global event listeners
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
            document.body.classList.remove('search-dragging');
        };
    }, []);
    
    // Toggle options panel
    const toggleOptions = () => {
        setShowOptions(!showOptions);
    };
    
    if (!isOpen) return null;
    
    return (
        <div 
            className={`floating-search-dialog ${isDragging ? 'dragging' : ''}`}
            ref={dialogRef}
            style={{ 
                right: `${position.right}px`, 
                bottom: `${position.bottom}px`,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            <div 
                className="search-dialog-header" 
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
            >
                <div className="drag-handle">
                    <i className="fas fa-grip-lines"></i>
                </div>
                <button 
                    className="search-option-toggle" 
                    onClick={toggleOptions}
                    title={showOptions ? "隐藏选项" : "显示选项"}
                >
                    <i className={`fas fa-cog ${showOptions ? 'active' : ''}`}></i>
                </button>
                <button 
                    className="search-dialog-close" 
                    onClick={onClose}
                    title="关闭 (Esc)"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>
            
            <div className="search-dialog-content">
                <div className="search-input-group">
                    <input 
                        ref={inputRef}
                        type="text" 
                        className="search-input" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        onKeyDown={handleKeyDown}
                        placeholder="输入搜索文本..." 
                    />
                    <button 
                        className="search-button" 
                        onClick={doSearch}
                        title="查找 (Enter)"
                        disabled={!searchQuery.trim()}
                    >
                        <i className="fas fa-search"></i>
                    </button>
                </div>
                
                {showOptions && (
                    <div className="search-options">
                        <label className="search-option">
                            <input 
                                type="checkbox" 
                                checked={caseSensitive} 
                                onChange={() => setCaseSensitive(!caseSensitive)}
                            />
                            <span>区分大小写</span>
                        </label>
                        
                        <label className="search-option">
                            <input 
                                type="checkbox" 
                                checked={useRegex} 
                                onChange={() => {
                                    setUseRegex(!useRegex);
                                    if (!useRegex) setWholeWord(false);
                                }}
                            />
                            <span>正则表达式</span>
                        </label>
                        
                        <label className="search-option">
                            <input 
                                type="checkbox" 
                                checked={wholeWord} 
                                onChange={() => setWholeWord(!wholeWord)}
                                disabled={useRegex}
                            />
                            <span>全词匹配</span>
                        </label>
                    </div>
                )}
                
                <div className="search-results">
                    {resultCount !== null && (
                        <div className="search-result-count">
                            {resultCount > 0 ? (
                                <span>{currentMatchIndex + 1}/{resultCount}</span>
                            ) : searchQuery.trim() ? (
                                <span className="no-results">无匹配</span>
                            ) : null}
                        </div>
                    )}
                    
                    <div className="search-navigation">
                        <button 
                            className="search-nav-button" 
                            onClick={onPrevious}
                            disabled={resultCount === 0}
                            title="上一个匹配项 (Shift+Enter 或 Shift+F3)"
                        >
                            <i className="fas fa-chevron-up"></i>
                        </button>
                        <button 
                            className="search-nav-button" 
                            onClick={onNext}
                            disabled={resultCount === 0}
                            title="下一个匹配项 (F3)"
                        >
                            <i className="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

//=============================================================================
// SETTINGS DIALOG COMPONENT
//=============================================================================

/**
 * Settings dialog component
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether dialog is open
 * @param {Function} props.onClose Close dialog callback
 * @param {number} props.fontSize Current font size
 * @param {Function} props.onIncreaseFontSize Increase font size callback
 * @param {Function} props.onDecreaseFontSize Decrease font size callback
 * @param {boolean} props.isDarkTheme Whether dark theme is active
 * @param {Function} props.onToggleTheme Toggle theme callback
 * @param {boolean} props.extractContent Whether to extract content
 * @param {Function} props.onToggleExtractContent Toggle extract content callback
 * @param {Function} props.onClearCache Callback to clear all cache data
 */
const SettingsDialog = ({
    isOpen,
    onClose,
    fontSize,
    onIncreaseFontSize,
    onDecreaseFontSize,
    isDarkTheme,
    onToggleTheme,
    extractContent,
    onToggleExtractContent,
    onClearCache
}) => {
    const dialogRef = useRef(null);
    const [position, setPosition] = useState({ right: 16, top: 80 });
    const positionRef = useRef({ right: 16, top: 80 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef(null);
    
    // When position state changes, update position reference
    useEffect(() => {
        positionRef.current = position;
    }, [position]);
    
    // Reset dragging state when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setIsDragging(false);
        }
    }, [isOpen]);
    
    // Handle keyboard shortcuts
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose(); // Esc to close dialog
        }
    };
    
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    
    // Start drag
    const handleDragStart = (e) => {
        e.preventDefault();
        if (document.body.classList.contains('search-dragging')) return;
        
        setIsDragging(true);
        
        // Add global dragging style
        document.body.classList.add('settings-dragging');
        
        // Record initial position
        if (e.type === 'touchstart') {
            dragStartRef.current = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY,
                position: { ...positionRef.current }
            };
        } else {
            dragStartRef.current = { 
                x: e.clientX, 
                y: e.clientY,
                position: { ...positionRef.current }
            };
        }
        
        // Add global event listeners
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
    };
    
    // Handle drag movement
    const handleDragMove = (e) => {
        if (!isDragging || !dragStartRef.current) return;
        
        e.preventDefault();
        
        // Calculate movement
        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const deltaX = clientX - dragStartRef.current.x;
        const deltaY = clientY - dragStartRef.current.y;
        
        // Update position (calculate right/top)
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        const newRight = Math.max(0, Math.min(viewportWidth - 60, dragStartRef.current.position.right - deltaX));
        const newTop = Math.max(0, Math.min(viewportHeight - 160, dragStartRef.current.position.top + deltaY));
        
        setPosition({
            right: newRight,
            top: newTop
        });
    };
    
    // End drag
    const handleDragEnd = () => {
        setIsDragging(false);
        
        // Remove global dragging styles
        document.body.classList.remove('settings-dragging');
        
        // Remove global event listeners
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
            document.body.classList.remove('settings-dragging');
        };
    }, []);
    
    // Handle clearing cache with confirmation
    const handleClearCache = () => {
        if (confirm('确定要清除所有缓存吗？此操作不可撤销。')) {
            onClearCache();
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div 
            className={`settings-dialog ${isDragging ? 'dragging' : ''}`}
            ref={dialogRef}
            style={{ 
                right: `${position.right}px`, 
                top: `${position.top}px`,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            <div 
                className="settings-dialog-header" 
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
            >
                <div className="drag-handle">
                    <i className="fas fa-grip-lines"></i>
                </div>
                <span className="settings-title">设置</span>
                <button 
                    className="settings-dialog-close" 
                    onClick={onClose}
                    title="关闭 (Esc)"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>
            
            <div className="settings-dialog-content">
                {/* Font Size Control */}
                <div className="settings-section">
                    <h4 className="settings-section-title">字体大小</h4>
                    <div className="settings-control font-size-control">
                        <button 
                            className="settings-button" 
                            onClick={onDecreaseFontSize}
                            title="减小字体"
                            disabled={fontSize <= 12}
                        >
                            <i className="fas fa-minus"></i>
                        </button>
                        <span className="font-size-value">{fontSize}px</span>
                        <button 
                            className="settings-button" 
                            onClick={onIncreaseFontSize}
                            title="增大字体"
                            disabled={fontSize >= 28}
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                
                {/* Theme Control */}
                <div className="settings-section">
                    <h4 className="settings-section-title">主题</h4>
                    <div className="settings-control theme-control">
                        <span className="theme-label">
                            {isDarkTheme ? '深色主题' : '浅色主题'}
                        </span>
                        <button 
                            className="settings-button theme-toggle" 
                            onClick={onToggleTheme}
                            title="切换主题"
                        >
                            {isDarkTheme ? 
                                <i className="fas fa-sun"></i> : 
                                <i className="fas fa-moon"></i>}
                        </button>
                    </div>
                </div>
                
                {/* Extract Content Control */}
                <div className="settings-section">
                    <h4 className="settings-section-title">内容提取</h4>
                    <div className="settings-control extract-control">
                        <span className="extract-label">
                            {extractContent ? '自动提取文件内容' : '不提取文件内容'}
                        </span>
                        <button 
                            className={`settings-button extract-toggle ${extractContent ? 'active' : ''}`} 
                            onClick={onToggleExtractContent}
                            title="切换内容提取"
                        >
                            <i className="fas fa-code"></i>
                        </button>
                    </div>
                </div>
                
                {/* 新增: 缓存管理部分 */}
                <div className="settings-section">
                    <h4 className="settings-section-title">缓存管理</h4>
                    <div className="settings-control cache-control">
                        <span className="cache-label">清除所有本地缓存数据</span>
                        <button 
                            className="settings-button clear-cache-button" 
                            onClick={handleClearCache}
                            title="清除所有缓存数据"
                        >
                            <i className="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export components
window.Components = window.Components || {};
window.Components.Resizer = Resizer;
window.Components.ScrollToTop = ScrollToTop;
window.Components.SearchDialog = SearchDialog;
window.Components.SettingsDialog = SettingsDialog;