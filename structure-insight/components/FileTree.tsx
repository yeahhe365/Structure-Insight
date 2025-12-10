
import React from 'react';
import { FileNode } from '../types';

interface FileTreeProps {
  nodes: FileNode[];
  onFileSelect: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onCopyPath: (path: string) => void;
  onToggleExclude: (path: string) => void;
  selectedFilePath: string | null;
  showCharCount: boolean;
}

const FileTreeNode: React.FC<{ 
    node: FileNode; 
    onFileSelect: (path: string) => void; 
    onDeleteFile: (path: string) => void; 
    onCopyPath: (path: string) => void; 
    onToggleExclude: (path: string) => void;
    level: number; 
    selectedFilePath: string | null; 
    showCharCount: boolean; 
}> = React.memo(({ node, onFileSelect, onDeleteFile, onCopyPath, onToggleExclude, level, selectedFilePath, showCharCount }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleToggle = () => {
    if (node.isDirectory) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = () => {
    if (!node.isDirectory && node.status === 'processed') {
      onFileSelect(node.path);
    } else if (node.isDirectory) {
      handleToggle();
    }
  };
  
  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDeleteFile(node.path);
  }

  const handleToggleExcludeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleExclude(node.path);
  }

  const icon = node.isDirectory
    ? (isOpen ? <i className="fa-solid fa-folder-open w-5 text-sky-500"></i> : <i className="fa-solid fa-folder w-5 text-sky-500"></i>)
    : <i className="fa-regular fa-file-lines w-5 text-gray-400 dark:text-gray-500"></i>;
  
  let statusClass = node.status === 'processed' || !node.status ? '' : 'cursor-default';
  let title = node.path;
  let displayName = node.name;
  const isSelected = !node.isDirectory && node.path === selectedFilePath;


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


  return (
    <li style={{ paddingLeft: `${level > 1 ? 1.25 : 0}rem` }} className="list-none">
      <div
        className={`group flex items-center space-x-2 py-1 px-2 rounded-md cursor-pointer hover:bg-light-border dark:hover:bg-dark-border/50 transition-colors duration-150 ${statusClass} ${isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
        onClick={handleSelect}
        title={title}
      >
        {node.isDirectory && (
          <span className="w-4 text-center" onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
            <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 text-light-subtle-text dark:text-dark-subtle-text ${isOpen ? 'rotate-0' : '-rotate-90'}`}></i>
          </span>
        )}
        {!node.isDirectory && <span className="w-4"></span>}
        {icon}
        <span className={`truncate text-sm flex-1 ${node.excluded ? 'line-through' : ''}`}>{displayName}</span>
        
         <button 
            onClick={(e) => { e.stopPropagation(); onCopyPath(node.path); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-light-subtle-text dark:text-dark-subtle-text hover:text-primary dark:hover:text-primary mr-1 w-5 h-5 flex items-center justify-center rounded hover:bg-light-border dark:hover:bg-dark-border/50"
            title="复制路径"
        >
              <i className="fa-regular fa-copy text-xs"></i>
        </button>
        
        {!node.isDirectory && node.status === 'processed' && (
            <button 
                onClick={handleToggleExcludeClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-light-subtle-text dark:text-dark-subtle-text hover:text-primary dark:hover:text-primary mr-1 w-5 h-5 flex items-center justify-center rounded hover:bg-light-border dark:hover:bg-dark-border/50"
                title={node.excluded ? "包含文件" : "排除文件"}
            >
                <i className={`fa-solid ${node.excluded ? 'fa-eye' : 'fa-eye-slash'} text-xs`}></i>
            </button>
        )}

        {!node.isDirectory && node.status === 'processed' && (
            <div className={`flex items-center space-x-2 text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0 transition-opacity ${showCharCount ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {typeof node.chars === 'number' && (
                    <span title={`${node.chars} 个字符`}>{node.chars}</span>
                )}
                {typeof node.lines === 'number' && (
                    <span className="border-l border-light-border dark:border-dark-border pl-2" title={`${node.lines} 行`}>{node.lines}</span>
                )}
            </div>
        )}
         {!node.isDirectory && (
          <button 
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-light-subtle-text dark:text-dark-subtle-text hover:text-red-500 dark:hover:text-red-400"
            title={`删除 ${node.name}`}
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
          </button>
        )}
      </div>
      {node.isDirectory && isOpen && (
        <ul className="pl-0">
          {node.children.map(child => (
            <FileTreeNode key={child.path} node={child} onFileSelect={onFileSelect} onDeleteFile={onDeleteFile} onCopyPath={onCopyPath} onToggleExclude={onToggleExclude} level={level + 1} selectedFilePath={selectedFilePath} showCharCount={showCharCount} />
          ))}
        </ul>
      )}
    </li>
  );
});

const FileTree: React.FC<FileTreeProps> = ({ nodes, onFileSelect, onDeleteFile, onCopyPath, onToggleExclude, selectedFilePath, showCharCount }) => {
  if (!nodes || nodes.length === 0) {
    return <div className="p-4 text-center text-sm text-light-subtle-text dark:text-dark-subtle-text">未加载文件。</div>;
  }
  return (
    <div className="p-2">
      <h3 className="text-xs font-semibold px-2 mb-2 text-light-subtle-text dark:text-dark-subtle-text uppercase tracking-wider">资源管理器</h3>
      <ul className="pl-0">
        {nodes.map(node => (
          <FileTreeNode key={node.path} node={node} onFileSelect={onFileSelect} onDeleteFile={onDeleteFile} onCopyPath={onCopyPath} onToggleExclude={onToggleExclude} level={1} selectedFilePath={selectedFilePath} showCharCount={showCharCount} />
        ))}
      </ul>
    </div>
  );
};

export default React.memo(FileTree);