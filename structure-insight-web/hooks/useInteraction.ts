import React from 'react';
import { FileNode, ProcessedFiles } from '../types';
import { buildASCIITree } from '../services/fileProcessor';

interface InteractionProps {
    processedData: ProcessedFiles | null;
    setProcessedData: React.Dispatch<React.SetStateAction<ProcessedFiles | null>>;
    handleShowToast: (message: string) => void;
    isMobile: boolean;
    setMobileView: (view: 'tree' | 'editor') => void;
    codeViewRef: React.RefObject<HTMLDivElement>;
}

export const useInteraction = ({
    processedData,
    setProcessedData,
    handleShowToast,
    isMobile,
    setMobileView,
    codeViewRef,
}: InteractionProps) => {
    const [editingPath, setEditingPath] = React.useState<string | null>(null);
    const [markdownPreviewPaths, setMarkdownPreviewPaths] = React.useState(new Set<string>());

    const handleDeleteFile = (path: string) => {
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
                    }).filter(node => node.isDirectory ? node.children.length > 0 : true);
            };
            const newTreeData = filterTreeRecursive(JSON.parse(JSON.stringify(prevData.treeData)));
            const rootName = newTreeData.length > 0 && newTreeData[0].isDirectory ? newTreeData[0].name : "项目";
            const newStructureString = buildASCIITree(newTreeData, rootName);
            return { fileContents: newFileContents, treeData: newTreeData, structureString: newStructureString };
        });
    };
    
    const handleFileTreeSelect = (path: string) => {
        if (isMobile) setMobileView('editor');
        setTimeout(() => {
            const el = document.getElementById(`file-path-${path}`);
            if (el && codeViewRef.current) {
                const targetScroll = el.offsetTop - codeViewRef.current.offsetTop - 20;
                codeViewRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
                el.classList.add('bg-primary/10', 'dark:bg-primary/20');
                setTimeout(() => el.classList.remove('bg-primary/10', 'dark:bg-primary/20'), 2000);
            }
        }, isMobile ? 100 : 0);
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
    
    return {
        editingPath, setEditingPath,
        markdownPreviewPaths, setMarkdownPreviewPaths,
        handleDeleteFile,
        handleFileTreeSelect,
        handleSaveEdit,
        handleToggleMarkdownPreview,
    };
};