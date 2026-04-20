import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

function createProcessedData(fileName: string, filePath: string): ProcessedFiles {
  const parts = filePath.split('/');
  const fileNode = {
    name: fileName,
    path: filePath,
    isDirectory: false as const,
    children: [],
    status: 'processed' as const,
    lines: 1,
    chars: fileName.length,
  };

  let treeNode = fileNode as {
    name: string;
    path: string;
    isDirectory: boolean;
    children: any[];
    status?: 'processed';
    lines?: number;
    chars?: number;
  };

  for (let index = parts.length - 2; index >= 0; index -= 1) {
    treeNode = {
      name: parts[index],
      path: parts.slice(0, index + 1).join('/'),
      isDirectory: true,
      children: [treeNode],
    };
  }

  return {
    rootName: 'demo',
    structureString: `demo\n└── ${parts[0]}\n`,
    treeData: [treeNode],
    fileContents: [
      {
        path: filePath,
        content: `content of ${fileName}`,
        originalContent: `content of ${fileName}`,
        language: 'plaintext',
        stats: { lines: 1, chars: fileName.length, estimatedTokens: 3 },
      },
    ],
    analysisSummary: {
      totalEstimatedTokens: 3,
      securityFindingCount: 0,
      scannedFileCount: 1,
    },
    securityFindings: [],
  };
}

function createLogic(processedData: ProcessedFiles | null) {
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
        logic={createLogic(createProcessedData('app.ts', 'src/nested/app.ts')) as never}
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
        logic={createLogic(createProcessedData('notes.md', 'src/nested/notes.md')) as never}
        codeViewRef={codeViewRef}
        leftPanelRef={leftPanelRef}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('nested')).not.toBeNull();
      expect(screen.getByText('notes.md')).not.toBeNull();
    });
  });
});
