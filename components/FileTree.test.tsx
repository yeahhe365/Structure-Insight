import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FileTree from './FileTree';
import type { FileNode } from '../types';

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent, fixedItemHeight }: any) => (
    <div
      data-testid="virtuoso"
      data-count={String(data.length)}
      data-fixed-item-height={fixedItemHeight == null ? '' : String(fixedItemHeight)}
    >
      {data.slice(0, 12).map((item: any, index: number) => (
        <div key={item.path}>{itemContent(index, item)}</div>
      ))}
    </div>
  ),
}));

const makeLargeTree = (): FileNode[] => [
  {
    name: 'src',
    path: 'src',
    isDirectory: true,
    children: Array.from({ length: 200 }, (_, index) => ({
      name: `file-${index}.ts`,
      path: `src/file-${index}.ts`,
      isDirectory: false,
      children: [],
      status: 'processed' as const,
    })),
  },
];

afterEach(() => {
  cleanup();
});

describe('FileTree virtualization', () => {
  it('resets to the default expanded state when a different tree is loaded', () => {
    const { rerender } = render(
      <FileTree
        nodes={[
          {
            name: 'src',
            path: 'src',
            isDirectory: true,
            children: [
              {
                name: 'index.ts',
                path: 'src/index.ts',
                isDirectory: false,
                children: [],
                status: 'processed',
              },
            ],
          },
        ]}
        treeResetKey="project-a"
        onFileSelect={vi.fn()}
        onDeleteFile={vi.fn()}
        onCopyPath={vi.fn()}
        onToggleExclude={vi.fn()}
        selectedFilePath={null}
      />
    );

    fireEvent.click(screen.getByText('src'));
    expect(screen.queryByText('index.ts')).toBeNull();

    rerender(
      <FileTree
        nodes={[
          {
            name: 'lib',
            path: 'lib',
            isDirectory: true,
            children: [
              {
                name: 'util.ts',
                path: 'lib/util.ts',
                isDirectory: false,
                children: [],
                status: 'processed',
              },
            ],
          },
        ]}
        treeResetKey="project-b"
        onFileSelect={vi.fn()}
        onDeleteFile={vi.fn()}
        onCopyPath={vi.fn()}
        onToggleExclude={vi.fn()}
        selectedFilePath={null}
      />
    );

    expect(screen.getByText('util.ts')).not.toBeNull();
  });

  it('passes the flattened visible rows into the virtual list instead of mounting the full tree', () => {
    render(
      <FileTree
        nodes={makeLargeTree()}
        onFileSelect={vi.fn()}
        onDeleteFile={vi.fn()}
        onCopyPath={vi.fn()}
        onToggleExclude={vi.fn()}
        selectedFilePath={null}
      />
    );

    expect(screen.getByTestId('virtuoso').getAttribute('data-count')).toBe('201');
    expect(screen.getByText('file-0.ts')).not.toBeNull();
    expect(screen.queryByText('file-199.ts')).toBeNull();
  });

  it('uses a fixed row height for the virtual list to avoid first-item probe flicker', () => {
    render(
      <FileTree
        nodes={makeLargeTree()}
        onFileSelect={vi.fn()}
        onDeleteFile={vi.fn()}
        onCopyPath={vi.fn()}
        onToggleExclude={vi.fn()}
        selectedFilePath={null}
      />
    );

    expect(screen.getByTestId('virtuoso').getAttribute('data-fixed-item-height')).toBe('36');
  });

  it('indents each nested tree level progressively to the right', () => {
    render(
      <FileTree
        nodes={[
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
        ]}
        onFileSelect={vi.fn()}
        onDeleteFile={vi.fn()}
        onCopyPath={vi.fn()}
        onToggleExclude={vi.fn()}
        selectedFilePath={null}
      />
    );

    expect((screen.getByText('src').closest('[role="treeitem"]') as HTMLElement).style.paddingLeft).toBe('0rem');
    expect((screen.getByText('nested').closest('[role="treeitem"]') as HTMLElement).style.paddingLeft).toBe('1.25rem');
    expect((screen.getByText('deeper').closest('[role="treeitem"]') as HTMLElement).style.paddingLeft).toBe('2.5rem');
    expect((screen.getByText('index.ts').closest('[role="treeitem"]') as HTMLElement).style.paddingLeft).toBe('3.75rem');
  });

  it('removes descendant rows when collapsing a directory', () => {
    render(
      <FileTree
        nodes={[
          {
            name: 'src',
            path: 'src',
            isDirectory: true,
            children: [
              {
                name: 'index.ts',
                path: 'src/index.ts',
                isDirectory: false,
                children: [],
                status: 'processed',
              },
            ],
          },
        ]}
        onFileSelect={vi.fn()}
        onDeleteFile={vi.fn()}
        onCopyPath={vi.fn()}
        onToggleExclude={vi.fn()}
        selectedFilePath={null}
      />
    );

    expect(screen.getByText('index.ts')).not.toBeNull();
    fireEvent.click(screen.getByText('src'));
    expect(screen.queryByText('index.ts')).toBeNull();
  });

  it('navigates visible rows with the keyboard and opens processed files on Enter', () => {
    const onFileSelect = vi.fn();

    render(
      <FileTree
        nodes={[
          {
            name: 'src',
            path: 'src',
            isDirectory: true,
            children: [
              {
                name: 'index.ts',
                path: 'src/index.ts',
                isDirectory: false,
                children: [],
                status: 'processed',
              },
            ],
          },
        ]}
        onFileSelect={onFileSelect}
        onDeleteFile={vi.fn()}
        onCopyPath={vi.fn()}
        onToggleExclude={vi.fn()}
        selectedFilePath={null}
      />
    );

    const tree = screen.getByRole('tree', { name: '资源管理器' });
    tree.focus();

    fireEvent.keyDown(tree, { key: 'ArrowDown' });
    fireEvent.keyDown(tree, { key: 'ArrowDown' });
    fireEvent.keyDown(tree, { key: 'Enter' });

    expect(onFileSelect).toHaveBeenCalledWith('src/index.ts');
  });

  it('does not render file line or character counts in the explorer rows', () => {
    render(
      <FileTree
        nodes={[
          {
            name: 'src',
            path: 'src',
            isDirectory: true,
            children: [
              {
                name: 'index.ts',
                path: 'src/index.ts',
                isDirectory: false,
                children: [],
                status: 'processed',
                lines: 42,
                chars: 420,
              },
            ],
          },
        ]}
        onFileSelect={vi.fn()}
        onDeleteFile={vi.fn()}
        onCopyPath={vi.fn()}
        onToggleExclude={vi.fn()}
        selectedFilePath={null}
      />
    );

    expect(screen.queryByText('420')).toBeNull();
    expect(screen.queryByText('42')).toBeNull();
    expect(screen.getByText('index.ts').closest('[title]')?.getAttribute('title')).toBe('src/index.ts');
  });

  it('renders file action buttons in an overlay that does not change row layout', () => {
    render(
      <FileTree
        nodes={[
          {
            name: 'src',
            path: 'src',
            isDirectory: true,
            children: [
              {
                name: 'index.ts',
                path: 'src/index.ts',
                isDirectory: false,
                children: [],
                status: 'processed',
              },
            ],
          },
        ]}
        onFileSelect={vi.fn()}
        onDeleteFile={vi.fn()}
        onCopyPath={vi.fn()}
        onToggleExclude={vi.fn()}
        selectedFilePath={null}
      />
    );

    const pathButton = screen.getByRole('button', { name: '路径' });
    const actionContainer = pathButton.parentElement;

    expect(actionContainer).not.toBeNull();
    expect(actionContainer?.className).toContain('absolute');
    expect(actionContainer?.className).toContain('opacity-0');
    expect(actionContainer?.className).not.toContain('group-hover:flex');
  });
});
