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
    const [pwaState, setPwaState] = useState({ isInstallable: false, isInstalled: false });
    const [installButtonActive, setInstallButtonActive] = useState(false);
    
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
    
    // 监听PWA安装状态变化
    useEffect(() => {
        const handlePwaStateChange = (e) => {
            setPwaState(e.detail);
        };
        
        // 添加PWA安装状态变化事件监听
        document.addEventListener('pwainstallstatechange', handlePwaStateChange);
        
        // 获取当前PWA状态
        if (window.pwaInstaller) {
            setPwaState(window.pwaInstaller.getInstallState());
        }
        
        return () => {
            document.removeEventListener('pwainstallstatechange', handlePwaStateChange);
        };
    }, []);
    
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
    
    // Start drag - 使用回调以便清理函数能正确引用
    const handleDragStart = useCallback((e) => {
        e.preventDefault();
        
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
    }, []);
    
    // Handle drag movement - 使用回调以便清理函数能正确引用
    const handleDragMove = useCallback((e) => {
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
    }, [isDragging]);
    
    // End drag - 使用回调以便清理函数能正确引用
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        
        // Remove global dragging styles
        document.body.classList.remove('settings-dragging');
        
        // Clean up drag state
        dragStartRef.current = null;
    }, []);
    
    // 在useEffect中使用这些回调函数，并包含在依赖数组中
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.addEventListener('touchmove', handleDragMove, { passive: false });
            document.addEventListener('touchend', handleDragEnd);
        }
        
        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
            document.body.classList.remove('settings-dragging');
        };
    }, [isDragging, handleDragMove, handleDragEnd]);
    
    // Handle clearing cache with confirmation
    const handleClearCache = () => {
        if (confirm('确定要清除所有缓存吗？此操作不可撤销。')) {
            onClearCache();
            
            // 添加提示信息
            alert('缓存已清除，页面将自动刷新');
            
            // 短暂延迟后刷新页面
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    };
    
    // 处理PWA安装
    const handleInstallPWA = async () => {
        if (window.pwaInstaller && pwaState.isInstallable) {
            setInstallButtonActive(true);
            const result = await window.pwaInstaller.installPWA();
            setTimeout(() => setInstallButtonActive(false), 300);
            
            // 如果安装失败但不是用户取消，显示错误信息
            if (!result.success && result.message !== '用户取消了安装') {
                alert(result.message);
            }
        }
    };
    
    // 获取安装按钮状态
    const getInstallButtonState = () => {
        if (pwaState.isInstalled) {
            return { text: '已安装', disabled: true };
        } else if (pwaState.isInstallable) {
            return { text: '安装应用', disabled: false };
        } else {
            return { text: '不可安装', disabled: true };
        }
    };
    
    const installButtonState = getInstallButtonState();
    
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
                
                {/* PWA Install Section - NEW */}
                <div className="settings-section">
                    <h4 className="settings-section-title">应用安装</h4>
                    <div className="settings-control pwa-control">
                        <span className="pwa-label">
                            {pwaState.isInstalled ? '应用已安装' : 
                             pwaState.isInstallable ? '可安装为本地应用' : 
                             '当前不可安装'}
                        </span>
                        <button 
                            className={`settings-button pwa-install-button ${installButtonActive ? 'button-active' : ''}`}
                            onClick={handleInstallPWA}
                            title={installButtonState.text}
                            disabled={installButtonState.disabled}
                        >
                            <i className="fas fa-download"></i>
                        </button>
                    </div>
                </div>
                
                {/* 缓存管理部分 */}
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
window.Components.SettingsDialog = SettingsDialog;