
import React from 'react';
import { FileNode, ProcessedFiles, ConfirmationState } from '../types';
import { buildASCIITree } from '../services/fileProcessor';

interface InteractionProps {
    processedData: ProcessedFiles | null;
    setProcessedData: React.Dispatch<React.SetStateAction<ProcessedFiles | null>>;
    handleShowToast: (message: string) => void;
    isMobile: boolean;
    setMobileView: (view: 'tree' | 'editor') => void;
    setConfirmation: React.Dispatch<React.SetStateAction<ConfirmationState>>;
    selectedFilePath: string | null;
    setSelectedFilePath: (path: string | null) => void;
    setActiveView: (view: 'structure' | 'code') => void;
    showCharCount: boolean;
}

export const useInteraction = ({
    processedData,
    setProcessedData,
    handleShowToast,
    isMobile,
    setMobileView,
    setConfirmation,
    selectedFilePath,
    setSelectedFilePath,
    setActiveView,
    showCharCount,
}: InteractionProps) => {
    const [editingPath, setEditingPath] = React.useState<string | null>(null);
    const [markdownPreviewPaths, setMarkdownPreviewPaths] = React.useState(new Set<string>());

    const handleDeleteFile = (path: string) => {
        setConfirmation({
            isOpen: true,
            title: '删除文件',
            message: `您确定要从视图中删除 ${path} 吗？此操作无法撤销。`,
            onConfirm: () => {
                 if (path === selectedFilePath) {
                    setSelectedFilePath(null);
                 }
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
                    const newStructureString = buildASCIITree(newTreeData, prevData.rootName, showCharCount);
                    
                    return { ...prevData, fileContents: newFileContents, treeData: newTreeData, structureString: newStructureString };
                });
                handleShowToast(`${path} 已删除。`);
            }
        });
    };
    
    const handleFileTreeSelect = (path: string) => {
        if (isMobile) setMobileView('editor');
        setSelectedFilePath(path);
        setActiveView('code');
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
    
    const clearInteractionState = () => {
        setEditingPath(null);
        setMarkdownPreviewPaths(new Set());
    };

    const handleCopyPath = (path: string) => {
        navigator.clipboard.writeText(path);
        handleShowToast('路径已复制');
    };
    
    return {
        editingPath, setEditingPath,
        markdownPreviewPaths, setMarkdownPreviewPaths,
        handleDeleteFile,
        handleFileTreeSelect,
        handleSaveEdit,
        handleToggleMarkdownPreview,
        clearInteractionState,
        handleCopyPath,
    };
};
