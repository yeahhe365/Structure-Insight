import React from 'react';
import { FileNode } from '../types';

interface FileTreeProps {
  nodes: FileNode[];
  onFileSelect: (path: string) => void;
  onDeleteFile: (path: string) => void;
}

const FileTreeNode: React.FC<{ node: FileNode; onFileSelect: (path: string) => void; onDeleteFile: (path: string) => void; level: number }> = ({ node, onFileSelect, onDeleteFile, level }) => {
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

  const icon = node.isDirectory
    ? (isOpen ? <i className="fa-solid fa-folder-open w-5 text-sky-400"></i> : <i className="fa-solid fa-folder w-5 text-sky-400"></i>)
    : <i className="fa-regular fa-file-lines w-5 text-gray-400"></i>;
  
  let statusClass = node.status === 'processed' || !node.status ? '' : 'cursor-default';
  let title = node.path;
  let displayName = node.name;

  if (node.status === 'skipped') {
      statusClass += ' opacity-50';
      title = `${node.path} (已跳过)`;
  } else if (node.status === 'error') {
      statusClass += ' text-red-500/80';
      displayName = `错误: ${node.name}`;
      title = `${node.path} (错误: 无法读取文件)`;
  }


  return (
    <li style={{ paddingLeft: `${level > 1 ? 1.25 : 0}rem` }} className="list-none">
      <div
        className={`group flex items-center space-x-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-light-border dark:hover:bg-dark-border transition-colors duration-150 ${statusClass}`}
        onClick={handleSelect}
        title={title}
      >
        {node.isDirectory && (
          <span className="w-4 text-center" onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
            <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}></i>
          </span>
        )}
        {!node.isDirectory && <span className="w-4"></span>}
        {icon}
        <span className="truncate text-sm flex-1">{displayName}</span>
        {!node.isDirectory && node.status === 'processed' && typeof node.lines === 'number' && (
            <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0">
                {node.lines}
            </span>
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
            <FileTreeNode key={child.path} node={child} onFileSelect={onFileSelect} onDeleteFile={onDeleteFile} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ nodes, onFileSelect, onDeleteFile }) => {
  if (!nodes || nodes.length === 0) {
    return <div className="p-4 text-center text-sm text-light-subtle-text dark:text-dark-subtle-text">未加载文件。</div>;
  }
  return (
    <div className="p-2">
      <h3 className="text-sm font-semibold px-2 mb-2 text-light-subtle-text dark:text-dark-subtle-text uppercase tracking-wider">资源管理器</h3>
      <ul className="pl-0">
        {nodes.map(node => (
          <FileTreeNode key={node.path} node={node} onFileSelect={onFileSelect} onDeleteFile={onDeleteFile} level={1} />
        ))}
      </ul>
    </div>
  );
};

export default FileTree;