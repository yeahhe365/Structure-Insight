import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSearch } from './useSearch';
import type { ProcessedFiles, SearchOptions } from '../types';

const { createSearchTaskMock } = vi.hoisted(() => ({
    createSearchTaskMock: vi.fn(),
}));

vi.mock('../services/searchClient', () => ({
    createSearchTask: createSearchTaskMock,
}));

const SEARCH_OPTIONS: SearchOptions = {
    caseSensitive: false,
    useRegex: false,
    wholeWord: false,
};

const PROJECT_DATA: ProcessedFiles = {
    rootName: 'demo',
    structureString: 'demo\n└── src\n    ├── example.ts\n    └── second.ts\n',
    treeData: [
        {
            name: 'src',
            path: 'src',
            isDirectory: true,
            children: [
                {
                    name: 'example.ts',
                    path: 'src/example.ts',
                    isDirectory: false,
                    children: [],
                    status: 'processed',
                },
                {
                    name: 'second.ts',
                    path: 'src/second.ts',
                    isDirectory: false,
                    children: [],
                    status: 'processed',
                },
            ],
        },
    ],
    fileContents: [
        {
            path: 'src/example.ts',
            content: 'const needle = true;',
            language: 'typescript',
            stats: { lines: 1, chars: 20, estimatedTokens: 5 },
        },
        {
            path: 'src/second.ts',
            content: 'const second = true;',
            language: 'typescript',
            stats: { lines: 1, chars: 20, estimatedTokens: 5 },
        },
    ],
    analysisSummary: {
        totalEstimatedTokens: 10,
        securityFindingCount: 0,
        scannedFileCount: 2,
    },
    securityFindings: [],
};

describe('useSearch', () => {
    beforeEach(() => {
        createSearchTaskMock.mockReset();
    });

    it('opens search results through the shared file-opening flow', async () => {
        createSearchTaskMock.mockReturnValueOnce({
            promise: Promise.resolve([
                {
                    filePath: 'src/example.ts',
                    startIndex: 6,
                    length: 6,
                    content: 'needle',
                    line: 1,
                    indexInFile: 0,
                },
            ]),
            cancel: vi.fn(),
        });

        const openFile = vi.fn();

        const { result } = renderHook(() =>
            useSearch({
                processedData: PROJECT_DATA,
                openFile,
            })
        );

        await act(async () => {
            result.current.handleSearch('needle', SEARCH_OPTIONS);
        });

        await waitFor(() => {
            expect(openFile).toHaveBeenCalledWith('src/example.ts');
        });

        expect(result.current.searchResults).toHaveLength(1);
    });

    it('ignores stale search results when a newer query finishes later', async () => {
        let resolveFirst: ((value: unknown) => void) | null = null;
        let resolveSecond: ((value: unknown) => void) | null = null;

        createSearchTaskMock
            .mockImplementationOnce(() => ({
                promise: new Promise(resolve => {
                    resolveFirst = resolve;
                }),
                cancel: vi.fn(),
            }))
            .mockImplementationOnce(() => ({
                promise: new Promise(resolve => {
                    resolveSecond = resolve;
                }),
                cancel: vi.fn(),
            }));

        const openFile = vi.fn();

        const { result } = renderHook(() =>
            useSearch({
                processedData: PROJECT_DATA,
                openFile,
            })
        );

        await act(async () => {
            result.current.handleSearch('old', SEARCH_OPTIONS);
            result.current.handleSearch('new', SEARCH_OPTIONS);
        });

        await act(async () => {
            resolveFirst?.([
                {
                    filePath: 'src/example.ts',
                    startIndex: 6,
                    length: 3,
                    content: 'old',
                    line: 1,
                    indexInFile: 0,
                },
            ]);
            await Promise.resolve();
        });

        expect(openFile).not.toHaveBeenCalled();

        await act(async () => {
            resolveSecond?.([
                {
                    filePath: 'src/second.ts',
                    startIndex: 6,
                    length: 3,
                    content: 'new',
                    line: 1,
                    indexInFile: 0,
                },
            ]);
            await Promise.resolve();
        });

        await waitFor(() => {
            expect(openFile).toHaveBeenCalledWith('src/second.ts');
        });

        expect(result.current.searchResults).toEqual([
            expect.objectContaining({ filePath: 'src/second.ts' }),
        ]);
    });
});
