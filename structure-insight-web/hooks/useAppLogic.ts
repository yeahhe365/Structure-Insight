import React from 'react';
import { usePersistentState } from './usePersistentState';
import { useWindowSize } from './useWindowSize';
import { useFileProcessing } from './useFileProcessing';
import { useInteraction } from './useInteraction';
import { generateFullOutput } from '../services/fileProcessor';
import { SearchOptions } from '../types';

declare const hljs: any;
declare const marked: any;

export const useAppLogic = (
    codeViewRef: React.RefObject<HTMLDivElement>,
    leftPanelRef: React.RefObject<HTMLDivElement>
) => {
    // --- UI & Shell State ---
    const [isDragging, setIsDragging] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [progressMessage, setProgressMessage] = React.useState("");
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    
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
    
    // --- Layout & Search State ---
    const windowSize = useWindowSize();
    const [mobileView, setMobileView] = React.useState<'tree' | 'editor'>('editor');
    const isMobile = React.useMemo(() => windowSize.width <= 768, [windowSize.width]);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [searchResults, setSearchResults] = React.useState<HTMLElement[]>([]);
    const [currentResultIndex, setCurrentResultIndex] = React.useState<number | null>(null);

    const handleShowToast = (message: string) => {
        setToastMessage(message);
    };

    // --- Child Hooks ---
    
    const { 
      processedData, setProcessedData, lastProcessedFiles, setLastProcessedFiles, handleProcessing,
      handleFileSelect, handleDrop, handleRefresh, handleCancel, abortControllerRef
    } = useFileProcessing({
        extractContent, setIsLoading, setProgressMessage, 
        setMobileView, handleShowToast, isMobile
    });

    const {
        editingPath, setEditingPath, markdownPreviewPaths, setMarkdownPreviewPaths,
        handleDeleteFile, handleFileTreeSelect, handleSaveEdit,
        handleToggleMarkdownPreview,
    } = useInteraction({
        processedData, setProcessedData, handleShowToast, isMobile, setMobileView, codeViewRef
    });
    
    // --- Central Reset Logic ---
    const handleReset = (showToast = true) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        setProcessedData(null);
        setLastProcessedFiles(null);
        setIsLoading(false);
        setProgressMessage("");
        setIsSettingsOpen(false);
        setEditingPath(null);
        setMarkdownPreviewPaths(new Set());
        setIsSearchOpen(false);
        setSearchResults([]);
        setCurrentResultIndex(null);
        if(showToast) handleShowToast("内容已重置。");
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
        const handleAppInstalled = () => { setIsInstalled(true); setIsInstallable(false); setDeferredPrompt(null); handleShowToast("应用安装成功！"); };
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
    }, []);

    // --- Search Logic ---
    const handleSearch = React.useCallback((query: string, options: SearchOptions) => {
        const container = codeViewRef.current;
        if (!container) return;

        // Unhighlight previous results
        container.querySelectorAll('mark.search-highlight, mark.search-highlight-active').forEach(mark => {
            const parent = mark.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
                parent.normalize();
            }
        });

        if (!query.trim()) {
            setSearchResults([]);
            setCurrentResultIndex(null);
            return;
        }

        const flags = options.caseSensitive ? 'g' : 'gi';
        let pattern = options.useRegex ? query : query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        if (options.wholeWord && !options.useRegex) {
            pattern = `\\b${pattern}\\b`;
        }
        
        let regex: RegExp;
        try {
            regex = new RegExp(pattern, flags);
        } catch (e) {
            setSearchResults([]);
            setCurrentResultIndex(null);
            return; // Invalid regex
        }

        const newResults: HTMLElement[] = [];
        const codeBlocks = container.querySelectorAll('pre code');
        
        codeBlocks.forEach(block => {
            const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
            const textNodes: Text[] = [];
            while(walker.nextNode()) textNodes.push(walker.currentNode as Text);

            textNodes.forEach(textNode => {
                if (!textNode.textContent) return;
                const matches = [...textNode.textContent.matchAll(regex)];
                if (matches.length > 0) {
                    const parent = textNode.parentNode;
                    if (!parent) return;

                    let lastIndex = 0;
                    matches.forEach(match => {
                        if (match.index === undefined) return;
                        
                        // Add text before the match
                        const before = textNode.textContent!.substring(lastIndex, match.index);
                        if (before) parent.insertBefore(document.createTextNode(before), textNode);

                        // Add the highlighted match
                        const markedText = document.createElement('mark');
                        markedText.className = 'search-highlight';
                        markedText.textContent = match[0];
                        parent.insertBefore(markedText, textNode);
                        newResults.push(markedText);

                        lastIndex = match.index + match[0].length;
                    });
                    
                    // Add text after the last match
                    const after = textNode.textContent!.substring(lastIndex);
                    if (after) parent.insertBefore(document.createTextNode(after), textNode);
                    
                    parent.removeChild(textNode);
                }
            });
        });

        setSearchResults(newResults);
        setCurrentResultIndex(newResults.length > 0 ? 0 : null);
    }, [codeViewRef]);

    const handleNavigate = (direction: 'next' | 'prev') => {
        if (searchResults.length === 0 || currentResultIndex === null) return;
        const newIndex = direction === 'next'
            ? (currentResultIndex + 1) % searchResults.length
            : (currentResultIndex - 1 + searchResults.length) % searchResults.length;
        setCurrentResultIndex(newIndex);
    };

    React.useEffect(() => {
        searchResults.forEach((el, index) => {
            if (index === currentResultIndex) {
                el.classList.add('search-highlight-active');
                el.classList.remove('search-highlight');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                el.classList.remove('search-highlight-active');
                el.classList.add('search-highlight');
            }
        });
    }, [currentResultIndex, searchResults]);
    

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
    const handleClearCache = () => { localStorage.clear(); handleReset(false); handleShowToast("缓存已清除。应用已重置。"); };
    const handleCopyAll = () => { if (processedData) navigator.clipboard.writeText(generateFullOutput(processedData.structureString, processedData.fileContents)).then(() => handleShowToast('已将所有内容复制到剪贴板！')); };
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
                if (e.key === 'f') { e.preventDefault(); if (processedData) setIsSearchOpen(p => !p); }
                if (e.key === 's') { e.preventDefault(); if (processedData) handleSave(); }
                if (e.key === 'o') { e.preventDefault(); handleFileSelect(); }
            }
            if (e.key === 'Escape') {
                if (isSearchOpen) { e.preventDefault(); setIsSearchOpen(false); }
                else if (isSettingsOpen) { e.preventDefault(); setIsSettingsOpen(false); }
                else if (isLoading) { e.preventDefault(); handleCancel(); }
            }
        };
        window.addEventListener('keydown', handleGlobalKeys);
        return () => window.removeEventListener('keydown', handleGlobalKeys);
    }, [isSearchOpen, isSettingsOpen, isLoading, processedData, handleSave, handleFileSelect, handleCancel]);

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
            processedData, isLoading, isDragging, progressMessage, isSettingsOpen, toastMessage, isOnline,
            isInstallable, isInstalled, updateWorker, editingPath, markdownPreviewPaths,
            isDark, panelWidth, extractContent, fontSize,
            lastProcessedFiles, mobileView, stats,
            isSearchOpen, searchResults, currentResultIndex,
        },
        handlers: {
            setIsDragging, handleDrop: (e: React.DragEvent) => { setIsDragging(false); handleDrop(e, isLoading); }, 
            handleFileSelect, handleCopyAll, handleSave, handleReset, handleRefresh: () => handleRefresh(handleProcessing), handleCancel,
            setIsSettingsOpen, setToastMessage,
            handleUpdate, handleDeleteFile, handleFileTreeSelect, setEditingPath, handleSaveEdit, handleToggleMarkdownPreview,
            handleMouseDownResize, 
            handleMobileViewToggle: () => { if (processedData) setMobileView(v => v === 'editor' ? 'tree' : 'editor') },
            setIsSearchOpen, handleSearch, handleNavigate
        },
        settings: {
            setIsDark, setExtractContent, setFontSize, handleClearCache, handleInstallPWA
        },
    };
};