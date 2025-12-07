
import React from 'react';
import { motion } from 'framer-motion';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkTheme: boolean;
    onToggleTheme: () => void;
    extractContent: boolean;
    onToggleExtractContent: () => void;
    fontSize: number;
    onSetFontSize: (size: number) => void;
    onClearCache: () => void;
    showCharCount: boolean;
    onToggleShowCharCount: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen, onClose, isDarkTheme, onToggleTheme, extractContent, onToggleExtractContent, fontSize, onSetFontSize, onClearCache,
    showCharCount, onToggleShowCharCount
}) => {
    const dialogRef = React.useRef<HTMLDivElement>(null);
    const [stars, setStars] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            // Fetch GitHub stars when the dialog opens
            fetch('https://api.github.com/repos/yeahhe365/Structure-Insight')
                .then(res => res.json())
                .then(data => {
                    if (data && typeof data.stargazers_count === 'number') {
                        setStars(data.stargazers_count);
                    }
                })
                .catch(err => console.error("Failed to fetch GitHub stars:", err));

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;
    
    const appVersion = "5.1.0"; 

    // Helper components for consistency
    const SectionTitle = ({ children }: { children: React.ReactNode }) => (
        <h4 className="text-xs font-semibold text-light-subtle-text dark:text-dark-subtle-text uppercase tracking-wider mb-3 mt-1 px-1">
            {children}
        </h4>
    );

    const Switch = ({ checked, onChange, id }: { checked: boolean, onChange: () => void, id: string }) => (
        <button 
            id={id} 
            onClick={onChange} 
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-panel ${checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
            <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
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
                ref={dialogRef}
                className="bg-light-panel dark:bg-dark-panel rounded-xl shadow-2xl border border-light-border dark:border-dark-border w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/50 backdrop-blur-md">
                    <h3 className="font-bold text-lg text-light-text dark:text-dark-text">设置</h3>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center text-light-subtle-text dark:text-dark-subtle-text transition-colors"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-8">
                    
                    {/* Appearance Section */}
                    <div>
                        <SectionTitle>外观</SectionTitle>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                        <i className="fa-solid fa-moon"></i>
                                    </div>
                                    <label htmlFor="theme-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">
                                        深色主题
                                    </label>
                                </div>
                                <Switch id="theme-toggle" checked={isDarkTheme} onChange={onToggleTheme} />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
                                        <i className="fa-solid fa-list-ol"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="char-count-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">
                                            显示统计信息
                                        </label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">在文件树中显示字符和行数</span>
                                    </div>
                                </div>
                                <Switch id="char-count-toggle" checked={showCharCount} onChange={onToggleShowCharCount} />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
                                        <i className="fa-solid fa-font"></i>
                                    </div>
                                    <div className="flex flex-col">
                                         <label htmlFor="font-size-slider" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">
                                            字体大小
                                        </label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">{fontSize}px</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-32">
                                     <span className="text-xs text-light-subtle-text">A</span>
                                     <input
                                        type="range"
                                        id="font-size-slider"
                                        min="10"
                                        max="24"
                                        step="1"
                                        value={fontSize}
                                        onChange={(e) => onSetFontSize(Number(e.target.value))}
                                        className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="text-lg text-light-text dark:text-dark-text">A</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* General Section */}
                    <div>
                        <SectionTitle>通用</SectionTitle>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm">
                                        <i className="fa-solid fa-file-code"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="extract-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">
                                            提取文件内容
                                        </label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">
                                            禁用以仅查看目录结构
                                        </span>
                                    </div>
                                </div>
                                <Switch id="extract-toggle" checked={extractContent} onChange={onToggleExtractContent} />
                            </div>

                             <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                                        <i className="fa-solid fa-database"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-light-text dark:text-dark-text">
                                            应用缓存
                                        </span>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">
                                            清除所有本地存储的数据
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={onClearCache}
                                    className="px-3 py-1.5 text-xs font-medium rounded-md text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-900/50"
                                >
                                    清除
                                </button>
                            </div>
                        </div>
                    </div>

                     {/* About Section */}
                    <div>
                         <SectionTitle>关于</SectionTitle>
                         <div className="bg-light-bg dark:bg-dark-bg rounded-xl p-4 border border-light-border dark:border-dark-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                     <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <i className="fa-solid fa-layer-group"></i>
                                     </div>
                                     <div>
                                         <h5 className="text-sm font-bold text-light-text dark:text-dark-text">Structure Insight</h5>
                                         <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text">v{appVersion}</p>
                                     </div>
                                </div>
                                <a 
                                    href="https://github.com/yeahhe365/Structure-Insight" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="group flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg bg-light-panel dark:bg-dark-panel border border-light-border dark:border-dark-border hover:border-primary dark:hover:border-primary text-light-subtle-text dark:text-dark-subtle-text hover:text-primary transition-all"
                                >
                                    <i className="fa-brands fa-github text-sm"></i>
                                    <span>GitHub</span>
                                    {stars !== null && (
                                        <span className="flex items-center pl-2 border-l border-light-border dark:border-dark-border ml-2 group-hover:border-primary/30">
                                            <i className="fa-solid fa-star text-yellow-500 mr-1 text-[10px]"></i>
                                            {stars.toLocaleString()}
                                        </span>
                                    )}
                                </a>
                            </div>
                            <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text leading-relaxed">
                                一个基于浏览器的本地代码分析工具，旨在帮助开发人员快速可视化项目结构并浏览代码内容。
                            </p>
                         </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
};

export default React.memo(SettingsDialog);