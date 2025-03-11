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
        isMobile, 
        mobileView, 
        saveContent, 
        copyContent,
        handleEditContent, 
        isSettingsOpen,
        closeSettings, 
        editorScrollRef, 
        setIsTransitioning, 
        setMobileView
    }) => {
        const handleKeyDown = (e) => {
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
        
        return {
            handleLocalFolderSelectWrapper,
            handleFileTreeSelectWrapper
        };
    }
};

// Make helper functions available globally
window.AppHelpers = AppHelpers;