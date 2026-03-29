
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileTree from './FileTree';
import CodeView from './CodeView';
import InitialPrompt from './InitialPrompt';
import TabBar from './TabBar';
import { useAppLogic } from '../hooks/useAppLogic';
import ScrollSlider from './ScrollSlider';
import StructureView from './StructureView';
import ScrollToTopButton from './ScrollToTopButton';
import { FileNode } from '../types';

interface MainContentProps {
    logic: ReturnType<typeof useAppLogic>;
    codeViewRef: React.RefObject<HTMLDivElement>;
    leftPanelRef: React.RefObject<HTMLDivElement>;
}

/** Recursively collect unique file extensions from a tree */
function collectExtensions(nodes: FileNode[]): string[] {
    const exts = new Set<string>();
    const walk = (items: FileNode[]) => {
        for (const node of items) {
            if (node.isDirectory) {
                walk(node.children);
            } else {
                const dot = node.name.lastIndexOf('.');
                if (dot > 0 && dot < node.name.length - 1) {
                    exts.add(node.name.slice(dot).toLowerCase());
                }
            }
        }
    };
    walk(nodes);
    return Array.from(exts).sort();
}

/** Recursively filter tree to files matching `ext`, keeping directories that have matching children */
function filterTreeByExtension(nodes: FileNode[], ext: string | null): FileNode[] {
    if (!ext) return nodes;
    return nodes.reduce<FileNode[]>((acc, node) => {
        if (node.isDirectory) {
            const filteredChildren = filterTreeByExtension(node.children, ext);
            if (filteredChildren.length > 0) {
                acc.push({ ...node, children: filteredChildren });
            }
        } else {
            const dot = node.name.lastIndexOf('.');
            const fileExt = dot > 0 && dot < node.name.length - 1 ? node.name.slice(dot).toLowerCase() : '';
            if (fileExt === ext) {
                acc.push(node);
            }
        }
        return acc;
    }, []);
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
    const [filterExt, setFilterExt] = React.useState<string | null>(null);

    const treeData = state.processedData?.treeData || [];
    const extensions = React.useMemo(() => collectExtensions(treeData), [treeData]);
    const filteredNodes = React.useMemo(() => filterTreeByExtension(treeData, filterExt), [treeData, filterExt]);

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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center bg-white/70 dark:bg-dark-bg/70 backdrop-blur-sm"
                    >
                        <div className="border-4 border-dashed border-primary/60 rounded-2xl p-12 flex flex-col items-center gap-4 max-w-md mx-4">
                            <motion.i
                                className="fa-solid fa-cloud-arrow-up text-5xl text-primary"
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <p className="text-xl font-bold text-light-text dark:text-dark-text">拖放文件夹或 .zip 文件</p>
                            <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">支持任意代码项目</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {isMobile ? (
                <div className="relative w-full h-full overflow-hidden">
                   <AnimatePresence initial={false}>
                        {state.mobileView === 'tree' && state.processedData && (
                            <motion.div key="tree" initial={{x: '-100%'}} animate={{x: '0%'}} exit={{x: '-100%'}} transition={{duration: 0.3, ease: 'easeInOut'}} className="absolute inset-0 h-full overflow-y-auto bg-light-panel dark:bg-dark-panel">
                                {extensions.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1 border-b border-light-border dark:border-dark-border">
                                        {extensions.map(ext => (
                                            <button
                                                key={ext}
                                                onClick={() => setFilterExt(filterExt === ext ? null : ext)}
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                                    filterExt === ext
                                                        ? 'bg-primary text-white'
                                                        : 'bg-light-hover dark:bg-dark-hover text-light-subtle-text dark:text-dark-subtle-text hover:bg-primary/20 dark:hover:bg-primary/20'
                                                }`}
                                            >
                                                {ext}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <FileTree
                                    nodes={filteredNodes}
                                    onFileSelect={handlers.handleFileTreeSelect}
                                    onDeleteFile={handlers.handleDeleteFile}
                                    onCopyPath={handlers.handleCopyPath}
                                    onToggleExclude={handlers.handleToggleExclude}
                                    onDirDoubleClick={handlers.handleDirDoubleClick}
                                    selectedFilePath={state.selectedFilePath}
                                    showCharCount={state.showCharCount}
                                />
                            </motion.div>
                        )}
                        {state.mobileView === 'editor' && (
                            <motion.div key="editor" initial={{x: '0%'}} animate={{x: '0%'}} exit={{x: '100%'}} transition={{duration: 0.3, ease: 'easeInOut'}} className="absolute inset-0 h-full flex flex-col">
                                {state.activeView === 'code' && state.processedData && (
                                    <TabBar
                                        openFiles={state.openFiles}
                                        selectedFilePath={state.selectedFilePath}
                                        onTabSelect={handlers.handleFileTreeSelect}
                                        onCloseTab={handlers.closeTab}
                                    />
                                )}
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
                                                wordWrap={state.wordWrap}
                                             />
                                         )}
                                    </div>
                                ) : (
                                    <div className="flex-1"><InitialPrompt onOpenFolder={handlers.handleFileSelect} recentProjects={state.recentProjects}/></div>
                                )}
                            </motion.div>
                        )}
                   </AnimatePresence>
                </div>
            ) : (
                <>
                    <div ref={leftPanelRef} className="relative h-full bg-light-panel dark:bg-dark-panel" style={{ width: `${state.panelWidth}%` }}>
                        <div ref={fileTreeScrollRef} className="h-full overflow-y-auto no-scrollbar">
                           {state.processedData && (
                                <>
                                    {extensions.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1 border-b border-light-border dark:border-dark-border">
                                            {extensions.map(ext => (
                                                <button
                                                    key={ext}
                                                    onClick={() => setFilterExt(filterExt === ext ? null : ext)}
                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                                        filterExt === ext
                                                            ? 'bg-primary text-white'
                                                            : 'bg-light-hover dark:bg-dark-hover text-light-subtle-text dark:text-dark-subtle-text hover:bg-primary/20 dark:hover:bg-primary/20'
                                                    }`}
                                                >
                                                    {ext}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <FileTree
                                        nodes={filteredNodes}
                                        onFileSelect={handlers.handleFileTreeSelect}
                                        onDeleteFile={handlers.handleDeleteFile}
                                        onCopyPath={handlers.handleCopyPath}
                                        onToggleExclude={handlers.handleToggleExclude}
                                        onDirDoubleClick={handlers.handleDirDoubleClick}
                                        selectedFilePath={state.selectedFilePath}
                                        showCharCount={state.showCharCount}
                                    />
                                </>
                           )}
                        </div>
                        {state.processedData && <ScrollSlider scrollRef={fileTreeScrollRef} />}
                    </div>
                    <div onMouseDown={handlers.handleMouseDownResize} className="w-1.5 h-full cursor-col-resize group z-10">
                         <div className="w-full h-full bg-light-border dark:bg-dark-border group-hover:bg-primary transition-colors duration-200" />
                    </div>
                    <div className="flex-1 h-full overflow-hidden bg-light-bg dark:bg-dark-bg flex flex-col">
                        {state.activeView === 'code' && state.processedData && (
                            <TabBar
                                openFiles={state.openFiles}
                                selectedFilePath={state.selectedFilePath}
                                onTabSelect={handlers.handleFileTreeSelect}
                                onCloseTab={handlers.closeTab}
                            />
                        )}
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
                                                wordWrap={state.wordWrap}
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
                                <InitialPrompt onOpenFolder={handlers.handleFileSelect} recentProjects={state.recentProjects}/>
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

export default React.memo(MainContent);