import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchOptions } from '../types';

const SEARCH_OPTIONS: SearchOptions = {
    caseSensitive: false,
    useRegex: false,
    wholeWord: false,
};

class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    postMessage = vi.fn((payload: unknown) => {
        setTimeout(() => {
            this.onmessage?.({
                data: {
                    type: 'result',
                    requestId: (payload as { requestId: number }).requestId,
                    results: [
                        {
                            filePath: 'src/a.ts',
                            startIndex: 0,
                            length: 6,
                            content: 'needle',
                            line: 1,
                            indexInFile: 0,
                        },
                    ],
                },
            } as MessageEvent);
        }, 0);
    });
    terminate = vi.fn();
}

describe('createSearchTask', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        Object.defineProperty(globalThis, 'Worker', {
            configurable: true,
            writable: true,
            value: MockWorker,
        });
    });

    it('resolves worker results for a search request', async () => {
        const { createSearchTask } = await import('./searchClient');
        const task = createSearchTask({
            files: [
                {
                    path: 'src/a.ts',
                    content: 'needle',
                    language: 'typescript',
                    stats: { lines: 1, chars: 6, estimatedTokens: 1 },
                },
            ],
            query: 'needle',
            options: SEARCH_OPTIONS,
        });

        await expect(task.promise).resolves.toEqual([
            expect.objectContaining({ filePath: 'src/a.ts' }),
        ]);
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

        const { createSearchTask } = await import('./searchClient');

        const task = createSearchTask({
            files: [
                {
                    path: 'src/a.ts',
                    content: 'needle',
                    language: 'typescript',
                    stats: { lines: 1, chars: 6, estimatedTokens: 1 },
                },
            ],
            query: 'needle',
            options: SEARCH_OPTIONS,
        });

        task.cancel();

        await expect(task.promise).rejects.toThrow('Search aborted');
    });
});
