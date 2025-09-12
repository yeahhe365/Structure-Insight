import React from 'react';
import { processDroppedItems, processFiles } from '../services/fileProcessor';
import { ProcessedFiles } from '../types';

interface FileProcessingProps {
    extractContent: boolean;
    setIsLoading: (loading: boolean) => void;
    setProgressMessage: (message: string) => void;
    setMobileView: (view: 'tree' | 'editor') => void;
    handleShowToast: (message: string) => void;
    isMobile: boolean;
}

export const useFileProcessing = ({
    extractContent,
    setIsLoading,
    setProgressMessage,
    setMobileView,
    handleShowToast,
    isMobile,
}: FileProcessingProps) => {
    const [processedData, setProcessedData] = React.useState<ProcessedFiles | null>(null);
    const [lastProcessedFiles, setLastProcessedFiles] = React.useState<File[] | null>(null);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const handleProcessing = async (files: File[], isRefresh = false) => {
        if (files.length === 0) return;
        
        if (!isRefresh) {
            setProcessedData(null);
            setLastProcessedFiles(null);
        }

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setIsLoading(true);
        try {
            const data = await processFiles(files, (msg) => setProgressMessage(msg), extractContent, signal);
            setProcessedData(data);
            setLastProcessedFiles(files);
            if (isMobile) setMobileView('editor');
        } catch (error: any) {
            if (error.name === 'AbortError') {
                setProgressMessage("处理已取消。");
            } else {
                console.error("Error processing files:", error);
                handleShowToast("处理文件时发生错误。");
            }
        } finally {
            setIsLoading(false);
            setTimeout(() => setProgressMessage(""), 2000);
            abortControllerRef.current = null;
        }
    };

    const handleFileSelect = () => {
        const input = document.createElement('input');
        input.type = 'file';
        (input as any).webkitdirectory = true;
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
        
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        setIsLoading(true);
        try {
            const files = await processDroppedItems(e.dataTransfer.items, (msg) => setProgressMessage(msg), signal);
            await handleProcessing(files);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                 console.error("Error processing dropped items:", error);
                 handleShowToast("读取拖放项目时出错。");
            }
        } finally {
            setIsLoading(false);
            setProgressMessage("");
        }
    };

    const handleRefresh = (processFn: (files: File[], isRefresh: boolean) => Promise<void>) => {
        if (lastProcessedFiles) {
            processFn(lastProcessedFiles, true);
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
        setLastProcessedFiles,
        handleProcessing,
        handleFileSelect,
        handleDrop,
        handleRefresh,
        handleCancel,
        abortControllerRef,
    };
};