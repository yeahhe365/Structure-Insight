
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InitialPrompt from './InitialPrompt';
import TabBar from './TabBar';
import { useAppLogic } from '../hooks/useAppLogic';
import ScrollSlider from './ScrollSlider';
import ScrollToTopButton from './ScrollToTopButton';
import { FileNode } from '../types';

const FileTree = React.lazy(() => import('./FileTree'));
const CodeView = React.lazy(() => import('./CodeView'));
const StructureView = React.lazy(() => import('./StructureView'));

interface MainContentProps {
    logic: ReturnType<typeof useAppLogic>;
    codeViewRef: React.RefObject<HTMLDivElement | null>;
    leftPanelRef: React.RefObject<HTMLDivElement | null>;
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
        <div className="flex space-x-2 mb-6">
            {[0, 1, 2].map(i => (
                <div key={i} className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
        </div>
        <p className="text-lg font-semibold mb-2">正在处理文件...</p>
        <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text max-w-xs truncate">{message}</p>
    </div>
);

const SuspenseFallback: React.FC = () => (
    <div className="flex items-center justify-center h-full text-sm text-light-subtle-text dark:text-dark-subtle-text">
        正在加载视图...
    </div>
);

const MainContent: React.FC<MainContentProps> = ({ logic, codeViewRef, leftPanelRef }) => {
    const { state, handlers } = logic;
    const { isMobile } = state;
    const fileTreeScrollRef = React.useRef<HTMLElement | null>(null);
    const [filterExt, setFilterExt] = React.useState<string | null>(null);

    const treeData = state.processedData?.treeData || [];
    const extensions = React.useMemo(() => collectExtensions(treeData), [treeData]);
    const activeFilterExt = filterExt && extensions.includes(filterExt) ? filterExt : null;
    const filteredNodes = React.useMemo(() => filterTreeByExtension(treeData, activeFilterExt), [treeData, activeFilterExt]);

    React.useEffect(() => {
        if (filterExt && activeFilterExt === null) {
            setFilterExt(null);
        }
    }, [activeFilterExt, filterExt]);

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
                            <motion.div key="tree" initial={{x: '-100%'}} animate={{x: '0%'}} exit={{x: '-100%'}} transition={{duration: 0.3, ease: 'easeInOut'}} className="absolute inset-0 h-full bg-light-panel dark:bg-dark-panel flex flex-col">
                                {extensions.length > 0 && (
                                    <div className="shrink-0 flex flex-wrap gap-1.5 px-3 pt-2 pb-1 border-b border-light-border dark:border-dark-border">
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
                                <div className="flex-1 min-h-0">
                                    <React.Suspense fallback={<SuspenseFallback />}>
                                        <FileTree
                                            nodes={filteredNodes}
                                            treeResetKey={state.lastProcessedFiles}
                                            onFileSelect={handlers.handleFileTreeSelect}
                                            onDeleteFile={handlers.handleDeleteFile}
                                            onCopyPath={handlers.handleCopyPath}
                                            onToggleExclude={handlers.handleToggleExclude}
                                            onDirDoubleClick={handlers.handleDirDoubleClick}
                                            selectedFilePath={state.selectedFilePath}
                                        />
                                    </React.Suspense>
                                </div>
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
                                             <React.Suspense fallback={<SuspenseFallback />}>
                                                <StructureView 
                                                    structureString={state.processedData.structureString} 
                                                    fontSize={state.fontSize} 
                                                    onShowToast={(msg) => handlers.setToastMessage(msg)}
                                                />
                                             </React.Suspense>
                                         ) : (
                                             <React.Suspense fallback={<SuspenseFallback />}>
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
                                             </React.Suspense>
                                         )}
                                    </div>
                                ) : (
                                    <div className="flex-1"><InitialPrompt onOpenFolder={handlers.handleFileSelect} onOpenRecentProject={handlers.handleRecentProjectSelect} recentProjects={state.recentProjects}/></div>
                                )}
                            </motion.div>
                        )}
                   </AnimatePresence>
                </div>
            ) : state.processedData ? (
                <>
                    <div ref={leftPanelRef} className="relative h-full bg-light-panel dark:bg-dark-panel flex flex-col" style={{ width: `${state.panelWidth}%` }}>
                        <div className="flex-1 min-h-0 flex flex-col">
                            {extensions.length > 0 && (
                                <div className="shrink-0 flex flex-wrap gap-1.5 px-3 pt-2 pb-1 border-b border-light-border dark:border-dark-border">
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
                            <div className="relative flex-1 min-h-0">
                                <React.Suspense fallback={<SuspenseFallback />}>
                                    <FileTree
                                        nodes={filteredNodes}
                                        treeResetKey={state.lastProcessedFiles}
                                        scrollContainerRef={fileTreeScrollRef}
                                        onFileSelect={handlers.handleFileTreeSelect}
                                        onDeleteFile={handlers.handleDeleteFile}
                                        onCopyPath={handlers.handleCopyPath}
                                        onToggleExclude={handlers.handleToggleExclude}
                                        onDirDoubleClick={handlers.handleDirDoubleClick}
                                        selectedFilePath={state.selectedFilePath}
                                    />
                                </React.Suspense>
                            </div>
                        </div>
                        <ScrollSlider scrollRef={fileTreeScrollRef} />
                    </div>
                    <div onMouseDown={handlers.handleMouseDownResize} className="w-1.5 h-full cursor-col-resize group z-10">
                         <div className="w-full h-full bg-light-border dark:bg-dark-border group-hover:bg-primary transition-colors duration-200" />
                    </div>
                    <div className="flex-1 h-full overflow-hidden bg-light-bg dark:bg-dark-bg flex flex-col">
                        {state.activeView === 'code' && (
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
                            ) : (
                                <div className="relative flex-1 min-h-0">
                                    <div ref={codeViewRef} className="h-full overflow-y-auto no-scrollbar">
                                        <div className={state.activeView === 'code' ? 'block min-h-full' : 'hidden'}>
                                            <React.Suspense fallback={<SuspenseFallback />}>
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
                                            </React.Suspense>
                                        </div>
                                        <div className={state.activeView === 'structure' ? 'block min-h-full' : 'hidden'}>
                                            <React.Suspense fallback={<SuspenseFallback />}>
                                                <StructureView 
                                                    structureString={state.processedData.structureString} 
                                                    fontSize={state.fontSize} 
                                                    onShowToast={(msg) => handlers.setToastMessage(msg)}
                                                />
                                            </React.Suspense>
                                        </div>
                                    </div>
                                    <ScrollSlider scrollRef={codeViewRef} />
                                    <ScrollToTopButton targetRef={codeViewRef} />
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 min-w-0 bg-light-bg dark:bg-dark-bg">
                    <InitialPrompt onOpenFolder={handlers.handleFileSelect} onOpenRecentProject={handlers.handleRecentProjectSelect} recentProjects={state.recentProjects}/>
                </div>
            )}
             {isMobile && state.processedData && (
                <button onClick={handlers.handleMobileViewToggle} aria-label={state.mobileView === 'tree' ? '切换到代码视图' : '切换到文件树'} className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-20 active:scale-90 transition-transform">
                    <i className={`fa-solid ${mobileFabIcon()} text-xl`}></i>
                </button>
            )}
        </main>
    );
};

export default React.memo(MainContent);
