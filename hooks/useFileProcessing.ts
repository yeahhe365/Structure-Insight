
import React from 'react';
import { processDroppedItems, processFiles } from '../services/fileProcessor';
import { ProcessedFiles } from '../types';

interface FileProcessingProps {
    extractContent: boolean;
    maxCharsThreshold: number;
    setIsLoading: (loading: boolean) => void;
    setProgressMessage: (message: string) => void;
    setMobileView: (view: 'tree' | 'editor') => void;
    handleShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    isMobile: boolean;
    setSelectedFilePath: (path: string | null) => void;
    setActiveView: (view: 'structure' | 'code') => void;
}

export const useFileProcessing = ({
    extractContent,
    maxCharsThreshold,
    setIsLoading,
    setProgressMessage,
    setMobileView,
    handleShowToast,
    isMobile,
    setSelectedFilePath,
    setActiveView,
}: FileProcessingProps) => {
    const [processedData, setProcessedData] = React.useState<ProcessedFiles | null>(null);
    const [lastProcessedFiles, setLastProcessedFiles] = React.useState<File[] | null>(null);
    const [lastEmptyDirectoryPaths, setLastEmptyDirectoryPaths] = React.useState<string[]>([]);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const handleProcessing = async (files: File[], isRefresh = false, controller?: AbortController, emptyDirectoryPaths: string[] = []) => {
        if (files.length === 0) {
            if (controller && abortControllerRef.current === controller) {
                abortControllerRef.current = null;
            }
            return;
        }
        
        if (!isRefresh) {
            setProcessedData(null);
            setLastProcessedFiles(null);
            setLastEmptyDirectoryPaths([]);
            setSelectedFilePath(null);
        }

        const activeController = controller ?? new AbortController();
        abortControllerRef.current = activeController;
        const signal = activeController.signal;

        setIsLoading(true);
        try {
            const data = await processFiles(
                files,
                (msg) => setProgressMessage(msg),
                extractContent,
                maxCharsThreshold,
                signal,
                {
                    useDefaultIgnorePatterns: true,
                    useGitignorePatterns: true,
                    includeEmptyDirectories: true,
                    emptyDirectoryPaths,
                }
            );
            setProcessedData(data);
            setLastProcessedFiles(files);
            setLastEmptyDirectoryPaths(emptyDirectoryPaths);
            if (isMobile) setMobileView('editor');
            setActiveView('structure');
        } catch (error: any) {
            if (error.name === 'AbortError') {
                setProgressMessage("处理已取消。");
            } else {
                console.error("Error processing files:", error);
                handleShowToast("处理文件时发生错误。", 'error');
            }
        } finally {
            setIsLoading(false);
            setTimeout(() => setProgressMessage(""), 2000);
            if (abortControllerRef.current === activeController) {
                abortControllerRef.current = null;
            }
        }
    };

    const handleFileSelect = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        input.onchange = (e: any) => {
            if (e.target.files) {
                handleProcessing(Array.from(e.target.files));
            }
        };
        input.click();
    };

    const handleDrop = async (e: React.DragEvent, isLoading: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;

        const dropController = new AbortController();
        abortControllerRef.current = dropController;

        try {
            const dropped = await processDroppedItems(e.dataTransfer.items, (msg) => setProgressMessage(msg), dropController.signal);
            await handleProcessing(dropped.files, false, dropController, dropped.emptyDirectoryPaths);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                 console.error("Error processing dropped items:", error);
                 handleShowToast("读取拖放项目时出错。", 'error');
            }
        } finally {
            if (abortControllerRef.current === dropController) {
                abortControllerRef.current = null;
            }
        }
    };

    const handleRefresh = (processFn: (files: File[], isRefresh: boolean, controller?: AbortController, emptyDirectoryPaths?: string[]) => Promise<void>) => {
        if (lastProcessedFiles) {
            processFn(lastProcessedFiles, true, undefined, lastEmptyDirectoryPaths);
        }
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    return {
        processedData,
        setProcessedData,
        lastProcessedFiles,
        lastEmptyDirectoryPaths,
        setLastProcessedFiles,
        handleProcessing,
        handleFileSelect,
        handleDrop,
        handleRefresh,
        handleCancel,
        abortControllerRef,
    };
};
