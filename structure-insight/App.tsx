

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
        <img src="https://fav.farm/🚀" alt="logo" className="rounded-full w-10 h-10" />
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
                <i className="fa-solid fa-rocket text-5xl text-primary mb-6"></i>
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
        document.documentElement.classList.toggle('dark',