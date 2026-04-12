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
      if (!node.isDirectory) {
        continue;
      }

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
