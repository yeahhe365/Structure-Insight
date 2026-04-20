
import React from 'react';
import { FileNode, ProcessedFiles, ConfirmationState } from '../types';
import { summarizeAnalysis } from '../services/analysisSummary';
import { buildASCIITree } from '../services/treeFormatter';
import { scanSensitiveContent } from '../services/securityScan';
import { estimateTokens } from '../services/tokenEstimate';
import { countLines } from '../services/textMetrics';

interface InteractionProps {
    processedData: ProcessedFiles | null;
    setProcessedData: React.Dispatch<React.SetStateAction<ProcessedFiles | null>>;
    handleShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    isMobile: boolean;
    setMobileView: (view: 'tree' | 'editor') => void;
    setConfirmation: React.Dispatch<React.SetStateAction<ConfirmationState>>;
    selectedFilePath: string | null;
    setSelectedFilePath: (path: string | null) => void;
    setActiveView: (view: 'structure' | 'code') => void;
    showCharCount: boolean;
    onDeleteConfirmed?: (path: string) => void;
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
    onDeleteConfirmed,
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
                    const nextRemovedPaths = Array.from(new Set([...(prevData.removedPaths ?? []), path]));
                    
                    const filterTreeRecursive = (nodes: FileNode[]): FileNode[] => {
                        return nodes
                            .map(node => {
                                if (node.path === path) return null;
                                if (node.isDirectory) {
                                    const filteredChildren = filterTreeRecursive(node.children);
                                    // Remove empty directories after child deletion
                                    if (filteredChildren.length === 0) return null;
                                    return { ...node, children: filteredChildren };
                                }
                                return node;
                            })
                            .filter((node): node is FileNode => node !== null);
                    };

                    const newTreeData = filterTreeRecursive(JSON.parse(JSON.stringify(prevData.treeData)));
                    const newStructureString = buildASCIITree(newTreeData, prevData.rootName, showCharCount);
                    const { analysisSummary, securityFindings } = summarizeAnalysis(newFileContents);
                    
                    return {
                        ...prevData,
                        fileContents: newFileContents,
                        treeData: newTreeData,
                        structureString: newStructureString,
                        removedPaths: nextRemovedPaths,
                        analysisSummary,
                        securityFindings,
                    };
                });
                onDeleteConfirmed?.(path);
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
        const nextLines = countLines(newContent);
        const nextChars = newContent.length;
        const nextEstimatedTokens = estimateTokens(newContent);
        const nextSecurityFindings = scanSensitiveContent(path, newContent);

        setProcessedData(prev => {
            if (!prev) return null;
            const newFileContents = prev.fileContents.map(f =>
                f.path === path
                    ? {
                        ...f,
                        content: newContent,
                        stats: {
                            lines: nextLines,
                            chars: nextChars,
                            estimatedTokens: nextEstimatedTokens,
                        },
                        securityFindings: nextSecurityFindings,
                    }
                    : f
            );

            const updateTreeRecursive = (nodes: FileNode[]): FileNode[] =>
                nodes.map(node => {
                    if (node.path === path && !node.isDirectory) {
                        return {
                            ...node,
                            status: 'processed',
                            lines: nextLines,
                            chars: nextChars,
                        };
                    }
                    if (node.children.length > 0) {
                        return { ...node, children: updateTreeRecursive(node.children) };
                    }
                    return node;
                });

            const newTreeData = updateTreeRecursive(prev.treeData);
            const newStructureString = buildASCIITree(newTreeData, prev.rootName, showCharCount);
            const { analysisSummary, securityFindings } = summarizeAnalysis(newFileContents);

            return {
                ...prev,
                fileContents: newFileContents,
                treeData: newTreeData,
                structureString: newStructureString,
                analysisSummary,
                securityFindings,
            };
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

    const handleToggleExclude = (path: string) => {
        setProcessedData(prevData => {
            if (!prevData) return null;

            // Update FileContents
            const newFileContents = prevData.fileContents.map(f => 
                f.path === path ? { ...f, excluded: !f.excluded } : f
            );

            // Update TreeData
            const updateNodeRecursive = (nodes: FileNode[]): FileNode[] => {
                return nodes.map(node => {
                    if (node.path === path) {
                         return { ...node, excluded: !node.excluded };
                    }
                    if (node.children) {
                        return { ...node, children: updateNodeRecursive(node.children) };
                    }
                    return node;
                });
            };
            const newTreeData = updateNodeRecursive(prevData.treeData);
            
            // Regenerate structure string
            const newStructureString = buildASCIITree(newTreeData, prevData.rootName, showCharCount);
            const { analysisSummary, securityFindings } = summarizeAnalysis(newFileContents);

            return {
                ...prevData,
                fileContents: newFileContents,
                treeData: newTreeData,
                structureString: newStructureString,
                analysisSummary,
                securityFindings,
            };
        });
    };
    
    const clearInteractionState = () => {
        setEditingPath(null);
        setMarkdownPreviewPaths(new Set());
    };

    const handleCopyPath = (path: string) => {
        navigator.clipboard.writeText(path).then(
            () => handleShowToast('路径已复制'),
            () => handleShowToast('复制失败，请检查剪贴板权限', 'error')
        );
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
        handleToggleExclude,
    };
};
