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

vi.mock('./FileTree', () => ({
  default: ({ nodes }: { nodes: Array<{ name: string; isDirectory: boolean; children: unknown[] }> }) => {
    const names: string[] = [];
    const visit = (items: Array<{ name: string; isDirectory: boolean; children: any[] }>) => {
      for (const node of items) {
        names.push(node.name);
        if (node.isDirectory) {
          visit(node.children);
        }
      }
    };
    visit(nodes as Array<{ name: string; isDirectory: boolean; children: any[] }>);
    return <div data-testid="file-tree">{names.join('|')}</div>;
  },
}));

vi.mock('./CodeView', () => ({
  default: () => <div data-testid="code-view">code view</div>,
}));

vi.mock('./StructureView', () => ({
  default: () => <div data-testid="structure-view">structure view</div>,
}));

function createProcessedData(fileName: string, filePath: string): ProcessedFiles {
  const [directoryName] = filePath.split('/');

  return {
    rootName: 'demo',
    structureString: `demo\n└── ${directoryName}\n`,
    treeData: [
      {
        name: directoryName,
        path: directoryName,
        isDirectory: true,
        children: [
          {
            name: fileName,
            path: filePath,
            isDirectory: false,
            children: [],
            status: 'processed',
            lines: 1,
            chars: fileName.length,
          },
        ],
      },
    ],
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

function createLogic(processedData: ProcessedFiles) {
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
      lastProcessedFiles: [new File(['demo'], processedData.fileContents[0].path.split('/').pop() ?? 'demo.txt')],
      selectedFilePath: null,
      showCharCount: false,
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
  it('clears a stale extension filter when the current tree no longer contains that extension', async () => {
    const codeViewRef = React.createRef<HTMLDivElement>();
    const leftPanelRef = React.createRef<HTMLDivElement>();
    const { rerender } = render(
      <MainContent
        logic={createLogic(createProcessedData('app.ts', 'src/app.ts')) as never}
        codeViewRef={codeViewRef}
        leftPanelRef={leftPanelRef}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '.ts' }));
    await waitFor(() => {
      expect(screen.getByTestId('file-tree').textContent).toContain('app.ts');
    });

    rerender(
      <MainContent
        logic={createLogic(createProcessedData('notes.md', 'docs/notes.md')) as never}
        codeViewRef={codeViewRef}
        leftPanelRef={leftPanelRef}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('file-tree').textContent).toContain('notes.md');
    });
  });
});
