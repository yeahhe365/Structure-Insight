/**
 * Structure Insight Web - App Helper Functions
 * Helper functions for the main app component
 */

const { useState, useEffect, useRef, useCallback } = React;

// App component helpers
const AppHelpers = {
    /**
     * Get class names for mobile panels
     * @param {boolean} isMobile Whether on mobile device
     * @param {string} mobileView Current mobile view mode
     * @param {boolean} isTransitioning Whether transition is active
     * @returns {Object} Class name functions
     */
    getMobilePanelClassNames: (isMobile, mobileView, isTransitioning) => {
        const getLeftPanelClassNames = () => {
            if (!isMobile) return '';
            const classNames = [
                mobileView === 'editor' ? 'mobile-full' : 'mobile-hidden'
            ];
            if (isTransitioning) classNames.push('mobile-transition');
            return classNames.join(' ');
        };
        
        const getRightPanelClassNames = () => {
            if (!isMobile) return '';
            const classNames = [
                mobileView === 'tree' ? 'mobile-full' : 'mobile-hidden'
            ];
            if (isTransitioning) classNames.push('mobile-transition');
            return classNames.join(' ');
        };
        
        return {
            getLeftPanelClassNames,
            getRightPanelClassNames
        };
    },
    
    /**
     * Set up keyboard shortcuts for the app
     * @param {Object} params Parameters for keyboard shortcuts
     * @returns {Function} Event listener cleanup function
     */
    setupKeyboardShortcuts: ({
        currentContent, 
        isEditing, 
        processing, 
        searchMatches, 
        currentMatchIndex,
        isMobile, 
        mobileView, 
        openSearchDialog, 
        saveContent, 
        copyContent,
        goToNextMatch, 
        goToPreviousMatch, 
        handleEditContent, 
        isSettingsOpen,
        closeSettings, 
        editorScrollRef, 
        setIsTransitioning, 
        setMobileView
    }) => {
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
    },
    
    /**
     * Setup drag and drop event handlers
     * @param {Object} params Parameters for drag and drop
     * @returns {Function} Event listener cleanup function
     */
    setupDragAndDrop: ({
        isEditing,
        dragDropHandlers,
        setMobileView,
        isMobile
    }) => {
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
        
        return () => {};
    },
    
    /**
     * Create wrapper functions for event handlers
     * @param {Object} params Parameters for wrappers
     * @returns {Object} Wrapped functions
     */
    createWrapperFunctions: ({
        handleLocalFolderSelect,
        handleFileTreeSelect,
        performSearch,
        goToNextMatch,
        goToPreviousMatch,
        openSearchDialog,
        isMobile,
        setMobileView,
        editorScrollRef,
        isTransitioning,
        setIsTransitioning,
        lineHeight,
        isSettingsOpen
    }) => {
        // Wrapper functions for event handlers
        const handleLocalFolderSelectWrapper = () => {
            handleLocalFolderSelect(isMobile, setMobileView);
        };
        
        const handleFileTreeSelectWrapper = (node) => {
            handleFileTreeSelect(node, editorScrollRef, isMobile, setMobileView, isTransitioning, setIsTransitioning, lineHeight);
        };
        
        const handleSearchWrapper = (query, options) => {
            performSearch(query, options, editorScrollRef);
        };
        
        const handleNextMatchWrapper = () => {
            goToNextMatch(editorScrollRef);
        };
        
        const handlePreviousMatchWrapper = () => {
            goToPreviousMatch(editorScrollRef);
        };
        
        const openSearchDialogWrapper = () => {
            // Only open search if settings is not open
            if (!isSettingsOpen) {
                openSearchDialog(isMobile, mobileView, setIsTransitioning, setMobileView);
            }
        };
        
        return {
            handleLocalFolderSelectWrapper,
            handleFileTreeSelectWrapper,
            handleSearchWrapper,
            handleNextMatchWrapper,
            handlePreviousMatchWrapper,
            openSearchDialogWrapper
        };
    }
};

// Make helper functions available globally
window.AppHelpers = AppHelpers;