
import React from 'react';
import { processDroppedItems } from '../services/droppedItems';
import { createFileProcessingTask } from '../services/fileProcessingClient';
import { readDirectoryHandle } from '../services/directoryHandleReader';
import { deleteRecentProjectHandle, loadRecentProjectHandle, saveRecentProjectHandle } from '../services/recentProjectHandles';
import { RecentProject, ProcessedFiles } from '../types';

interface FileProcessingProps {
    extractContent: boolean;
    maxCharsThreshold: number;
    useDefaultIgnorePatterns: boolean;
    useGitignorePatterns: boolean;
    includePatterns: string;
    ignorePatterns: string;
    includeEmptyDirectories: boolean;
    setIsLoading: (loading: boolean) => void;
    setProgressMessage: (message: string) => void;
    setMobileView: (view: 'tree' | 'editor') => void;
    handleShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    isMobile: boolean;
    setSelectedFilePath: (path: string | null) => void;
    setActiveView: (view: 'structure' | 'code') => void;
    recentProjects: RecentProject[];
    onRememberProject: (project: RecentProject) => string[] | void;
    onForgetProject: (projectId: string) => void;
}

function parsePatternList(value: string): string[] {
    return value
        .split(',')
        .map(pattern => pattern.trim())
        .filter(Boolean);
}

export const useFileProcessing = ({
    extractContent,
    maxCharsThreshold,
    useDefaultIgnorePatterns,
    useGitignorePatterns,
    includePatterns,
    ignorePatterns,
    includeEmptyDirectories,
    setIsLoading,
    setProgressMessage,
    setMobileView,
    handleShowToast,
    isMobile,
    setSelectedFilePath,
    setActiveView,
    recentProjects,
    onRememberProject,
    onForgetProject,
}: FileProcessingProps) => {
    const [processedData, setProcessedData] = React.useState<ProcessedFiles | null>(null);
    const [lastProcessedFiles, setLastProcessedFiles] = React.useState<File[] | null>(null);
    const [lastEmptyDirectoryPaths, setLastEmptyDirectoryPaths] = React.useState<string[]>([]);
    const abortControllerRef = React.useRef<{ abort: () => void } | null>(null);
    const currentDirectoryHandleRef = React.useRef<FileSystemDirectoryHandle | null>(null);

    const applyRecentProjectRecord = React.useCallback(async (project: RecentProject, directoryHandle?: FileSystemDirectoryHandle) => {
        const evictedProjectIds = onRememberProject(project) ?? [];
        await Promise.all(evictedProjectIds.map(projectId => deleteRecentProjectHandle(projectId).catch(() => {})));

        if (directoryHandle) {
            await saveRecentProjectHandle(project.id, directoryHandle);
        }
    }, [onRememberProject]);

    const resolveExistingProjectId = React.useCallback(async (directoryHandle: FileSystemDirectoryHandle) => {
        if (typeof directoryHandle.isSameEntry !== 'function') {
            return null;
        }

        for (const project of recentProjects) {
            const storedHandle = await loadRecentProjectHandle(project.id);
            if (!storedHandle) {
                onForgetProject(project.id);
                continue;
            }

            try {
                if (await directoryHandle.isSameEntry(storedHandle)) {
                    return project.id;
                }
            } catch {
                await deleteRecentProjectHandle(project.id).catch(() => {});
                onForgetProject(project.id);
            }
        }

        return null;
    }, [onForgetProject, recentProjects]);

    const handleProcessing = async (files: File[], isRefresh = false, emptyDirectoryPaths: string[] = []) => {
        if (files.length === 0 && emptyDirectoryPaths.length === 0) {
            return;
        }
        
        if (!isRefresh) {
            setProcessedData(null);
            setLastProcessedFiles(null);
            setLastEmptyDirectoryPaths([]);
            setSelectedFilePath(null);
        }

        const task = createFileProcessingTask({
            files,
            onProgress: (msg) => setProgressMessage(msg),
            extractContent,
            maxCharsThreshold,
            options: {
                useDefaultIgnorePatterns,
                useGitignorePatterns,
                includePatterns: parsePatternList(includePatterns),
                ignorePatterns: parsePatternList(ignorePatterns),
                includeEmptyDirectories,
                emptyDirectoryPaths,
            },
        });
        abortControllerRef.current = {
            abort: task.cancel,
        };

        setIsLoading(true);
        try {
            const data = await task.promise;
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
            if (abortControllerRef.current?.abort === task.cancel) {
                abortControllerRef.current = null;
            }
        }
    };

    const handleFileSelect = async () => {
        if (window.showDirectoryPicker) {
            try {
                const directoryHandle = await window.showDirectoryPicker({ mode: 'read' });
                const projectId = (await resolveExistingProjectId(directoryHandle)) ?? crypto.randomUUID();
                const dropped = await readDirectoryHandle(directoryHandle, {
                    skipDefaultIgnoredDirectories: useDefaultIgnorePatterns,
                });

                currentDirectoryHandleRef.current = directoryHandle;
                await applyRecentProjectRecord({
                    id: projectId,
                    name: directoryHandle.name,
                    openedAt: Date.now(),
                }, directoryHandle);
                await handleProcessing(dropped.files, false, dropped.emptyDirectoryPaths);
                return;
            } catch (error: any) {
                if (error?.name !== 'AbortError' && error?.name !== 'NotAllowedError') {
                    console.error('Error opening directory handle:', error);
                    handleShowToast('读取文件夹时发生错误。', 'error');
                }
                return;
            }
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        input.onchange = (e: any) => {
            if (e.target.files) {
                currentDirectoryHandleRef.current = null;
                handleProcessing(Array.from(e.target.files));
            }
        };
        input.click();
    };

    const handleRecentProjectSelect = async (project: RecentProject) => {
        try {
            const directoryHandle = await loadRecentProjectHandle(project.id);
            if (!directoryHandle) {
                onForgetProject(project.id);
                handleShowToast('该历史记录已失效，请重新选择文件夹。', 'info');
                return;
            }

            const queryPermission = await directoryHandle.queryPermission({ mode: 'read' });
            const permission = queryPermission === 'granted'
                ? queryPermission
                : await directoryHandle.requestPermission({ mode: 'read' });

            if (permission !== 'granted') {
                handleShowToast('需要读取权限才能重新打开该项目。', 'info');
                return;
            }

            const dropped = await readDirectoryHandle(directoryHandle, {
                skipDefaultIgnoredDirectories: useDefaultIgnorePatterns,
            });
            currentDirectoryHandleRef.current = directoryHandle;
            await applyRecentProjectRecord({
                ...project,
                openedAt: Date.now(),
            }, directoryHandle);

            await handleProcessing(dropped.files, false, dropped.emptyDirectoryPaths);
        } catch (error) {
            console.error('Error reopening recent project:', error);
            await deleteRecentProjectHandle(project.id).catch(() => {});
            onForgetProject(project.id);
            handleShowToast('重新打开历史项目失败，请重新选择文件夹。', 'error');
        }
    };

    const handleDrop = async (e: React.DragEvent, isLoading: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;

        const dropController = new AbortController();
        const dropAbort = () => dropController.abort();
        abortControllerRef.current = {
            abort: dropAbort,
        };

        try {
            currentDirectoryHandleRef.current = null;
            const dropped = await processDroppedItems(
                e.dataTransfer.items,
                (msg) => setProgressMessage(msg),
                dropController.signal,
                {
                    skipDefaultIgnoredDirectories: useDefaultIgnorePatterns,
                }
            );
            await handleProcessing(dropped.files, false, dropped.emptyDirectoryPaths);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                 console.error("Error processing dropped items:", error);
                 handleShowToast("读取拖放项目时出错。", 'error');
            }
        } finally {
            if (abortControllerRef.current?.abort === dropAbort) {
                abortControllerRef.current = null;
            }
        }
    };

    const handleRefresh = async () => {
        if (currentDirectoryHandleRef.current) {
            const dropped = await readDirectoryHandle(currentDirectoryHandleRef.current, {
                skipDefaultIgnoredDirectories: useDefaultIgnorePatterns,
            });
            await handleProcessing(dropped.files, true, dropped.emptyDirectoryPaths);
            return;
        }

        if (lastProcessedFiles) {
            await handleProcessing(lastProcessedFiles, true, lastEmptyDirectoryPaths);
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
        handleRecentProjectSelect,
        handleDrop,
        handleRefresh,
        handleCancel,
        abortControllerRef,
    };
};
