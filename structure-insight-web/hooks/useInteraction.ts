import React from 'react';
import { FileNode, SearchOptions, SearchResult, ProcessedFiles } from '../types';
import { buildASCIITree } from '../services/fileProcessor';
import { TranslationKey } from './useLocalization';

interface InteractionProps {
    processedData: ProcessedFiles | null;
    setProcessedData: React.Dispatch<React.SetStateAction<ProcessedFiles | null>>;
    handleShowToast: (message: string) => void;
    isMobile: boolean;
    setMobileView: (view: 'tree' | 'editor' | 'chat') => void;
    codeViewRef: React.RefObject<HTMLDivElement>;
    t: (key: TranslationKey, options?: { [key: string]: string | number }) => string;
}

export const useInteraction = ({
    processedData,
    setProcessedData,
    handleShowToast,
    isMobile,
    setMobileView,
    codeViewRef,
    t
}: InteractionProps) => {
    const [editingPath, setEditingPath] = React.useState<string | null>(null);
    const [markdownPreviewPaths, setMarkdownPreviewPaths] = React.useState(new Set<string>());
    const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
    const [currentSearchResultIndex, setCurrentSearchResultIndex] = React.useState<number | null>(null);

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
            const rootName = newTreeData.length > 0 && newTreeData[0].isDirectory ? newTreeData[0].name : "Project";
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

    const navigateToSearchResult = (index: number | null, results: SearchResult[] = searchResults) => {
        if (index === null || index < 0 || index >= results.length) {
            setCurrentSearchResultIndex(null);
            return;
        }
        setCurrentSearchResultIndex(index);
        const result = results[index];
        if (isMobile) setMobileView('editor');
        setTimeout(() => {
            const fileCard = document.getElementById(`file-path-${result.path}`);
            const resultElId = `search-result-${result.path}-${results.slice(0, index + 1).filter(r => r.path === result.path).length - 1}`
            const resultEl = document.getElementById(resultElId);
            
            if (fileCard && codeViewRef.current) {
                let targetScroll = fileCard.offsetTop - codeViewRef.current.offsetTop - 20;
                if (resultEl) targetScroll += resultEl.offsetTop - (codeViewRef.current.clientHeight / 2);
                codeViewRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        }, isMobile ? 100 : 0);
    };
    
    const handleSearch = (query: string, options: SearchOptions) => {
        if (!processedData || !query) {
            setSearchResults([]);
            setCurrentSearchResultIndex(null);
            return;
        }
        const results: SearchResult[] = [];
        try {
            const flags = options.caseSensitive ? 'g' : 'gi';
            const pattern = options.useRegex ? query : query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(options.wholeWord ? `\\b${pattern}\\b` : pattern, flags);
            
            processedData.fileContents.forEach(file => {
                let match;
                while ((match = regex.exec(file.content)) !== null) {
                    const lineStart = file.content.lastIndexOf('\n', match.index) + 1;
                    const lineEnd = file.content.indexOf('\n', match.index);
                    results.push({
                        path: file.path,
                        start: match.index,
                        end: match.index + match[0].length,
                        line: file.content.substring(0, match.index).split('\n').length,
                        preview: file.content.substring(lineStart, lineEnd > -1 ? lineEnd : file.content.length).trim(),
                        matchText: match[0],
                    });
                     if (match[0].length === 0) regex.lastIndex++;
                }
            });
            setSearchResults(results);
            navigateToSearchResult(results.length > 0 ? 0 : null, results);
        } catch (e) {
            handleShowToast(t("invalid_regex"));
            setSearchResults([]);
        }
    };
    
    const handleSearchNavigate = (direction: 'next' | 'prev') => {
        if (searchResults.length === 0 || currentSearchResultIndex === null) return;
        const nextIndex = direction === 'next' ? (currentSearchResultIndex + 1) % searchResults.length : (currentSearchResultIndex - 1 + searchResults.length) % searchResults.length;
        navigateToSearchResult(nextIndex);
    };
    
    return {
        editingPath, setEditingPath,
        markdownPreviewPaths, setMarkdownPreviewPaths,
        searchResults, setSearchResults,
        currentSearchResultIndex, setCurrentSearchResultIndex,
        handleDeleteFile,
        handleFileTreeSelect,
        handleSaveEdit,
        handleToggleMarkdownPreview,
        handleSearch,
        handleSearchNavigate,
        navigateToSearchResult
    };
};