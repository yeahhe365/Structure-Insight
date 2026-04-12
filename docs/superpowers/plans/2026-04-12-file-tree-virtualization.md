# File Tree Virtualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the recursive full-tree render in `components/FileTree.tsx` with a virtualized visible-row list that keeps expand/collapse, keyboard navigation, and file actions working for large repositories.

**Architecture:** Keep `FileNode[]` as the source of truth, derive a flat visible-row list from `nodes` plus `expandedPaths`, and render that list through `react-virtuoso`. Move tree-flattening into a small helper module so the component logic stays readable and testable, then cover the integration with focused component tests that mock the virtualization boundary.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Framer Motion, react-virtuoso

---

## File Structure

- `components/FileTree.tsx`
  Responsibility: keep the public `FileTree` API stable, manage expand/focus state, handle keyboard navigation, and render virtualized rows instead of recursive nested lists.
- `components/fileTreeRows.ts`
  Responsibility: expose pure helpers for collecting default expanded directories and flattening visible rows from nested `FileNode[]`.
- `components/fileTreeRows.test.ts`
  Responsibility: lock down the pure visible-row derivation logic independent of React rendering.
- `components/FileTree.test.tsx`
  Responsibility: verify virtualization integration, collapse behavior, keyboard navigation, and row action affordances.
- `package.json`
  Responsibility: declare `react-virtuoso` as the virtualization dependency.
- `package-lock.json`
  Responsibility: pin the installed dependency tree after adding `react-virtuoso`.

### Task 1: Add Pure Visible-Row Helpers

**Files:**
- Create: `components/fileTreeRows.ts`
- Create: `components/fileTreeRows.test.ts`
- Test: `components/fileTreeRows.test.ts`

- [ ] **Step 1: Write the failing helper tests**

```ts
import { describe, expect, it } from 'vitest';
import type { FileNode } from '../types';
import { collectExpandedDirectoryPaths, flattenVisibleTreeRows } from './fileTreeRows';

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
            name: 'deep.ts',
            path: 'src/nested/deep.ts',
            isDirectory: false,
            children: [],
            status: 'processed',
          },
        ],
      },
      {
        name: 'index.ts',
        path: 'src/index.ts',
        isDirectory: false,
        children: [],
        status: 'processed',
      },
    ],
  },
];

describe('fileTreeRows helpers', () => {
  it('collects every directory path for the default expanded state', () => {
    expect(collectExpandedDirectoryPaths(TREE)).toEqual(new Set(['src', 'src/nested']));
  });

  it('flattens only the descendants of expanded directories', () => {
    const collapsed = flattenVisibleTreeRows(TREE, new Set(), null, null);
    const expanded = flattenVisibleTreeRows(TREE, new Set(['src', 'src/nested']), 'src/index.ts', 'src/nested');

    expect(collapsed.map(row => row.path)).toEqual(['src']);
    expect(expanded.map(row => row.path)).toEqual(['src', 'src/nested', 'src/nested/deep.ts', 'src/index.ts']);
    expect(expanded.find(row => row.path === 'src/index.ts')?.isSelected).toBe(true);
    expect(expanded.find(row => row.path === 'src/nested')?.isFocused).toBe(true);
  });
});
```

- [ ] **Step 2: Run the helper test to verify it fails**

Run: `npm test -- components/fileTreeRows.test.ts`
Expected: FAIL with a module resolution error for `./fileTreeRows` or missing exported helper functions.

- [ ] **Step 3: Write the minimal helper implementation**

```ts
import type { FileNode } from '../types';

export interface VisibleTreeRow {
  path: string;
  node: FileNode;
  level: number;
  isOpen: boolean;
  isSelected: boolean;
  isFocused: boolean;
}

export function collectExpandedDirectoryPaths(nodes: FileNode[]): Set<string> {
  const paths = new Set<string>();

  const walk = (items: FileNode[]) => {
    for (const node of items) {
      if (!node.isDirectory) continue;
      paths.add(node.path);
      walk(node.children);
    }
  };

  walk(nodes);
  return paths;
}

export function flattenVisibleTreeRows(
  nodes: FileNode[],
  expandedPaths: Set<string>,
  selectedFilePath: string | null,
  focusedPath: string | null
): VisibleTreeRow[] {
  const rows: VisibleTreeRow[] = [];

  const walk = (items: FileNode[], level: number) => {
    for (const node of items) {
      const isOpen = node.isDirectory && expandedPaths.has(node.path);
      rows.push({
        path: node.path,
        node,
        level,
        isOpen,
        isSelected: !node.isDirectory && node.path === selectedFilePath,
        isFocused: node.path === focusedPath,
      });

      if (node.isDirectory && isOpen) {
        walk(node.children, level + 1);
      }
    }
  };

  walk(nodes, 1);
  return rows;
}
```

- [ ] **Step 4: Run the helper test to verify it passes**

Run: `npm test -- components/fileTreeRows.test.ts`
Expected: PASS with 2 passing tests for the pure helper module.

- [ ] **Step 5: Commit**

```bash
git add components/fileTreeRows.ts components/fileTreeRows.test.ts
git commit -m "test: add file tree row helpers"
```

### Task 2: Swap Recursive Rendering For A Virtualized Row List

**Files:**
- Modify: `components/FileTree.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `components/FileTree.test.tsx`
- Test: `components/FileTree.test.tsx`

- [ ] **Step 1: Install the virtualization dependency**

Run: `npm install react-virtuoso`
Expected: install completes successfully and both `package.json` and `package-lock.json` record `react-virtuoso`.

- [ ] **Step 2: Write the failing component test for virtualization integration**

```tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FileTree from './FileTree';
import type { FileNode } from '../types';

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent }: any) => (
    <div data-testid="virtuoso" data-count={String(data.length)}>
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

describe('FileTree virtualization', () => {
  it('passes the flattened visible rows into the virtual list instead of mounting the full tree', () => {
    render(
      <FileTree
        nodes={makeLargeTree()}
        onFileSelect={vi.fn()}
        onDeleteFile={vi.fn()}
        onCopyPath={vi.fn()}
        onToggleExclude={vi.fn()}
        selectedFilePath={null}
        showCharCount={false}
      />
    );

    expect(screen.getByTestId('virtuoso').getAttribute('data-count')).toBe('201');
    expect(screen.getByText('file-0.ts')).not.toBeNull();
    expect(screen.queryByText('file-199.ts')).toBeNull();
  });
});
```

- [ ] **Step 3: Run the component test to verify it fails**

Run: `npm test -- components/FileTree.test.tsx`
Expected: FAIL because `FileTree` still renders the full recursive list and does not produce the mocked `virtuoso` container.

- [ ] **Step 4: Refactor `FileTree.tsx` to use `react-virtuoso` and the helper rows**

```tsx
import React from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { FileNode } from '../types';
import { collectExpandedDirectoryPaths, flattenVisibleTreeRows, type VisibleTreeRow } from './fileTreeRows';

const FileTreeRow: React.FC<{
  row: VisibleTreeRow;
  onFileSelect: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onCopyPath: (path: string) => void;
  onToggleExclude: (path: string) => void;
  onDirDoubleClick?: () => void;
  onToggleExpand: (path: string) => void;
  showCharCount: boolean;
}> = React.memo(({ row, onFileSelect, onDeleteFile, onCopyPath, onToggleExclude, onDirDoubleClick, onToggleExpand, showCharCount }) => {
  const { node, level, isOpen, isSelected, isFocused } = row;

  const handleToggle = () => {
    if (node.isDirectory) onToggleExpand(node.path);
  };

  const handleSelect = () => {
    if (node.isDirectory) handleToggle();
    else if (node.status === 'processed') onFileSelect(node.path);
  };

  return (
    <div style={{ paddingLeft: `${level > 1 ? 1.25 : 0}rem` }}>
      <div
        className={`group flex flex-col py-1 px-2 rounded-md cursor-pointer ${isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''} ${isFocused ? 'ring-1 ring-primary/50 bg-primary/5' : ''}`}
        onClick={handleSelect}
        onDoubleClick={() => {
          if (!node.isDirectory || !onDirDoubleClick) return;
          onToggleExpand(node.path);
          onDirDoubleClick();
        }}
        title={node.path}
      >
        <div className="flex items-center space-x-2 w-full">
          {node.isDirectory ? (
            <span className="w-4 text-center shrink-0" onClick={(event) => { event.stopPropagation(); handleToggle(); }}>
              <i className={`fa-solid fa-chevron-down text-xs ${isOpen ? 'rotate-0' : '-rotate-90'}`}></i>
            </span>
          ) : (
            <span className="w-4 shrink-0"></span>
          )}

          <span className="shrink-0">
            {node.isDirectory ? (
              <i className={`fa-solid ${isOpen ? 'fa-folder-open' : 'fa-folder'} w-5 text-center text-sky-500`}></i>
            ) : (
              <i className="fa-regular fa-file w-5 text-center text-gray-400"></i>
            )}
          </span>

          <span className={`truncate text-sm flex-1 ${node.excluded ? 'line-through' : ''}`}>{node.name}</span>

          {node.isDirectory ? (
            <span className="text-[10px] text-light-subtle-text/60 shrink-0 ml-1 tabular-nums">{countFiles(node)}</span>
          ) : (
            node.status === 'processed' && (
              <div className={`flex items-center space-x-2 text-xs text-light-subtle-text shrink-0 ml-2 ${showCharCount ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {typeof node.chars === 'number' && <span>{node.chars}</span>}
                {typeof node.lines === 'number' && <span className="border-l border-light-border pl-2">{node.lines}</span>}
              </div>
            )
          )}
        </div>

        {!node.isDirectory && (
          <div className="hidden group-hover:flex items-center space-x-2 pl-9 mt-1.5 pb-0.5 w-full overflow-x-auto no-scrollbar">
            <button onClick={(event) => { event.stopPropagation(); onCopyPath(node.path); }} className="flex items-center space-x-1.5 px-2 py-1 rounded text-xs">
              <i className="fa-regular fa-copy"></i>
              <span>路径</span>
            </button>
            {node.status === 'processed' && (
              <button onClick={(event) => { event.stopPropagation(); onToggleExclude(node.path); }} className="flex items-center space-x-1.5 px-2 py-1 rounded text-xs">
                <i className={`fa-solid ${node.excluded ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                <span>{node.excluded ? '包含' : '排除'}</span>
              </button>
            )}
            <button onClick={(event) => { event.stopPropagation(); onDeleteFile(node.path); }} className="flex items-center space-x-1.5 px-2 py-1 rounded text-xs">
              <i className="fa-solid fa-trash-can"></i>
              <span>删除</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

const FileTree: React.FC<FileTreeProps> = ({ nodes, onFileSelect, onDeleteFile, onCopyPath, onToggleExclude, onDirDoubleClick, selectedFilePath, showCharCount }) => {
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(() => collectExpandedDirectoryPaths(nodes));
  const [focusedPath, setFocusedPath] = React.useState<string | null>(null);
  const virtuosoRef = React.useRef<VirtuosoHandle>(null);

  const handleToggleExpand = React.useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const collapseAll = () => setExpandedPaths(new Set());
  const expandAll = () => setExpandedPaths(collectExpandedDirectoryPaths(nodes));

  const visibleRows = React.useMemo(
    () => flattenVisibleTreeRows(nodes, expandedPaths, selectedFilePath, focusedPath),
    [nodes, expandedPaths, selectedFilePath, focusedPath]
  );

  const visiblePaths = React.useMemo(() => visibleRows.map(row => row.path), [visibleRows]);

  React.useEffect(() => {
    if (!focusedPath) return;
    const index = visiblePaths.indexOf(focusedPath);
    if (index >= 0) {
      virtuosoRef.current?.scrollToIndex({ index, align: 'center', behavior: 'auto' });
    }
  }, [focusedPath, visiblePaths]);

  return (
    <div className="p-2 h-full min-h-0" role="tree" aria-label="资源管理器" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-xs font-semibold text-light-subtle-text uppercase tracking-wider">资源管理器</h3>
        <div className="flex items-center gap-1">
          <button onClick={expandAll} className="w-6 h-6 rounded flex items-center justify-center text-light-subtle-text" title="全部展开">
            <i className="fa-solid fa-angles-down text-xs"></i>
          </button>
          <button onClick={collapseAll} className="w-6 h-6 rounded flex items-center justify-center text-light-subtle-text" title="全部折叠">
            <i className="fa-solid fa-angles-up text-xs"></i>
          </button>
        </div>
      </div>
      <div className="h-[calc(100%-2.5rem)] min-h-0">
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: '100%' }}
          data={visibleRows}
          increaseViewportBy={240}
          itemContent={(_index, row) => (
            <FileTreeRow
              key={row.path}
              row={row}
              onFileSelect={onFileSelect}
              onDeleteFile={onDeleteFile}
              onCopyPath={onCopyPath}
              onToggleExclude={onToggleExclude}
              onDirDoubleClick={onDirDoubleClick}
              onToggleExpand={handleToggleExpand}
              showCharCount={showCharCount}
            />
          )}
        />
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Run the component test to verify it passes**

Run: `npm test -- components/FileTree.test.tsx`
Expected: PASS and the mocked `virtuoso` container reports the full visible-row count while only a bounded slice is mounted.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json components/FileTree.tsx components/FileTree.test.tsx
git commit -m "feat: virtualize file tree rendering"
```

### Task 3: Restore Collapse And Keyboard Navigation Parity

**Files:**
- Modify: `components/FileTree.tsx`
- Modify: `components/FileTree.test.tsx`
- Test: `components/FileTree.test.tsx`

- [ ] **Step 1: Extend the component test with collapse and keyboard expectations**

```tsx
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
      showCharCount={false}
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
      showCharCount={false}
    />
  );

  const tree = screen.getByRole('tree', { name: '资源管理器' });
  tree.focus();

  fireEvent.keyDown(tree, { key: 'ArrowDown' });
  fireEvent.keyDown(tree, { key: 'ArrowDown' });
  fireEvent.keyDown(tree, { key: 'Enter' });

  expect(onFileSelect).toHaveBeenCalledWith('src/index.ts');
});
```

- [ ] **Step 2: Run the component test to verify it fails**

Run: `npm test -- components/FileTree.test.tsx`
Expected: FAIL because the virtualized version is not yet keeping the visible-path keyboard order and collapse behavior aligned.

- [ ] **Step 3: Update `FileTree.tsx` so navigation works from the flattened visible rows**

```tsx
const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
  if (!visiblePaths.length) return;

  const currentIdx = focusedPath ? visiblePaths.indexOf(focusedPath) : -1;

  switch (e.key) {
    case 'ArrowDown': {
      e.preventDefault();
      const next = currentIdx < visiblePaths.length - 1 ? currentIdx + 1 : 0;
      setFocusedPath(visiblePaths[next]);
      break;
    }
    case 'ArrowUp': {
      e.preventDefault();
      const prev = currentIdx > 0 ? currentIdx - 1 : visiblePaths.length - 1;
      setFocusedPath(visiblePaths[prev]);
      break;
    }
    case 'ArrowRight': {
      e.preventDefault();
      if (!focusedPath) break;
      const row = visibleRows.find(item => item.path === focusedPath);
      if (row?.node.isDirectory && !row.isOpen) {
        handleToggleExpand(focusedPath);
      }
      break;
    }
    case 'ArrowLeft': {
      e.preventDefault();
      if (!focusedPath) break;
      const row = visibleRows.find(item => item.path === focusedPath);
      if (row?.node.isDirectory && row.isOpen) {
        handleToggleExpand(focusedPath);
      }
      break;
    }
    case 'Enter': {
      e.preventDefault();
      if (!focusedPath) break;
      const row = visibleRows.find(item => item.path === focusedPath);
      if (!row) break;
      if (row.node.isDirectory) handleToggleExpand(focusedPath);
      else if (row.node.status === 'processed') onFileSelect(focusedPath);
      break;
    }
    case 'Escape':
      setFocusedPath(null);
      break;
  }
}, [visiblePaths, visibleRows, focusedPath, handleToggleExpand, onFileSelect]);
```

- [ ] **Step 4: Run the component test to verify it passes**

Run: `npm test -- components/FileTree.test.tsx`
Expected: PASS with virtualization, collapse, and keyboard navigation all green.

- [ ] **Step 5: Run the helper test again to verify no regression**

Run: `npm test -- components/fileTreeRows.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/FileTree.tsx components/FileTree.test.tsx
git commit -m "test: preserve file tree navigation behavior"
```

### Task 4: Run Full Verification And Smoke Checks

**Files:**
- Modify: `components/FileTree.tsx`
- Modify: `components/FileTree.test.tsx`
- Modify: `components/fileTreeRows.ts`
- Modify: `components/fileTreeRows.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `components/FileTree.test.tsx`
- Test: `components/fileTreeRows.test.ts`

- [ ] **Step 1: Run the focused tree tests together**

Run: `npm test -- components/FileTree.test.tsx components/fileTreeRows.test.ts`
Expected: PASS for all new tree-related tests.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS with no regressions in hooks or services tests.

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: PASS and output emitted to `dist/`.

- [ ] **Step 4: Manually verify the large-tree behavior in the app**

Run: `npm run dev`
Expected:
- loading a synthetic tree with thousands of files keeps the tree panel responsive
- scrolling the tree does not mount every visible file at once
- file selection, exclude/include, delete, and double-click-to-open still behave the same
- mobile and desktop tree panels still scroll correctly

- [ ] **Step 5: Commit**

```bash
git add components/FileTree.tsx components/FileTree.test.tsx components/fileTreeRows.ts components/fileTreeRows.test.ts package.json package-lock.json
git commit -m "chore: verify file tree virtualization"
```
