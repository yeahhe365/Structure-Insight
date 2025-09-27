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
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen, onClose, isDarkTheme, onToggleTheme, extractContent, onToggleExtractContent, fontSize, onSetFontSize, onClearCache
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
    
    const appVersion = "5.0.0"; // Hardcoded version
    const settingsRowClass = "flex items-center justify-between py-4";
    const labelClass = "text-sm text-light-text dark:text-dark-text";
    const switchClass = (isActive: boolean) => `relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-panel ${isActive ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`;
    const switchKnobClass = (isActive: boolean) => `inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${isActive ? 'translate-x-6' : 'translate-x-1'}`;
    
    return (
        <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                ref={dialogRef}
                className="bg-light-panel dark:bg-dark-panel rounded-lg shadow-2xl border border-light-border dark:border-dark-border w-[380px]"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
                <div
                    className="flex items-center justify-between p-3 border-b border-light-border dark:border-dark-border"
                >
                    <h3 className="font-semibold text-sm pl-1">设置</h3>
                    <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center">
                        <i className="fa-solid fa-times text-xs"></i>
                    </button>
                </div>
                <div className="p-4 divide-y divide-light-border dark:divide-dark-border">
                    {/* Theme */}
                    <div className={settingsRowClass}>
                        <label htmlFor="theme-toggle" className={labelClass}>
                            <i className="fa-solid fa-moon mr-3 w-4 text-center text-light-subtle-text dark:text-dark-subtle-text"></i>
                            深色主题
                        </label>
                        <button id="theme-toggle" onClick={onToggleTheme} className={switchClass(isDarkTheme)}>
                            <span className={switchKnobClass(isDarkTheme)} />
                        </button>
                    </div>
                    
                    {/* Extract Content */}
                    <div className={settingsRowClass}>
                        <label htmlFor="extract-toggle" className={labelClass}>
                            <i className="fa-solid fa-align-left mr-3 w-4 text-center text-light-subtle-text dark:text-dark-subtle-text"></i>
                            提取文件内容
                        </label>
                        <button id="extract-toggle" onClick={onToggleExtractContent} className={switchClass(extractContent)}>
                            <span className={switchKnobClass(extractContent)} />
                        </button>
                    </div>

                    {/* Font Size */}
                    <div className={settingsRowClass}>
                        <label htmlFor="font-size-slider" className={labelClass}>
                             <i className="fa-solid fa-font mr-3 w-4 text-center text-light-subtle-text dark:text-dark-subtle-text"></i>
                             字体大小
                        </label>
                        <div className="flex items-center space-x-3">
                            <span className="text-xs w-6 text-center">{fontSize}px</span>
                            <input
                                type="range"
                                id="font-size-slider"
                                min="10"
                                max="24"
                                step="1"
                                value={fontSize}
                                onChange={(e) => onSetFontSize(Number(e.target.value))}
                                className="w-32 accent-primary"
                            />
                        </div>
                    </div>

                    {/* Clear Cache */}
                    <div className="pt-4">
                        <div className="flex items-center justify-between">
                            <div className={labelClass}>
                                <i className="fa-solid fa-database mr-3 w-4 text-center text-light-subtle-text dark:text-dark-subtle-text"></i>
                                <span>应用缓存</span>
                                <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text mt-1 pl-7">清除所有本地存储的数据。</p>
                            </div>
                            <button 
                                onClick={onClearCache}
                                className="px-3 py-1 text-sm rounded-md text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20"
                            >
                                清除
                            </button>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className={`${labelClass} flex items-center`}>
                                <i className="fa-solid fa-circle-info mr-3 w-4 text-center text-light-subtle-text dark:text-dark-subtle-text"></i>
                                版本
                            </span>
                            <span className="text-sm text-light-subtle-text dark:text-dark-subtle-text">{appVersion}</span>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className={`${labelClass} flex items-center`}>
                                <i className="fa-brands fa-github mr-3 w-4 text-center text-light-subtle-text dark:text-dark-subtle-text"></i>
                                开源地址
                            </span>
                            <a 
                                href="https://github.com/yeahhe365/Structure-Insight" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 px-3 py-1 text-sm rounded-md hover:bg-light-border dark:hover:bg-dark-border"
                            >
                                <span className="font-semibold">GitHub</span>
                                {stars !== null && (
                                    <span className="flex items-center text-xs text-light-subtle-text dark:text-dark-subtle-text">
                                        <i className="fa-solid fa-star text-yellow-500 mr-1"></i>
                                        {stars.toLocaleString()}
                                    </span>
                                )}
                                <i className="fa-solid fa-arrow-up-right-from-square text-xs text-light-subtle-text dark:text-dark-subtle-text"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default React.memo(SettingsDialog);