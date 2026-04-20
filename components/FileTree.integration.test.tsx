import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VirtuosoMockContext } from 'react-virtuoso';
import FileTree from './FileTree';
import type { FileNode } from '../types';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverMock,
});

const TREE: FileNode[] = [
  {
    name: 'src',
    path: 'src',
    isDirectory: true,
    children: [
      {
        name: 'nested',
        path: 'src/nested',
        isDirectory: true,
        children: [
          {
            name: 'deeper',
            path: 'src/nested/deeper',
            isDirectory: true,
            children: [
              {
                name: 'index.ts',
                path: 'src/nested/deeper/index.ts',
                isDirectory: false,
                children: [],
                status: 'processed',
              },
            ],
          },
        ],
      },
    ],
  },
];

describe('FileTree with real Virtuoso', () => {
  it('renders nested directory rows when mounted inside the explorer scroll layout', async () => {
    render(
      <div style={{ height: '360px', overflowY: 'auto' }}>
        <div style={{ height: '40px' }}>filters</div>
        <VirtuosoMockContext.Provider value={{ viewportHeight: 320, itemHeight: 32 }}>
          <FileTree
            nodes={TREE}
            onFileSelect={vi.fn()}
            onDeleteFile={vi.fn()}
            onCopyPath={vi.fn()}
            onToggleExclude={vi.fn()}
            selectedFilePath={null}
            showCharCount={false}
          />
        </VirtuosoMockContext.Provider>
      </div>
    );

    await waitFor(() => {
      expect(screen.getByText('nested')).not.toBeNull();
      expect(screen.getByText('deeper')).not.toBeNull();
      expect(screen.getByText('index.ts')).not.toBeNull();
    });
  });
});
