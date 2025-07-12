import React from 'react';
import { usePersistentState } from './usePersistentState';
import { useWindowSize } from './useWindowSize';
import { useFileProcessing } from './useFileProcessing';
import { useInteraction } from './useInteraction';
import { useAIChat } from './useAIChat';
import { generateFullOutput } from '../services/fileProcessor';
import { useLocalization } from './useLocalization';

declare const hljs: any;
declare const marked: any;

export const useAppLogic = (
    codeViewRef: React.RefObject<HTMLDivElement>,
    leftPanelRef: React.RefObject<HTMLDivElement>
) => {
    const { t } = useLocalization();
    // --- UI & Shell State ---
    const [isDragging, setIsDragging] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [progressMessage, setProgressMessage] = React.useState("");
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    const [isAiChatOpen, setIsAiChatOpen] = React.useState(false);
    const [isAiLoading, setIsAiLoading] = React.useState(false);
    
    // --- PWA State ---
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);
    const [deferredPrompt, setDeferredPrompt] = React.useState<any | null>(null);
    const [isInstallable, setIsInstallable] = React.useState(false);
    const [isInstalled, setIsInstalled] = React.useState(window.matchMedia('(display-mode: standalone)').matches);
    const [updateWorker, setUpdateWorker] = React.useState<ServiceWorker | null>(null);
    
    // --- Persistent Settings ---
    const [isDark, setIsDark] = usePersistentState('theme', false);
    const [panelWidth, setPanelWidth] = usePersistentState('panelWidth', 30);
    const [extractContent, setExtractContent] = usePersistentState('extractContent', true);
    const [fontSize, setFontSize] = usePersistentState('fontSize', 14);
    
    // --- Layout State ---
    const windowSize = useWindowSize();
    const [mobileView, setMobileView] = React.useState<'tree' | 'editor' | 'chat'>('editor');
    const isMobile = React.useMemo(() => windowSize.width <= 768, [windowSize.width]);

    const handleShowToast = (message: string) => {
        setToastMessage(message);
    };

    // --- Child Hooks ---
    
    const { 
      processedData, setProcessedData, lastProcessedFiles, setLastProcessedFiles, handleProcessing,
      handleFileSelect, handleDrop, handleRefresh, handleCancel, abortControllerRef
    } = useFileProcessing({
        extractContent, setIsLoading, setProgressMessage, 
        setMobileView, handleShowToast, isMobile, t
    });

    const {
        editingPath, setEditingPath, markdownPreviewPaths, setMarkdownPreviewPaths, searchResults, setSearchResults,
        currentSearchResultIndex, setCurrentSearchResultIndex, handleDeleteFile, handleFileTreeSelect, handleSaveEdit,
        handleToggleMarkdownPreview, handleSearch, handleSearchNavigate, navigateToSearchResult
    } = useInteraction({
        processedData, setProcessedData, handleShowToast, isMobile, setMobileView, codeViewRef, t
    });
    
    const { 
      chatHistory, setChatHistory, isApiKeyMissing, handleSendMessage, resetChat
    } = useAIChat({
        processedData, isAiLoading, setIsAiLoading, handleShowToast, t
    });
    
    // --- Central Reset Logic ---
    const handleReset = (showToast = true) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        setProcessedData(null);
        setLastProcessedFiles(null);
        setIsLoading(false);
        setProgressMessage("");
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setEditingPath(null);
        setMarkdownPreviewPaths(new Set());
        setSearchResults([]);
        setCurrentSearchResultIndex(null);
        setIsAiChatOpen(false);
        resetChat();
        if(showToast) handleShowToast(t("content_reset"));
    };

    // --- Effects for Theme and Markdown ---
    React.useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        (document.getElementById('hljs-light-theme') as HTMLLinkElement).disabled = isDark;
        (document.getElementById('hljs-dark-theme') as HTMLLinkElement).disabled = !isDark;
    }, [isDark]);
    
    React.useEffect(() => {
        marked.setOptions({
            highlight: (code: string, lang: string) => hljs.highlight(code, { language: hljs.getLanguage(lang) ? lang : 'plaintext' }).value,
            langPrefix: 'hljs language-', gfm: true, breaks: true,
        });
    }, []);

    // --- Effects for PWA and Network ---
    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const beforeInstallPrompt = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setIsInstallable(true); };
        const handleAppInstalled = () => { setIsInstalled(true); setIsInstallable(false); setDeferredPrompt(null); handleShowToast(t("app_installed_message")); };
        const handleUpdateAvailable = (e: Event) => setUpdateWorker((e as CustomEvent).detail);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('beforeinstallprompt', beforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('update-available', handleUpdateAvailable);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', beforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener('update-available', handleUpdateAvailable);
        };
    }, [t]);

    // --- PWA Action Handlers ---
    const handleInstallPWA = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(() => { setDeferredPrompt(null); setIsInstallable(false); });
    };
    
    const handleUpdate = () => {
        if (updateWorker) { updateWorker.postMessage({ type: 'SKIP_WAITING' }); setUpdateWorker(null); }
    };

    // --- General Action Handlers ---
    const handleClearCache = () => { localStorage.clear(); handleReset(false); handleShowToast(t("cache_cleared_message")); };
    const handleCopyAll = () => { if (processedData) navigator.clipboard.writeText(generateFullOutput(processedData.structureString, processedData.fileContents)).then(() => handleShowToast(t('copy_all_message'))); };
    const handleSave = () => {
        if (!processedData) return;
        const blob = new Blob([generateFullOutput(processedData.structureString, processedData.fileContents)], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'structure-insight.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    };

    // --- Resizing Handlers ---
    const handleResize = React.useCallback((e: MouseEvent) => {
        if (leftPanelRef.current) {
            const newWidth = (e.clientX / leftPanelRef.current.parentElement!.offsetWidth) * 100;
            if (newWidth > 15 && newWidth < 85) setPanelWidth(newWidth);
        }
    }, [setPanelWidth, leftPanelRef]);

    const stopResize = React.useCallback(() => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', stopResize);
    }, [handleResize]);

    const handleMouseDownResize = (e: React.MouseEvent) => {
        e.preventDefault();
        window.addEventListener('mousemove', handleResize);
        window.addEventListener('mouseup', stopResize);
    };
    
    // --- Global Keydown Handler ---
    React.useEffect(() => {
        const handleGlobalKeys = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'f') { e.preventDefault(); if (processedData) setIsSearchOpen(true); }
                if (e.key === 'i') { e.preventDefault(); if (processedData) setIsAiChatOpen(p => !p); }
                if (e.key === 's') { e.preventDefault(); if (processedData) handleSave(); }
                if (e.key === 'o') { e.preventDefault(); handleFileSelect(); }
            }
            if (e.key === 'Escape') {
                if (isSearchOpen) { e.preventDefault(); setIsSearchOpen(false); }
                else if (isSettingsOpen) { e.preventDefault(); setIsSettingsOpen(false); }
                else if (isAiChatOpen && !isMobile) { e.preventDefault(); setIsAiChatOpen(false); }
                else if (isLoading) { e.preventDefault(); handleCancel(); }
            }
        };
        window.addEventListener('keydown', handleGlobalKeys);
        return () => window.removeEventListener('keydown', handleGlobalKeys);
    }, [isSearchOpen, isSettingsOpen, isLoading, processedData, isAiChatOpen, isMobile, handleSave, handleFileSelect, handleCancel]);

    // --- Memoized Stats ---
    const stats = React.useMemo(() => {
        if (!processedData?.fileContents) return { fileCount: 0, totalLines: 0, totalChars: 0 };
        return {
            fileCount: processedData.fileContents.length,
            totalLines: processedData.fileContents.reduce((sum, f) => sum + f.stats.lines, 0),
            totalChars: processedData.fileContents.reduce((sum, f) => sum + f.stats.chars, 0),
        };
    }, [processedData]);

    // --- Assemble Final Return Object ---
    return {
        state: {
            processedData, isLoading, isDragging, progressMessage, isSearchOpen, isSettingsOpen, toastMessage, isOnline,
            isInstallable, isInstalled, updateWorker, editingPath, markdownPreviewPaths, searchResults, currentSearchResultIndex,
            isAiChatOpen, chatHistory, isAiLoading, isApiKeyMissing, isDark, panelWidth, extractContent, fontSize,
            lastProcessedFiles, mobileView, stats
        },
        handlers: {
            setIsDragging, handleDrop: (e: React.DragEvent) => { setIsDragging(false); handleDrop(e, isLoading); }, 
            handleFileSelect, handleCopyAll, handleSave, handleReset, handleRefresh: () => handleRefresh(handleProcessing), handleCancel,
            setIsSearchOpen, setIsSettingsOpen, handleToggleAIChat: () => setIsAiChatOpen(!isAiChatOpen), setToastMessage,
            handleUpdate, handleDeleteFile, handleFileTreeSelect, setEditingPath, handleSaveEdit, handleToggleMarkdownPreview,
            handleSearch, handleSearchNavigate, handleSendMessage, handleMouseDownResize, 
            handleMobileViewToggle: () => { if (processedData) setMobileView(v => v === 'editor' ? 'tree' : (v === 'tree' ? 'chat' : 'editor')) }
        },
        settings: {
            setIsDark, setExtractContent, setFontSize, handleClearCache, handleInstallPWA
        },
    };
};