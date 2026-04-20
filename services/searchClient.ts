import type { FileContent, SearchOptions, SearchResultItem } from '../types';

interface SearchTaskParams {
    files: FileContent[];
    query: string;
    options: SearchOptions;
}

export interface SearchTask {
    promise: Promise<SearchResultItem[]>;
    cancel: () => void;
}

const USE_MAIN_THREAD_FALLBACK = import.meta.env.MODE === 'test' && typeof Worker === 'undefined';

let requestCounter = 0;

function createAbortError(): Error {
    return new Error('Search aborted');
}

export function createSearchTask(params: SearchTaskParams): SearchTask {
    if (USE_MAIN_THREAD_FALLBACK) {
        const controller = new AbortController();
        return {
            promise: import('./searchEngine').then(({ searchProjectFiles }) =>
                searchProjectFiles({
                    ...params,
                    signal: controller.signal,
                })
            ),
            cancel: () => controller.abort(),
        };
    }

    if (typeof Worker === 'undefined') {
        return {
            promise: Promise.reject(new Error('Search workers are unavailable')),
            cancel: () => {},
        };
    }

    const requestId = ++requestCounter;
    const worker = new Worker(new URL('./searchWorker.ts', import.meta.url), { type: 'module' });
    let settled = false;
    let rejectPromise: ((reason?: unknown) => void) | null = null;

    const cleanup = () => {
        worker.onmessage = null;
        worker.onerror = null;
        worker.terminate();
    };

    const promise = new Promise<SearchResultItem[]>((resolve, reject) => {
        rejectPromise = reject;

        worker.onmessage = (event: MessageEvent) => {
            const data = event.data as
                | { type: 'result'; requestId: number; results: SearchResultItem[] }
                | { type: 'error'; requestId: number; message: string };

            if (settled || data.requestId !== requestId) {
                return;
            }

            settled = true;
            cleanup();

            if (data.type === 'result') {
                resolve(data.results);
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
            reject(new Error('Search worker failed'));
        };
    });

    worker.postMessage({
        requestId,
        files: params.files,
        query: params.query,
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
