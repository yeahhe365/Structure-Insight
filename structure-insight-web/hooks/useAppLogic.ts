import React from 'react';
import { usePersistentState } from './usePersistentState';
import { useWindowSize } from './useWindowSize';
import { useFileProcessing } from './useFileProcessing';
import { useInteraction } from './useInteraction';
import { generateFullOutput } from '../services/fileProcessor';
import { SearchOptions, ConfirmationState } from '../types';

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
    const [isAiChatOpen, setIsAiChatOpen] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    const [confirmation, setConfirmation] = React.useState<ConfirmationState>({isOpen: false, title: '', message: '', onConfirm: () => {}});
    
    // --- Network State ---
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);
    
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
    const [activeResultIndex, setActiveResultIndex] = React.useState<number | null>(null);

    const handleShowToast = React.useCallback((message: string) => {
        setToastMessage(message);
    }, []);

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
        processedData, setProcessedData, handleShowToast, isMobile, setMobileView, codeViewRef, setConfirmation
    });
    
    // --- Central Reset Logic ---
    const handleReset = React.useCallback(() => {
        setConfirmation({
            isOpen: true,
            title: '重置应用程序',
            message: '您确定要重置应用程序吗？所有已加载的数据将被清除。',
            onConfirm: () => {
                if (abortControllerRef.current) abortControllerRef.current.abort();
                setProcessedData(null);
                setLastProcessedFiles(null);
                setIsLoading(false);
                setProgressMessage("");
                setIsSettingsOpen(false);
                setEditingPath(null);
                setMarkdownPreviewPaths(new Set());
                setIsSearchOpen(false);
                setIsAiChatOpen(false);
                setSearchResults([]);
                setActiveResultIndex(null);
                handleShowToast("内容已重置。");
            }
        });
    }, [handleShowToast]);

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

    // --- Effects for Network ---
    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
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
            setActiveResultIndex(null);
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
            setActiveResultIndex(null);
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
        setActiveResultIndex(newResults.length > 0 ? 0 : null);
    }, [codeViewRef]);

    const handleNavigate = React.useCallback((direction: 'next' | 'prev') => {
        if (searchResults.length === 0 || activeResultIndex === null) return;
        const newIndex = direction === 'next'
            ? (activeResultIndex + 1) % searchResults.length
            : (activeResultIndex - 1 + searchResults.length) % searchResults.length;
        setActiveResultIndex(newIndex);
    }, [searchResults, activeResultIndex]);

    React.useEffect(() => {
        searchResults.forEach((el, index) => {
            if (index === activeResultIndex) {
                el.classList.add('search-highlight-active');
                el.classList.remove('search-highlight');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                el.classList.remove('search-highlight-active');
                el.classList.add('search-highlight');
            }
        });
    }, [activeResultIndex, searchResults]);
    

    // --- General Action Handlers ---
    const handleClearCache = React.useCallback(() => {
        setConfirmation({
            isOpen: true,
            title: '清除缓存',
            message: '您确定要清除所有缓存的应用数据吗？此操作将重置所有设置。',
            onConfirm: () => {
                localStorage.clear();
                window.location.reload();
            }
        });
    }, []);
    const handleCopyAll = React.useCallback(() => { if (processedData) navigator.clipboard.writeText(generateFullOutput(processedData.structureString, processedData.fileContents)).then(() => handleShowToast('已将所有内容复制到剪贴板！')); }, [processedData, handleShowToast]);
    const handleSave = React.useCallback(() => {
        if (!processedData) return;
        const blob = new Blob([generateFullOutput(processedData.structureString, processedData.fileContents)], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const filename = (processedData.rootName || 'structure-insight').replace(/[\\/?<>:*|"']/g, '_') + '.txt';
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }, [processedData]);

    const handleMobileViewToggle = React.useCallback(() => {
        if (processedData) {
            setMobileView(v => v === 'editor' ? 'tree' : 'editor');
        }
    }, [processedData]);

    // --- Resizing Handlers ---
    const handleResize = React.useCallback((e: MouseEvent) => {
        const panel = leftPanelRef.current;
        if (panel && panel.parentElement) {
            const newWidth = (e.clientX / panel.parentElement.offsetWidth) * 100;
            if (newWidth > 15 && newWidth < 85) setPanelWidth(newWidth);
        }
    }, [setPanelWidth, leftPanelRef]);

    const stopResize = React.useCallback(() => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', stopResize);
    }, [handleResize]);

    const handleMouseDownResize = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        window.addEventListener('mousemove', handleResize);
        window.addEventListener('mouseup', stopResize);
    }, [handleResize, stopResize]);
    
    // --- Global Keydown Handler ---
    React.useEffect(() => {
        const handleGlobalKeys = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'f') { e.preventDefault(); if (processedData) setIsSearchOpen(p => !p); }
                if (e.key === 's') { e.preventDefault(); if (processedData) handleSave(); }
                if (e.key === 'o') { e.preventDefault(); handleFileSelect(); }
            }
            if (e.key === 'Escape') {
                if (isAiChatOpen) { e.preventDefault(); setIsAiChatOpen(false); }
                else if (isSearchOpen) { e.preventDefault(); setIsSearchOpen(false); }
                else if (isSettingsOpen) { e.preventDefault(); setIsSettingsOpen(false); }
                else if (isLoading) { e.preventDefault(); handleCancel(); }
            }
        };
        window.addEventListener('keydown', handleGlobalKeys);
        return () => window.removeEventListener('keydown', handleGlobalKeys);
    }, [isSearchOpen, isSettingsOpen, isAiChatOpen, isLoading, processedData, handleSave, handleFileSelect, handleCancel]);

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
            editingPath, markdownPreviewPaths, confirmation,
            isDark, panelWidth, extractContent, fontSize,
            lastProcessedFiles, mobileView, stats,
            isSearchOpen, searchResults, activeResultIndex, isMobile, isAiChatOpen,
        },
        handlers: {
            setIsDragging, handleDrop: (e: React.DragEvent) => { setIsDragging(false); handleDrop(e, isLoading); }, 
            handleFileSelect, handleCopyAll, handleSave, handleReset, handleRefresh: () => handleRefresh(handleProcessing), handleCancel,
            setIsSettingsOpen, setToastMessage, setConfirmation,
            handleDeleteFile, handleFileTreeSelect, setEditingPath, handleSaveEdit, handleToggleMarkdownPreview,
            handleMouseDownResize, 
            handleMobileViewToggle,
            setIsSearchOpen, handleSearch, handleNavigate, setIsAiChatOpen,
        },
        settings: {
            setIsDark, setExtractContent, setFontSize, handleClearCache
        },
    };
};