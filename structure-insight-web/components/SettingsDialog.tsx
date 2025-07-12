import React from 'react';
import { useLocalization } from '../hooks/useLocalization';

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
    const { t, language, setLanguage } = useLocalization();

    const [position, setPosition] = React.useState({ x: window.innerWidth - 370, y: 70 });
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartPos = React.useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('input, button, .slider')) return;
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        e.preventDefault();
    };

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStartPos.current.x,
            y: e.clientY - dragStartPos.current.y,
        });
    }, [isDragging]);

    const handleMouseUp = React.useCallback(() => {
        setIsDragging(false);
    }, []);

    React.useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

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
    
    const installButtonText = isInstalled ? t('installed') : t('install_app');

    return (
        <div
            ref={dialogRef}
            className="fixed z-20 bg-light-panel dark:bg-dark-panel rounded-lg shadow-2xl border border-light-border dark:border-dark-border w-[350px]"
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
            <div
                className="flex items-center justify-between p-3 border-b border-light-border dark:border-dark-border cursor-move"
                onMouseDown={handleMouseDown}
            >
                <h3 className="font-semibold text-sm">{t('settings')}</h3>
                <button onClick={onClose} className="w-6 h-6 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center">
                    <i className="fa-solid fa-times text-xs"></i>
                </button>
            </div>
            <div className="p-4 divide-y divide-light-border dark:divide-dark-border">
                {/* Language */}
                <div className={settingsRowClass}>
                    <label className={labelClass}>{t('language')}</label>
                     <div className="flex items-center space-x-1 p-0.5 bg-light-bg dark:bg-dark-bg rounded-md">
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${language === 'en' ? 'bg-white dark:bg-dark-panel shadow-sm font-medium' : 'hover:bg-light-border dark:hover:bg-dark-border'}`}
                        >
                            English
                        </button>
                        <button 
                            onClick={() => setLanguage('zh')}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${language === 'zh' ? 'bg-white dark:bg-dark-panel shadow-sm font-medium' : 'hover:bg-light-border dark:hover:bg-dark-border'}`}
                        >
                            中文
                        </button>
                    </div>
                </div>

                {/* Theme */}
                <div className={settingsRowClass}>
                    <label htmlFor="theme-toggle" className={labelClass}>{t('dark_theme')}</label>
                    <button id="theme-toggle" onClick={onToggleTheme} className={switchClass(isDarkTheme)}>
                        <span className={switchKnobClass(isDarkTheme)} />
                    </button>
                </div>
                
                {/* Extract Content */}
                <div className={settingsRowClass}>
                    <label htmlFor="extract-toggle" className={labelClass}>{t('extract_file_content')}</label>
                    <button id="extract-toggle" onClick={onToggleExtractContent} className={switchClass(extractContent)}>
                        <span className={switchKnobClass(extractContent)} />
                    </button>
                </div>

                {/* Font Size */}
                <div className={settingsRowClass}>
                    <label htmlFor="font-size-slider" className={labelClass}>{t('font_size')}</label>
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
                    <label className={labelClass}>{t('installable_app')}</label>
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
                    <label className={labelClass}>{t('application_cache')}</label>
                    <button 
                        onClick={() => {
                            if(window.confirm(t('clear_cache_confirm'))) {
                                onClearCache();
                            }
                        }}
                        className="px-3 py-1 text-sm rounded-md text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20"
                    >
                        {t('clear_cache')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SettingsDialog;