import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileTree from './FileTree';
import CodeView from './CodeView';
import AiChatPanel from './AiChatPanel';
import InitialPrompt from './InitialPrompt';
import { useWindowSize } from '../hooks/useWindowSize';
import { useAppLogic } from '../hooks/useAppLogic';
import { useLocalization } from '../hooks/useLocalization';

interface MainContentProps {
    logic: ReturnType<typeof useAppLogic>;
    codeViewRef: React.RefObject<HTMLDivElement>;
    leftPanelRef: React.RefObject<HTMLDivElement>;
}

const MainContent: React.FC<MainContentProps> = ({ logic, codeViewRef, leftPanelRef }) => {
    const { state, handlers } = logic;
    const windowSize = useWindowSize();
    const isMobile = windowSize.width <= 768;
    const { t } = useLocalization();

    const mobileFabIcon = () => {
        if (!state.processedData) return 'fa-list-ul';
        switch(state.mobileView) {
            case 'editor': return 'fa-list-ul';
            case 'tree': return 'fa-wand-magic-sparkles';
            case 'chat': return 'fa-code';
            default: return 'fa-list-ul';
        }
    }

    const LoadingIndicator: React.FC = () => (
         <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <i className="fa-solid fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-lg font-semibold">{t('processing_files')}</p>
            <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text mt-2">{state.progressMessage}</p>
        </div>
    );

    return (
        <main className="flex-1 flex overflow-hidden relative">
            <AnimatePresence>
                {state.isDragging && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/50 flex items-center justify-center z-30 pointer-events-none">
                        <div className="text-center text-white bg-primary/80 p-8 rounded-lg"><i className="fa-solid fa-upload fa-3x mb-4"></i><p className="text-xl font-bold">{t('drop_folder_prompt')}</p></div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {isMobile ? (
                <div className="relative w-full h-full overflow-hidden">
                   <AnimatePresence initial={false}>
                        {state.mobileView === 'tree' && state.processedData && (
                            <motion.div key="tree" initial={{x: '-100%'}} animate={{x: '0%'}} exit={{x: '-100%'}} transition={{duration: 0.3, ease: 'easeInOut'}} className="absolute inset-0 h-full overflow-y-auto bg-light-panel dark:bg-dark-panel">
                                <FileTree nodes={state.processedData.treeData || []} onFileSelect={handlers.handleFileTreeSelect} onDeleteFile={handlers.handleDeleteFile}/>
                            </motion.div>
                        )}
                        {state.mobileView === 'editor' && (
                            <motion.div key="editor" initial={{x: '0%'}} animate={{x: '0%'}} exit={{x: state.mobileView === 'tree' ? '100%' : '-100%'}} transition={{duration: 0.3, ease: 'easeInOut'}} className="absolute inset-0 h-full flex flex-col">
                                {state.isLoading ? (
                                    <LoadingIndicator />
                                ) : state.processedData ? (
                                    <div ref={codeViewRef} className="flex-1 overflow-y-auto"><CodeView {...{...state.processedData, searchResults: state.searchResults, currentResultIndex: state.currentSearchResultIndex, editingPath: state.editingPath, markdownPreviewPaths: state.markdownPreviewPaths, onStartEdit: handlers.setEditingPath, onSaveEdit: handlers.handleSaveEdit, onCancelEdit:() => handlers.setEditingPath(null), onToggleMarkdownPreview: handlers.handleToggleMarkdownPreview, onShowToast: (msg: string) => handlers.setToastMessage(msg), fontSize: state.fontSize}} /></div>
                                ) : (
                                    <div className="flex-1"><InitialPrompt onOpenFolder={handlers.handleFileSelect}/></div>
                                )}
                            </motion.div>
                        )}
                        {state.mobileView === 'chat' && state.processedData && (
                            <motion.div key="chat" initial={{x: '100%'}} animate={{x: '0%'}} exit={{x: '100%'}} transition={{duration: 0.3, ease: 'easeInOut'}} className="absolute inset-0 h-full flex flex-col">
                                <AiChatPanel messages={state.chatHistory} onSendMessage={handlers.handleSendMessage} isLoading={state.isAiLoading} onClose={() => {}} isApiKeyMissing={state.isApiKeyMissing} isMobile={true}/>
                            </motion.div>
                        )}
                   </AnimatePresence>
                </div>
            ) : (
                <>
                    <div ref={leftPanelRef} className="h-full bg-light-panel dark:bg-dark-panel overflow-y-auto" style={{ width: `${state.panelWidth}%` }}>
                       {state.processedData && <FileTree nodes={state.processedData.treeData || []} onFileSelect={handlers.handleFileTreeSelect} onDeleteFile={handlers.handleDeleteFile}/>}
                    </div>
                    <div onMouseDown={handlers.handleMouseDownResize} className="w-1.5 h-full cursor-col-resize bg-light-border dark:bg-dark-border hover:bg-primary transition-colors duration-200 z-10" />
                    <div className="flex-1 h-full overflow-hidden bg-light-bg dark:bg-dark-bg flex">
                        <div className="flex-1 h-full flex flex-col min-w-0">
                            {state.isLoading ? (
                                <LoadingIndicator />
                            ) : state.processedData ? (
                                <div ref={codeViewRef} className="flex-1 overflow-y-auto"><CodeView {...{...state.processedData, searchResults: state.searchResults, currentResultIndex: state.currentSearchResultIndex, editingPath: state.editingPath, markdownPreviewPaths: state.markdownPreviewPaths, onStartEdit: handlers.setEditingPath, onSaveEdit: handlers.handleSaveEdit, onCancelEdit:() => handlers.setEditingPath(null), onToggleMarkdownPreview: handlers.handleToggleMarkdownPreview, onShowToast: (msg: string) => handlers.setToastMessage(msg), fontSize: state.fontSize}} /></div>
                            ) : (
                                <InitialPrompt onOpenFolder={handlers.handleFileSelect}/>
                            )}
                        </div>
                         <AnimatePresence>
                            {state.isAiChatOpen && (
                                <motion.div
                                    className="h-full flex flex-col bg-light-panel dark:bg-dark-panel border-l border-light-border dark:border-dark-border"
                                    style={{ width: '450px' }}
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: '450px', opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                                >
                                    <AiChatPanel messages={state.chatHistory} onSendMessage={handlers.handleSendMessage} isLoading={state.isAiLoading} onClose={handlers.handleToggleAIChat} isApiKeyMissing={state.isApiKeyMissing} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}
             {isMobile && state.processedData && (
                <button onClick={handlers.handleMobileViewToggle} className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-20 active:scale-90 transition-transform">
                    <i className={`fa-solid ${mobileFabIcon()} text-xl`}></i>
                </button>
            )}
        </main>
    );
};

export default MainContent;