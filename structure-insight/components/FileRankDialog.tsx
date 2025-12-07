
import React from 'react';
import { motion } from 'framer-motion';
import { FileContent } from '../types';

interface FileRankDialogProps {
    isOpen: boolean;
    onClose: () => void;
    files: FileContent[];
    onSelectFile: (path: string) => void;
    onCopyPath: (path: string) => void;
}

const FileRankDialog: React.FC<FileRankDialogProps> = ({ isOpen, onClose, files, onSelectFile, onCopyPath }) => {
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
        return [...files].sort((a, b) => b.stats.chars - a.stats.chars);
    }, [files]);
    
    const maxChars = sortedFiles.length > 0 ? sortedFiles[0].stats.chars : 0;

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
                        className="w-8 h-8 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center text-light-subtle-text dark:text-dark-subtle-text transition-colors"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
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
                             return (
                                <button
                                    key={file.path}
                                    onClick={() => { onSelectFile(file.path); onClose(); }}
                                    className="relative w-full group flex items-center p-3 rounded-lg border border-transparent hover:border-light-border dark:hover:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg transition-all text-left overflow-hidden"
                                >
                                    {/* Progress Bar Background */}
                                    <div 
                                        className="absolute left-0 top-0 bottom-0 bg-primary/5 dark:bg-primary/10 transition-all duration-500 z-0"
                                        style={{ width: `${percentage}%` }}
                                    />
                                    
                                    {/* Content */}
                                    <div className="relative z-10 flex items-center w-full gap-4">
                                        <span className={`font-mono text-sm w-8 text-center shrink-0 ${index < 3 ? 'text-primary font-bold' : 'text-light-subtle-text dark:text-dark-subtle-text'}`}>
                                            #{index + 1}
                                        </span>
                                        
                                        <div className="flex-1 min-w-0 flex items-center gap-2">
                                            <div className="text-sm font-medium text-light-text dark:text-dark-text truncate" title={file.path}>
                                                {file.path}
                                            </div>
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); onCopyPath(file.path); }}
                                                className="w-6 h-6 rounded flex items-center justify-center text-light-subtle-text hover:text-primary hover:bg-light-border dark:hover:bg-dark-border/50 transition-colors opacity-0 group-hover:opacity-100"
                                                title="复制路径"
                                            >
                                                <i className="fa-regular fa-copy text-xs"></i>
                                            </div>
                                            <div className="text-xs text-light-subtle-text dark:text-dark-subtle-text truncate opacity-80 flex-1">
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
                             );
                        })
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default React.memo(FileRankDialog);
