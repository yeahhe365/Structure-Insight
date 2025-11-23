
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
  onToggleAiChat: () => void;
  onShowStructure: () => void;
  hasContent: boolean;
  canRefresh: boolean;
  isLoading: boolean;
  activeView: 'structure' | 'code';
}

const Header: React.FC<HeaderProps> = ({ 
    onOpenFolder, onCopyAll, onSave, onReset, onRefresh, onCancel,
    onSettings, onToggleSearch, onToggleAiChat, onShowStructure, hasContent, canRefresh, isLoading, activeView
}) => {
  const buttonClass = "flex items-center justify-center h-9 w-9 rounded-lg text-light-subtle-text dark:text-dark-subtle-text hover:bg-light-border dark:hover:bg-dark-border/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all";
  const iconClass = "text-lg";

  return (
    <header className="flex items-center justify-between p-2 h-16 bg-light-header dark:bg-dark-header border-b border-light-border dark:border-dark-border shrink-0 z-20">
      <div className="flex items-center gap-3">
        <a href="https://structure-insight-website.pages.dev/" target="_blank" rel="noopener noreferrer" title="访问 Structure Insight 主页">
          <img src="data:image/svg+xml;charset=utf-8;base64,PHN2ZyB2aWV3Qm94PSIzMCAwIDE0MCAxNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGcgaWQ9Im1vbm9DdWJlIj48cGF0aCBkPSJNMzAgMCBMNjAgMTUgTDMwIDMwIEwwIDE1IFoiIGZpbGw9IiNlZWYyZjMiLz48cGF0aCBkPSJNMCAxNSBMMzAgMzAgVjY1IEwwIDUwIFoiIGZpbGw9IiM5ZmE4YjAiLz48cGF0aCBkPSJNMzAgMzAgTDYwIDE1IFY1MCBMMzAgNjUgWiIgZmlsbD0iIzE5MWMyMCIvPjwvZz48L2RlZnM+PHVzZSBocmVmPSIjbW9ub0N1YmUiIHg9IjcwIiB5PSI0MCIgLz48dXNlIGhyZWY9IiNtb25vQ3ViZSIgeD0iNzAiIHk9IjAiIC8+PHVzZSBocmVmPSIjbW9ub0N1YmUiIHg9IjM2IiB5PSI1NyIgLz48dXNlIGhyZWY9IiNtb25vQ3ViZSIgeD0iMTA0IiB5PSI1NyIgLz48dXNlIGhyZWY9IiNtb25vQ3ViZSIgeD0iMzYiIHk9IjE3IiAvPjx1c2UgaHJlZj0iI21vbm9DdWJlIiB4PSIxMDQiIHk9IjE3IiAvPjx1c2UgaHJlZj0iI21vbm9DdWJlIiB4PSI3MCIgeT0iNzQiIC8+PHVzZSBocmVmPSIjbW9ub0N1YmUiIHg9IjcwIiB5PSIzNCIgLz48L3N2Zz4=" alt="Structure Insight Logo" className="h-9 w-9" />
        </a>
        <h1 className="text-xl font-semibold hidden sm:block">Structure Insight</h1>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={onOpenFolder} className={buttonClass} title="打开文件夹 (Ctrl+O)" disabled={isLoading}>
          <i className={`fa-regular fa-folder-open ${iconClass}`}></i>
        </button>
        <button onClick={onToggleSearch} className={buttonClass} title="在文件中查找 (Ctrl+F)" disabled={!hasContent || isLoading}>
            <i className={`fa-solid fa-search ${iconClass}`}></i>
        </button>
        <button onClick={onShowStructure} className={`${buttonClass} ${activeView === 'structure' && hasContent ? 'bg-light-border dark:bg-dark-border/50 text-primary' : ''}`} title="查看项目结构" disabled={!hasContent || isLoading}>
            <i className={`fa-solid fa-sitemap ${iconClass}`}></i>
        </button>
        <button onClick={onToggleAiChat} className={`${buttonClass} text-primary dark:text-sky-400`} title="AI 助理" disabled={!hasContent || isLoading}>
            <i className={`fa-solid fa-wand-magic-sparkles ${iconClass}`}></i>
        </button>

        <div className="w-px h-6 bg-light-border dark:bg-dark-border mx-1"></div>

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

export default React.memo(Header);