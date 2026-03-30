
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppLogic } from './hooks/useAppLogic';
import Toast from './components/Toast';
import Header from './components/Header';
import MainContent from './components/MainContent';
import StatusBar from './components/StatusBar';
import ConfirmationDialog from './components/ConfirmationDialog';

// Lazy-load heavy components
const SettingsDialog = React.lazy(() => import('./components/SettingsDialog'));
const SearchDialog = React.lazy(() => import('./components/SearchDialog'));
const AIChat = React.lazy(() => import('./components/AIChat'));
const FileRankDialog = React.lazy(() => import('./components/FileRankDialog'));
const KeyboardShortcutsDialog = React.lazy(() => import('./components/KeyboardShortcutsDialog'));

const SuspenseFallback = () => null;

const App: React.FC = () => {
    const codeViewRef = React.useRef<HTMLDivElement>(null);
    const leftPanelRef = React.useRef<HTMLDivElement>(null);

    const logic = useAppLogic(codeViewRef, leftPanelRef);
    const { state, handlers, settings } = logic;
    
    return (
        <div 
            className="flex flex-col h-full bg-light-bg dark:bg-dark-bg"
            onDragEnter={(e) => {e.preventDefault(); e.stopPropagation(); handlers.setIsDragging(true);}} 
            onDragOver={(e) => {e.preventDefault(); e.stopPropagation();}} 
            onDragLeave={(e) => {e.preventDefault(); e.stopPropagation(); handlers.setIsDragging(false);}} 
            onDrop={handlers.handleDrop}
        >
            {/* Loading progress bar */}
            {state.isLoading && (
                <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-light-border dark:bg-dark-border overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-300 ease-out" style={{ width: state.progressMessage ? `${Math.min(95, parseInt(state.progressMessage.match(/(\d+)\/(\d+)/)?.[1] || '0') / Math.max(1, parseInt(state.progressMessage.match(/(\d+)\/(\d+)/)?.[2] || '1')) * 100)}%` : '90%' }} />
                </div>
            )}
            <Header 
                onOpenFolder={handlers.handleFileSelect} 
                onCopyAll={handlers.handleCopyAll} 
                onSave={handlers.handleSave} 
                onReset={handlers.handleReset} 
                onCancel={handlers.handleCancel}
                onSettings={() => handlers.setIsSettingsOpen(true)}
                onToggleSearch={() => handlers.setIsSearchOpen(true)}
                onToggleAiChat={() => handlers.setIsAiChatOpen(true)}
                onToggleFileRank={() => handlers.setIsFileRankOpen(true)}
                onShowStructure={() => handlers.setActiveView('structure')}
                hasContent={!!state.processedData} 
                isLoading={state.isLoading}
                activeView={state.activeView}
            />
            
            <MainContent logic={logic} codeViewRef={codeViewRef} leftPanelRef={leftPanelRef} />

            {state.processedData && (
                <StatusBar
                    fileCount={state.stats.fileCount}
                    totalLines={state.stats.totalLines}
                    totalChars={state.stats.totalChars}
                    selectedFileName={state.selectedFile?.name}
                    isDark={state.isDark}
                    processedData={state.processedData}
                />
            )}
            
             <ConfirmationDialog 
                isOpen={state.confirmation.isOpen}
                onClose={() => handlers.setConfirmation(c => ({...c, isOpen: false}))}
                onConfirm={state.confirmation.onConfirm}
                title={state.confirmation.title}
                message={state.confirmation.message}
             />

            <AnimatePresence>
                 {state.isSearchOpen && (
                    <React.Suspense fallback={<SuspenseFallback />}>
                    <SearchDialog
                        onClose={() => handlers.setIsSearchOpen(false)}
                        onSearch={handlers.handleSearch}
                        onNavigate={handlers.handleNavigate}
                        resultsCount={state.searchResults.length}
                        currentIndex={state.activeResultIndex}
                    />
                    </React.Suspense>
                 )}
            </AnimatePresence>

            <AnimatePresence>
                {state.isFileRankOpen && (
                    <React.Suspense fallback={<SuspenseFallback />}>
                    <FileRankDialog
                        isOpen={state.isFileRankOpen}
                        onClose={() => handlers.setIsFileRankOpen(false)}
                        files={state.processedData?.fileContents || []}
                        onSelectFile={handlers.handleFileTreeSelect}
                        onCopyPath={handlers.handleCopyPath}
                        onDeleteFile={handlers.handleDeleteFile}
                        onToggleExclude={handlers.handleToggleExclude}
                    />
                    </React.Suspense>
                )}
            </AnimatePresence>

            <React.Suspense fallback={<SuspenseFallback />}>
            <AIChat
                isOpen={state.isAiChatOpen}
                onClose={() => handlers.setIsAiChatOpen(false)}
                projectData={state.processedData}
            />
            </React.Suspense>

            <AnimatePresence>
                {state.isSettingsOpen && (
                    <React.Suspense fallback={<SuspenseFallback />}>
                    <SettingsDialog
                        isOpen={state.isSettingsOpen}
                        onClose={() => handlers.setIsSettingsOpen(false)}
                        isDarkTheme={state.isDark}
                        onToggleTheme={() => settings.setIsDark(!state.isDark)}
                        extractContent={state.extractContent}
                        onToggleExtractContent={() => settings.setExtractContent(!state.extractContent)}
                        fontSize={state.fontSize}
                        onSetFontSize={settings.setFontSize}
                        onClearCache={settings.handleClearCache}
                        showCharCount={state.showCharCount}
                        onToggleShowCharCount={() => settings.setShowCharCount(!state.showCharCount)}
                        maxCharsThreshold={state.maxCharsThreshold}
                        onSetMaxCharsThreshold={settings.setMaxCharsThreshold}
                        wordWrap={state.wordWrap}
                        onToggleWordWrap={() => settings.setWordWrap(!state.wordWrap)}
                    />
                    </React.Suspense>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {state.isShortcutsOpen && (
                    <React.Suspense fallback={<SuspenseFallback />}>
                    <KeyboardShortcutsDialog
                        isOpen={state.isShortcutsOpen}
                        onClose={() => handlers.setIsShortcutsOpen(false)}
                    />
                    </React.Suspense>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {state.toastMessage && <Toast message={state.toastMessage} onDone={() => handlers.setToastMessage(null)} />}
            </AnimatePresence>
        </div>
    );
};

export default App;
