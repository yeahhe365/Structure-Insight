import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProcessedFiles } from '../types';
import { useAppLogic } from './useAppLogic';

const PROJECT_DATA: ProcessedFiles = {
    rootName: 'demo-project',
    structureString: `demo-project
└── src
    └── app.ts
`,
    treeData: [
        {
            name: 'src',
            path: 'src',
            isDirectory: true,
            children: [
                {
                    name: 'app.ts',
                    path: 'src/app.ts',
                    isDirectory: false,
                    children: [],
                    status: 'processed',
                    lines: 1,
                    chars: 20,
                },
            ],
        },
    ],
    fileContents: [
        {
            path: 'src/app.ts',
            content: 'console.log("demo");\n',
            originalContent: 'console.log("demo");\n',
            language: 'typescript',
            stats: { lines: 1, chars: 21, estimatedTokens: 6 },
        },
    ],
    analysisSummary: {
        totalEstimatedTokens: 6,
        securityFindingCount: 0,
        scannedFileCount: 1,
    },
    securityFindings: [],
};

const { buildExportOutputMock } = vi.hoisted(() => ({
    buildExportOutputMock: vi.fn(() => Promise.resolve('PACKED OUTPUT')),
}));

vi.mock('../services/exportBuilder', () => ({
    buildExportOutput: buildExportOutputMock,
}));

vi.mock('./useWindowSize', () => ({
    useWindowSize: () => ({ width: 1280, height: 720 }),
}));

vi.mock('./useFileProcessing', () => ({
    useFileProcessing: () => ({
        processedData: PROJECT_DATA,
        setProcessedData: vi.fn(),
        lastProcessedFiles: [new File(['demo'], 'app.ts')],
        lastEmptyDirectoryPaths: ['demo/empty-folder'],
        setLastProcessedFiles: vi.fn(),
        handleProcessing: vi.fn(),
        handleFileSelect: vi.fn(),
        handleDrop: vi.fn(),
        handleRefresh: vi.fn(),
        handleCancel: vi.fn(),
        abortControllerRef: { current: null },
    }),
}));

vi.mock('./useInteraction', () => ({
    useInteraction: (options: {
        isMobile: boolean;
        selectedFilePath: string | null;
        setSelectedFilePath: (path: string | null) => void;
        setActiveView: (view: 'structure' | 'code') => void;
        setMobileView: (view: 'tree' | 'editor') => void;
        onDeleteConfirmed?: (path: string) => void;
    }) => ({
        editingPath: null,
        setEditingPath: vi.fn(),
        markdownPreviewPaths: new Set<string>(),
        handleDeleteFile: vi.fn((path: string) => {
            if (path === options.selectedFilePath) {
                options.setSelectedFilePath(null);
                options.setActiveView('structure');
            }
            options.onDeleteConfirmed?.(path);
        }),
        handleFileTreeSelect: vi.fn((path: string) => {
            if (options.isMobile) {
                options.setMobileView('editor');
            }
            options.setSelectedFilePath(path);
            options.setActiveView('code');
        }),
        handleSaveEdit: vi.fn(),
        handleToggleMarkdownPreview: vi.fn(),
        clearInteractionState: vi.fn(),
        handleCopyPath: vi.fn(),
        handleToggleExclude: vi.fn(),
    }),
}));

vi.mock('./useSearch', () => ({
    useSearch: () => ({
        isSearchOpen: false,
        setIsSearchOpen: vi.fn(),
        searchResults: [],
        activeResultIndex: null,
        searchQuery: '',
        searchOptions: { caseSensitive: false, useRegex: false, wholeWord: false },
        handleSearch: vi.fn(),
        handleNavigate: vi.fn(),
        resetSearch: vi.fn(),
    }),
}));

function createLocalStorageMock(): Storage {
    const store = new Map<string, string>();

    return {
        get length() {
            return store.size;
        },
        clear: vi.fn(() => {
            store.clear();
        }),
        getItem: vi.fn((key: string) => {
            return store.has(key) ? store.get(key)! : null;
        }),
        key: vi.fn((index: number) => {
            return Array.from(store.keys())[index] ?? null;
        }),
        removeItem: vi.fn((key: string) => {
            store.delete(key);
        }),
        setItem: vi.fn((key: string, value: string) => {
            store.set(key, String(value));
        }),
    } as Storage;
}

describe('useAppLogic', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        buildExportOutputMock.mockClear();

        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            value: createLocalStorageMock(),
        });

        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: vi.fn(() => Promise.resolve()),
            },
        });

        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: vi.fn(() => 'blob:packed-output'),
        });

        Object.defineProperty(URL, 'revokeObjectURL', {
            configurable: true,
            value: vi.fn(),
        });

        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    it('defaults the new export settings to the expected values', () => {
        const codeViewRef = React.createRef<HTMLDivElement>();
        const leftPanelRef = React.createRef<HTMLDivElement>();

        const { result } = renderHook(() => useAppLogic(codeViewRef, leftPanelRef));

        expect(result.current.state.maxCharsThreshold).toBe(0);
        expect(result.current.state.includeFileSummary).toBe(true);
        expect(result.current.state.includeDirectoryStructure).toBe(true);
        expect(result.current.state.includeGitDiffs).toBe(false);
        expect(result.current.state.exportFormat).toBe('plain');
        expect(result.current.state.includePatterns).toBe('');
        expect(result.current.state.ignorePatterns).toBe('');
        expect(result.current.state.useDefaultPatterns).toBe(true);
        expect(result.current.state.useGitignore).toBe(true);
        expect(result.current.state.includeEmptyDirectories).toBe(false);
        expect(result.current.state.showLineNumbers).toBe(false);
        expect(result.current.state.removeEmptyLines).toBe(false);
        expect(result.current.state.truncateBase64).toBe(false);
        expect(result.current.state.exportSplitMaxChars).toBe(0);
        expect(result.current.state.exportHeaderText).toBe('');
        expect(result.current.state.exportInstructionText).toBe('');
    });

    it('migrates the legacy large-file threshold default to disabled', async () => {
        window.localStorage.setItem('maxCharsThreshold', JSON.stringify(1000000));

        const codeViewRef = React.createRef<HTMLDivElement>();
        const leftPanelRef = React.createRef<HTMLDivElement>();

        const { result } = renderHook(() => useAppLogic(codeViewRef, leftPanelRef));

        await waitFor(() => {
            expect(result.current.state.maxCharsThreshold).toBe(0);
            expect(window.localStorage.getItem('maxCharsThreshold')).toBe('0');
            expect(window.localStorage.getItem('migration:maxCharsThresholdDefaultDisabled:v1')).toBe('true');
        });
    });

    it('does not override the large-file threshold after the migration has already run', () => {
        window.localStorage.setItem('maxCharsThreshold', JSON.stringify(1000000));
        window.localStorage.setItem('migration:maxCharsThresholdDefaultDisabled:v1', 'true');

        const codeViewRef = React.createRef<HTMLDivElement>();
        const leftPanelRef = React.createRef<HTMLDivElement>();

        const { result } = renderHook(() => useAppLogic(codeViewRef, leftPanelRef));

        expect(result.current.state.maxCharsThreshold).toBe(1000000);
    });

    it('uses the async export builder for copy and save actions', async () => {
        const codeViewRef = React.createRef<HTMLDivElement>();
        const leftPanelRef = React.createRef<HTMLDivElement>();
        const OriginalBlob = globalThis.Blob;
        class FakeBlob {
            parts: unknown[];
            options?: BlobPropertyBag;

            constructor(parts: unknown[], options?: BlobPropertyBag) {
                this.parts = parts;
                this.options = options;
            }
        }
        Object.defineProperty(globalThis, 'Blob', {
            configurable: true,
            value: FakeBlob,
        });

        try {
            const { result } = renderHook(() => useAppLogic(codeViewRef, leftPanelRef));

            await act(async () => {
                await result.current.handlers.handleCopyAll();
            });

            expect(buildExportOutputMock).toHaveBeenCalledWith(expect.objectContaining({
                currentData: PROJECT_DATA,
                emptyDirectoryPaths: ['demo/empty-folder'],
                exportOptions: expect.objectContaining({
                    format: 'plain',
                    includeFileSummary: true,
                    includeDirectoryStructure: true,
                    includeFiles: true,
                    includeGitDiffs: false,
                    includePatterns: '',
                    ignorePatterns: '',
                    useDefaultPatterns: true,
                    useGitignore: true,
                    includeEmptyDirectories: false,
                    showLineNumbers: false,
                    removeEmptyLines: false,
                    truncateBase64: false,
                    userProvidedHeader: '',
                    instruction: '',
                }),
            }));
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('PACKED OUTPUT');

            await act(async () => {
                await result.current.handlers.handleSave();
            });

            const createObjectURLMock = vi.mocked(URL.createObjectURL);
            expect(createObjectURLMock).toHaveBeenCalledTimes(1);
            const exportedBlob = createObjectURLMock.mock.calls[0][0] as unknown as FakeBlob;
            expect(exportedBlob.parts).toEqual(['PACKED OUTPUT']);
            expect(exportedBlob.options).toEqual({ type: 'text/plain;charset=utf-8' });

            act(() => {
                result.current.settings.setExportSplitMaxChars(9);
            });

            buildExportOutputMock.mockResolvedValueOnce('part-one\npart-two\n');

            await act(async () => {
                await result.current.handlers.handleSave();
            });

            expect(createObjectURLMock).toHaveBeenCalledTimes(3);
        } finally {
            Object.defineProperty(globalThis, 'Blob', {
                configurable: true,
                value: OriginalBlob,
            });
        }
    });

    it('removes deleted files from open tabs and clears the active selection', () => {
        const codeViewRef = React.createRef<HTMLDivElement>();
        const leftPanelRef = React.createRef<HTMLDivElement>();

        const { result } = renderHook(() => useAppLogic(codeViewRef, leftPanelRef));

        act(() => {
            result.current.handlers.handleFileTreeSelect('src/app.ts');
        });

        expect(result.current.state.openFiles).toEqual(['src/app.ts']);
        expect(result.current.state.selectedFilePath).toBe('src/app.ts');
        expect(result.current.state.activeView).toBe('code');

        act(() => {
            result.current.handlers.handleDeleteFile('src/app.ts');
        });

        expect(result.current.state.openFiles).toEqual([]);
        expect(result.current.state.selectedFilePath).toBeNull();
        expect(result.current.state.activeView).toBe('structure');
    });
});
