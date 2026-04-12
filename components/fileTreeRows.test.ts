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
