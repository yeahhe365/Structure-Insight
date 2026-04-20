
import React from 'react';

export interface HeaderProps {
  onOpenFolder: () => void;
  onCopyAll: () => void;
  onSave: () => void;
  onReset: () => void;
  onCancel: () => void;
  onSettings: () => void;
  onToggleSearch: () => void;
  onToggleFileRank: () => void;
  onShowStructure: () => void;
  hasContent: boolean;
  isLoading: boolean;
  isCancelable?: boolean;
  activeView: 'structure' | 'code';
}

const Header: React.FC<HeaderProps> = ({ 
    onOpenFolder, onCopyAll, onSave, onReset, onCancel,
    onSettings, onToggleSearch, onToggleFileRank, onShowStructure, hasContent, isLoading, isCancelable = false, activeView
}) => {
  const buttonClass = "flex shrink-0 items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-light-subtle-text dark:text-dark-subtle-text hover:bg-light-border dark:hover:bg-dark-border/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all";
  const iconClass = "text-lg";
  const toolbarClassName = hasContent || isLoading
    ? "flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 sm:gap-2"
    : "hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-1 sm:flex sm:gap-2";

  return (
    <header className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 bg-light-header px-2 py-1.5 border-b border-light-border dark:bg-dark-header dark:border-dark-border shrink-0 z-20" role="banner">
      <div className="flex min-w-0 items-center gap-3">
        <a href="https://structure-insight-website.pages.dev/" target="_blank" rel="noopener noreferrer" title="访问 Structure Insight 主页">
          <img src="data:image/svg+xml;charset=utf-8;base64,PHN2ZyB2aWV3Qm94PSIzMCAwIDE0MCAxNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGcgaWQ9Im1vbm9DdWJlIj48cGF0aCBkPSJNMzAgMCBMNjAgMTUgTDMwIDMwIEwwIDE1IFoiIGZpbGw9IiNlZWYyZjMiLz48cGF0aCBkPSJNMCAxNSBMMzAgMzAgVjY1IEwwIDUwIFoiIGZpbGw9IiM5ZmE4YjAiLz48cGF0aCBkPSJNMzAgMzAgTDYwIDE1IFY1MCBMMzAgNjUgWiIgZmlsbD0iIzE5MWMyMCIvPjwvZz48L2RlZnM+PHVzZSBocmVmPSIjbW9ub0N1YmUiIHg9IjcwIiB5PSI0MCIgLz48dXNlIGhyZWY9IiNtb25vQ3ViZSIgeD0iNzAiIHk9IjAiIC8+PHVzZSBocmVmPSIjbW9ub0N1YmUiIHg9IjM2IiB5PSI1NyIgLz48dXNlIGhyZWY9IiNtb25vQ3ViZSIgeD0iMTA0IiB5PSI1NyIgLz48dXNlIGhyZWY9IiNtb25vQ3ViZSIgeD0iMzYiIHk9IjE3IiAvPjx1c2UgaHJlZj0iI21vbm9DdWJlIiB4PSIxMDQiIHk9IjE3IiAvPjx1c2UgaHJlZj0iI21vbm9DdWJlIiB4PSI3MCIgeT0iNzQiIC8+PHVzZSBocmVmPSIjbW9ub0N1YmUiIHg9IjcwIiB5PSIzNCIgLz48L3N2Zz4=" alt="Structure Insight Logo" className="h-9 w-9" />
        </a>
        <h1 className="text-xl font-semibold hidden sm:block">Structure Insight</h1>
      </div>
      <div className={toolbarClassName} role="toolbar" aria-label="工具栏">
        <button onClick={onOpenFolder} className={buttonClass} title="打开文件夹 (Ctrl+O)" aria-label="打开文件夹" disabled={isLoading}>
          <i className={`fa-solid fa-folder-open ${iconClass}`}></i>
        </button>
        {hasContent && (
          <>
            <button onClick={onToggleSearch} className={buttonClass} title="在文件中查找 (Ctrl+F)" aria-label="在文件中查找" disabled={isLoading}>
                <i className={`fa-solid fa-search ${iconClass}`}></i>
            </button>
            <button onClick={onToggleFileRank} className={buttonClass} title="文件大小排行" aria-label="文件大小排行" disabled={isLoading}>
                <i className={`fa-solid fa-arrow-down-short-wide ${iconClass}`}></i>
            </button>
            <button onClick={onShowStructure} className={`${buttonClass} ${activeView === 'structure' ? 'bg-light-border dark:bg-dark-border/50 text-primary' : ''}`} title="查看项目结构" aria-label="查看项目结构" disabled={isLoading}>
                <i className={`fa-solid fa-sitemap ${iconClass}`}></i>
            </button>

            <div className="hidden h-6 w-px bg-light-border dark:bg-dark-border sm:block"></div>

            <button onClick={onCopyAll} className={buttonClass} title="全部复制" aria-label="全部复制" disabled={isLoading}>
              <i className={`fa-solid fa-copy ${iconClass}`}></i>
            </button>
            <button onClick={onSave} className={buttonClass} title="保存为文本文件 (Ctrl+S)" aria-label="保存为文本文件" disabled={isLoading}>
              <i className={`fa-solid fa-download ${iconClass}`}></i>
            </button>
            <button onClick={onReset} className={buttonClass} title="重置" aria-label="重置" disabled={isLoading}>
              <i className={`fa-solid fa-trash-can ${iconClass}`}></i>
            </button>
          </>
        )}

        {isCancelable ? (
         <button onClick={onCancel} className={`${buttonClass} h-9 w-auto px-4 !text-red-500 hover:!bg-red-500/10`} title="取消 (Esc)" aria-label="取消">
             <i className={`fa-solid fa-ban ${iconClass} mr-2`}></i> 取消
         </button>
        ) : (
        <button onClick={onSettings} className={buttonClass} title="设置" aria-label="设置">
          <i className={`fa-solid fa-cog ${iconClass}`}></i>
        </button>
        )}
      </div>
    </header>
  );
};

export default React.memo(Header);
