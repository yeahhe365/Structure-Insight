/**
 * Structure Insight Web - Settings Hooks
 * Hooks for managing application settings
 */

const { useState, useEffect, useCallback } = React;
const { Storage } = window.Utils;

//=============================================================================
// APP SETTINGS HOOKS MODULE
//=============================================================================

/**
 * Hook for managing application settings (theme, font size, etc.)
 * @returns {Object} Theme and font size state and handlers
 */
const useAppSettings = () => {
    // Load settings from storage
    const [isDarkTheme, setIsDarkTheme] = useState(Storage.load('theme', false));
    const [fontSize, setFontSize] = useState(Storage.load('fontSize', 16));
    const [extractContent, setExtractContent] = useState(Storage.load('extractContent', true));
    const [lineHeight, setLineHeight] = useState(Math.round(fontSize * 1.5));
    
    // Save settings to storage when they change
    useEffect(() => {
        Storage.save('theme', isDarkTheme);
    }, [isDarkTheme]);
    
    useEffect(() => {
        Storage.save('fontSize', fontSize);
    }, [fontSize]);
    
    useEffect(() => {
        Storage.save('extractContent', extractContent);
    }, [extractContent]);
    
    // Update line height when font size changes
    useEffect(() => {
        setLineHeight(Math.round(fontSize * 1.5));
    }, [fontSize]);
    
    // Apply theme to document
    useEffect(() => {
        document.body.className = isDarkTheme ? 'dark-theme' : '';
    }, [isDarkTheme]);
    
    // Theme toggle handler
    const toggleTheme = useCallback(() => {
        setIsDarkTheme(prev => !prev);
    }, []);
    
    // Font size adjustment handlers
    const increaseFontSize = useCallback(() => {
        if (fontSize < 28) setFontSize(prev => prev + 2);
    }, [fontSize]);
    
    const decreaseFontSize = useCallback(() => {
        if (fontSize > 12) setFontSize(prev => prev - 2);
    }, [fontSize]);
    
    // Extract content toggle handler
    const toggleExtractContent = useCallback(() => {
        setExtractContent(prev => !prev);
    }, []);
    
    return {
        isDarkTheme,
        fontSize,
        lineHeight,
        extractContent,
        toggleTheme,
        increaseFontSize,
        decreaseFontSize,
        toggleExtractContent
    };
};

// Export hooks
window.Hooks = window.Hooks || {};
window.Hooks.useAppSettings = useAppSettings;