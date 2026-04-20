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
  onDirDoubleClick?: () => void;
  selectedFilePath: string | null;
}

function countFiles(node: FileNode): number {
  if (!node.isDirectory) {
    return 1;
  }

  let count = 0;
  for (const child of node.children) {
    count += countFiles(child);
  }
  return count;
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
  onFileSelect: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onCopyPath: (path: string) => void;
  onToggleExclude: (path: string) => void;
  onDirDoubleClick?: () => void;
  onToggleExpand: (path: string) => void;
}> = React.memo(({ row, onFileSelect, onDeleteFile, onCopyPath, onToggleExclude, onDirDoubleClick, onToggleExpand }) => {
  const { node, level, isOpen, isSelected, isFocused } = row;
  const { statusClass, title, displayName } = getRowStatus(node);

  const handleToggle = () => {
    if (node.isDirectory) {
      onToggleExpand(node.path);
    }
  };

  const handleSelect = () => {
    if (!node.isDirectory && node.status === 'processed') {
      onFileSelect(node.path);
    } else if (node.isDirectory) {
      handleToggle();
    }
  };

  const handleDoubleClick = () => {
    if (node.isDirectory && onDirDoubleClick) {
      onToggleExpand(node.path);
      onDirDoubleClick();
    }
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDeleteFile(node.path);
  };

  const handleToggleExcludeClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleExclude(node.path);
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
      style={{ paddingLeft: `${level > 1 ? 1.25 : 0}rem` }}
      className="list-none"
    >
      <div
        className={`group relative flex min-h-9 items-center py-1 px-2 rounded-md cursor-pointer hover:bg-light-border dark:hover:bg-dark-border/50 transition-colors duration-150 ${statusClass} ${isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''} ${isFocused ? 'ring-1 ring-primary/50 bg-primary/5' : ''}`}
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
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
          <span className="text-[10px] text-light-subtle-text/60 dark:text-dark-subtle-text/60 shrink-0 ml-1 tabular-nums">
            {countFiles(node)}
          </span>
        )}

        {!node.isDirectory && (
          <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center space-x-2 rounded-md bg-light-panel/95 px-1 py-0.5 opacity-0 shadow-sm backdrop-blur-sm pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto dark:bg-dark-panel/95">
            <button
              onClick={(event) => { event.stopPropagation(); onCopyPath(node.path); }}
              className="flex items-center space-x-1.5 px-2 py-1 rounded text-xs bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border shadow-sm text-light-subtle-text hover:text-primary hover:border-primary transition-colors shrink-0"
              title="复制完整路径"
            >
              <i className="fa-solid fa-copy"></i>
              <span>路径</span>
            </button>

            {node.status === 'processed' && (
              <button
                onClick={handleToggleExcludeClick}
                className="flex items-center space-x-1.5 px-2 py-1 rounded text-xs bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border shadow-sm text-light-subtle-text hover:text-primary hover:border-primary transition-colors shrink-0"
                title={node.excluded ? '包含此文件' : '从分析中排除'}
              >
                <i className={`fa-solid ${node.excluded ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                <span>{node.excluded ? '包含' : '排除'}</span>
              </button>
            )}

            <button
              onClick={handleDelete}
              className="flex items-center space-x-1.5 px-2 py-1 rounded text-xs bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border shadow-sm text-light-subtle-text hover:text-red-500 hover:border-red-500 transition-colors shrink-0"
              title="从列表中移除"
            >
              <i className="fa-solid fa-trash-can"></i>
              <span>删除</span>
            </button>
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
  onDirDoubleClick,
  selectedFilePath,
}) => {
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(() => collectExpandedDirectoryPaths(nodes));
  const [focusedPath, setFocusedPath] = React.useState<string | null>(null);
  const virtuosoRef = React.useRef<VirtuosoHandle>(null);

  React.useEffect(() => {
    setExpandedPaths(collectExpandedDirectoryPaths(nodes));
    setFocusedPath(null);
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
    if (!focusedPath) {
      return;
    }

    const index = visiblePaths.indexOf(focusedPath);
    if (index >= 0) {
      virtuosoRef.current?.scrollToIndex({ index, align: 'center', behavior: 'auto' });
    }
  }, [focusedPath, visiblePaths]);

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
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
  }, [visiblePaths, visibleRows, focusedPath, handleToggleExpand, onFileSelect]);

  const collapseAll = React.useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  const expandAll = React.useCallback(() => {
    setExpandedPaths(collectExpandedDirectoryPaths(nodes));
  }, [nodes]);

  if (!nodes || nodes.length === 0) {
    return <div className="p-4 text-center text-sm text-light-subtle-text dark:text-dark-subtle-text">未加载文件。</div>;
  }

  return (
    <div className="p-2 h-full min-h-0 flex flex-col" role="tree" aria-label="资源管理器" tabIndex={0} onKeyDown={handleKeyDown}>
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
              onFileSelect={onFileSelect}
              onDeleteFile={onDeleteFile}
            onCopyPath={onCopyPath}
            onToggleExclude={onToggleExclude}
            onDirDoubleClick={onDirDoubleClick}
            onToggleExpand={handleToggleExpand}
          />
        )}
      />
      </div>
    </div>
  );
};

export default React.memo(FileTree);
