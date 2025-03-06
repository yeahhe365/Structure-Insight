/**
 * Structure Insight Web - Main Application
 * Core application component and entry point
 */

const { useState, useEffect, useRef, useCallback } = React;
const { LineNumbers, HighlightedContent, FileTree, Resizer, ScrollToTop, SearchDialog, SettingsDialog } = window.Components;
const { useAppSettings, useDeviceDetection, useFileManagement, useSearchFunctionality, useUIInteractions } = window.Hooks;

// Main application component
const App = () => {
    // Application hooks
    const { 
        isDarkTheme, 
        fontSize, 
        lineHeight, 
        extractContent, 
        toggleTheme, 
        increaseFontSize, 
        decreaseFontSize, 
        toggleExtractContent 
    } = useAppSettings();
    
    const { 
        isMobile, 
        isLandscape, 
        mobileView, 
        isTransitioning, 
        mobileToggleRef, 
        toggleMobileView, 
        setMobileView, 
        setIsTransitioning, 
        isTabletLandscape 
    } = useDeviceDetection();
    
    const { 
        fileStructure, 
        filesContent, 
        treeData, 
        currentContent, 
        filePositions, 
        processing, 
        progress, 
        maxProgress, 
        statusMessage, 
        lineCount, 
        charCount, 
        isDragging, 
        isEditing, 
        currentEditingFile, 
        resetContent, 
        cancelProcessing, 
        copyContent, 
        saveContent, 
        handleLocalFolderSelect, 
        handleReceivedFiles, 
        handleFileTreeSelect, 
        handleFileDelete, 
        handleEditContent, 
        dragDropHandlers, 
        setStatusMessage 
    } = useFileManagement(extractContent);
    
    const { 
        isSearchDialogOpen, 
        searchQuery, 
        searchMatches, 
        currentMatchIndex, 
        performSearch, 
        goToNextMatch, 
        goToPreviousMatch, 
        openSearchDialog, 
        closeSearchDialog, 
        clearSearchHighlights 
    } = useSearchFunctionality(currentContent, lineHeight, setStatusMessage);
    
    const { 
        leftPanelWidth, 
        containerRef, 
        editorScrollRef, 
        lineNumbersRef, 
        appRef, 
        handleResizeUpdate, 
        handleMobileScroll, 
        scrollToTop 
    } = useUIInteractions();
    
    // Settings dialog state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const openSettings = useCallback(() => {
        setIsSettingsOpen(true);
    }, []);
    
    const closeSettings = useCallback(() => {
        setIsSettingsOpen(false);
    }, []);
    
    //=========================================================================
    // KEYBOARD SHORTCUTS
    //=========================================================================

    // Set up keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+F Search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                // Only open search if settings is not open to avoid conflict
                if (!isSettingsOpen) {
                    openSearchDialog(isMobile, mobileView, setIsTransitioning, setMobileView);
                }
            }
            
            // Ctrl+S Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveContent();
            }
            
            // Ctrl+C Copy
            if (e.ctrlKey && e.key === 'c' && !window.getSelection().toString()) {
                // Only trigger global copy if no text is selected
                copyContent();
            }
            
            // Esc Exit edit mode
            if (e.key === 'Escape' && isEditing) {
                e.preventDefault();
                handleEditContent(null);
            }
            
            // Esc Close settings
            if (e.key === 'Escape' && isSettingsOpen) {
                e.preventDefault();
                closeSettings();
            }
            
            // F3 Find next
            if ((e.key === 'F3' || (e.ctrlKey && e.key === 'g')) && searchMatches.length > 0) {
                e.preventDefault();
                if (e.shiftKey) {
                    goToPreviousMatch(editorScrollRef);
                } else {
                    goToNextMatch(editorScrollRef);
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        currentContent, isEditing, processing, searchMatches, currentMatchIndex, 
        isMobile, mobileView, openSearchDialog, saveContent, copyContent, 
        goToNextMatch, goToPreviousMatch, handleEditContent, isSettingsOpen,
        closeSettings, editorScrollRef, setIsTransitioning, setMobileView
    ]);

    //=========================================================================
    // EVENT HANDLERS
    //=========================================================================

    // Mobile scroll event listener
    useEffect(() => {
        if (isMobile && editorScrollRef.current) {
            const editorElement = editorScrollRef.current;
            editorElement.addEventListener('scroll', handleMobileScroll);
            
            return () => {
                editorElement.removeEventListener('scroll', handleMobileScroll);
            };
        }
    }, [isMobile, editorScrollRef, handleMobileScroll]);

    // Set up drag and drop event listeners
    useEffect(() => {
        const app = document.getElementById('app');
        if (app) {
            app.addEventListener('dragenter', dragDropHandlers.handleDragEnter);
            app.addEventListener('dragover', dragDropHandlers.handleDragOver);
            app.addEventListener('dragleave', dragDropHandlers.handleDragLeave);
            app.addEventListener('drop', (e) => dragDropHandlers.handleDrop(e, setMobileView, isMobile));
            
            return () => {
                app.removeEventListener('dragenter', dragDropHandlers.handleDragEnter);
                app.removeEventListener('dragover', dragDropHandlers.handleDragOver);
                app.removeEventListener('dragleave', dragDropHandlers.handleDragLeave);
                app.removeEventListener('drop', (e) => dragDropHandlers.handleDrop(e, setMobileView, isMobile));
            };
        }
    }, [isEditing, dragDropHandlers, setMobileView, isMobile]);

    // Check if scroll-to-top button should be shown when content length changes
    useEffect(() => {
        if (isMobile && editorScrollRef.current) {
            const scrollHeight = editorScrollRef.current.scrollHeight;
            const clientHeight = editorScrollRef.current.clientHeight;
            
            // Only enable scroll button when content is long enough
            if (scrollHeight > clientHeight * 1.5) {
                handleMobileScroll();
            }
        }
    }, [isMobile, currentContent, editorScrollRef, handleMobileScroll]);

    //=========================================================================
    // HELPER FUNCTIONS
    //=========================================================================

    // Wrapper functions for event handlers
    const handleLocalFolderSelectWrapper = useCallback(() => {
        handleLocalFolderSelect(isMobile, setMobileView);
    }, [handleLocalFolderSelect, isMobile, setMobileView]);
    
    const handleFileTreeSelectWrapper = useCallback((node) => {
        handleFileTreeSelect(node, editorScrollRef, isMobile, setMobileView, isTransitioning, setIsTransitioning, lineHeight);
    }, [handleFileTreeSelect, editorScrollRef, isMobile, setMobileView, isTransitioning, setIsTransitioning, lineHeight]);
    
    const handleSearchWrapper = useCallback((query, options) => {
        performSearch(query, options, editorScrollRef);
    }, [performSearch, editorScrollRef]);
    
    const handleNextMatchWrapper = useCallback(() => {
        goToNextMatch(editorScrollRef);
    }, [goToNextMatch, editorScrollRef]);
    
    const handlePreviousMatchWrapper = useCallback(() => {
        goToPreviousMatch(editorScrollRef);
    }, [goToPreviousMatch, editorScrollRef]);
    
    const openSearchDialogWrapper = useCallback(() => {
        // Only open search if settings is not open
        if (!isSettingsOpen) {
            openSearchDialog(isMobile, mobileView, setIsTransitioning, setMobileView);
        }
    }, [isSettingsOpen, openSearchDialog, isMobile, mobileView, setIsTransitioning, setMobileView]);

    //=========================================================================
    // RENDERING HELPERS
    //=========================================================================

    // Mobile class names
    const getLeftPanelClassNames = useCallback(() => {
        if (!isMobile) return '';
        const classNames = [
            mobileView === 'editor' ? 'mobile-full' : 'mobile-hidden'
        ];
        if (isTransitioning) classNames.push('mobile-transition');
        return classNames.join(' ');
    }, [isMobile, mobileView, isTransitioning]);
    
    const getRightPanelClassNames = useCallback(() => {
        if (!isMobile) return '';
        const classNames = [
            mobileView === 'tree' ? 'mobile-full' : 'mobile-hidden'
        ];
        if (isTransitioning) classNames.push('mobile-transition');
        return classNames.join(' ');
    }, [isMobile, mobileView, isTransitioning]);

    //=========================================================================
    // MAIN RENDER
    //=========================================================================

    return (
        <>
            {/* Header with integrated buttons */}
            <div className="app-header">
                <div className="app-logo">
                    <img src="favicon_io/android-chrome-192x192.png" alt="Structure Insight Logo" />
                    <span>Structure Insight Web</span>
                    
                    {/* Mobile device controls in title bar */}
                    {isMobile && (
                        <div className="mobile-title-controls">
                            <button 
                                className="header-button settings-button" 
                                onClick={openSettings}
                                title="设置"
                            >
                                <i className="fas fa-cog"></i>
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="header-buttons">
                    <button 
                        className="header-button" 
                        onClick={handleLocalFolderSelectWrapper}
                        title="选择一个文件夹开始分析"
                        disabled={isEditing}
                    >
                        <i className="fas fa-folder-open"></i>
                        {isMobile && <span className="tooltip">选择文件夹</span>}
                    </button>
                    <button 
                        className="header-button" 
                        onClick={copyContent} 
                        disabled={!currentContent || isEditing}
                        title="复制全部内容到剪贴板"
                    >
                        <i className="fas fa-copy"></i>
                        {isMobile && <span className="tooltip">复制内容</span>}
                    </button>
                    <button 
                        className="header-button" 
                        onClick={saveContent} 
                        disabled={!currentContent || isEditing}
                        title="将内容保存为文本文件"
                    >
                        <i className="fas fa-save"></i>
                        {isMobile && <span className="tooltip">保存文件</span>}
                    </button>
                    <button 
                        className="header-button" 
                        onClick={resetContent} 
                        disabled={!currentContent || processing}
                        title="清空当前结果并重置"
                    >
                        <i className="fas fa-redo"></i>
                        {isMobile && <span className="tooltip">重置</span>}
                    </button>
                    <button 
                        className="header-button" 
                        onClick={cancelProcessing} 
                        disabled={!processing}
                        title="取消当前处理"
                    >
                        <i className="fas fa-stop"></i>
                        {isMobile && <span className="tooltip">取消</span>}
                    </button>
                    <button
                        className="header-button"
                        onClick={openSearchDialogWrapper}
                        disabled={!currentContent || isEditing}
                        title="搜索内容 (Ctrl+F)"
                    >
                        <i className="fas fa-search"></i>
                        {isMobile && <span className="tooltip">搜索</span>}
                    </button>
                    
                    {/* Settings button */}
                    <button 
                        className="header-button settings-button" 
                        onClick={openSettings}
                        title="设置"
                    >
                        <i className="fas fa-cog"></i>
                        {isMobile && <span className="tooltip">设置</span>}
                    </button>
                </div>
            </div>
            
            <div 
                className={`container ${isDragging ? 'dragging' : ''}`} 
                ref={containerRef}
            >
                <div 
                    className={`left-panel ${getLeftPanelClassNames()}`} 
                    style={!isMobile || isTabletLandscape ? { width: `${leftPanelWidth}%` } : {}}
                >
                    <div className="code-editor">
                        <LineNumbers 
                            ref={lineNumbersRef}
                            content={currentContent} 
                            lineHeight={lineHeight}
                            fontSize={fontSize}
                        />
                        <div 
                            ref={editorScrollRef}
                            className="highlighted-content" 
                            style={{ 
                                fontSize: `${fontSize}px`,
                                lineHeight: `${lineHeight}px` 
                            }}
                        >
                            <HighlightedContent 
                                content={currentContent}
                                fontSize={fontSize}
                                lineHeight={lineHeight}
                                isEditing={isEditing}
                                currentEditingFile={currentEditingFile}
                                onEditContent={handleEditContent}
                            />
                        </div>
                    </div>
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${Math.min(100, (progress / Math.max(1, maxProgress)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                
                {/* Resizable divider - only for non-mobile or tablet landscape */}
                {(!isMobile || isTabletLandscape) && (
                    <Resizer 
                        onResize={handleResizeUpdate} 
                        position={leftPanelWidth}
                        isVertical={true}
                    />
                )}
                
                <div 
                    className={`right-panel ${getRightPanelClassNames()}`}
                    style={!isMobile || isTabletLandscape ? { width: `${100 - leftPanelWidth}%` } : {}}
                >
                    <FileTree 
                        nodes={treeData} 
                        onFileSelect={handleFileTreeSelectWrapper}
                        onFileDelete={handleFileDelete}
                    />
                </div>
            </div>
            
            <div className="status-bar">
                {processing ? statusMessage : `${statusMessage} - 共 ${lineCount} 行, ${charCount} 字符`}
                {isEditing && !processing && " - 编辑模式"}
                {searchMatches.length > 0 && !processing && !isEditing && 
                    ` - 找到 ${searchMatches.length} 个匹配项 (${currentMatchIndex + 1}/${searchMatches.length})`}
            </div>
            
            {/* Mobile view toggle button */}
            {isMobile && !isTabletLandscape && (
                <button 
                    ref={mobileToggleRef}
                    className="view-toggle"
                    onClick={toggleMobileView}
                    title={mobileView === 'editor' ? "切换到文件列表" : "切换到编辑器"}
                >
                    {mobileView === 'editor' ? 
                        <i className="fas fa-folder"></i> : 
                        <i className="fas fa-file-alt"></i>}
                </button>
            )}

            {/* Drop overlay */}
            {isDragging && (
                <div className="drop-overlay">
                    <div className="drop-message">
                        <i className="fas fa-upload"></i>
                        <span>释放鼠标以导入文件夹</span>
                    </div>
                </div>
            )}
            
            {/* Initial prompt */}
            {!currentContent && !processing && (
                <div className="initial-prompt">
                    <div className="prompt-content">
                        <i className="fas fa-folder-open"></i>
                        <p>拖放文件夹到此处，或点击左上角的文件夹图标</p>
                    </div>
                </div>
            )}
            
            {/* Mobile scroll to top button */}
            {isMobile && (
                <ScrollToTop targetRef={editorScrollRef} />
            )}
            
            {/* Search dialog */}
            <SearchDialog 
                isOpen={isSearchDialogOpen}
                onClose={closeSearchDialog}
                onSearch={handleSearchWrapper}
                onNext={handleNextMatchWrapper}
                onPrevious={handlePreviousMatchWrapper}
                resultCount={searchMatches.length}
                currentMatchIndex={currentMatchIndex < 0 ? 0 : currentMatchIndex}
                initialQuery={searchQuery}
            />
            
            {/* Settings dialog */}
            <SettingsDialog
                isOpen={isSettingsOpen}
                onClose={closeSettings}
                fontSize={fontSize}
                onIncreaseFontSize={increaseFontSize}
                onDecreaseFontSize={decreaseFontSize}
                isDarkTheme={isDarkTheme}
                onToggleTheme={toggleTheme}
                extractContent={extractContent}
                onToggleExtractContent={toggleExtractContent}
            />
            
            {/* Quick search button */}
            {currentContent && !isEditing && !isSearchDialogOpen && !isSettingsOpen && (
                <button 
                    className="quick-search-button"
                    onClick={openSearchDialogWrapper}
                    title="搜索 (Ctrl+F)"
                >
                    <i className="fas fa-search"></i>
                </button>
            )}
        </>
    );
};

// Render the application
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);