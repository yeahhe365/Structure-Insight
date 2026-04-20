import { describe, expect, it } from 'vitest';
import type { FileContent, SearchOptions } from '../types';
import { searchProjectFiles } from './searchEngine';

const SEARCH_OPTIONS: SearchOptions = {
    caseSensitive: false,
    useRegex: false,
    wholeWord: false,
};

const FILES: FileContent[] = [
    {
        path: 'src/a.ts',
        content: 'const alpha = true;\nconst needle = 1;\n',
        language: 'typescript',
        stats: { lines: 2, chars: 38, estimatedTokens: 8 },
    },
    {
        path: 'src/b.ts',
        content: 'needle again\n',
        language: 'typescript',
        stats: { lines: 1, chars: 13, estimatedTokens: 3 },
    },
];

describe('searchProjectFiles', () => {
    it('returns matches with correct file paths and line numbers', async () => {
        await expect(
            searchProjectFiles({
                files: FILES,
                query: 'needle',
                options: SEARCH_OPTIONS,
            })
        ).resolves.toEqual([
            expect.objectContaining({
                filePath: 'src/a.ts',
                line: 2,
                content: 'needle',
            }),
            expect.objectContaining({
                filePath: 'src/b.ts',
                line: 1,
                content: 'needle',
            }),
        ]);
    });

    it('stops when the caller aborts the search', async () => {
        const controller = new AbortController();
        controller.abort();

        await expect(
            searchProjectFiles({
                files: FILES,
                query: 'needle',
                options: SEARCH_OPTIONS,
                signal: controller.signal,
            })
        ).rejects.toThrow('Search aborted');
    });
});
