import React from 'react';

export interface HeaderProps {
  onOpenFolder: () => void;
  onCopyAll: () => void;
  onSave: () => void;
  onReset: () => void;
  onRefresh: () => void;
  onCancel: () => void;
  onSettings: () => void;
  onToggleSearch: () => void;
  hasContent: boolean;
  canRefresh: boolean;
  isLoading: boolean;
  isOnline: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
    onOpenFolder, onCopyAll, onSave, onReset, onRefresh, onCancel,
    onSettings, onToggleSearch, hasContent, canRefresh, isLoading, isOnline
}) => {
  const buttonClass = "flex items-center justify-center h-10 w-10 rounded-full bg-light-panel dark:bg-dark-panel text-light-subtle-text dark:text-dark-subtle-text hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed transition-all";
  const iconClass = "text-lg";

  return (
    <header className="flex items-center justify-between p-2 h-16 bg-light-header dark:bg-dark-header border-b border-light-border dark:border-dark-border shrink-0 z-20">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold hidden sm:block">Structure Insight</h1>
        <div className={`flex items-center space-x-1.5 text-xs ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isOnline ? '在线' : '离线'}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={onOpenFolder} className={buttonClass} title="打开文件夹 (Ctrl+O)" disabled={isLoading}>
          <i className={`fa-regular fa-folder-open ${iconClass}`}></i>
        </button>
        <button onClick={onToggleSearch} className={buttonClass} title="在文件中查找 (Ctrl+F)" disabled={!hasContent || isLoading}>
            <i className={`fa-solid fa-search ${iconClass}`}></i>
        </button>
        <button onClick={onCopyAll} className={buttonClass} title="全部复制" disabled={!hasContent || isLoading}>
          <i className={`fa-solid fa-copy ${iconClass}`}></i>
        </button>
        <button onClick={onSave} className={buttonClass} title="保存为文本文件 (Ctrl+S)" disabled={!hasContent || isLoading}>
          <i className={`fa-solid fa-download ${iconClass}`}></i>
        </button>
        <button onClick={onReset} className={buttonClass} title="重置" disabled={!hasContent || isLoading}>
          <i className={`fa-solid fa-trash-can ${iconClass}`}></i>
        </button>
        <button onClick={onRefresh} className={buttonClass} title="刷新" disabled={!canRefresh || isLoading}>
          <i className={`fa-solid fa-arrows-rotate ${iconClass}`}></i>
        </button>

        {isLoading ? (
         <button onClick={onCancel} className={`${buttonClass} w-auto px-4 !text-red-500 hover:!bg-red-500/10`} title="取消 (Esc)">
             <i className={`fa-solid fa-ban ${iconClass} mr-2`}></i> 取消
         </button>
        ) : (
        <button onClick={onSettings} className={buttonClass} title="设置">
          <i className={`fa-solid fa-cog ${iconClass}`}></i>
        </button>
        )}
      </div>
    </header>
  );
};

export default Header;