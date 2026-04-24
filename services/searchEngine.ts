import type { FileContent, SearchOptions, SearchResultItem } from '../types';
import { MAIN_THREAD_YIELD_INTERVAL_MS, SEARCH_MATCH_BATCH_SIZE } from './constants';
import { yieldToMainThread, getCurrentTimeMs } from './scheduler';
import { buildSearchRegex } from './searchRegex';
import { buildLineStartIndices, findLineNumber } from './textMetrics';

interface CachedLineStarts {
    content: string;
    lineStarts: number[];
}

export interface SearchProjectFilesParams {
    files: FileContent[];
    query: string;
    options: SearchOptions;
    signal?: AbortSignal;
    lineStartCache?: Map<string, CachedLineStarts>;
}

function getCachedLineStarts(file: FileContent, cache?: Map<string, CachedLineStarts>): number[] {
    if (!cache) {
        return buildLineStartIndices(file.content);
    }

    const cached = cache.get(file.path);
    if (cached && cached.content === file.content) {
        return cached.lineStarts;
    }

    const lineStarts = buildLineStartIndices(file.content);
    cache.set(file.path, {
        content: file.content,
        lineStarts,
    });
    return lineStarts;
}

function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new Error('Search aborted');
    }
}

export async function searchProjectFiles({
    files,
    query,
    options,
    signal,
    lineStartCache,
}: SearchProjectFilesParams): Promise<SearchResultItem[]> {
    throwIfAborted(signal);

    const regex = buildSearchRegex(query, options);
    if (!regex) {
        return [];
    }

    const results: SearchResultItem[] = [];
    let lastYieldAt = getCurrentTimeMs();

    for (const file of files) {
        throwIfAborted(signal);

        const fileRegex = new RegExp(regex.source, regex.flags);
        const lineStarts = getCachedLineStarts(file, lineStartCache);
        let indexInFile = 0;
        let match: RegExpExecArray | null;

        while ((match = fileRegex.exec(file.content)) !== null) {
            throwIfAborted(signal);

            const startIndex = match.index ?? 0;
            results.push({
                filePath: file.path,
                startIndex,
                length: match[0].length,
                content: match[0],
                line: findLineNumber(lineStarts, startIndex),
                indexInFile,
            });
            indexInFile++;

            if (match[0].length === 0) {
                fileRegex.lastIndex += 1;
            }

            if (indexInFile % SEARCH_MATCH_BATCH_SIZE === 0 && getCurrentTimeMs() - lastYieldAt >= MAIN_THREAD_YIELD_INTERVAL_MS) {
                await yieldToMainThread();
                lastYieldAt = getCurrentTimeMs();
            }
        }

        if (getCurrentTimeMs() - lastYieldAt >= MAIN_THREAD_YIELD_INTERVAL_MS) {
            await yieldToMainThread();
            lastYieldAt = getCurrentTimeMs();
        }
    }

    return results;
}
