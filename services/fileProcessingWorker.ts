import { processFiles, type ProcessFilesOptions } from './fileProcessor';
import type { WorkerFilePayload } from './fileProcessingClient';

interface FileProcessingWorkerRequest {
    files: WorkerFilePayload[];
    extractContent: boolean;
    maxCharsThreshold: number;
    options: ProcessFilesOptions;
}

self.onmessage = async (event: MessageEvent<FileProcessingWorkerRequest>) => {
    const controller = new AbortController();
    const { files: workerFiles, extractContent, maxCharsThreshold, options } = event.data;
    const files = workerFiles.map(({ file, relativePath }) => {
        Object.defineProperty(file, 'webkitRelativePath', {
            configurable: true,
            value: relativePath,
        });
        return file;
    });

    try {
        const result = await processFiles(
            files,
            (message) => {
                self.postMessage({
                    type: 'progress',
                    message,
                });
            },
            extractContent,
            maxCharsThreshold,
            controller.signal,
            options
        );

        self.postMessage({
            type: 'result',
            result,
        });
    } catch (error) {
        if (error instanceof DOMException) {
            self.postMessage({
                type: 'error',
                name: error.name,
                message: error.message,
            });
            return;
        }

        self.postMessage({
            type: 'error',
            message: error instanceof Error ? error.message : 'File processing worker failed',
        });
    }
};

export {};
