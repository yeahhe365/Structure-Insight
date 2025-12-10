
import React from 'react';
import { usePersistentState } from './usePersistentState';
import { useWindowSize } from './useWindowSize';
import { useFileProcessing } from './useFileProcessing';
import { useInteraction } from './useInteraction';
import { generateFullOutput, buildASCIITree } from '../services/fileProcessor';
import { SearchOptions, ConfirmationState, FileContent, SearchResultItem } from '../types';
import { marked } from 'marked';

declare const hljs: any;

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
    const [isFileRankOpen, setIsFileRankOpen] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    const [confirmation, setConfirmation] = React.useState<ConfirmationState>({isOpen: false, title: '', message: '', onConfirm: () => {}});
    
    // --- Network State ---
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);
    
    // --- Persistent Settings ---
    const [isDark, setIsDark] = usePersistentState('theme', false);
    const [panelWidth, setPanelWidth] = usePersistentState('panelWidth', 30);
    const [extractContent, setExtractContent] = usePersistentState('extractContent', true);
    const [fontSize, setFontSize] = usePersistentState('fontSize', 14);
    const [showCharCount, setShowCharCount] = usePersistentState('showCharCount', false);

    // --- Core Data & Selection State ---
    const [selectedFilePath, setSelectedFilePath] = React.useState<string | null>(null);
    const [activeView, setActiveView] = React.useState<'structure' | 'code'>('structure');
    
    // --- Layout & Search State ---
    const windowSize = useWindowSize();
    const [mobileView, setMobileView] = React.useState<'tree' | 'editor'>('editor');
    const isMobile = React.useMemo(() => windowSize.width <= 768, [windowSize.width]);
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    
    // Updated Search State
    const [searchResults, setSearchResults] = React.useState<SearchResultItem[]>([]);
    const [activeResultIndex, setActiveResultIndex] = React.useState<number | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchOptions, setSearchOptions] = React.useState<SearchOptions>({ caseSensitive: false, useRegex: false, wholeWord: false, fuzzySearch: false });

    const handleShowToast = React.useCallback((message: string) => {
        setToastMessage(message);
    }, []);

    // --- Child Hooks ---
    
    const { 
      processedData, setProcessedData, lastProcessedFiles, setLastProcessedFiles, handleProcessing,
      handleFileSelect, handleDrop, handleRefresh, handleCancel, abortControllerRef
    } = useFileProcessing({
        extractContent, setIsLoading, setProgressMessage, 
        setMobileView, handleShowToast, isMobile, setSelectedFilePath, setActiveView
    });

    // Update structure string when showCharCount changes
    React.useEffect(() => {
        if (processedData) {
            const newStructure = buildASCIITree(processedData.treeData, processedData.rootName, showCharCount);
            if (newStructure !== processedData.structureString) {
                setProcessedData(prev => prev ? ({ ...prev, structureString: newStructure }) : null);
            }
        }
    }, [showCharCount, processedData?.treeData, processedData?.rootName]);

    const {
        editingPath, setEditingPath, markdownPreviewPaths,
        handleDeleteFile, handleFileTreeSelect, handleSaveEdit,
        handleToggleMarkdownPreview, clearInteractionState, handleCopyPath, handleToggleExclude
    } = useInteraction({
        processedData, setProcessedData, handleShowToast, isMobile, setMobileView, setConfirmation,
        selectedFilePath, setSelectedFilePath, setActiveView, showCharCount
    });
    
    // --- Derived State ---
    const selectedFile = React.useMemo<FileContent | null>(() => {
        if (!selectedFilePath || !processedData?.fileContents) return null;
        return processedData.fileContents.find(f => f.path === selectedFilePath) || null;
    }, [selectedFilePath, processedData]);


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
                clearInteractionState();
                setSelectedFilePath(null);
                setIsSearchOpen(false);
                setIsAiChatOpen(false);
                setIsFileRankOpen(false);
                setSearchResults([]);
                setActiveResultIndex(null);
                setSearchQuery('');
                setActiveView('structure');
                handleShowToast("内容已重置。");
            }
        });
    }, [handleShowToast, clearInteractionState]);

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
        setSearchQuery(query);
        setSearchOptions(options);

        if (!query.trim() || !processedData) {
            setSearchResults([]);
            setActiveResultIndex(null);
            return;
        }

        const flags = options.caseSensitive ? 'g' : 'gi';
        let pattern = options.useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (options.wholeWord && !options.useRegex) {
            pattern = `\\b${pattern}\\b`;
        }
        
        let regex: RegExp;
        try {
            regex = new RegExp(pattern, flags);
        } catch (e) {
            setSearchResults([]);
            setActiveResultIndex(null);
            return;
        }

        const results: SearchResultItem[] = [];

        // Only search in non-excluded files
        const activeFiles = processedData.fileContents.filter(f => !f.excluded);

        activeFiles.forEach(file => {
            const matches = [...file.content.matchAll(regex)];
            matches.forEach((match, indexInFile) => {
                if (match.index !== undefined) {
                    // Calculate line number
                    const contentUpToMatch = file.content.substring(0, match.index);
                    const lineNumber = contentUpToMatch.split('\n').length;

                    results.push({
                        filePath: file.path,
                        startIndex: match.index,
                        length: match[0].length,
                        content: match[0],
                        line: lineNumber,
                        indexInFile: indexInFile
                    });
                }
            });
        });

        setSearchResults(results);
        if (results.length > 0) {
            setActiveResultIndex(0);
            const firstResult = results[0];
            setSelectedFilePath(firstResult.filePath);
            setActiveView('code');
            if(isMobile) setMobileView('editor');
        } else {
            setActiveResultIndex(null);
        }
    }, [processedData, isMobile, setMobileView, setSelectedFilePath, setActiveView]);

    const handleNavigate = React.useCallback((direction: 'next' | 'prev') => {
        if (searchResults.length === 0 || activeResultIndex === null) return;
        
        const newIndex = direction === 'next'
            ? (activeResultIndex + 1) % searchResults.length
            : (activeResultIndex - 1 + searchResults.length) % searchResults.length;
        
        setActiveResultIndex(newIndex);
        
        const result = searchResults[newIndex];
        if (result) {
            setSelectedFilePath(result.filePath);
            setActiveView('code');
            if(isMobile) setMobileView('editor');
        }
    }, [searchResults, activeResultIndex, isMobile, setMobileView, setSelectedFilePath, setActiveView]);
    
    // Calculate active match index relative to the current file
    const activeMatchIndexInFile = React.useMemo(() => {
        if (activeResultIndex === null || !selectedFilePath || searchResults.length === 0) return null;
        const currentResult = searchResults[activeResultIndex];
        if (currentResult.filePath === selectedFilePath) {
            return currentResult.indexInFile;
        }
        return null;
    }, [activeResultIndex, selectedFilePath, searchResults]);


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
                else if (isFileRankOpen) { e.preventDefault(); setIsFileRankOpen(false); }
                else if (isSettingsOpen) { e.preventDefault(); setIsSettingsOpen(false); }
                else if (isLoading) { e.preventDefault(); handleCancel(); }
            }
        };
        window.addEventListener('keydown', handleGlobalKeys);
        return () => window.removeEventListener('keydown', handleGlobalKeys);
    }, [isSearchOpen, isSettingsOpen, isAiChatOpen, isFileRankOpen, isLoading, processedData, handleSave, handleFileSelect, handleCancel]);

    // --- Memoized Stats ---
    const stats = React.useMemo(() => {
        if (!processedData?.fileContents) return { fileCount: 0, totalLines: 0, totalChars: 0 };
        // Only count files that are not excluded
        const activeFiles = processedData.fileContents.filter(f => !f.excluded);
        return {
            fileCount: activeFiles.length,
            totalLines: activeFiles.reduce((sum, f) => sum + f.stats.lines, 0),
            totalChars: activeFiles.reduce((sum, f) => sum + f.stats.chars, 0),
        };
    }, [processedData]);

    // --- Assemble Final Return Object ---
    return {
        state: {
            processedData, isLoading, isDragging, progressMessage, isSettingsOpen, toastMessage, isOnline,
            editingPath, markdownPreviewPaths, confirmation,
            isDark, panelWidth, extractContent, fontSize, showCharCount,
            lastProcessedFiles, mobileView, stats,
            isSearchOpen, isFileRankOpen, searchResults, activeResultIndex, isMobile, isAiChatOpen,
            selectedFilePath, selectedFile, activeView,
            searchQuery, searchOptions, activeMatchIndexInFile // Export search state for CodeView
        },
        handlers: {
            setIsDragging, handleDrop: (e: React.DragEvent) => { setIsDragging(false); handleDrop(e, isLoading); }, 
            handleFileSelect, handleCopyAll, handleSave, handleReset, handleRefresh: () => handleRefresh(handleProcessing), handleCancel,
            setIsSettingsOpen, setToastMessage, setConfirmation,
            handleDeleteFile, handleFileTreeSelect, setEditingPath, handleSaveEdit, handleToggleMarkdownPreview,
            handleMouseDownResize, 
            handleMobileViewToggle,
            setIsSearchOpen, setIsFileRankOpen, handleSearch, handleNavigate, setIsAiChatOpen,
            setActiveView,
            handleCopyPath,
            handleToggleExclude,
        },
        settings: {
            setIsDark, setExtractContent, setFontSize, handleClearCache, setShowCharCount
        },
    };
};