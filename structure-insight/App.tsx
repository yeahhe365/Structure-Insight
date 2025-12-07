
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppLogic } from './hooks/useAppLogic';
import Toast from './components/Toast';
import SettingsDialog from './components/SettingsDialog';
import Header from './components/Header';
import MainContent from './components/MainContent';
import StatusBar from './components/StatusBar';
import SearchDialog from './components/SearchDialog';
import ConfirmationDialog from './components/ConfirmationDialog';
import AIChat from './components/AIChat';
import FileRankDialog from './components/FileRankDialog';

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
                    <SearchDialog 
                        onClose={() => handlers.setIsSearchOpen(false)}
                        onSearch={handlers.handleSearch}
                        onNavigate={handlers.handleNavigate}
                        resultsCount={state.searchResults.length}
                        currentIndex={state.activeResultIndex}
                    />
                 )}
            </AnimatePresence>
            
            <AnimatePresence>
                {state.isFileRankOpen && (
                    <FileRankDialog
                        isOpen={state.isFileRankOpen}
                        onClose={() => handlers.setIsFileRankOpen(false)}
                        files={state.processedData?.fileContents || []}
                        onSelectFile={handlers.handleFileTreeSelect}
                        onCopyPath={handlers.handleCopyPath}
                    />
                )}
            </AnimatePresence>

            <AIChat 
                isOpen={state.isAiChatOpen}
                onClose={() => handlers.setIsAiChatOpen(false)}
                projectData={state.processedData}
            />

            <AnimatePresence>
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
                        showCharCount={state.showCharCount}
                        onToggleShowCharCount={() => settings.setShowCharCount(!state.showCharCount)}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {state.toastMessage && <Toast message={state.toastMessage} onDone={() => handlers.setToastMessage(null)} />}
            </AnimatePresence>
        </div>
    );
};

export default App;
