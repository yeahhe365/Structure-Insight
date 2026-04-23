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
  it('keeps explorer rows compact and exposes secondary actions from a menu', () => {
    const onCopyPath = vi.fn();
    const onToggleExclude = vi.fn();
    const onDeleteFile = vi.fn();

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
        onDeleteFile={onDeleteFile}
        onCopyPath={onCopyPath}
        onToggleExclude={onToggleExclude}
        selectedFilePath={null}
      />
    );

    expect(screen.queryByRole('button', { name: '复制 src/index.ts 路径' })).toBeNull();

    const menuButton = screen.getByRole('button', { name: '更多 src/index.ts 操作' });
    expect(menuButton.className).toContain('w-7');
    fireEvent.click(menuButton);

    fireEvent.click(screen.getByRole('menuitem', { name: '复制 src/index.ts 路径' }));
    expect(onCopyPath).toHaveBeenCalledWith('src/index.ts');

    fireEvent.click(menuButton);
    fireEvent.click(screen.getByRole('menuitem', { name: '排除 src/index.ts' }));
    expect(onToggleExclude).toHaveBeenCalledWith('src/index.ts');

    fireEvent.click(menuButton);
    fireEvent.click(screen.getByRole('menuitem', { name: '删除 src/index.ts' }));
    expect(onDeleteFile).toHaveBeenCalledWith('src/index.ts');
  });

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

  it('ignores directory double clicks so the tree does not bounce between states unexpectedly', () => {
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

    fireEvent.doubleClick(screen.getByText('src'));
    expect(screen.getByText('index.ts')).not.toBeNull();
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

  it('renders only a compact action trigger in the fixed-height tree row', () => {
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

    const menuButton = screen.getByRole('button', { name: '更多 src/index.ts 操作' });
    const actionContainer = menuButton.parentElement;
    const rowContainer = screen.getByText('index.ts').closest('.group');

    expect(actionContainer).not.toBeNull();
    expect(actionContainer?.className).toContain('w-7');
    expect(actionContainer?.className).not.toContain('gap-1');
    expect(actionContainer?.className).not.toContain('top-1/2');
    expect(rowContainer?.className).not.toContain('flex-col');
  });

  it('closes the active file action menu when Escape is pressed', () => {
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

    const menuButton = screen.getByRole('button', { name: '更多 src/index.ts 操作' });
    fireEvent.click(menuButton);
    expect(screen.getByRole('menu')).toBeTruthy();

    fireEvent.keyDown(menuButton, { key: 'Escape' });

    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('keeps only one file action menu open at a time', () => {
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
              {
                name: 'app.ts',
                path: 'src/app.ts',
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

    fireEvent.click(screen.getByRole('button', { name: '更多 src/index.ts 操作' }));
    expect(screen.getByRole('menuitem', { name: '复制 src/index.ts 路径' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '更多 src/app.ts 操作' }));

    expect(screen.getAllByRole('menu')).toHaveLength(1);
    expect(screen.queryByRole('menuitem', { name: '复制 src/index.ts 路径' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: '复制 src/app.ts 路径' })).toBeTruthy();
  });
});
