import { beforeEach, describe, expect, it, vi } from 'vitest';

class MockWorker {
    static instances: MockWorker[] = [];

    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    constructor() {
        MockWorker.instances.push(this);
    }

    postMessage = vi.fn(() => {
        setTimeout(() => {
            this.onmessage?.({
                data: {
                    type: 'progress',
                    message: 'processing...',
                },
            } as MessageEvent);
            this.onmessage?.({
                data: {
                    type: 'result',
                    result: {
                        treeData: [],
                        fileContents: [],
                        structureString: 'demo\n',
                        rootName: 'demo',
                        removedPaths: [],
                        emptyDirectoryPaths: [],
                    },
                },
            } as MessageEvent);
        }, 0);
    });
    terminate = vi.fn();
}

describe('createFileProcessingTask', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        MockWorker.instances = [];
        Object.defineProperty(globalThis, 'Worker', {
            configurable: true,
            writable: true,
            value: MockWorker,
        });
    });

    it('streams progress and resolves worker results', async () => {
        const { createFileProcessingTask } = await import('./fileProcessingClient');
        const onProgress = vi.fn();

        const task = createFileProcessingTask({
            files: [new File(['const a = 1;\n'], 'a.ts', { type: 'text/plain' })],
            extractContent: true,
            maxCharsThreshold: 0,
            options: {
                useDefaultIgnorePatterns: true,
                useGitignorePatterns: true,
                includeEmptyDirectories: true,
                emptyDirectoryPaths: [],
            },
            onProgress,
        });

        await expect(task.promise).resolves.toMatchObject({
            rootName: 'demo',
            structureString: 'demo\n',
        });
        expect(onProgress).toHaveBeenCalledWith('processing...');
    });

    it('sends explicit relative path metadata to the worker for synthetic paths', async () => {
        const { createFileProcessingTask } = await import('./fileProcessingClient');

        const file = new File(['const a = 1;\n'], 'a.ts', { type: 'text/plain' });
        Object.defineProperty(file, 'webkitRelativePath', {
            configurable: true,
            value: 'demo/src/a.ts',
        });

        createFileProcessingTask({
            files: [file],
            extractContent: true,
            maxCharsThreshold: 0,
            options: {
                useDefaultIgnorePatterns: true,
                useGitignorePatterns: true,
                includeEmptyDirectories: true,
                emptyDirectoryPaths: [],
            },
            onProgress: vi.fn(),
        });

        const worker = MockWorker.instances[0];
        expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({
            files: [
                expect.objectContaining({
                    file,
                    relativePath: 'demo/src/a.ts',
                }),
            ],
        }));
    });

    it('rejects with an abort error when cancelled', async () => {
        class HangingWorker extends MockWorker {
            override postMessage = vi.fn();
        }

        Object.defineProperty(globalThis, 'Worker', {
            configurable: true,
            writable: true,
            value: HangingWorker,
        });

        const { createFileProcessingTask } = await import('./fileProcessingClient');

        const task = createFileProcessingTask({
            files: [new File(['const a = 1;\n'], 'a.ts', { type: 'text/plain' })],
            extractContent: true,
            maxCharsThreshold: 0,
            options: {
                useDefaultIgnorePatterns: true,
                useGitignorePatterns: true,
                includeEmptyDirectories: true,
                emptyDirectoryPaths: [],
            },
            onProgress: vi.fn(),
        });

        task.cancel();

        await expect(task.promise).rejects.toThrow('Aborted');
    });
});
