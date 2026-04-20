import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFileProcessing } from './useFileProcessing';

const PROCESSED = {
  treeData: [],
  fileContents: [],
  structureString: 'demo\n',
  rootName: 'demo',
  removedPaths: [],
  emptyDirectoryPaths: [],
};

const {
  createFileProcessingTaskMock,
  saveRecentProjectHandleMock,
  loadRecentProjectHandleMock,
  deleteRecentProjectHandleMock,
  readDirectoryHandleMock,
} = vi.hoisted(() => ({
  createFileProcessingTaskMock: vi.fn(() => ({
    promise: Promise.resolve(PROCESSED),
    cancel: vi.fn(),
  })),
  saveRecentProjectHandleMock: vi.fn(() => Promise.resolve()),
  loadRecentProjectHandleMock: vi.fn<() => Promise<FileSystemDirectoryHandle | null>>(() => Promise.resolve(null)),
  deleteRecentProjectHandleMock: vi.fn(() => Promise.resolve()),
  readDirectoryHandleMock: vi.fn<() => Promise<{ files: File[]; emptyDirectoryPaths: string[] }>>(() => Promise.resolve({ files: [], emptyDirectoryPaths: [] })),
}));

vi.mock('../services/fileProcessingClient', () => ({
  createFileProcessingTask: createFileProcessingTaskMock,
}));

vi.mock('../services/recentProjectHandles', () => ({
  saveRecentProjectHandle: saveRecentProjectHandleMock,
  loadRecentProjectHandle: loadRecentProjectHandleMock,
  deleteRecentProjectHandle: deleteRecentProjectHandleMock,
}));

vi.mock('../services/directoryHandleReader', () => ({
  readDirectoryHandle: readDirectoryHandleMock,
}));

describe('useFileProcessing recent project flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    createFileProcessingTaskMock.mockClear();
    saveRecentProjectHandleMock.mockClear();
    loadRecentProjectHandleMock.mockClear();
    deleteRecentProjectHandleMock.mockClear();
    readDirectoryHandleMock.mockClear();
    Object.defineProperty(globalThis, 'showDirectoryPicker', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: () => 'recent-project-id',
      },
    });
  });

  it('stores a reopenable recent project when the folder picker returns a directory handle', async () => {
    const directoryHandle = {
      name: 'demo-project',
      isSameEntry: vi.fn(() => Promise.resolve(false)),
    };
    const file = new File(['a'], 'a.ts', { type: 'text/plain' });
    Object.defineProperty(file, 'webkitRelativePath', {
      configurable: true,
      value: 'demo-project/src/a.ts',
    });

    Object.defineProperty(globalThis, 'showDirectoryPicker', {
      configurable: true,
      writable: true,
      value: vi.fn(() => Promise.resolve(directoryHandle)),
    });

    readDirectoryHandleMock.mockResolvedValueOnce({
      files: [file],
      emptyDirectoryPaths: [],
    });

    const onRememberProject = vi.fn();

    const { result } = renderHook(() =>
      useFileProcessing({
        extractContent: true,
        maxCharsThreshold: 0,
        useDefaultIgnorePatterns: false,
        useGitignorePatterns: false,
        includePatterns: 'src/**/*.ts,docs/**',
        ignorePatterns: 'dist/**,**/*.test.ts',
        includeEmptyDirectories: false,
        setIsLoading: vi.fn(),
        setProgressMessage: vi.fn(),
        setMobileView: vi.fn(),
        handleShowToast: vi.fn(),
        isMobile: false,
        setSelectedFilePath: vi.fn(),
        setActiveView: vi.fn(),
        recentProjects: [],
        onRememberProject,
        onForgetProject: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleFileSelect();
    });

    expect(readDirectoryHandleMock).toHaveBeenCalledWith(directoryHandle, {
      skipDefaultIgnoredDirectories: false,
    });
    expect(createFileProcessingTaskMock).toHaveBeenCalledWith(expect.objectContaining({
      options: {
        useDefaultIgnorePatterns: false,
        useGitignorePatterns: false,
        includePatterns: ['src/**/*.ts', 'docs/**'],
        ignorePatterns: ['dist/**', '**/*.test.ts'],
        includeEmptyDirectories: false,
        emptyDirectoryPaths: [],
      },
    }));
    expect(saveRecentProjectHandleMock).toHaveBeenCalledWith('recent-project-id', directoryHandle);
    expect(onRememberProject).toHaveBeenCalledWith({
      id: 'recent-project-id',
      name: 'demo-project',
      openedAt: expect.any(Number),
    });
  });

  it('reuses an existing recent project id for the same directory handle and cleans up evicted handles', async () => {
    const storedHandle = { name: 'demo-project' } as FileSystemDirectoryHandle;
    const directoryHandle = {
      name: 'demo-project',
      isSameEntry: vi.fn(() => Promise.resolve(true)),
    };

    Object.defineProperty(globalThis, 'showDirectoryPicker', {
      configurable: true,
      writable: true,
      value: vi.fn(() => Promise.resolve(directoryHandle)),
    });

    loadRecentProjectHandleMock.mockResolvedValueOnce(storedHandle);
    readDirectoryHandleMock.mockResolvedValueOnce({
      files: [],
      emptyDirectoryPaths: [],
    });

    const onRememberProject = vi.fn(() => ['stale-project-id']);

    const { result } = renderHook(() =>
      useFileProcessing({
        extractContent: true,
        maxCharsThreshold: 0,
        useDefaultIgnorePatterns: true,
        useGitignorePatterns: true,
        includePatterns: '',
        ignorePatterns: '',
        includeEmptyDirectories: true,
        setIsLoading: vi.fn(),
        setProgressMessage: vi.fn(),
        setMobileView: vi.fn(),
        handleShowToast: vi.fn(),
        isMobile: false,
        setSelectedFilePath: vi.fn(),
        setActiveView: vi.fn(),
        recentProjects: [
          {
            id: 'existing-project-id',
            name: 'demo-project',
            openedAt: 1,
          },
        ],
        onRememberProject,
        onForgetProject: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleFileSelect();
    });

    expect(loadRecentProjectHandleMock).toHaveBeenCalledWith('existing-project-id');
    expect(directoryHandle.isSameEntry).toHaveBeenCalledWith(storedHandle);
    expect(saveRecentProjectHandleMock).toHaveBeenCalledWith('existing-project-id', directoryHandle);
    expect(onRememberProject).toHaveBeenCalledWith({
      id: 'existing-project-id',
      name: 'demo-project',
      openedAt: expect.any(Number),
    });
    expect(deleteRecentProjectHandleMock).toHaveBeenCalledWith('stale-project-id');
  });

  it('reopens a recent project from its stored directory handle', async () => {
    const file = new File(['a'], 'a.ts', { type: 'text/plain' });
    Object.defineProperty(file, 'webkitRelativePath', {
      configurable: true,
      value: 'demo-project/src/a.ts',
    });

    const directoryHandle = {
      name: 'demo-project',
      queryPermission: vi.fn(() => Promise.resolve('granted')),
      requestPermission: vi.fn(() => Promise.resolve('granted')),
    } as unknown as FileSystemDirectoryHandle;

    loadRecentProjectHandleMock.mockResolvedValueOnce(directoryHandle);
    readDirectoryHandleMock.mockResolvedValueOnce({
      files: [file],
      emptyDirectoryPaths: [],
    });

    const { result } = renderHook(() =>
      useFileProcessing({
        extractContent: true,
        maxCharsThreshold: 0,
        useDefaultIgnorePatterns: true,
        useGitignorePatterns: true,
        includePatterns: '',
        ignorePatterns: '',
        includeEmptyDirectories: true,
        setIsLoading: vi.fn(),
        setProgressMessage: vi.fn(),
        setMobileView: vi.fn(),
        handleShowToast: vi.fn(),
        isMobile: false,
        setSelectedFilePath: vi.fn(),
        setActiveView: vi.fn(),
        recentProjects: [],
        onRememberProject: vi.fn(),
        onForgetProject: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleRecentProjectSelect({
        id: 'recent-project-id',
        name: 'demo-project',
        openedAt: 1,
      });
    });

    expect(loadRecentProjectHandleMock).toHaveBeenCalledWith('recent-project-id');
    expect(readDirectoryHandleMock).toHaveBeenCalledWith(directoryHandle, {
      skipDefaultIgnoredDirectories: true,
    });
    expect(result.current.processedData).toMatchObject({
      rootName: 'demo',
    });
  });

  it('refreshes from the current directory handle instead of reusing stale file snapshots', async () => {
    const firstFile = new File(['a'], 'a.ts', { type: 'text/plain' });
    Object.defineProperty(firstFile, 'webkitRelativePath', {
      configurable: true,
      value: 'demo-project/src/a.ts',
    });

    const secondFile = new File(['b'], 'b.ts', { type: 'text/plain' });
    Object.defineProperty(secondFile, 'webkitRelativePath', {
      configurable: true,
      value: 'demo-project/src/b.ts',
    });

    const directoryHandle = {
      name: 'demo-project',
      isSameEntry: vi.fn(() => Promise.resolve(false)),
    };

    Object.defineProperty(globalThis, 'showDirectoryPicker', {
      configurable: true,
      writable: true,
      value: vi.fn(() => Promise.resolve(directoryHandle)),
    });

    readDirectoryHandleMock
      .mockResolvedValueOnce({
        files: [firstFile],
        emptyDirectoryPaths: [],
      })
      .mockResolvedValueOnce({
        files: [secondFile],
        emptyDirectoryPaths: [],
      });

    createFileProcessingTaskMock.mockImplementation((({ files }: { files: File[] }) => ({
      promise: Promise.resolve({
        ...PROCESSED,
        rootName: files[0]?.name ?? 'demo',
      }),
      cancel: vi.fn(),
    })) as any);

    const { result } = renderHook(() =>
      useFileProcessing({
        extractContent: true,
        maxCharsThreshold: 0,
        useDefaultIgnorePatterns: true,
        useGitignorePatterns: true,
        includePatterns: '',
        ignorePatterns: '',
        includeEmptyDirectories: true,
        setIsLoading: vi.fn(),
        setProgressMessage: vi.fn(),
        setMobileView: vi.fn(),
        handleShowToast: vi.fn(),
        isMobile: false,
        setSelectedFilePath: vi.fn(),
        setActiveView: vi.fn(),
        recentProjects: [],
        onRememberProject: vi.fn(() => []),
        onForgetProject: vi.fn(),
      })
    );

    await act(async () => {
      await result.current.handleFileSelect();
    });

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(readDirectoryHandleMock).toHaveBeenNthCalledWith(1, directoryHandle, {
      skipDefaultIgnoredDirectories: true,
    });
    expect(readDirectoryHandleMock).toHaveBeenNthCalledWith(2, directoryHandle, {
      skipDefaultIgnoredDirectories: true,
    });
    expect(createFileProcessingTaskMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
      files: [secondFile],
    }));
    expect(result.current.processedData?.rootName).toBe('b.ts');
  });
});
