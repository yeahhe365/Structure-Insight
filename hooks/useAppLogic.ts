
import React from 'react';
import { usePersistentState } from './usePersistentState';
import { useWindowSize } from './useWindowSize';
import { useFileProcessing } from './useFileProcessing';
import { useInteraction } from './useInteraction';
import { useSearch } from './useSearch';
import { generateFullOutput, buildASCIITree } from '../services/fileProcessor';
import { ConfirmationState, FileContent } from '../types';
import { marked } from 'marked';

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

    // --- Persistent Settings ---
    const [isDark, setIsDark] = usePersistentState('theme', false);
    const [panelWidth, setPanelWidth] = usePersistentState('panelWidth', 30);
    const [extractContent, setExtractContent] = usePersistentState('extractContent', true);
    const [fontSize, setFontSize] = usePersistentState('fontSize', 14);
    const [showCharCount, setShowCharCount] = usePersistentState('showCharCount', false);
    const [maxCharsThreshold, setMaxCharsThreshold] = usePersistentState('maxCharsThreshold', 1000000);

    // --- Core Data & Selection State ---
    const [selectedFilePath, setSelectedFilePath] = React.useState<string | null>(null);
    const [activeView, setActiveView] = React.useState<'structure' | 'code'>('structure');

    // --- Layout State ---
    const windowSize = useWindowSize();
    const [mobileView, setMobileView] = React.useState<'tree' | 'editor'>('editor');
    const isMobile = React.useMemo(() => windowSize.width <= 768, [windowSize.width]);

    const handleShowToast = React.useCallback((message: string) => {
        setToastMessage(message);
    }, []);

    // --- Child Hooks ---
    const {
      processedData, setProcessedData, lastProcessedFiles, setLastProcessedFiles, handleProcessing,
      handleFileSelect, handleDrop, handleRefresh, handleCancel, abortControllerRef
    } = useFileProcessing({
        extractContent, maxCharsThreshold, setIsLoading, setProgressMessage,
        setMobileView, handleShowToast, isMobile, setSelectedFilePath, setActiveView
    });

    const {
        editingPath, setEditingPath, markdownPreviewPaths,
        handleDeleteFile, handleFileTreeSelect, handleSaveEdit,
        handleToggleMarkdownPreview, clearInteractionState, handleCopyPath, handleToggleExclude
    } = useInteraction({
        processedData, setProcessedData, handleShowToast, isMobile, setMobileView, setConfirmation,
        selectedFilePath, setSelectedFilePath, setActiveView, showCharCount
    });

    // --- Search Hook ---
    const {
        isSearchOpen, setIsSearchOpen, searchResults, activeResultIndex,
        searchQuery, searchOptions, handleSearch, handleNavigate, resetSearch,
    } = useSearch({
        processedData, isMobile, setMobileView, setSelectedFilePath, setActiveView,
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

    // --- Derived State ---
    const selectedFile = React.useMemo<FileContent | null>(() => {
        if (!selectedFilePath || !processedData?.fileContents) return null;
        return processedData.fileContents.find(f => f.path === selectedFilePath) || null;
    }, [selectedFilePath, processedData]);

    // Calculate active match index relative to the current file
    const activeMatchIndexInFile = React.useMemo(() => {
        if (activeResultIndex === null || !selectedFilePath || searchResults.length === 0) return null;
        const currentResult = searchResults[activeResultIndex];
        if (currentResult && currentResult.filePath === selectedFilePath) {
            return currentResult.indexInFile;
        }
        return null;
    }, [activeResultIndex, selectedFilePath, searchResults]);

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
                resetSearch();
                setIsAiChatOpen(false);
                setIsFileRankOpen(false);
                setActiveView('structure');
                handleShowToast("内容已重置。");
            }
        });
    }, [handleShowToast, clearInteractionState, resetSearch, abortControllerRef, setProcessedData, setLastProcessedFiles]);

    // --- Effects for Theme and Markdown ---
    React.useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        (document.getElementById('hljs-light-theme') as HTMLLinkElement).disabled = isDark;
        (document.getElementById('hljs-dark-theme') as HTMLLinkElement).disabled = !isDark;
    }, [isDark]);

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

    const handleCopyAll = React.useCallback(() => {
        if (processedData) navigator.clipboard.writeText(generateFullOutput(processedData.structureString, processedData.fileContents)).then(() => handleShowToast('已将所有内容复制到剪贴板！'));
    }, [processedData, handleShowToast]);

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
            processedData, isLoading, isDragging, progressMessage, isSettingsOpen, toastMessage,
            editingPath, markdownPreviewPaths, confirmation,
            isDark, panelWidth, extractContent, fontSize, showCharCount, maxCharsThreshold,
            lastProcessedFiles, mobileView, stats,
            isSearchOpen, isFileRankOpen, searchResults, activeResultIndex, isMobile, isAiChatOpen,
            selectedFilePath, selectedFile, activeView,
            searchQuery, searchOptions, activeMatchIndexInFile,
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
            setIsDark, setExtractContent, setFontSize, handleClearCache, setShowCharCount, setMaxCharsThreshold
        },
    };
};
