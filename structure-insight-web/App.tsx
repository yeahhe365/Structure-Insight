

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileNode, FileContent, ProcessedFiles, SearchOptions, SearchResult, ChatMessage } from './types';
import { processDroppedItems, processFiles, generateFullOutput, buildASCIITree } from './services/fileProcessor';
import { createChatSession, sendMessage } from './services/aiService';
import { usePersistentState } from './hooks/usePersistentState';
import FileTree from './components/FileTree';
import CodeView, { Toast } from './components/CodeView';
import SearchDialog from './components/SearchDialog';
import SettingsDialog from './components/SettingsDialog';
import ScrollToTopButton from './components/ScrollToTopButton';
import AiChatPanel from './components/AiChatPanel';
import { Chat } from '@google/genai';

declare const hljs: any;
declare const marked: any;

// Custom hook for window size
function useWindowSize() {
    const [size, setSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });
    React.useLayoutEffect(() => {
        const handleResize = () => {
            setSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return size;
}

const Header: React.FC<{
  onOpenFolder: () => void;
  onCopyAll: () => void;
  onSave: () => void;
  onReset: () => void;
  onRefresh: () => void;
  onCancel: () => void;
  onSearch: () => void;
  onSettings: () => void;
  onToggleAIChat: () => void;
  hasContent: boolean;
  canRefresh: boolean;
  isLoading: boolean;
  isOnline: boolean;
  isAiChatOpen: boolean;
}> = ({ 
    onOpenFolder, onCopyAll, onSave, onReset, onRefresh, onCancel, onSearch,
    onSettings, onToggleAIChat, hasContent, canRefresh, isLoading, isOnline, isAiChatOpen
}) => {
  const buttonClass = "flex items-center justify-center h-10 w-10 rounded-full bg-light-panel dark:bg-dark-panel text-light-subtle-text dark:text-dark-subtle-text hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed transition-all";
  const iconClass = "text-lg";

  return (
    <header className="flex items-center justify-between p-2 h-16 bg-light-header dark:bg-dark-header border-b border-light-border dark:border-dark-border shrink-0 z-20">
      <div className="flex items-center space-x-2">
        <img src="/favicon.png" alt="logo" className="rounded-full w-10 h-10" />
        <div className="flex flex-col">
            <h1 className="text-xl font-bold hidden sm:block">Structure Insight</h1>
            <div className={`flex items-center space-x-1.5 text-xs ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={onOpenFolder} className={buttonClass} title="Open Folder (Ctrl+O)" disabled={isLoading}>
          <i className={`fa-regular fa-folder-open ${iconClass}`}></i>
        </button>
        <button onClick={onSearch} className={buttonClass} title="Search (Ctrl+F)" disabled={!hasContent || isLoading}>
            <i className={`fa-solid fa-magnifying-glass ${iconClass}`}></i>
        </button>
        <button onClick={onToggleAIChat} className={`${buttonClass} ${isAiChatOpen ? '!bg-primary/20 !text-primary' : ''}`} title="AI Chat (Ctrl+I)" disabled={!hasContent || isLoading}>
            <i className={`fa-solid fa-wand-magic-sparkles ${iconClass}`}></i>
        </button>
        <button onClick={onCopyAll} className={buttonClass} title="Copy All" disabled={!hasContent || isLoading}>
          <i className={`fa-solid fa-copy ${iconClass}`}></i>
        </button>
        <button onClick={onSave} className={buttonClass} title="Save as Text File (Ctrl+S)" disabled={!hasContent || isLoading}>
          <i className={`fa-solid fa-download ${iconClass}`}></i>
        </button>
        <button onClick={onReset} className={buttonClass} title="Reset" disabled={!hasContent || isLoading}>
          <i className={`fa-solid fa-trash-can ${iconClass}`}></i>
        </button>
        <button onClick={onRefresh} className={buttonClass} title="Refresh" disabled={!canRefresh || isLoading}>
          <i className={`fa-solid fa-arrows-rotate ${iconClass}`}></i>
        </button>

        {isLoading ? (
         <button onClick={onCancel} className={`${buttonClass} w-auto px-4 !text-red-500 hover:!bg-red-500/10`} title="Cancel (Esc)">
             <i className={`fa-solid fa-ban ${iconClass} mr-2`}></i> Cancel
         </button>
        ) : (
        <button onClick={onSettings} className={buttonClass} title="Settings">
          <i className={`fa-solid fa-cog ${iconClass}`}></i>
        </button>
        )}
      </div>
    </header>
  );
};

const InitialPrompt: React.FC<{ onOpenFolder: () => void; }> = ({ onOpenFolder }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="max-w-md">
                <img src="/favicon.png" alt="Structure Insight Logo" className="w-16 h-16 mb-6 mx-auto" />
                <h2 className="text-2xl font-bold mb-2">Welcome to Structure Insight</h2>
                <p className="text-light-subtle-text dark:text-dark-subtle-text mb-6">Drag and drop a folder or click the button below to analyze its structure and content. Ideal for preparing code context for AI models.</p>
                <button
                    onClick={onOpenFolder}
                    className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors duration-200 active:scale-95"
                >
                    <i className="fa-regular fa-folder-open mr-2"></i>
                    Select Folder
                </button>
            </div>
        </div>
    );
};

const StatusBar: React.FC<{
    fileCount: number;
    totalLines: number;
    totalChars: number;
}> = ({ fileCount, totalLines, totalChars }) => {
    return (
        <footer className="h-8 flex items-center justify-end px-4 space-x-6 bg-light-header dark:bg-dark-header border-t border-light-border dark:border-dark-border text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0">
            <span>Files: {fileCount}</span>
            <span>Lines: {totalLines}</span>
            <span>Characters: {totalChars}</span>
        </footer>
    );
}

const UpdateToast: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center space-x-4"
        >
            <span>A new version is available!</span>
            <button onClick={onUpdate} className="bg-white text-blue-600 font-bold px-3 py-1 rounded-md text-sm">
                Refresh
            </button>
        </motion.div>
    );
};


const App: React.FC = () => {
    const [processedData, setProcessedData] = React.useState<ProcessedFiles | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);
    const [progressMessage, setProgressMessage] = React.useState("");
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);
    
    // PWA State
    const [isOnline, setIsOnline] = React.useState(navigator.onLine);
    const [deferredPrompt, setDeferredPrompt] = React.useState<any | null>(null);
    const [isInstallable, setIsInstallable] = React.useState(false);
    const [isInstalled, setIsInstalled] = React.useState(window.matchMedia('(display-mode: standalone)').matches);
    const [updateWorker, setUpdateWorker] = React.useState<ServiceWorker | null>(null);

    const [editingPath, setEditingPath] = React.useState<string | null>(null);
    const [markdownPreviewPaths, setMarkdownPreviewPaths] = React.useState(new Set<string>());
    
    const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
    const [currentSearchResultIndex, setCurrentSearchResultIndex] = React.useState<number | null>(null);

    // AI Chat State
    const [isAiChatOpen, setIsAiChatOpen] = React.useState(false);
    const [chatSession, setChatSession] = React.useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = usePersistentState<ChatMessage[]>('chatHistory', []);
    const [isAiLoading, setIsAiLoading] = React.useState(false);
    const [isApiKeyMissing, setIsApiKeyMissing] = React.useState(false);

    const [isDark, setIsDark] = usePersistentState('theme', false);
    const [panelWidth, setPanelWidth] = usePersistentState('panelWidth', 30);
    const [extractContent, setExtractContent] = usePersistentState('extractContent', true);
    const [fontSize, setFontSize] = usePersistentState('fontSize', 14);
    
    const [lastProcessedFiles, setLastProcessedFiles] = React.useState<File[] | null>(null);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const leftPanelRef = React.useRef<HTMLDivElement>(null);
    const codeViewRef = React.useRef<HTMLDivElement>(null);

    const windowSize = useWindowSize();
    const isMobile = windowSize.width <= 768;
    const [mobileView, setMobileView] = React.useState<'tree' | 'editor' | 'chat'>('editor');

    React.useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
        const lightThemeEl = document.getElementById('hljs-light-theme');
        if (lightThemeEl) {
            (lightThemeEl as HTMLLinkElement).disabled = isDark;
        }
        const darkThemeEl = document.getElementById('hljs-dark-theme');
        if (darkThemeEl) {
            (darkThemeEl as HTMLLinkElement).disabled = !isDark;
        }
    }, [isDark]);
    
    React.useEffect(() => {
        if (!process.env.API_KEY) {
            setIsApiKeyMissing(true);
        }
        marked.setOptions({
            highlight: (code: string, lang: string) => {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return hljs.highlight(code, { language }).value;
            },
            langPrefix: 'hljs language-',
            gfm: true,
            breaks: true,
        });
    }, []);

    // PWA and Network listeners
    React.useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const beforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        }
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            handleShowToast("App installed successfully!");
        }
        const handleUpdateAvailable = (e: Event) => {
            const worker = (e as CustomEvent).detail;
            setUpdateWorker(worker);
        }

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
        }
    }, []);

    const handleInstallPWA = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            setDeferredPrompt(null);
            setIsInstallable(false);
        });
    };
    
    const handleUpdate = () => {
        if (updateWorker) {
            updateWorker.postMessage({ type: 'SKIP_WAITING' });
            setUpdateWorker(null);
        }
    };

    const handleShowToast = (message: string) => {
        setToastMessage(message);
    };

    const handleProcessing = async (files: File[], isRefresh = false) => {
        if (files.length === 0) return;
        
        if (!isRefresh) handleReset(false);

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setIsLoading(true);
        try {
            const data = await processFiles(files, (msg) => setProgressMessage(msg), extractContent, signal);
            setProcessedData(data);
            setLastProcessedFiles(files);
            if (isMobile) setMobileView('editor');
        } catch (error: any) {
            if (error.name === 'AbortError') {
                setProgressMessage("Processing cancelled.");
            } else {
                console.error("Error processing files:", error);
                handleShowToast("An error occurred while processing files.");
            }
        } finally {
            setIsLoading(false);
            setTimeout(() => setProgressMessage(""), 2000);
            abortControllerRef.current = null;
        }
    };
    
    const handleFileSelect = () => {
        const input = document.createElement('input');
        input.type = 'file';
        (input as any).webkitdirectory = true;
        input.onchange = (e: any) => {
            if(e.target.files) {
                handleProcessing(Array.from(e.target.files));
            }
        };
        input.click();
    };

    const handleDrop = React.useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isLoading) return;
        
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        setIsLoading(true);
        try {
            const files = await processDroppedItems(e.dataTransfer.items, (msg) => setProgressMessage(msg), signal);
            await handleProcessing(files);
        } catch (error: any) {
            if (error.name !== 'AbortError') console.error("Error processing dropped items:", error);
            setIsLoading(false);
            setProgressMessage("");
        }
    }, [isLoading, extractContent]);
    
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
        // Reset AI Chat
        setIsAiChatOpen(false);
        setChatSession(null);
        setChatHistory([]);
        setIsAiLoading(false);

        if(showToast) handleShowToast("Content reset.");
    };

    const handleClearCache = () => {
        localStorage.clear();
        handleReset(false);
        handleShowToast("Cache cleared. App has been reset.");
    }

    const handleCopyAll = () => {
        if (!processedData) return;
        const fullOutput = generateFullOutput(processedData.structureString, processedData.fileContents);
        navigator.clipboard.writeText(fullOutput).then(() => handleShowToast('Copied all content to clipboard!'));
    };

    const handleSave = () => {
        if (!processedData) return;
        const fullOutput = generateFullOutput(processedData.structureString, processedData.fileContents);
        const blob = new Blob([fullOutput], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'structure-insight.txt';
        a.click();
        URL.revokeObjectURL(url);
    };
    
    const handleRefresh = () => {
        if (lastProcessedFiles) handleProcessing(lastProcessedFiles, true);
    };

    const handleCancel = () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
    };
    
    const handleDeleteFile = (path: string) => {
        setProcessedData(prevData => {
            if (!prevData) return null;
    
            const newFileContents = prevData.fileContents.filter(f => f.path !== path);
    
            const filterTreeRecursive = (nodes: FileNode[]): FileNode[] => {
                return nodes
                    .filter(node => node.path !== path)
                    .map(node => {
                        if (node.isDirectory) {
                            return { ...node, children: filterTreeRecursive(node.children) };
                        }
                        return node;
                    });
            };
    
            const newTreeData = filterTreeRecursive(JSON.parse(JSON.stringify(prevData.treeData)));
    
            const rootName = newTreeData.length > 0 && newTreeData[0].isDirectory ? newTreeData[0].name : "Project";
            const newStructureString = buildASCIITree(newTreeData, rootName);
            
            return { fileContents: newFileContents, treeData: newTreeData, structureString: newStructureString };
        });
    };

    const handleFileTreeSelect = (path: string) => {
        if (isMobile) setMobileView('editor');
        setTimeout(() => {
            const el = document.getElementById(`file-path-${path}`);
            if(el && codeViewRef.current) {
                const targetScroll = el.offsetTop - codeViewRef.current.offsetTop - 20;
                codeViewRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
                el.classList.add('bg-primary/10', 'dark:bg-primary/20');
                setTimeout(() => el.classList.remove('bg-primary/10', 'dark:bg-primary/20'), 2000);
            }
        }, isMobile ? 100 : 0);
    };
    
    const handleSaveEdit = (path: string, newContent: string) => {
        setProcessedData(prev => {
            if (!prev) return null;
            const newFileContents = prev.fileContents.map(f => f.path === path ? { ...f, content: newContent, stats: { lines: newContent.split('\n').length, chars: newContent.length }} : f);
            return { ...prev, fileContents: newFileContents };
        });
        setEditingPath(null);
    };

    const handleToggleMarkdownPreview = (path: string) => {
        setMarkdownPreviewPaths(prev => {
            const newSet = new Set(prev);
            newSet.has(path) ? newSet.delete(path) : newSet.add(path);
            return newSet;
        });
    };
    
    const handleSearch = (query: string, options: SearchOptions) => {
        if (!processedData || !query) {
            setSearchResults([]);
            setCurrentSearchResultIndex(null);
            return;
        }
        const results: SearchResult[] = [];
        try {
            if (options.fuzzySearch) {
                 const searchLower = options.caseSensitive ? query : query.toLowerCase();
                 processedData.fileContents.forEach(file => {
                    const contentLower = options.caseSensitive ? file.content : file.content.toLowerCase();
                    let fromIndex = 0;
                    while(fromIndex < contentLower.length) {
                        let queryIndex = 0;
                        let contentIndex = fromIndex;
                        let firstMatch = -1;
                        let lastMatch = -1;

                        while(queryIndex < searchLower.length && contentIndex < contentLower.length) {
                            if (contentLower[contentIndex] === searchLower[queryIndex]) {
                                if (firstMatch === -1) firstMatch = contentIndex;
                                lastMatch = contentIndex;
                                queryIndex++;
                            }
                            contentIndex++;
                        }

                        if (queryIndex === searchLower.length) {
                            const lineStart = file.content.lastIndexOf('\n', firstMatch) + 1;
                            const lineEnd = file.content.indexOf('\n', firstMatch);
                            results.push({
                                path: file.path,
                                start: firstMatch,
                                end: lastMatch + 1,
                                line: file.content.substring(0, firstMatch).split('\n').length,
                                preview: file.content.substring(lineStart, lineEnd > -1 ? lineEnd : file.content.length).trim(),
                                matchText: file.content.substring(firstMatch, lastMatch + 1),
                            });
                            fromIndex = firstMatch + 1;
                        } else {
                            break;
                        }
                    }
                 });
            } else {
                 const flags = options.caseSensitive ? 'g' : 'gi';
                const pattern = options.useRegex ? query : query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const regex = new RegExp(options.wholeWord ? `\\b${pattern}\\b` : pattern, flags);
                
                processedData.fileContents.forEach(file => {
                    let match;
                    while ((match = regex.exec(file.content)) !== null) {
                        const lineStart = file.content.lastIndexOf('\n', match.index) + 1;
                        const lineEnd = file.content.indexOf('\n', match.index);
                        results.push({
                            path: file.path,
                            start: match.index,
                            end: match.index + match[0].length,
                            line: file.content.substring(0, match.index).split('\n').length,
                            preview: file.content.substring(lineStart, lineEnd > -1 ? lineEnd : file.content.length).trim(),
                            matchText: match[0],
                        });
                         if (match[0].length === 0) regex.lastIndex++;
                    }
                });
            }
            setSearchResults(results);
            navigateToSearchResult(results.length > 0 ? 0 : null, results);
        } catch (e) {
            handleShowToast("Invalid Regular Expression");
            setSearchResults([]);
        }
    };
    
    const navigateToSearchResult = (index: number | null, results: SearchResult[] = searchResults) => {
        if (index === null || index < 0 || index >= results.length) {
            setCurrentSearchResultIndex(null);
            return;
        }
        setCurrentSearchResultIndex(index);
        const result = results[index];
        if (isMobile) setMobileView('editor');
        setTimeout(() => {
            const fileCard = document.getElementById(`file-path-${result.path}`);
            const resultElId = `search-result-${result.path}-${searchResults.slice(0, index + 1).filter(r => r.path === result.path).length - 1}`
            const resultEl = document.getElementById(resultElId);
            
            if(fileCard && codeViewRef.current) {
                let targetScroll = fileCard.offsetTop - codeViewRef.current.offsetTop - 20;
                if(resultEl) targetScroll += resultEl.offsetTop - (codeViewRef.current.clientHeight / 2);
                codeViewRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        }, isMobile ? 100 : 0);
    };

    const handleSearchNavigate = (direction: 'next' | 'prev') => {
        if (searchResults.length === 0 || currentSearchResultIndex === null) return;
        const nextIndex = direction === 'next' ? (currentSearchResultIndex + 1) % searchResults.length : (currentSearchResultIndex - 1 + searchResults.length) % searchResults.length;
        navigateToSearchResult(nextIndex);
    };

    const handleSendMessage = async (message: string) => {
        if (!message.trim() || isAiLoading || !processedData) return;

        let currentChat = chatSession;
        if (!currentChat) {
            try {
                currentChat = createChatSession();
                setChatSession(currentChat);
            } catch (error: any) {
                console.error("AI chat error:", error);
                handleShowToast(error.message);
                setIsAiLoading(false);
                return;
            }
        }
    
        const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: message };
        const loadingMessage: ChatMessage = { id: 'loading', role: 'loading', content: '' };
        
        const currentHistory = [...chatHistory, newUserMessage];
        setChatHistory([...currentHistory, loadingMessage]);
        setIsAiLoading(true);
    
        try {
            const isFirstMessage = chatHistory.filter(m => m.role === 'model').length === 0;
            const stream = await sendMessage(currentChat, message, processedData, isFirstMessage);
            
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setChatHistory(() => {
                    const updatedHistory = [...currentHistory];
                    const lastMsg = updatedHistory[updatedHistory.length - 1];
                    if (lastMsg?.role === 'model') {
                        lastMsg.content = fullResponse;
                    } else {
                         updatedHistory.push({ id: Date.now().toString() + '-ai', role: 'model', content: fullResponse });
                    }
                    return updatedHistory;
                });
            }
    
        } catch (error: any) {
            console.error("AI chat error:", error);
            const errorMessage: ChatMessage = { id: 'error', role: 'model', content: `Sorry, I encountered an error. Please check your API key and network connection. (Error: ${error.message})` };
            setChatHistory(prev => prev.filter(m => m.role !== 'loading').concat(errorMessage));
        } finally {
            setIsAiLoading(false);
            setChatHistory(prev => prev.filter(m => m.role !== 'loading'));
        }
    };

    const handleResize = React.useCallback((e: MouseEvent) => {
        if(leftPanelRef.current) {
            const containerWidth = leftPanelRef.current.parentElement!.offsetWidth;
            const newWidth = (e.clientX / containerWidth) * 100;
            if(newWidth > 15 && newWidth < 85) setPanelWidth(newWidth);
        }
    }, [setPanelWidth]);
    const stopResize = React.useCallback(() => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', stopResize);
    }, [handleResize]);
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        window.addEventListener('mousemove', handleResize);
        window.addEventListener('mouseup', stopResize);
    };
    
    React.useEffect(() => {
        const handleGlobalKeys = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'f') { e.preventDefault(); if (processedData) setIsSearchOpen(true); }
            if (e.ctrlKey && e.key === 'i') { e.preventDefault(); if (processedData) setIsAiChatOpen(p => !p); }
            if (e.ctrlKey && e.key === 's') { e.preventDefault(); if(processedData) handleSave(); }
            if (e.ctrlKey && e.key === 'o') { e.preventDefault(); handleFileSelect(); }
            if (e.key === 'Escape') {
                if (isSearchOpen) { e.preventDefault(); setIsSearchOpen(false); }
                else if (isSettingsOpen) { e.preventDefault(); setIsSettingsOpen(false); }
                else if (isAiChatOpen && !isMobile) { e.preventDefault(); setIsAiChatOpen(false); }
                else if (isLoading) { e.preventDefault(); handleCancel(); }
            }
        };
        window.addEventListener('keydown', handleGlobalKeys);
        return () => window.removeEventListener('keydown', handleGlobalKeys);
    }, [isSearchOpen, isSettingsOpen, isLoading, processedData, isAiChatOpen, isMobile]);

    const { fileCount, totalLines, totalChars } = React.useMemo(() => {
        if (!processedData?.fileContents) return { fileCount: 0, totalLines: 0, totalChars: 0 };
        return {
            fileCount: processedData.fileContents.length,
            totalLines: processedData.fileContents.reduce((sum, f) => sum + f.stats.lines, 0),
            totalChars: processedData.fileContents.reduce((sum, f) => sum + f.stats.chars, 0),
        };
    }, [processedData]);

    const handleMobileViewToggle = () => {
        if (!processedData) return;
        setMobileView(v => v === 'editor' ? 'tree' : (v === 'tree' ? 'chat' : 'editor'));
    }

    const mobileFabIcon = () => {
        if (!processedData) return 'fa-list-ul';
        switch(mobileView) {
            case 'editor': return 'fa-list-ul';
            case 'tree': return 'fa-wand-magic-sparkles';
            case 'chat': return 'fa-code';
            default: return 'fa-list-ul';
        }
    }

    return (
        <div 
            className="flex flex-col h-full bg-light-bg dark:bg-dark-bg"
            onDragEnter={(e) => {e.preventDefault(); e.stopPropagation(); setIsDragging(true);}} 
            onDragOver={(e) => {e.preventDefault(); e.stopPropagation();}} 
            onDragLeave={(e) => {e.preventDefault(); e.stopPropagation(); setIsDragging(false);}} 
            onDrop={handleDrop}
        >
            <Header 
                onOpenFolder={handleFileSelect} onCopyAll={handleCopyAll} onSave={handleSave} onReset={handleReset} onRefresh={handleRefresh} onCancel={handleCancel}
                onSearch={() => setIsSearchOpen(true)}
                onSettings={() => setIsSettingsOpen(true)}
                onToggleAIChat={() => setIsAiChatOpen(!isAiChatOpen)}
                hasContent={!!processedData} canRefresh={!!lastProcessedFiles}
                isLoading={isLoading}
                isOnline={isOnline}
                isAiChatOpen={isAiChatOpen}
            />
            <main className="flex-1 flex overflow-hidden relative">
                <AnimatePresence>
                    {isDragging && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/50 flex items-center justify-center z-30 pointer-events-none">
                            <div className="text-center text-white bg-primary/80 p-8 rounded-lg"><i className="fa-solid fa-upload fa-3x mb-4"></i><p className="text-xl font-bold">Drop Folder to Analyze</p></div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {isMobile ? (
                    <div className="relative w-full h-full overflow-hidden">
                       <AnimatePresence initial={false}>
                            {mobileView === 'tree' && (
                                <motion.div key="tree" initial={{x: '-100%'}} animate={{x: '0%'}} exit={{x: '-100%'}} transition={{duration: 0.3, ease: 'easeInOut'}} className="absolute inset-0 h-full overflow-y-auto bg-light-panel dark:bg-dark-panel">
                                    <FileTree nodes={processedData?.treeData || []} onFileSelect={handleFileTreeSelect} onDeleteFile={handleDeleteFile}/>
                                </motion.div>
                            )}
                            {mobileView === 'editor' && (
                                <motion.div key="editor" initial={{x: mobileView === 'tree' ? '-100%' : '100%'}} animate={{x: '0%'}} exit={{x: mobileView === 'chat' ? '100%' : '-100%'}} transition={{duration: 0.3, ease: 'easeInOut'}} className="absolute inset-0 h-full flex flex-col">
                                    {processedData ? (
                                        <div ref={codeViewRef} className="flex-1 overflow-y-auto"><CodeView {...{...processedData, searchResults, currentResultIndex: currentResultIndex, editingPath, markdownPreviewPaths, onStartEdit:setEditingPath, onSaveEdit: handleSaveEdit, onCancelEdit:() => setEditingPath(null), onToggleMarkdownPreview: handleToggleMarkdownPreview, onShowToast: handleShowToast, fontSize}} /></div>
                                    ) : (
                                        <div className="flex-1"><InitialPrompt onOpenFolder={handleFileSelect}/></div>
                                    )}
                                </motion.div>
                            )}
                            {mobileView === 'chat' && (
                                <motion.div key="chat" initial={{x: '100%'}} animate={{x: '0%'}} exit={{x: '100%'}} transition={{duration: 0.3, ease: 'easeInOut'}} className="absolute inset-0 h-full flex flex-col">
                                    <AiChatPanel messages={chatHistory} onSendMessage={handleSendMessage} isLoading={isAiLoading} onClose={() => {}} isApiKeyMissing={isApiKeyMissing} isMobile={true}/>
                                </motion.div>
                            )}
                       </AnimatePresence>
                    </div>
                ) : (
                    <>
                        <div ref={leftPanelRef} className="h-full bg-light-panel dark:bg-dark-panel overflow-y-auto" style={{ width: `${panelWidth}%` }}>
                            <FileTree nodes={processedData?.treeData || []} onFileSelect={handleFileTreeSelect} onDeleteFile={handleDeleteFile}/>
                        </div>
                        <div onMouseDown={handleMouseDown} className="w-1.5 h-full cursor-col-resize bg-light-border dark:bg-dark-border hover:bg-primary transition-colors duration-200 z-10" />
                        <div className="flex-1 h-full overflow-hidden bg-light-bg dark:bg-dark-bg flex">
                            <div className="flex-1 h-full flex flex-col min-w-0">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-4"><i className="fa-solid fa-spinner fa-spin text-4xl text-primary mb-4"></i><p className="text-lg font-semibold">Processing files...</p><p className="text-sm text-light-subtle-text dark:text-dark-subtle-text mt-2">{progressMessage}</p></div>
                                ) : processedData ? (
                                    <div ref={codeViewRef} className="flex-1 overflow-y-auto"><CodeView {...{...processedData, searchResults, currentResultIndex: currentResultIndex, editingPath, markdownPreviewPaths, onStartEdit:setEditingPath, onSaveEdit: handleSaveEdit, onCancelEdit:() => setEditingPath(null), onToggleMarkdownPreview: handleToggleMarkdownPreview, onShowToast: handleShowToast, fontSize}} /></div>
                                ) : (
                                    <InitialPrompt onOpenFolder={handleFileSelect}/>
                                )}
                            </div>
                             <AnimatePresence>
                                {isAiChatOpen && (
                                    <motion.div
                                        className="h-full flex flex-col bg-light-panel dark:bg-dark-panel border-l border-light-border dark:border-dark-border"
                                        style={{ width: '450px' }}
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: '450px', opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                                    >
                                        <AiChatPanel messages={chatHistory} onSendMessage={handleSendMessage} isLoading={isAiLoading} onClose={() => setIsAiChatOpen(false)} isApiKeyMissing={isApiKeyMissing} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}

                <AnimatePresence>
                    {isSearchOpen && (
                        <SearchDialog onClose={() => setIsSearchOpen(false)} onSearch={handleSearch} onNavigate={handleSearchNavigate} resultsCount={searchResults.length} currentIndex={currentSearchResultIndex} />
                    )}
                    {isSettingsOpen && (
                        <SettingsDialog
                            isOpen={isSettingsOpen}
                            onClose={() => setIsSettingsOpen(false)}
                            isDarkTheme={isDark}
                            onToggleTheme={() => setIsDark(!isDark)}
                            extractContent={extractContent}
                            onToggleExtractContent={() => setExtractContent(!extractContent)}
                            fontSize={fontSize}
                            onSetFontSize={setFontSize}
                            onClearCache={handleClearCache}
                            onInstallPWA={handleInstallPWA}
                            isInstallable={isInstallable}
                            isInstalled={isInstalled}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage(null)} />}
                    {updateWorker && <UpdateToast onUpdate={handleUpdate} />}
                </AnimatePresence>
                {processedData && <ScrollToTopButton targetRef={codeViewRef} />}
                {isMobile && processedData && (
                    <button onClick={handleMobileViewToggle} className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-20 active:scale-90 transition-transform">
                        <i className={`fa-solid ${mobileFabIcon()} text-xl`}></i>
                    </button>
                )}
            </main>
            {processedData && <StatusBar fileCount={fileCount} totalLines={totalLines} totalChars={totalChars} />}
        </div>
    );
};

export default App;