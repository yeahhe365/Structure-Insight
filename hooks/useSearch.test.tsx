import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSearch } from './useSearch';
import type { ProcessedFiles, SearchOptions } from '../types';

const SEARCH_OPTIONS: SearchOptions = {
    caseSensitive: false,
    useRegex: false,
    wholeWord: false,
};

const PROJECT_DATA: ProcessedFiles = {
    rootName: 'demo',
    structureString: 'demo\n└── src/example.ts\n',
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
    ],
    analysisSummary: {
        totalEstimatedTokens: 5,
        securityFindingCount: 0,
        scannedFileCount: 1,
    },
    securityFindings: [],
};

describe('useSearch', () => {
    it('opens search results through the shared file-opening flow', () => {
        const openFile = vi.fn();
        const setSelectedFilePath = vi.fn();
        const setActiveView = vi.fn();

        const { result } = renderHook(() =>
            useSearch({
                processedData: PROJECT_DATA,
                isMobile: false,
                setMobileView: vi.fn(),
                setSelectedFilePath,
                setActiveView,
                openFile,
            } as never)
        );

        act(() => {
            result.current.handleSearch('needle', SEARCH_OPTIONS);
        });

        expect(openFile).toHaveBeenCalledWith('src/example.ts');
        expect(setSelectedFilePath).not.toHaveBeenCalled();
        expect(setActiveView).not.toHaveBeenCalled();
    });
});
