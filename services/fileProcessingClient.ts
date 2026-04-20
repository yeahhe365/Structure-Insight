import type { ProcessedFiles } from '../types';
import type { ProcessFilesOptions } from './fileProcessor';

interface FileProcessingTaskParams {
    files: File[];
    extractContent: boolean;
    maxCharsThreshold: number;
    options: ProcessFilesOptions;
    onProgress: (message: string) => void;
}

export interface FileProcessingTask {
    promise: Promise<ProcessedFiles>;
    cancel: () => void;
}

export interface WorkerFilePayload {
    file: File;
    relativePath: string;
}

const USE_MAIN_THREAD_FALLBACK = import.meta.env.MODE === 'test' && typeof Worker === 'undefined';

function createAbortError(): DOMException {
    return new DOMException('Aborted', 'AbortError');
}

function getRelativePath(file: File): string {
    return file.webkitRelativePath || file.name;
}

function serializeFilesForWorker(files: File[]): WorkerFilePayload[] {
    return files.map(file => ({
        file,
        relativePath: getRelativePath(file),
    }));
}

export function createFileProcessingTask(params: FileProcessingTaskParams): FileProcessingTask {
    if (USE_MAIN_THREAD_FALLBACK) {
        const controller = new AbortController();
        return {
            promise: import('./fileProcessor').then(({ processFiles }) =>
                processFiles(
                    params.files,
                    params.onProgress,
                    params.extractContent,
                    params.maxCharsThreshold,
                    controller.signal,
                    params.options
                )
            ),
            cancel: () => controller.abort(),
        };
    }

    if (typeof Worker === 'undefined') {
        return {
            promise: Promise.reject(new Error('File processing workers are unavailable')),
            cancel: () => {},
        };
    }

    const worker = new Worker(new URL('./fileProcessingWorker.ts', import.meta.url), { type: 'module' });
    let settled = false;
    let rejectPromise: ((reason?: unknown) => void) | null = null;

    const cleanup = () => {
        worker.onmessage = null;
        worker.onerror = null;
        worker.terminate();
    };

    const promise = new Promise<ProcessedFiles>((resolve, reject) => {
        rejectPromise = reject;

        worker.onmessage = (event: MessageEvent) => {
            const data = event.data as
                | { type: 'progress'; message: string }
                | { type: 'result'; result: ProcessedFiles }
                | { type: 'error'; message: string; name?: string };

            if (settled) {
                return;
            }

            if (data.type === 'progress') {
                params.onProgress(data.message);
                return;
            }

            settled = true;
            cleanup();

            if (data.type === 'result') {
                resolve(data.result);
                return;
            }

            if (data.name === 'AbortError') {
                reject(createAbortError());
                return;
            }

            reject(new Error(data.message));
        };

        worker.onerror = () => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            reject(new Error('File processing worker failed'));
        };
    });

    worker.postMessage({
        files: serializeFilesForWorker(params.files),
        extractContent: params.extractContent,
        maxCharsThreshold: params.maxCharsThreshold,
        options: params.options,
    });

    return {
        promise,
        cancel: () => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            rejectPromise?.(createAbortError());
        },
    };
}
