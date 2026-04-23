
import React from 'react';
import { motion } from 'framer-motion';
import { FileContent } from '../types';

interface FileRankDialogProps {
    isOpen: boolean;
    onClose: () => void;
    files: FileContent[];
    onSelectFile: (path: string) => void;
    onCopyPath: (path: string) => void;
    onDeleteFile: (path: string) => void;
    onToggleExclude: (path: string) => void;
}

const FileRankDialog: React.FC<FileRankDialogProps> = ({ isOpen, onClose, files, onSelectFile, onCopyPath, onDeleteFile, onToggleExclude }) => {
    const [sortBy, setSortBy] = React.useState<'size' | 'name' | 'type'>('size');
    const [searchQuery, setSearchQuery] = React.useState('');

    // Prevent interaction with background and handle Esc
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const sortedFiles = React.useMemo(() => {
        let filtered = files;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = files.filter(f => f.path.toLowerCase().includes(q));
        }
        const sorted = [...filtered];
        if (sortBy === 'size') {
            sorted.sort((a, b) => b.stats.chars - a.stats.chars);
        } else if (sortBy === 'name') {
            sorted.sort((a, b) => a.path.localeCompare(b.path));
        } else {
            const getExt = (path: string) => { const dot = path.lastIndexOf('.'); return dot >= 0 ? path.slice(dot) : ''; };
            sorted.sort((a, b) => getExt(a.path).localeCompare(getExt(b.path)) || a.path.localeCompare(b.path));
        }
        return sorted;
    }, [files, sortBy, searchQuery]);
    
    const maxChars = sortedFiles.length > 0 ? sortedFiles[0].stats.chars : 0;

    const ActionButton = ({
        icon,
        label,
        onClick,
        className = "",
        danger = false,
        ariaLabel,
    }: {
        icon: string,
        label: string,
        onClick: (e: React.MouseEvent) => void,
        className?: string,
        danger?: boolean,
        ariaLabel: string,
    }) => (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className={`flex h-7 w-7 items-center justify-center rounded border border-light-border bg-white text-xs text-light-subtle-text shadow-sm transition-all hover:border-primary hover:text-primary dark:border-dark-border dark:bg-dark-bg md:h-auto md:w-auto md:space-x-1.5 md:px-2 md:py-1 ${danger ? 'hover:border-red-500 hover:text-red-500' : ''} ${className}`}
            title={label}
        >
            <i className={`fa-solid ${icon}`}></i>
            <span className="hidden md:inline">{label}</span>
        </button>
    );

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-light-panel dark:bg-dark-panel rounded-xl shadow-2xl border border-light-border dark:border-dark-border w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
            >
                {/* Header */}
                 <div className="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/50 backdrop-blur-md shrink-0">
                    <h3 className="font-bold text-lg text-light-text dark:text-dark-text flex items-center gap-2">
                        <i className="fa-solid fa-arrow-down-short-wide text-primary"></i>
                        文件大小排行
                    </h3>
                    <button 
                        onClick={onClose} 
                        aria-label="关闭文件大小排行"
                        className="w-8 h-8 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center text-light-subtle-text dark:text-dark-subtle-text transition-colors"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-1.5 px-6 py-2 border-b border-light-border dark:border-dark-border bg-light-bg/30 dark:bg-dark-bg/30 shrink-0">
                    <div className="relative flex-1 mr-2">
                        <i className="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-light-subtle-text dark:text-dark-subtle-text"></i>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索文件..."
                            className="w-full pl-7 pr-3 py-1 text-xs bg-light-panel dark:bg-dark-panel border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text mr-1">排序:</span>
                    {([['size', '大小'], ['name', '名称'], ['type', '类型']] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setSortBy(key)}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                sortBy === key
                                    ? 'bg-primary text-white'
                                    : 'bg-light-bg dark:bg-dark-bg text-light-subtle-text dark:text-dark-subtle-text hover:bg-light-border dark:hover:bg-dark-border'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {sortedFiles.length === 0 ? (
                        <div className="text-center p-8 text-light-subtle-text dark:text-dark-subtle-text">
                            没有可显示的文件
                        </div>
                    ) : (
                        sortedFiles.map((file, index) => {
                             const percentage = maxChars > 0 ? (file.stats.chars / maxChars) * 100 : 0;
                             const isExcluded = !!file.excluded;
                             
                             return (
                                <div
                                    key={file.path}
                                    className={`relative group rounded-lg border border-transparent hover:border-light-border dark:hover:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg transition-all overflow-hidden ${isExcluded ? 'opacity-60 italic' : ''}`}
                                >
                                    <button
                                        onClick={() => { onSelectFile(file.path); onClose(); }}
                                        className="relative w-full flex items-center p-3 text-left overflow-hidden z-10"
                                    >
                                        {/* Progress Bar Background */}
                                        <div 
                                            className="absolute left-0 top-0 bottom-0 bg-primary/5 dark:bg-primary/10 transition-all duration-500 -z-10"
                                            style={{ width: `${percentage}%` }}
                                        />
                                        
                                        {/* Content */}
                                        <div className="flex items-center w-full gap-4">
                                            <span className={`font-mono text-sm w-8 text-center shrink-0 ${index < 3 ? 'text-primary font-bold' : 'text-light-subtle-text dark:text-dark-subtle-text'}`}>
                                                #{index + 1}
                                            </span>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-medium text-light-text dark:text-dark-text truncate ${isExcluded ? 'line-through' : ''}`} title={file.path}>
                                                    {file.path}
                                                </div>
                                                <div className="text-xs text-light-subtle-text dark:text-dark-subtle-text truncate opacity-80">
                                                    {file.language}
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="text-sm font-bold text-primary tabular-nums">
                                                    {file.stats.chars.toLocaleString()} <span className="text-xs font-normal opacity-70">字符</span>
                                                </div>
                                                <div className="text-xs text-light-subtle-text dark:text-dark-subtle-text tabular-nums opacity-70">
                                                    {file.stats.lines.toLocaleString()} 行
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                    
                                    {/* Action Toolbar */}
                                    <div className="relative z-20 px-3 pb-2 flex items-center space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity md:translate-y-1 md:group-hover:translate-y-0 md:group-focus-within:translate-y-0 duration-200">
                                        <div className="ml-12 flex items-center space-x-2">
                                            <ActionButton 
                                                icon="fa-copy" 
                                                label="路径" 
                                                ariaLabel={`复制 ${file.path} 路径`}
                                                onClick={(e) => { e.stopPropagation(); onCopyPath(file.path); }} 
                                            />
                                            <ActionButton 
                                                icon={isExcluded ? "fa-eye" : "fa-eye-slash"} 
                                                label={isExcluded ? "包含" : "排除"} 
                                                ariaLabel={isExcluded ? `包含 ${file.path}` : `排除 ${file.path}`}
                                                onClick={(e) => { e.stopPropagation(); onToggleExclude(file.path); }} 
                                            />
                                            <ActionButton 
                                                icon="fa-trash-can" 
                                                label="删除" 
                                                ariaLabel={`删除 ${file.path}`}
                                                onClick={(e) => { e.stopPropagation(); onDeleteFile(file.path); }} 
                                                danger 
                                            />
                                        </div>
                                    </div>
                                </div>
                             );
                        })
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default React.memo(FileRankDialog);
