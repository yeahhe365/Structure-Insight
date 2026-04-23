import React from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { FileNode } from '../types';
import { getFileIcon } from './fileIcons';
import { collectExpandedDirectoryPaths, flattenVisibleTreeRows, type VisibleTreeRow } from './fileTreeRows';

interface FileTreeProps {
  nodes: FileNode[];
  treeResetKey?: unknown;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  onFileSelect: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onCopyPath: (path: string) => void;
  onToggleExclude: (path: string) => void;
  selectedFilePath: string | null;
}

const FILE_TREE_ROW_HEIGHT = 36;
const FILE_TREE_INDENT_REM = 1.25;

function buildDirectoryFileCounts(nodes: FileNode[]): Map<string, number> {
  const counts = new Map<string, number>();

  const walk = (node: FileNode): number => {
    if (!node.isDirectory) {
      return 1;
    }

    let fileCount = 0;
    for (const child of node.children) {
      fileCount += walk(child);
    }

    counts.set(node.path, fileCount);
    return fileCount;
  };

  for (const node of nodes) {
    walk(node);
  }

  return counts;
}

function getRowStatus(node: FileNode): { statusClass: string; title: string; displayName: string } {
  let statusClass = node.status === 'processed' || !node.status ? '' : 'cursor-default';
  let title = node.path;
  let displayName = node.name;

  if (node.status === 'skipped') {
    statusClass += ' opacity-60';
    title = `${node.path} (已跳过)`;
  } else if (node.status === 'error') {
    statusClass += ' text-red-500/80';
    displayName = `错误: ${node.name}`;
    title = `${node.path} (错误: 无法读取文件)`;
  } else if (node.excluded) {
    statusClass += ' opacity-50 italic decoration-slate-400';
    title = `${node.path} (已排除)`;
  }

  return { statusClass, title, displayName };
}

const FileTreeRow: React.FC<{
  row: VisibleTreeRow;
  isActionMenuOpen: boolean;
  onFileSelect: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onCopyPath: (path: string) => void;
  onToggleExclude: (path: string) => void;
  directoryFileCount: number;
  onToggleExpand: (path: string) => void;
  onToggleActionMenu: (path: string) => void;
  onCloseActionMenu: () => void;
}> = React.memo(({
  row,
  isActionMenuOpen,
  onFileSelect,
  onDeleteFile,
  onCopyPath,
  onToggleExclude,
  directoryFileCount,
  onToggleExpand,
  onToggleActionMenu,
  onCloseActionMenu,
}) => {
  const { node, level, isOpen, isSelected, isFocused } = row;
  const { statusClass, title, displayName } = getRowStatus(node);

  const handleToggle = () => {
    onCloseActionMenu();
    if (node.isDirectory) {
      onToggleExpand(node.path);
    }
  };

  const handleSelect = () => {
    onCloseActionMenu();
    if (!node.isDirectory && node.status === 'processed') {
      onFileSelect(node.path);
    } else if (node.isDirectory) {
      handleToggle();
    }
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onCloseActionMenu();
    onDeleteFile(node.path);
  };

  const handleToggleExcludeClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onCloseActionMenu();
    onToggleExclude(node.path);
  };

  const handleCopyPathClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onCloseActionMenu();
    onCopyPath(node.path);
  };

  const handleActionMenuToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleActionMenu(node.path);
  };

  const handleActionKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onCloseActionMenu();
    }
  };

  const iconElement = node.isDirectory
    ? <i className={`fa-solid ${isOpen ? 'fa-folder-open' : 'fa-folder'} w-5 text-center text-sky-500`}></i>
    : <i className={`${getFileIcon(node.name).icon} w-5 text-center ${getFileIcon(node.name).color}`}></i>;

  return (
    <div
      role="treeitem"
      aria-level={level}
      aria-expanded={node.isDirectory ? isOpen : undefined}
      aria-selected={isSelected || undefined}
      style={{ paddingLeft: `${Math.max(0, level - 1) * FILE_TREE_INDENT_REM}rem` }}
      className="list-none"
    >
      <div
        className={`group relative flex min-h-9 items-center py-1 px-2 rounded-md cursor-pointer hover:bg-light-border dark:hover:bg-dark-border/50 transition-colors duration-150 ${statusClass} ${isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''} ${isFocused ? 'ring-1 ring-primary/50 bg-primary/5' : ''}`}
        onClick={handleSelect}
        title={title}
        data-path={node.path}
      >
        {node.isDirectory ? (
          <span className="w-4 text-center shrink-0" onClick={(event) => { event.stopPropagation(); handleToggle(); }}>
            <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 text-light-subtle-text dark:text-dark-subtle-text ${isOpen ? 'rotate-0' : '-rotate-90'}`}></i>
          </span>
        ) : (
          <span className="w-4 shrink-0"></span>
        )}

        <span className="shrink-0 ml-2">{iconElement}</span>
        <span className={`truncate text-sm flex-1 min-w-0 ml-2 ${node.excluded ? 'line-through' : ''}`}>{displayName}</span>

        {node.isDirectory && (
          <span className="text-[10px] text-light-subtle-text dark:text-dark-subtle-text shrink-0 ml-1 tabular-nums">
            {directoryFileCount}
          </span>
        )}

        {!node.isDirectory && (
          <div className="relative ml-2 flex w-7 shrink-0 items-center justify-center opacity-100 pointer-events-auto">
            <button
              onClick={handleActionMenuToggle}
              onKeyDown={handleActionKeyDown}
              type="button"
              aria-haspopup="menu"
              aria-expanded={isActionMenuOpen}
              aria-label={`更多 ${node.path} 操作`}
              data-file-action-trigger
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-light-border bg-light-bg text-xs text-light-subtle-text shadow-sm transition-colors hover:border-primary hover:text-primary dark:border-dark-border dark:bg-dark-bg"
              title="更多操作"
            >
              <i className="fa-solid fa-ellipsis"></i>
            </button>

            {isActionMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-1 w-28 overflow-hidden rounded-lg border border-light-border bg-light-panel py-1 text-xs shadow-lg dark:border-dark-border dark:bg-dark-panel"
                data-file-action-menu
                onClick={(event) => event.stopPropagation()}
                onKeyDown={handleActionKeyDown}
              >
                <button
                  onClick={handleCopyPathClick}
                  type="button"
                  role="menuitem"
                  aria-label={`复制 ${node.path} 路径`}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-light-subtle-text transition-colors hover:bg-light-hover hover:text-primary dark:text-dark-subtle-text dark:hover:bg-dark-hover"
                >
                  <i className="fa-solid fa-copy w-3 text-center"></i>
                  路径
                </button>

                {node.status === 'processed' && (
                  <button
                    onClick={handleToggleExcludeClick}
                    type="button"
                    role="menuitem"
                    aria-label={node.excluded ? `包含 ${node.path}` : `排除 ${node.path}`}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-light-subtle-text transition-colors hover:bg-light-hover hover:text-primary dark:text-dark-subtle-text dark:hover:bg-dark-hover"
                  >
                    <i className={`fa-solid ${node.excluded ? 'fa-eye' : 'fa-eye-slash'} w-3 text-center`}></i>
                    {node.excluded ? '包含' : '排除'}
                  </button>
                )}

                <button
                  onClick={handleDelete}
                  type="button"
                  role="menuitem"
                  aria-label={`删除 ${node.path}`}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-light-subtle-text transition-colors hover:bg-red-50 hover:text-red-500 dark:text-dark-subtle-text dark:hover:bg-red-950/30"
                >
                  <i className="fa-solid fa-trash-can w-3 text-center"></i>
                  删除
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  treeResetKey,
  scrollContainerRef,
  onFileSelect,
  onDeleteFile,
  onCopyPath,
  onToggleExclude,
  selectedFilePath,
}) => {
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(() => collectExpandedDirectoryPaths(nodes));
  const [focusedPath, setFocusedPath] = React.useState<string | null>(null);
  const [openActionMenuPath, setOpenActionMenuPath] = React.useState<string | null>(null);
  const virtuosoRef = React.useRef<VirtuosoHandle>(null);
  const treeRef = React.useRef<HTMLDivElement>(null);
  const directoryFileCounts = React.useMemo(() => buildDirectoryFileCounts(nodes), [nodes]);

  React.useEffect(() => {
    setExpandedPaths(collectExpandedDirectoryPaths(nodes));
    setFocusedPath(null);
    setOpenActionMenuPath(null);
  }, [treeResetKey]);

  const handleToggleExpand = React.useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const visibleRows = React.useMemo(
    () => flattenVisibleTreeRows(nodes, expandedPaths, selectedFilePath, focusedPath),
    [nodes, expandedPaths, selectedFilePath, focusedPath]
  );

  const visiblePaths = React.useMemo(() => visibleRows.map(row => row.path), [visibleRows]);

  React.useEffect(() => {
    if (openActionMenuPath && !visiblePaths.includes(openActionMenuPath)) {
      setOpenActionMenuPath(null);
    }
  }, [openActionMenuPath, visiblePaths]);

  React.useEffect(() => {
    if (!openActionMenuPath) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest('[data-file-action-menu]') || target.closest('[data-file-action-trigger]')) {
        return;
      }

      if (treeRef.current?.contains(target)) {
        setOpenActionMenuPath(null);
        return;
      }

      setOpenActionMenuPath(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [openActionMenuPath]);

  React.useEffect(() => {
    if (!focusedPath) {
      return;
    }

    const index = visiblePaths.indexOf(focusedPath);
    if (index >= 0) {
      virtuosoRef.current?.scrollToIndex({ index, align: 'center', behavior: 'auto' });
    }
  }, [focusedPath, visiblePaths]);

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && openActionMenuPath) {
      event.preventDefault();
      setOpenActionMenuPath(null);
      return;
    }

    if (!visiblePaths.length) {
      return;
    }

    const currentIdx = focusedPath ? visiblePaths.indexOf(focusedPath) : -1;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = currentIdx < visiblePaths.length - 1 ? currentIdx + 1 : 0;
        setFocusedPath(visiblePaths[next]);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const prev = currentIdx > 0 ? currentIdx - 1 : visiblePaths.length - 1;
        setFocusedPath(visiblePaths[prev]);
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (!focusedPath) {
          break;
        }

        const row = visibleRows.find(item => item.path === focusedPath);
        if (row?.node.isDirectory && !row.isOpen) {
          handleToggleExpand(focusedPath);
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        if (!focusedPath) {
          break;
        }

        const row = visibleRows.find(item => item.path === focusedPath);
        if (row?.node.isDirectory && row.isOpen) {
          handleToggleExpand(focusedPath);
        }
        break;
      }
      case 'Enter': {
        event.preventDefault();
        if (!focusedPath) {
          break;
        }

        const row = visibleRows.find(item => item.path === focusedPath);
        if (!row) {
          break;
        }

        if (row.node.isDirectory) {
          handleToggleExpand(focusedPath);
        } else if (row.node.status === 'processed') {
          onFileSelect(focusedPath);
        }
        break;
      }
      case 'Escape':
        setFocusedPath(null);
        break;
    }
  }, [visiblePaths, visibleRows, focusedPath, handleToggleExpand, onFileSelect, openActionMenuPath]);

  const collapseAll = React.useCallback(() => {
    setOpenActionMenuPath(null);
    setExpandedPaths(new Set());
  }, []);

  const expandAll = React.useCallback(() => {
    setOpenActionMenuPath(null);
    setExpandedPaths(collectExpandedDirectoryPaths(nodes));
  }, [nodes]);

  const handleToggleActionMenu = React.useCallback((path: string) => {
    setOpenActionMenuPath(current => current === path ? null : path);
  }, []);

  const closeActionMenu = React.useCallback(() => {
    setOpenActionMenuPath(null);
  }, []);

  if (!nodes || nodes.length === 0) {
    return <div className="p-4 text-center text-sm text-light-subtle-text dark:text-dark-subtle-text">未加载文件。</div>;
  }

  return (
    <div ref={treeRef} className="p-2 h-full min-h-0 flex flex-col" role="tree" aria-label="资源管理器" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-xs font-semibold text-light-subtle-text dark:text-dark-subtle-text uppercase tracking-wider">资源管理器</h3>
        <div className="flex items-center gap-1">
          <button onClick={expandAll} className="w-6 h-6 rounded flex items-center justify-center text-light-subtle-text hover:text-primary hover:bg-light-border dark:hover:bg-dark-border/50 transition-colors" title="全部展开">
            <i className="fa-solid fa-angles-down text-xs"></i>
          </button>
          <button onClick={collapseAll} className="w-6 h-6 rounded flex items-center justify-center text-light-subtle-text hover:text-primary hover:bg-light-border dark:hover:bg-dark-border/50 transition-colors" title="全部折叠">
            <i className="fa-solid fa-angles-up text-xs"></i>
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: '100%' }}
          data={visibleRows}
          fixedItemHeight={FILE_TREE_ROW_HEIGHT}
          computeItemKey={(_index, row) => row.path}
          increaseViewportBy={240}
          scrollerRef={ref => {
            if (scrollContainerRef) {
              scrollContainerRef.current = ref instanceof HTMLElement ? ref : null;
            }
          }}
          itemContent={(_index, row) => (
            <FileTreeRow
              row={row}
              isActionMenuOpen={openActionMenuPath === row.path}
              onFileSelect={onFileSelect}
              onDeleteFile={onDeleteFile}
              onCopyPath={onCopyPath}
              onToggleExclude={onToggleExclude}
              directoryFileCount={directoryFileCounts.get(row.path) ?? 0}
              onToggleExpand={handleToggleExpand}
              onToggleActionMenu={handleToggleActionMenu}
              onCloseActionMenu={closeActionMenu}
            />
          )}
        />
      </div>
    </div>
  );
};

export default React.memo(FileTree);
