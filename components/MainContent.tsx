
import React from 'react';
import InitialPrompt from './InitialPrompt';
import TabBar from './TabBar';
import { useAppLogic } from '../hooks/useAppLogic';
import ScrollSlider from './ScrollSlider';
import ScrollToTopButton from './ScrollToTopButton';
import { FileNode } from '../types';
import { compareFileTypeLabels, getFileTypeLabel } from '../services/fileTypeLabel';

const FileTree = React.lazy(() => import('./FileTree'));
const CodeView = React.lazy(() => import('./CodeView'));
const StructureView = React.lazy(() => import('./StructureView'));

interface MainContentProps {
    logic: ReturnType<typeof useAppLogic>;
    codeViewRef: React.RefObject<HTMLDivElement | null>;
    leftPanelRef: React.RefObject<HTMLDivElement | null>;
}

interface FileTypeCount {
    label: string;
    count: number;
}

function collectFileTypeCounts(nodes: FileNode[]): FileTypeCount[] {
    const counts = new Map<string, number>();

    const walk = (items: FileNode[]) => {
        for (const node of items) {
            if (node.isDirectory) {
                walk(node.children);
            } else {
                const label = getFileTypeLabel(node.name);
                counts.set(label, (counts.get(label) ?? 0) + 1);
            }
        }
    };

    walk(nodes);

    return Array.from(counts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => compareFileTypeLabels(a.label, b.label));
}

function filterTreeByFileType(nodes: FileNode[], fileType: string | null): FileNode[] {
    if (!fileType) return nodes;
    return nodes.reduce<FileNode[]>((acc, node) => {
        if (node.isDirectory) {
            const filteredChildren = filterTreeByFileType(node.children, fileType);
            if (filteredChildren.length > 0) {
                acc.push({ ...node, children: filteredChildren });
            }
        } else {
            if (getFileTypeLabel(node.name) === fileType) {
                acc.push(node);
            }
        }
        return acc;
    }, []);
}

const LoadingIndicator: React.FC<{message: string}> = ({message}) => (
     <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary">
            <i className="fa-solid fa-folder-tree text-2xl"></i>
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

const FileTypeFilterToolbar: React.FC<{
    fileTypes: FileTypeCount[];
    activeFilterType: string | null;
    hiddenSelectedFileName: string | null;
    onSelectFileType: (fileType: string | null) => void;
}> = ({ fileTypes, activeFilterType, hiddenSelectedFileName, onSelectFileType }) => {
    if (fileTypes.length === 0) {
        return null;
    }

    return (
        <div className="shrink-0 border-b border-light-border dark:border-dark-border">
            <div className="px-3 pt-2 text-[11px] text-light-subtle-text dark:text-dark-subtle-text">
                <span className="font-semibold uppercase tracking-[0.16em]">文件类型筛选</span>
                <p className="mt-1">筛选仅影响文件树浏览，不影响导出与右侧内容。</p>
            </div>
            <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-2">
                <button
                    type="button"
                    aria-label="全部"
                    aria-pressed={activeFilterType === null}
                    onClick={() => onSelectFileType(null)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        activeFilterType === null
                            ? 'bg-primary text-white'
                            : 'bg-light-hover dark:bg-dark-hover text-light-subtle-text dark:text-dark-subtle-text hover:bg-primary/20 dark:hover:bg-primary/20'
                    }`}
                >
                    全部
                </button>
                {fileTypes.map(fileType => (
                    <button
                        key={fileType.label}
                        type="button"
                        aria-label={fileType.label}
                        aria-pressed={activeFilterType === fileType.label}
                        onClick={() => onSelectFileType(activeFilterType === fileType.label ? null : fileType.label)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                            activeFilterType === fileType.label
                                ? 'bg-primary text-white'
                                : 'bg-light-hover dark:bg-dark-hover text-light-subtle-text dark:text-dark-subtle-text hover:bg-primary/20 dark:hover:bg-primary/20'
                        }`}
                    >
                        <span>{fileType.label}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeFilterType === fileType.label ? 'bg-white/20' : 'bg-light-panel dark:bg-dark-panel'}`}>
                            {fileType.count}
                        </span>
                    </button>
                ))}
            </div>
            {hiddenSelectedFileName && (
                <div className="px-3 pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/50 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
                        <span>当前文件 {hiddenSelectedFileName} 未显示在当前筛选结果中。</span>
                        <button
                            type="button"
                            onClick={() => onSelectFileType(null)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-amber-900 transition-colors hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/40"
                        >
                            清除筛选
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const MainContent: React.FC<MainContentProps> = ({ logic, codeViewRef, leftPanelRef }) => {
    const { state, handlers } = logic;
    const { isMobile } = state;
    const fileTreeScrollRef = React.useRef<HTMLElement | null>(null);
    const [filterType, setFilterType] = React.useState<string | null>(null);

    const treeData = state.processedData?.treeData || [];
    const fileTypes = React.useMemo(() => collectFileTypeCounts(treeData), [treeData]);
    const activeFilterType = filterType && fileTypes.some(fileType => fileType.label === filterType) ? filterType : null;
    const filteredNodes = React.useMemo(() => filterTreeByFileType(treeData, activeFilterType), [treeData, activeFilterType]);
    const hiddenSelectedFileName = React.useMemo(() => {
        if (!activeFilterType || !state.selectedFilePath) {
            return null;
        }

        if (getFileTypeLabel(state.selectedFilePath) === activeFilterType) {
            return null;
        }

        return state.selectedFilePath.split('/').pop() ?? state.selectedFilePath;
    }, [activeFilterType, state.selectedFilePath]);

    React.useEffect(() => {
        if (filterType && activeFilterType === null) {
            setFilterType(null);
        }
    }, [activeFilterType, filterType]);

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
            {state.isDragging && (
                <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center bg-white/70 dark:bg-dark-bg/70">
                        <div className="border-4 border-dashed border-primary/60 rounded-2xl p-12 flex flex-col items-center gap-4 max-w-md mx-4">
                            <i className="fa-solid fa-cloud-arrow-up text-5xl text-primary" />
                            <p className="text-xl font-bold text-light-text dark:text-dark-text">拖放文件夹或 .zip 文件</p>
                            <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">支持任意代码项目</p>
                        </div>
                </div>
            )}
            
            {isMobile ? (
                <div className="relative w-full h-full overflow-hidden">
                        {state.mobileView === 'tree' && state.processedData && (
                            <div className="absolute inset-0 h-full bg-light-panel dark:bg-dark-panel flex flex-col">
                                <FileTypeFilterToolbar
                                    fileTypes={fileTypes}
                                    activeFilterType={activeFilterType}
                                    hiddenSelectedFileName={hiddenSelectedFileName}
                                    onSelectFileType={setFilterType}
                                />
                                <div className="flex-1 min-h-0">
                                    <React.Suspense fallback={<SuspenseFallback />}>
                                        <FileTree
                                            nodes={filteredNodes}
                                            treeResetKey={state.lastProcessedFiles}
                                            onFileSelect={handlers.handleFileTreeSelect}
                                            onDeleteFile={handlers.handleDeleteFile}
                                            onCopyPath={handlers.handleCopyPath}
                                            onToggleExclude={handlers.handleToggleExclude}
                                            selectedFilePath={state.selectedFilePath}
                                        />
                                    </React.Suspense>
                                </div>
                            </div>
                        )}
                        {state.mobileView === 'editor' && (
                            <div className="absolute inset-0 h-full flex flex-col">
                                {state.processedData && state.openFiles.length > 0 && (
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
                            </div>
                        )}
                </div>
            ) : state.processedData ? (
                <>
                    <div ref={leftPanelRef} className="relative h-full bg-light-panel dark:bg-dark-panel flex flex-col" style={{ width: `${state.panelWidth}%` }}>
                        <div className="flex-1 min-h-0 flex flex-col">
                            <FileTypeFilterToolbar
                                fileTypes={fileTypes}
                                activeFilterType={activeFilterType}
                                hiddenSelectedFileName={hiddenSelectedFileName}
                                onSelectFileType={setFilterType}
                            />
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
                        {state.openFiles.length > 0 && (
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
                <button onClick={handlers.handleMobileViewToggle} aria-label={state.mobileView === 'tree' ? '切换到代码视图' : '切换到文件树'} className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center z-20">
                    <i className={`fa-solid ${mobileFabIcon()} text-xl`}></i>
                </button>
            )}
        </main>
    );
};

export default React.memo(MainContent);
