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
    onInstallPWA: () => void;
    isInstallable: boolean;
    isInstalled: boolean;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen, onClose, isDarkTheme, onToggleTheme, extractContent, onToggleExtractContent, fontSize, onSetFontSize, onClearCache,
    onInstallPWA, isInstallable, isInstalled
}) => {
    const dialogRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;
    
    const settingsRowClass = "flex items-center justify-between py-3";
    const labelClass = "text-sm text-light-text dark:text-dark-text";
    const switchClass = (isActive: boolean) => `relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-panel ${isActive ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`;
    const switchKnobClass = (isActive: boolean) => `inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${isActive ? 'translate-x-6' : 'translate-x-1'}`;
    
    const installButtonText = isInstalled ? "已安装" : "安装应用";

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
                className="bg-light-panel dark:bg-dark-panel rounded-lg shadow-2xl border border-light-border dark:border-dark-border w-[350px]"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
                <div
                    className="flex items-center justify-between p-3 border-b border-light-border dark:border-dark-border"
                >
                    <h3 className="font-semibold text-sm">设置</h3>
                    <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center">
                        <i className="fa-solid fa-times text-xs"></i>
                    </button>
                </div>
                <div className="p-4 divide-y divide-light-border dark:divide-dark-border">
                    {/* Theme */}
                    <div className={settingsRowClass}>
                        <label htmlFor="theme-toggle" className={labelClass}>深色主题</label>
                        <button id="theme-toggle" onClick={onToggleTheme} className={switchClass(isDarkTheme)}>
                            <span className={switchKnobClass(isDarkTheme)} />
                        </button>
                    </div>
                    
                    {/* Extract Content */}
                    <div className={settingsRowClass}>
                        <label htmlFor="extract-toggle" className={labelClass}>提取文件内容</label>
                        <button id="extract-toggle" onClick={onToggleExtractContent} className={switchClass(extractContent)}>
                            <span className={switchKnobClass(extractContent)} />
                        </button>
                    </div>

                    {/* Font Size */}
                    <div className={settingsRowClass}>
                        <label htmlFor="font-size-slider" className={labelClass}>字体大小</label>
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
                                className="w-32 slider"
                            />
                        </div>
                    </div>

                    {/* PWA Install */}
                     <div className={settingsRowClass}>
                        <label className={labelClass}>可安装应用</label>
                        <button 
                            onClick={onInstallPWA}
                            disabled={!isInstallable || isInstalled}
                            className="px-3 py-1 text-sm rounded-md text-white bg-primary hover:bg-primary-hover disabled:bg-primary-disabled disabled:cursor-not-allowed"
                        >
                            {installButtonText}
                        </button>
                    </div>

                    {/* Clear Cache */}
                    <div className={settingsRowClass}>
                        <label className={labelClass}>应用缓存</label>
                        <button 
                            onClick={() => {
                                if(window.confirm('您确定要清除所有缓存数据吗？此操作无法撤销。')) {
                                    onClearCache();
                                }
                            }}
                            className="px-3 py-1 text-sm rounded-md text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20"
                        >
                            清除缓存
                        </button>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
};

export default React.memo(SettingsDialog);