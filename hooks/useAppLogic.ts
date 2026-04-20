import React from 'react';
import { usePersistentState } from './usePersistentState';
import { useWindowSize } from './useWindowSize';
import { useFileProcessing } from './useFileProcessing';
import { useInteraction } from './useInteraction';
import { useSearch } from './useSearch';
import { buildASCIITree } from '../services/treeFormatter';
import { buildExportOutput, type ExportFormat } from '../services/exportBuilder';
import { splitOutputText } from '../services/exportSplit';
import { ConfirmationState, FileContent } from '../types';

const LEGACY_MAX_CHARS_THRESHOLD_DEFAULT = 1000000;
const MAX_CHARS_THRESHOLD_MIGRATION_KEY = 'migration:maxCharsThresholdDefaultDisabled:v1';

export const useAppLogic = (
    codeViewRef: React.RefObject<HTMLDivElement | null>,
    leftPanelRef: React.RefObject<HTMLDivElement | null>
) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const isLoadingRef = React.useRef(false);
    React.useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
    const [progressMessage, setProgressMessage] = React.useState('');
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isFileRankOpen, setIsFileRankOpen] = React.useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);
    const [isSecurityFindingsOpen, setIsSecurityFindingsOpen] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    const [toastType, setToastType] = React.useState<'success' | 'error' | 'info'>('success');
    const [confirmation, setConfirmation] = React.useState<ConfirmationState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const [isDark, setIsDark] = usePersistentState('theme', false);
    const [panelWidth, setPanelWidth] = usePersistentState('panelWidth', 30);
    const [extractContent, setExtractContent] = usePersistentState('extractContent', true);
    const [fontSize, setFontSize] = usePersistentState('fontSize', 14);
    const [showCharCount, setShowCharCount] = usePersistentState('showCharCount', false);
    const [wordWrap, setWordWrap] = usePersistentState('wordWrap', false);
    const [maxCharsThreshold, setMaxCharsThreshold] = usePersistentState('maxCharsThreshold', 0);
    const [includeFileSummary, setIncludeFileSummary] = usePersistentState('includeFileSummary', true);
    const [includeDirectoryStructure, setIncludeDirectoryStructure] = usePersistentState('includeDirectoryStructure', true);
    const [includeGitDiffs, setIncludeGitDiffs] = usePersistentState('includeGitDiffs', false);
    const [exportHeaderText, setExportHeaderText] = usePersistentState('exportHeaderText', '');
    const [exportInstructionText, setExportInstructionText] = usePersistentState('exportInstructionText', '');
    const [exportFormat, setExportFormat] = usePersistentState<ExportFormat>('exportFormat', 'plain');
    const [includePatterns, setIncludePatterns] = usePersistentState('exportIncludePatterns', '');
    const [ignorePatterns, setIgnorePatterns] = usePersistentState('exportIgnorePatterns', '');
    const [useDefaultPatterns, setUseDefaultPatterns] = usePersistentState('exportUseDefaultPatterns', true);
    const [useGitignore, setUseGitignore] = usePersistentState('exportUseGitignore', true);
    const [includeEmptyDirectories, setIncludeEmptyDirectories] = usePersistentState('exportIncludeEmptyDirectories', false);
    const [showLineNumbers, setShowLineNumbers] = usePersistentState('exportShowLineNumbers', false);
    const [removeEmptyLines, setRemoveEmptyLines] = usePersistentState('exportRemoveEmptyLines', false);
    const [truncateBase64, setTruncateBase64] = usePersistentState('exportTruncateBase64', false);
    const [exportSplitMaxChars, setExportSplitMaxChars] = usePersistentState('exportSplitMaxChars', 0);

    React.useEffect(() => {
        try {
            if (window.localStorage.getItem(MAX_CHARS_THRESHOLD_MIGRATION_KEY) === 'true') {
                return;
            }

            if (window.localStorage.getItem('maxCharsThreshold') === JSON.stringify(LEGACY_MAX_CHARS_THRESHOLD_DEFAULT)) {
                setMaxCharsThreshold(0);
            }

            window.localStorage.setItem(MAX_CHARS_THRESHOLD_MIGRATION_KEY, 'true');
        } catch {
            // Ignore storage access errors and keep using the in-memory default.
        }
    }, [setMaxCharsThreshold]);

    const [selectedFilePath, setSelectedFilePath] = React.useState<string | null>(null);
    const [activeView, setActiveView] = React.useState<'structure' | 'code'>('structure');
    const [openFiles, setOpenFiles] = React.useState<string[]>([]);

    const windowSize = useWindowSize();
    const [mobileView, setMobileView] = React.useState<'tree' | 'editor'>('editor');
    const isMobile = React.useMemo(() => windowSize.width <= 768, [windowSize.width]);

    const [recentProjects, setRecentProjects] = usePersistentState<{ name: string; openedAt: number }[]>('recentProjects', []);

    const addToHistory = React.useCallback((name: string) => {
        setRecentProjects(prev => {
            const filtered = prev.filter(p => p.name !== name);
            return [{ name, openedAt: Date.now() }, ...filtered].slice(0, 5);
        });
    }, [setRecentProjects]);

    const handleShowToast = React.useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(message);
        setToastType(type);
    }, []);

    const {
        processedData, setProcessedData, lastProcessedFiles, setLastProcessedFiles, handleProcessing,
        lastEmptyDirectoryPaths, handleFileSelect, handleDrop, handleRefresh, handleCancel, abortControllerRef,
    } = useFileProcessing({
        extractContent, maxCharsThreshold, setIsLoading, setProgressMessage,
        setMobileView, handleShowToast, isMobile, setSelectedFilePath, setActiveView,
    });

    const {
        editingPath, setEditingPath, markdownPreviewPaths,
        handleDeleteFile, handleFileTreeSelect, handleSaveEdit,
        handleToggleMarkdownPreview, clearInteractionState, handleCopyPath, handleToggleExclude,
    } = useInteraction({
        processedData, setProcessedData, handleShowToast, isMobile, setMobileView, setConfirmation,
        selectedFilePath, setSelectedFilePath, setActiveView, showCharCount,
        onDeleteConfirmed: (path: string) => {
            setOpenFiles(prev => prev.filter(openPath => openPath !== path));
            if (path === selectedFilePath) {
                setActiveView('structure');
            }
        },
    });

    const handleTabSelect = React.useCallback((path: string) => {
        setOpenFiles(prev => (prev.includes(path) ? prev : [...prev, path]));
        handleFileTreeSelect(path);
    }, [handleFileTreeSelect]);

    const closeTab = React.useCallback((path: string) => {
        if (editingPath === path) {
            setConfirmation({
                isOpen: true,
                title: '文件正在编辑中',
                message: '关闭标签页将丢失未保存的更改。是否继续？',
                onConfirm: () => {
                    setEditingPath(null);
                    setOpenFiles(prev => {
                        const next = prev.filter(p => p !== path);
                        if (path === selectedFilePath) {
                            const closedIdx = prev.indexOf(path);
                            const newSelected = next[Math.min(closedIdx, next.length - 1)] ?? null;
                            setSelectedFilePath(newSelected);
                            if (!newSelected) setActiveView('structure');
                        }
                        return next;
                    });
                },
            });
            return;
        }
        setOpenFiles(prev => {
            const next = prev.filter(p => p !== path);
            if (path === selectedFilePath) {
                const closedIdx = prev.indexOf(path);
                const newSelected = next[Math.min(closedIdx, next.length - 1)] ?? null;
                setSelectedFilePath(newSelected);
                if (!newSelected) setActiveView('structure');
            }
            return next;
        });
    }, [editingPath, selectedFilePath, setSelectedFilePath, setActiveView, setConfirmation, setEditingPath]);

    const {
        isSearchOpen, setIsSearchOpen, searchResults, activeResultIndex,
        searchQuery, searchOptions, handleSearch, handleNavigate, resetSearch,
    } = useSearch({
        processedData,
        openFile: handleTabSelect,
    });

    const handleDirDoubleClick = React.useCallback(() => {
        setActiveView('code');
        setMobileView('editor');
    }, [setActiveView, setMobileView]);

    React.useEffect(() => {
        if (processedData) {
            const newStructure = buildASCIITree(processedData.treeData, processedData.rootName, showCharCount);
            if (newStructure !== processedData.structureString) {
                setProcessedData(prev => (prev ? ({ ...prev, structureString: newStructure }) : null));
            }
        }
    }, [showCharCount, processedData?.treeData, processedData?.rootName]);

    React.useEffect(() => {
        if (processedData?.rootName) {
            addToHistory(processedData.rootName);
        }
    }, [processedData?.rootName]);

    const selectedFile = React.useMemo<FileContent | null>(() => {
        if (!selectedFilePath || !processedData?.fileContents) return null;
        return processedData.fileContents.find(f => f.path === selectedFilePath) || null;
    }, [selectedFilePath, processedData]);

    const buildProjectContext = React.useCallback(async () => {
        if (!processedData || !lastProcessedFiles) return null;

        return await buildExportOutput({
            currentData: processedData,
            rawFiles: lastProcessedFiles,
            emptyDirectoryPaths: lastEmptyDirectoryPaths,
            exportOptions: {
                format: exportFormat,
                includeFileSummary,
                includeDirectoryStructure,
                includeFiles: true,
                includeGitDiffs,
                includeEmptyDirectories,
                includePatterns,
                ignorePatterns,
                useDefaultPatterns,
                useGitignore,
                showLineNumbers,
                removeEmptyLines,
                truncateBase64,
                userProvidedHeader: exportHeaderText,
                instruction: exportInstructionText,
            },
            extractContent,
            maxCharsThreshold,
            progressCallback: () => {},
        });
    }, [
        processedData,
        lastProcessedFiles,
        lastEmptyDirectoryPaths,
        exportFormat,
        includeFileSummary,
        includeDirectoryStructure,
        includeGitDiffs,
        includeEmptyDirectories,
        includePatterns,
        ignorePatterns,
        useDefaultPatterns,
        useGitignore,
        showLineNumbers,
        removeEmptyLines,
        truncateBase64,
        exportHeaderText,
        exportInstructionText,
        extractContent,
        maxCharsThreshold,
    ]);

    const activeMatchIndexInFile = React.useMemo(() => {
        if (activeResultIndex === null || !selectedFilePath || searchResults.length === 0) return null;
        const currentResult = searchResults[activeResultIndex];
        if (currentResult && currentResult.filePath === selectedFilePath) {
            return currentResult.indexInFile;
        }
        return null;
    }, [activeResultIndex, selectedFilePath, searchResults]);

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
                setProgressMessage('');
                setIsSettingsOpen(false);
                clearInteractionState();
                setSelectedFilePath(null);
                setOpenFiles([]);
                resetSearch();
                setIsFileRankOpen(false);
                setIsSecurityFindingsOpen(false);
                setActiveView('structure');
                handleShowToast('内容已重置。', 'info');
            },
        });
    }, [handleShowToast, clearInteractionState, resetSearch, abortControllerRef, setProcessedData, setLastProcessedFiles]);

    React.useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        const lightTheme = document.getElementById('hljs-light-theme') as HTMLLinkElement | null;
        const darkTheme = document.getElementById('hljs-dark-theme') as HTMLLinkElement | null;
        if (lightTheme) lightTheme.disabled = isDark;
        if (darkTheme) darkTheme.disabled = !isDark;
    }, [isDark]);

    const handleClearCache = React.useCallback(() => {
        setConfirmation({
            isOpen: true,
            title: '清除缓存',
            message: '您确定要清除所有缓存的应用数据吗？此操作将重置所有设置。',
            onConfirm: () => {
                localStorage.clear();
                window.location.reload();
            },
        });
    }, []);

    const handleCopyAll = React.useCallback(async () => {
        const output = await buildProjectContext();
        if (!output) return;

        navigator.clipboard.writeText(output).then(() => {
            const warningCount = processedData?.analysisSummary?.securityFindingCount ?? 0;
            if (warningCount > 0) {
                handleShowToast(`已复制内容，并检测到 ${warningCount} 条敏感信息提示。`, 'info');
                return;
            }
            handleShowToast('已将所有内容复制到剪贴板！');
        });
    }, [buildProjectContext, handleShowToast, processedData?.analysisSummary?.securityFindingCount]);

    const handleSave = React.useCallback(async () => {
        if (!processedData) return;
        const output = await buildProjectContext();
        if (!output) return;

        const extensionMap: Record<ExportFormat, string> = {
            plain: 'txt',
            markdown: 'md',
            xml: 'xml',
            json: 'json',
        };
        const safeBaseName = (processedData.rootName || 'structure-insight').replace(/[\\/?<>:*|"']/g, '_');
        const parts = splitOutputText(output, exportSplitMaxChars);

        parts.forEach((part, index) => {
            const blob = new Blob([part], { type: 'text/plain;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = parts.length === 1
                ? `${safeBaseName}.${extensionMap[exportFormat]}`
                : `${safeBaseName}.part${index + 1}.${extensionMap[exportFormat]}`;
            a.click();
            URL.revokeObjectURL(a.href);
        });

        const warningCount = processedData.analysisSummary?.securityFindingCount ?? 0;
        if (parts.length > 1) {
            handleShowToast(`导出文件已拆分保存，共 ${parts.length} 份。`, warningCount > 0 ? 'info' : 'success');
            return;
        }
        if (warningCount > 0) {
            handleShowToast(`已保存导出文件，并检测到 ${warningCount} 条敏感信息提示。`, 'info');
            return;
        }
        handleShowToast('导出文件已保存。');
    }, [processedData, buildProjectContext, exportFormat, exportSplitMaxChars, handleShowToast]);

    const handleMobileViewToggle = React.useCallback(() => {
        if (processedData) {
            setMobileView(v => (v === 'editor' ? 'tree' : 'editor'));
        }
    }, [processedData]);

    const resizeStateRef = React.useRef<{ isResizing: boolean }>({ isResizing: false });

    const handleResize = React.useCallback((e: MouseEvent) => {
        const panel = leftPanelRef.current;
        if (panel && panel.parentElement) {
            const newWidth = (e.clientX / panel.parentElement.offsetWidth) * 100;
            if (newWidth > 15 && newWidth < 85) setPanelWidth(newWidth);
        }
    }, [setPanelWidth, leftPanelRef]);

    const stopResize = React.useCallback(() => {
        resizeStateRef.current.isResizing = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', stopResize);
    }, [handleResize]);

    const handleMouseDownResize = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        resizeStateRef.current.isResizing = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        window.addEventListener('mousemove', handleResize);
        window.addEventListener('mouseup', stopResize);
    }, [handleResize, stopResize]);

    React.useEffect(() => {
        const handleGlobalKeys = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'f') { e.preventDefault(); if (processedData) setIsSearchOpen(p => !p); }
                if (e.key === 's') { e.preventDefault(); if (processedData) void handleSave(); }
                if (e.key === 'o') { e.preventDefault(); handleFileSelect(); }
                if (e.key === '/') { e.preventDefault(); setIsShortcutsOpen(p => !p); }
                if (e.key === 'w') { e.preventDefault(); if (selectedFilePath) closeTab(selectedFilePath); }
            }
            if (e.key === 'Escape') {
                if (isShortcutsOpen) { e.preventDefault(); setIsShortcutsOpen(false); }
                else if (isSearchOpen) { e.preventDefault(); setIsSearchOpen(false); }
                else if (isFileRankOpen) { e.preventDefault(); setIsFileRankOpen(false); }
                else if (isSecurityFindingsOpen) { e.preventDefault(); setIsSecurityFindingsOpen(false); }
                else if (isSettingsOpen) { e.preventDefault(); setIsSettingsOpen(false); }
                else if (isLoading) { e.preventDefault(); handleCancel(); }
            }
        };
        window.addEventListener('keydown', handleGlobalKeys);
        return () => window.removeEventListener('keydown', handleGlobalKeys);
    }, [isSearchOpen, isSettingsOpen, isFileRankOpen, isSecurityFindingsOpen, isShortcutsOpen, isLoading, processedData, handleSave, handleFileSelect, handleCancel, selectedFilePath, closeTab]);

    const stats = React.useMemo(() => {
        if (!processedData?.fileContents) return { fileCount: 0, totalLines: 0, totalChars: 0 };
        const activeFiles = processedData.fileContents.filter(f => !f.excluded);
        return {
            fileCount: activeFiles.length,
            totalLines: activeFiles.reduce((sum, f) => sum + f.stats.lines, 0),
            totalChars: activeFiles.reduce((sum, f) => sum + f.stats.chars, 0),
        };
    }, [processedData]);

    return {
        state: {
            processedData, isLoading, isDragging, progressMessage, isSettingsOpen, toastMessage, toastType,
            editingPath, markdownPreviewPaths, confirmation,
            isDark, panelWidth, extractContent, fontSize, showCharCount, maxCharsThreshold, wordWrap,
            includeFileSummary, includeDirectoryStructure, includeGitDiffs,
            exportHeaderText, exportInstructionText,
            exportFormat, includePatterns, ignorePatterns, useDefaultPatterns, useGitignore,
            includeEmptyDirectories, showLineNumbers, removeEmptyLines, truncateBase64, exportSplitMaxChars,
            lastProcessedFiles, mobileView, stats,
            isSearchOpen, isFileRankOpen, isShortcutsOpen, isSecurityFindingsOpen, searchResults, activeResultIndex, isMobile,
            selectedFilePath, selectedFile, activeView,
            openFiles,
            searchQuery, searchOptions, activeMatchIndexInFile,
            recentProjects,
        },
        handlers: {
            setIsDragging,
            handleDrop: (e: React.DragEvent) => { setIsDragging(false); handleDrop(e, isLoadingRef.current); },
            handleFileSelect,
            handleCopyAll,
            handleSave,
            handleReset,
            handleRefresh: () => handleRefresh(handleProcessing),
            handleCancel,
            setIsSettingsOpen,
            setToastMessage,
            setConfirmation,
            handleDeleteFile,
            handleFileTreeSelect: handleTabSelect,
            closeTab,
            setEditingPath,
            handleSaveEdit,
            handleToggleMarkdownPreview,
            handleMouseDownResize,
            handleMobileViewToggle,
            setIsSearchOpen,
            setIsFileRankOpen,
            setIsShortcutsOpen,
            setIsSecurityFindingsOpen,
            handleSearch,
            handleNavigate,
            setActiveView,
            handleCopyPath,
            handleToggleExclude,
            handleDirDoubleClick,
        },
        settings: {
            setIsDark,
            setExtractContent,
            setFontSize,
            handleClearCache,
            setShowCharCount,
            setMaxCharsThreshold,
            setWordWrap,
            setIncludeFileSummary,
            setIncludeDirectoryStructure,
            setIncludeGitDiffs,
            setExportHeaderText,
            setExportInstructionText,
            setExportFormat,
            setIncludePatterns,
            setIgnorePatterns,
            setUseDefaultPatterns,
            setUseGitignore,
            setIncludeEmptyDirectories,
            setShowLineNumbers,
            setRemoveEmptyLines,
            setTruncateBase64,
            setExportSplitMaxChars,
        },
    };
};
