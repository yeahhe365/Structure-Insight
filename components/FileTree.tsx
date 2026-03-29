
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

type IconEntry = { icon: string; color: string };

// Special filename lookups (exact match, lowercase)
const specialFileMap = new Map<string, IconEntry>([
  ['package.json', { icon: 'fa-brands fa-npm', color: 'text-[#CB3837]' }],
  ['dockerfile', { icon: 'fa-brands fa-docker', color: 'text-[#2496ED]' }],
  ['makefile', { icon: 'fa-solid fa-gavel', color: 'text-gray-500' }],
  ['jenkinsfile', { icon: 'fa-brands fa-jenkins', color: 'text-[#D24939]' }],
  ['readme.md', { icon: 'fa-brands fa-markdown', color: 'text-gray-700 dark:text-gray-300' }],
  ['.gitignore', { icon: 'fa-brands fa-git-alt', color: 'text-[#F05032]' }],
  ['.gitattributes', { icon: 'fa-brands fa-git-alt', color: 'text-[#F05032]' }],
]);

// Extension-to-icon mapping for O(1) lookups
const extensionMap = new Map<string, IconEntry>([
  // Web
  ['html', { icon: 'fa-brands fa-html5', color: 'text-[#E34F26]' }],
  ['htm', { icon: 'fa-brands fa-html5', color: 'text-[#E34F26]' }],
  ['css', { icon: 'fa-brands fa-css3-alt', color: 'text-[#1572B6]' }],
  ['scss', { icon: 'fa-brands fa-sass', color: 'text-[#CC6699]' }],
  ['sass', { icon: 'fa-brands fa-sass', color: 'text-[#CC6699]' }],
  ['less', { icon: 'fa-brands fa-less', color: 'text-[#1D365D]' }],
  ['js', { icon: 'fa-brands fa-js', color: 'text-[#F7DF1E]' }],
  ['cjs', { icon: 'fa-brands fa-js', color: 'text-[#F7DF1E]' }],
  ['mjs', { icon: 'fa-brands fa-js', color: 'text-[#F7DF1E]' }],
  ['ts', { icon: 'fa-brands fa-js', color: 'text-[#3178C6]' }],
  ['jsx', { icon: 'fa-brands fa-react', color: 'text-[#61DAFB]' }],
  ['tsx', { icon: 'fa-brands fa-react', color: 'text-[#61DAFB]' }],
  ['vue', { icon: 'fa-brands fa-vuejs', color: 'text-[#4FC08D]' }],
  ['svelte', { icon: 'fa-solid fa-code', color: 'text-[#FF3E00]' }],
  ['php', { icon: 'fa-brands fa-php', color: 'text-[#777BB4]' }],
  // Backend / Systems
  ['py', { icon: 'fa-brands fa-python', color: 'text-[#3776AB]' }],
  ['pyc', { icon: 'fa-brands fa-python', color: 'text-[#3776AB]' }],
  ['java', { icon: 'fa-brands fa-java', color: 'text-[#007396]' }],
  ['class', { icon: 'fa-brands fa-java', color: 'text-[#007396]' }],
  ['jar', { icon: 'fa-brands fa-java', color: 'text-[#007396]' }],
  ['rb', { icon: 'fa-regular fa-gem', color: 'text-[#CC342D]' }],
  ['go', { icon: 'fa-brands fa-golang', color: 'text-[#00ADD8]' }],
  ['rs', { icon: 'fa-brands fa-rust', color: 'text-[#DEA584]' }],
  ['swift', { icon: 'fa-brands fa-swift', color: 'text-[#F05138]' }],
  ['c', { icon: 'fa-solid fa-c', color: 'text-[#555555]' }],
  ['h', { icon: 'fa-solid fa-c', color: 'text-[#555555]' }],
  ['cpp', { icon: 'fa-solid fa-c', color: 'text-[#00599C]' }],
  ['hpp', { icon: 'fa-solid fa-c', color: 'text-[#00599C]' }],
  ['cc', { icon: 'fa-solid fa-c', color: 'text-[#00599C]' }],
  ['cs', { icon: 'fa-solid fa-code', color: 'text-[#239120]' }],
  // Scripts
  ['sh', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  ['bash', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  ['zsh', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  ['ps1', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  ['bat', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  ['cmd', { icon: 'fa-solid fa-terminal', color: 'text-gray-500' }],
  // Data / Config
  ['json', { icon: 'fa-solid fa-code', color: 'text-yellow-600' }],
  ['xml', { icon: 'fa-solid fa-code', color: 'text-orange-500' }],
  ['yaml', { icon: 'fa-solid fa-list', color: 'text-purple-500' }],
  ['yml', { icon: 'fa-solid fa-list', color: 'text-purple-500' }],
  ['toml', { icon: 'fa-solid fa-gear', color: 'text-gray-500' }],
  ['ini', { icon: 'fa-solid fa-gear', color: 'text-gray-500' }],
  ['env', { icon: 'fa-solid fa-gear', color: 'text-gray-500' }],
  ['sql', { icon: 'fa-solid fa-database', color: 'text-blue-400' }],
  ['db', { icon: 'fa-solid fa-database', color: 'text-blue-400' }],
  ['sqlite', { icon: 'fa-solid fa-database', color: 'text-blue-400' }],
  // Documents
  ['md', { icon: 'fa-brands fa-markdown', color: 'text-gray-700 dark:text-gray-300' }],
  ['txt', { icon: 'fa-regular fa-file-lines', color: 'text-gray-400' }],
  ['pdf', { icon: 'fa-regular fa-file-pdf', color: 'text-red-500' }],
  ['doc', { icon: 'fa-regular fa-file-word', color: 'text-blue-700' }],
  ['docx', { icon: 'fa-regular fa-file-word', color: 'text-blue-700' }],
  ['xls', { icon: 'fa-regular fa-file-excel', color: 'text-green-600' }],
  ['xlsx', { icon: 'fa-regular fa-file-excel', color: 'text-green-600' }],
  ['csv', { icon: 'fa-regular fa-file-excel', color: 'text-green-600' }],
  ['ppt', { icon: 'fa-regular fa-file-powerpoint', color: 'text-orange-600' }],
  ['pptx', { icon: 'fa-regular fa-file-powerpoint', color: 'text-orange-600' }],
  // Media
  ['png', { icon: 'fa-regular fa-file-image', color: 'text-purple-500' }],
  ['jpg', { icon: 'fa-regular fa-file-image', color: 'text-purple-500' }],
  ['jpeg', { icon: 'fa-regular fa-file-image', color: 'text-purple-500' }],
  ['gif', { icon: 'fa-regular fa-file-image', color: 'text-purple-500' }],
  ['svg', { icon: 'fa-regular fa-file-image', color: 'text-purple-500' }],
  ['ico', { icon: 'fa-regular fa-file-image', color: 'text-purple-500' }],
  ['webp', { icon: 'fa-regular fa-file-image', color: 'text-purple-500' }],
  ['mp3', { icon: 'fa-regular fa-file-audio', color: 'text-yellow-600' }],
  ['wav', { icon: 'fa-regular fa-file-audio', color: 'text-yellow-600' }],
  ['ogg', { icon: 'fa-regular fa-file-audio', color: 'text-yellow-600' }],
  ['mp4', { icon: 'fa-regular fa-file-video', color: 'text-pink-600' }],
  ['mov', { icon: 'fa-regular fa-file-video', color: 'text-pink-600' }],
  ['avi', { icon: 'fa-regular fa-file-video', color: 'text-pink-600' }],
  ['webm', { icon: 'fa-regular fa-file-video', color: 'text-pink-600' }],
  // Archives
  ['zip', { icon: 'fa-regular fa-file-zipper', color: 'text-amber-600' }],
  ['rar', { icon: 'fa-regular fa-file-zipper', color: 'text-amber-600' }],
  ['7z', { icon: 'fa-regular fa-file-zipper', color: 'text-amber-600' }],
  ['tar', { icon: 'fa-regular fa-file-zipper', color: 'text-amber-600' }],
  ['gz', { icon: 'fa-regular fa-file-zipper', color: 'text-amber-600' }],
  // Fonts
  ['ttf', { icon: 'fa-solid fa-font', color: 'text-gray-500' }],
  ['otf', { icon: 'fa-solid fa-font', color: 'text-gray-500' }],
  ['woff', { icon: 'fa-solid fa-font', color: 'text-gray-500' }],
  ['woff2', { icon: 'fa-solid fa-font', color: 'text-gray-500' }],
]);

const defaultIcon: IconEntry = { icon: 'fa-regular fa-file', color: 'text-gray-400 dark:text-gray-500' };

const getFileIcon = (fileName: string): IconEntry => {
    const lowerName = fileName.toLowerCase();

    // Check special filenames first
    const special = specialFileMap.get(lowerName);
    if (special) return special;

    // Check config file patterns
    if (lowerName.endsWith('.config.js') || lowerName.endsWith('.config.ts')) {
      return { icon: 'fa-solid fa-gear', color: 'text-gray-500' };
    }

    // Extension lookup
    const ext = lowerName.split('.').pop()!;
    return extensionMap.get(ext) ?? defaultIcon;
};

export { getFileIcon };
export type { IconEntry };

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

  // Determine icon
  let iconElement;
  if (node.isDirectory) {
      iconElement = isOpen 
        ? <i className="fa-solid fa-folder-open w-5 text-center text-sky-500"></i> 
        : <i className="fa-solid fa-folder w-5 text-center text-sky-500"></i>;
  } else {
      const { icon, color } = getFileIcon(node.name);
      iconElement = <i className={`${icon} w-5 text-center ${color}`}></i>;
  }
  
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
        className={`group flex flex-col py-1 px-2 rounded-md cursor-pointer hover:bg-light-border dark:hover:bg-dark-border/50 transition-colors duration-150 ${statusClass} ${isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
        onClick={handleSelect}
        title={title}
      >
        {/* Top Row: Icon, Name, Stats */}
        <div className="flex items-center space-x-2 w-full">
            {node.isDirectory && (
            <span className="w-4 text-center shrink-0" onClick={(e) => { e.stopPropagation(); handleToggle(); }}>
                <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 text-light-subtle-text dark:text-dark-subtle-text ${isOpen ? 'rotate-0' : '-rotate-90'}`}></i>
            </span>
            )}
            {!node.isDirectory && <span className="w-4 shrink-0"></span>}
            
            <span className="shrink-0">{iconElement}</span>
            
            <span className={`truncate text-sm flex-1 ${node.excluded ? 'line-through' : ''}`}>{displayName}</span>
            
            {!node.isDirectory && node.status === 'processed' && (
                <div className={`flex items-center space-x-2 text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0 ml-2 transition-opacity ${showCharCount ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {typeof node.chars === 'number' && (
                        <span title={`${node.chars} 个字符`}>{node.chars}</span>
                    )}
                    {typeof node.lines === 'number' && (
                        <span className="border-l border-light-border dark:border-dark-border pl-2" title={`${node.lines} 行`}>{node.lines}</span>
                    )}
                </div>
            )}
        </div>

        {/* Bottom Row: Action Buttons (Only for files, on Hover) */}
        {!node.isDirectory && (
            <div className="hidden group-hover:flex items-center space-x-2 pl-9 mt-1.5 pb-0.5 animate-enter origin-top w-full overflow-x-auto no-scrollbar">
                <button 
                    onClick={(e) => { e.stopPropagation(); onCopyPath(node.path); }}
                    className="flex items-center space-x-1.5 px-2 py-1 rounded text-xs bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border shadow-sm text-light-subtle-text hover:text-primary hover:border-primary transition-colors shrink-0"
                    title="复制完整路径"
                >
                    <i className="fa-regular fa-copy"></i>
                    <span>路径</span>
                </button>
                
                {node.status === 'processed' && (
                    <button 
                        onClick={handleToggleExcludeClick}
                        className="flex items-center space-x-1.5 px-2 py-1 rounded text-xs bg-white dark:bg-dark-bg border border-light-border dark:border-dark-border shadow-sm text-light-subtle-text hover:text-primary hover:border-primary transition-colors shrink-0"
                        title={node.excluded ? "包含此文件" : "从分析中排除"}
                    >
                        <i className={`fa-solid ${node.excluded ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                        <span>{node.excluded ? "包含" : "排除"}</span>
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
