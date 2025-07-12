import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppLogic } from './hooks/useAppLogic';
import { Toast } from './components/CodeView';
import SearchDialog from './components/SearchDialog';
import SettingsDialog from './components/SettingsDialog';
import ScrollToTopButton from './components/ScrollToTopButton';
import Header from './components/Header';
import MainContent from './components/MainContent';
import StatusBar from './components/StatusBar';
import UpdateToast from './components/UpdateToast';

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
            <Header 
                onOpenFolder={handlers.handleFileSelect} 
                onCopyAll={handlers.handleCopyAll} 
                onSave={handlers.handleSave} 
                onReset={() => handlers.handleReset(true)} 
                onRefresh={handlers.handleRefresh} 
                onCancel={handlers.handleCancel}
                onSearch={() => handlers.setIsSearchOpen(true)}
                onSettings={() => handlers.setIsSettingsOpen(true)}
                onToggleAIChat={handlers.handleToggleAIChat}
                hasContent={!!state.processedData} 
                canRefresh={!!state.lastProcessedFiles}
                isLoading={state.isLoading}
                isOnline={state.isOnline}
                isAiChatOpen={state.isAiChatOpen}
            />
            
            <MainContent logic={logic} codeViewRef={codeViewRef} leftPanelRef={leftPanelRef} />

            {state.processedData && (
                <StatusBar 
                    fileCount={state.stats.fileCount} 
                    totalLines={state.stats.totalLines} 
                    totalChars={state.stats.totalChars} 
                />
            )}

            
            {state.isSearchOpen && (
                <SearchDialog 
                    onClose={() => handlers.setIsSearchOpen(false)} 
                    onSearch={handlers.handleSearch} 
                    onNavigate={handlers.handleSearchNavigate} 
                    resultsCount={state.searchResults.length} 
                    currentIndex={state.currentSearchResultIndex} 
                />
            )}
            {state.isSettingsOpen && (
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
                    onInstallPWA={settings.handleInstallPWA}
                    isInstallable={state.isInstallable}
                    isInstalled={state.isInstalled}
                />
            )}
            <AnimatePresence>
                {state.toastMessage && <Toast message={state.toastMessage} onDone={() => handlers.setToastMessage(null)} />}
                {state.updateWorker && <UpdateToast onUpdate={handlers.handleUpdate} />}
            </AnimatePresence>
            {state.processedData && <ScrollToTopButton targetRef={codeViewRef} />}
        </div>
    );
};

export default App;
