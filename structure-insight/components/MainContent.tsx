
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileTree from './FileTree';
import CodeView from './CodeView';
import InitialPrompt from './InitialPrompt';
import { useAppLogic } from '../hooks/useAppLogic';
import ScrollSlider from './ScrollSlider';
import StructureView from './StructureView';
import ScrollToTopButton from './ScrollToTopButton';

interface MainContentProps {
    logic: ReturnType<typeof useAppLogic>;
    codeViewRef: React.RefObject<HTMLDivElement>;
    leftPanelRef: React.RefObject<HTMLDivElement>;
}

const LoadingIndicator: React.FC<{message: string}> = ({message}) => (
     <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary mb-4"></i>
        <p className="text-lg font-semibold">正在处理文件...</p>
        <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text mt-2 max-w-xs truncate">{message}</p>
    </div>
);

const MainContent: React.FC<MainContentProps> = ({ logic, codeViewRef, leftPanelRef }) => {
    const { state, handlers } = logic;
    const { isMobile } = state;
    const fileTreeScrollRef = React.useRef<HTMLDivElement>(null);

    const mobileFabIcon = () => {
        if (!state.processedData) return 'fa-list-ul';
        switch(state.mobileView) {
            case 'editor': return 'fa-list-ul';
            case 'tree': return 'fa-code';
            default: return 'fa-list-ul';
        }
    }

    return (
        <main className="flex-1 flex overflow-hidden relative">
            <AnimatePresence>
                {state.isDragging && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/50 backdrop-blur-sm flex items-center justify-center z-30 pointer-events-none">
                        <div className="text-center text-white bg-primary/80 p-8 rounded-lg"><i className="fa-solid fa-upload fa-3x mb-4"></i><p className="text-xl font-bold">拖放文件夹以进行分析</p></div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {isMobile ? (
                <div className="relative w-full h-full overflow-hidden">
                   <AnimatePresence initial={false}>
                        {state.mobileView === 'tree' && state.processedData && (
                            <motion.div key="tree" initial={{x: '-100%'}} animate={{x: '0%'}} exit={{x: '-100%'}} transition={{duration: 0.3, ease: 'easeInOut'}} className="absolute inset-0 h-full overflow-y-auto bg-light-panel dark:bg-dark-panel">
                                <FileTree nodes={state.processedData.treeData || []} onFileSelect={handlers.handleFileTreeSelect} onDeleteFile={handlers.handleDeleteFile} onCopyPath={handlers.handleCopyPath} selectedFilePath={state.selectedFilePath} showCharCount={state.showCharCount} />
                            </motion.div>
                        )}
                        {state.mobileView === 'editor' && (
                            <motion.div key="editor" initial={{x: '0%'}} animate={{x: '0%'}} exit={{x: '100%'}} transition={{duration: 0.3, ease: 'easeInOut'}} className="absolute inset-0 h-full flex flex-col">
                                {state.isLoading ? (
                                    <LoadingIndicator message={state.progressMessage} />
                                ) : state.processedData ? (
                                    <div ref={codeViewRef} className="flex-1 overflow-y-auto">
                                         {state.activeView === 'structure' ? (
                                             <StructureView 
                                                structureString={state.processedData.structureString} 
                                                fontSize={state.fontSize} 
                                                onShowToast={(msg) => handlers.setToastMessage(msg)}
                                             />
                                         ) : (
                                             <CodeView 
                                                selectedFile={state.selectedFile} 
                                                editingPath={state.editingPath} 
                                                onStartEdit={handlers.setEditingPath} 
                                                onSaveEdit={handlers.handleSaveEdit} 
                                                onCancelEdit={() => handlers.setEditingPath(null)} 
                                                markdownPreviewPaths={state.markdownPreviewPaths} 
                                                onToggleMarkdownPreview={handlers.handleToggleMarkdownPreview} 
                                                onShowToast={(msg) => handlers.setToastMessage(msg)} 
                                                fontSize={state.fontSize}
                                                searchQuery={state.searchQuery}
                                                searchOptions={state.searchOptions}
                                                activeMatchIndexInFile={state.activeMatchIndexInFile}
                                                onCopyPath={handlers.handleCopyPath}
                                             />
                                         )}
                                    </div>
                                ) : (
                                    <div className="flex-1"><InitialPrompt onOpenFolder={handlers.handleFileSelect}/></div>
                                )}
                            </motion.div>
                        )}
                   </AnimatePresence>
                </div>
            ) : (
                <>
                    <div ref={leftPanelRef} className="relative h-full bg-light-panel dark:bg-dark-panel" style={{ width: `${state.panelWidth}%` }}>
                        <div ref={fileTreeScrollRef} className="h-full overflow-y-auto no-scrollbar">
                           {state.processedData && <FileTree nodes={state.processedData.treeData || []} onFileSelect={handlers.handleFileTreeSelect} onDeleteFile={handlers.handleDeleteFile} onCopyPath={handlers.handleCopyPath} selectedFilePath={state.selectedFilePath} showCharCount={state.showCharCount} />}
                        </div>
                        {state.processedData && <ScrollSlider scrollRef={fileTreeScrollRef} />}
                    </div>
                    <div onMouseDown={handlers.handleMouseDownResize} className="w-1.5 h-full cursor-col-resize group z-10">
                         <div className="w-full h-full bg-light-border dark:bg-dark-border group-hover:bg-primary transition-colors duration-200" />
                    </div>
                    <div className="flex-1 h-full overflow-hidden bg-light-bg dark:bg-dark-bg flex">
                        <div className="flex-1 h-full flex flex-col min-w-0">
                            {state.isLoading ? (
                                <LoadingIndicator message={state.progressMessage} />
                            ) : state.processedData ? (
                                <div className="relative flex-1 min-h-0">
                                    <div ref={codeViewRef} className="h-full overflow-y-auto no-scrollbar">
                                        <div className={state.activeView === 'code' ? 'block min-h-full' : 'hidden'}>
                                            <CodeView 
                                                selectedFile={state.selectedFile} 
                                                editingPath={state.editingPath} 
                                                markdownPreviewPaths={state.markdownPreviewPaths} 
                                                onStartEdit={handlers.setEditingPath} 
                                                onSaveEdit={handlers.handleSaveEdit} 
                                                onCancelEdit={() => handlers.setEditingPath(null)} 
                                                onToggleMarkdownPreview={handlers.handleToggleMarkdownPreview} 
                                                onShowToast={(msg) => handlers.setToastMessage(msg)} 
                                                fontSize={state.fontSize} 
                                                searchQuery={state.searchQuery} 
                                                searchOptions={state.searchOptions}
                                                activeMatchIndexInFile={state.activeMatchIndexInFile}
                                                onCopyPath={handlers.handleCopyPath}
                                            />
                                        </div>
                                        <div className={state.activeView === 'structure' ? 'block min-h-full' : 'hidden'}>
                                            <StructureView 
                                                structureString={state.processedData.structureString} 
                                                fontSize={state.fontSize} 
                                                onShowToast={(msg) => handlers.setToastMessage(msg)}
                                            />
                                        </div>
                                    </div>
                                    <ScrollSlider scrollRef={codeViewRef} />
                                    <ScrollToTopButton targetRef={codeViewRef} />
                                </div>
                            ) : (
                                <InitialPrompt onOpenFolder={handlers.handleFileSelect}/>
                            )}
                        </div>
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
