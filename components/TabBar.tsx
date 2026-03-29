
import React from 'react';
import { getFileIcon } from './FileTree';

interface TabBarProps {
    openFiles: string[];
    selectedFilePath: string | null;
    onTabSelect: (path: string) => void;
    onCloseTab: (path: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ openFiles, selectedFilePath, onTabSelect, onCloseTab }) => {
    if (openFiles.length === 0) return null;

    return (
        <div className="flex overflow-x-auto no-scrollbar border-b border-light-border dark:border-dark-border bg-light-panel dark:bg-dark-panel shrink-0">
            {openFiles.map(path => {
                const fileName = path.split('/').pop() || path;
                const isActive = path === selectedFilePath;
                const { icon, color } = getFileIcon(fileName);

                return (
                    <div
                        key={path}
                        onClick={() => onTabSelect(path)}
                        onAuxClick={(e) => { if (e.button === 1) { e.preventDefault(); onCloseTab(path); } }}
                        className={`group flex items-center gap-1.5 px-3 py-1.5 cursor-pointer border-b-2 transition-colors shrink-0 text-xs ${
                            isActive
                                ? 'border-primary bg-primary/10 text-light-text dark:text-dark-text'
                                : 'border-transparent text-light-subtle-text dark:text-dark-subtle-text hover:bg-light-hover dark:hover:bg-dark-hover'
                        }`}
                        title={path}
                    >
                        <i className={`${icon} ${color} text-[11px]`} />
                        <span className="truncate max-w-[120px]">{fileName}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onCloseTab(path); }}
                            className="ml-1 w-4 h-4 flex items-center justify-center rounded hover:bg-light-border dark:hover:bg-dark-border text-light-subtle-text dark:text-dark-subtle-text opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <i className="fa-solid fa-xmark text-[10px]" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(TabBar);
