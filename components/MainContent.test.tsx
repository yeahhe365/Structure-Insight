import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MainContent from './MainContent';
import type { ProcessedFiles } from '../types';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    i: ({ ...props }: React.HTMLAttributes<HTMLElement>) => <i {...props} />,
  },
}));

vi.mock('./InitialPrompt', () => ({
  default: () => <div data-testid="initial-prompt">initial prompt</div>,
}));

vi.mock('./TabBar', () => ({
  default: () => <div data-testid="tab-bar">tab bar</div>,
}));

vi.mock('./ScrollSlider', () => ({
  default: () => <div data-testid="scroll-slider">scroll slider</div>,
}));

vi.mock('./ScrollToTopButton', () => ({
  default: () => <div data-testid="scroll-to-top">scroll to top</div>,
}));

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent }: any) => (
    <div data-testid="virtuoso" data-count={String(data.length)}>
      {data.map((item: any, index: number) => (
        <div key={item.path}>{itemContent(index, item)}</div>
      ))}
    </div>
  ),
}));

vi.mock('./CodeView', () => ({
  default: () => <div data-testid="code-view">code view</div>,
}));

vi.mock('./StructureView', () => ({
  default: () => <div data-testid="structure-view">structure view</div>,
}));

afterEach(() => {
  cleanup();
});

function createProcessedData(entries: Array<{ path: string; language?: string }>): ProcessedFiles {
  type TreeNode = {
    name: string;
    path: string;
    isDirectory: boolean;
    children: TreeNode[];
    status?: 'processed';
    lines?: number;
    chars?: number;
  };

  const rootNodes: TreeNode[] = [];

  const ensureDirectory = (children: TreeNode[], name: string, path: string): TreeNode => {
    let existing = children.find(node => node.path === path && node.isDirectory);
    if (!existing) {
      existing = {
        name,
        path,
        isDirectory: true,
        children: [],
      };
      children.push(existing);
    }
    return existing;
  };

  for (const entry of entries) {
    const parts = entry.path.split('/');
    const fileName = parts[parts.length - 1];
    let currentChildren = rootNodes;

    for (let index = 0; index < parts.length - 1; index += 1) {
      const directoryPath = parts.slice(0, index + 1).join('/');
      const directoryNode = ensureDirectory(currentChildren, parts[index], directoryPath);
      currentChildren = directoryNode.children;
    }

    currentChildren.push({
      name: fileName,
      path: entry.path,
      isDirectory: false,
      children: [],
      status: 'processed',
      lines: 1,
      chars: fileName.length,
    });
  }

  return {
    rootName: 'demo',
    structureString: `demo\n${entries.map(entry => `└── ${entry.path}`).join('\n')}\n`,
    treeData: rootNodes,
    fileContents: entries.map(entry => {
      const fileName = entry.path.split('/').pop() ?? entry.path;
      return {
        path: entry.path,
        content: `content of ${fileName}`,
        originalContent: `content of ${fileName}`,
        language: entry.language ?? 'plaintext',
        stats: { lines: 1, chars: fileName.length, estimatedTokens: 3 },
      };
    }),
    analysisSummary: {
      totalEstimatedTokens: entries.length * 3,
      securityFindingCount: 0,
      scannedFileCount: entries.length,
    },
    securityFindings: [],
  };
}

function createLogic(
  processedData: ProcessedFiles | null,
  stateOverrides: Record<string, unknown> = {},
  handlerOverrides: Record<string, unknown> = {}
) {
  return {
    state: {
      isMobile: false,
      processedData,
      mobileView: 'editor' as const,
      activeView: 'structure' as const,
      panelWidth: 30,
      isDragging: false,
      isLoading: false,
      progressMessage: '',
      lastProcessedFiles: processedData
        ? [new File(['demo'], processedData.fileContents[0].path.split('/').pop() ?? 'demo.txt')]
        : null,
      selectedFilePath: null,
      openFiles: [],
      selectedFile: null,
      editingPath: null,
      markdownPreviewPaths: new Set<string>(),
      fontSize: 14,
      searchQuery: '',
      searchOptions: { caseSensitive: false, useRegex: false, wholeWord: false },
      activeMatchIndexInFile: null,
      wordWrap: false,
      recentProjects: [],
      ...stateOverrides,
    },
    handlers: {
      handleFileTreeSelect: vi.fn(),
      handleDeleteFile: vi.fn(),
      handleCopyPath: vi.fn(),
      handleToggleExclude: vi.fn(),
      handleDirDoubleClick: vi.fn(),
      closeTab: vi.fn(),
      handleFileSelect: vi.fn(),
      handleSaveEdit: vi.fn(),
      handleToggleMarkdownPreview: vi.fn(),
      setEditingPath: vi.fn(),
      setToastMessage: vi.fn(),
      handleMobileViewToggle: vi.fn(),
      handleMouseDownResize: vi.fn(),
      ...handlerOverrides,
    },
  };
}

describe('MainContent', () => {
  it('renders the empty state without the desktop split-pane chrome when no project is loaded', () => {
    const codeViewRef = React.createRef<HTMLDivElement>();
    const leftPanelRef = React.createRef<HTMLDivElement>();
    const { container } = render(
      <MainContent
        logic={createLogic(null) as never}
        codeViewRef={codeViewRef}
        leftPanelRef={leftPanelRef}
      />
    );

    expect(screen.getByTestId('initial-prompt')).not.toBeNull();
    expect(container.querySelector('.cursor-col-resize')).toBeNull();
  });

  it('clears a stale extension filter without collapsing nested directories in the replacement tree', async () => {
    const codeViewRef = React.createRef<HTMLDivElement>();
    const leftPanelRef = React.createRef<HTMLDivElement>();
    const { rerender } = render(
      <MainContent
        logic={createLogic(createProcessedData([{ path: 'src/nested/app.ts', language: 'typescript' }])) as never}
        codeViewRef={codeViewRef}
        leftPanelRef={leftPanelRef}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '.ts' }));
    await waitFor(() => {
      expect(screen.getByText('app.ts')).not.toBeNull();
    });

    rerender(
      <MainContent
        logic={createLogic(createProcessedData([{ path: 'src/nested/notes.md', language: 'markdown' }])) as never}
        codeViewRef={codeViewRef}
        leftPanelRef={leftPanelRef}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('nested')).not.toBeNull();
      expect(screen.getByText('notes.md')).not.toBeNull();
    });
  });

  it('keeps tab context visible while browsing the structure view', () => {
    const codeViewRef = React.createRef<HTMLDivElement>();
    const leftPanelRef = React.createRef<HTMLDivElement>();
    const processedData = createProcessedData([{ path: 'src/nested/app.ts', language: 'typescript' }]);

    render(
      <MainContent
        logic={createLogic(processedData, {
          activeView: 'structure',
          selectedFilePath: 'src/nested/app.ts',
          selectedFile: processedData.fileContents[0],
          openFiles: ['src/nested/app.ts'],
        }) as never}
        codeViewRef={codeViewRef}
        leftPanelRef={leftPanelRef}
      />
    );

    expect(screen.getByTestId('tab-bar')).not.toBeNull();
    expect(screen.getByTestId('structure-view')).not.toBeNull();
  });

  it('clarifies that file type filters only affect the tree and exposes a quick way to clear hidden selections', async () => {
    const codeViewRef = React.createRef<HTMLDivElement>();
    const leftPanelRef = React.createRef<HTMLDivElement>();
    const processedData = createProcessedData([
      { path: 'src/app.ts', language: 'typescript' },
      { path: 'src/notes.md', language: 'markdown' },
    ]);

    render(
      <MainContent
        logic={createLogic(processedData, {
          activeView: 'code',
          selectedFilePath: 'src/app.ts',
          selectedFile: processedData.fileContents[0],
          openFiles: ['src/app.ts'],
        }) as never}
        codeViewRef={codeViewRef}
        leftPanelRef={leftPanelRef}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '.md' }));

    await waitFor(() => {
      expect(screen.getByText('筛选仅影响文件树浏览，不影响导出与右侧内容。')).not.toBeNull();
      expect(screen.getByText('当前文件 app.ts 未显示在当前筛选结果中。')).not.toBeNull();
      expect(screen.queryByText('app.ts')).toBeNull();
      expect(screen.getByText('notes.md')).not.toBeNull();
    });

    fireEvent.click(screen.getByRole('button', { name: '清除筛选' }));

    await waitFor(() => {
      expect(screen.queryByText('当前文件 app.ts 未显示在当前筛选结果中。')).toBeNull();
      expect(screen.getByText('app.ts')).not.toBeNull();
    });
  });
});
