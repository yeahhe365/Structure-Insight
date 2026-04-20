import { searchProjectFiles } from './searchEngine';
import type { FileContent, SearchOptions } from '../types';

interface SearchWorkerRequest {
    requestId: number;
    files: FileContent[];
    query: string;
    options: SearchOptions;
}

self.onmessage = async (event: MessageEvent<SearchWorkerRequest>) => {
    const { requestId, files, query, options } = event.data;

    try {
        const results = await searchProjectFiles({
            files,
            query,
            options,
        });

        self.postMessage({
            type: 'result',
            requestId,
            results,
        });
    } catch (error) {
        self.postMessage({
            type: 'error',
            requestId,
            message: error instanceof Error ? error.message : 'Search worker failed',
        });
    }
};

export {};
