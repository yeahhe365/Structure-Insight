import React from 'react';

export interface HeaderProps {
  onOpenFolder: () => void;
  onCopyAll: () => void;
  onSave: () => void;
  onReset: () => void;
  onCancel: () => void;
  onSettings: () => void;
  onToggleShortcuts: () => void;
  onToggleSearch: () => void;
  onToggleFileRank: () => void;
  onShowCode: () => void;
  onShowStructure: () => void;
  hasContent: boolean;
  busyState?: 'loading' | 'exporting' | null;
  activeView: 'structure' | 'code';
}

function getShortcutModifier(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl';
}

const iconUrl = `${import.meta.env.BASE_URL}icon.svg`;

const Header: React.FC<HeaderProps> = ({
  onOpenFolder,
  onCopyAll,
  onSave,
  onReset,
  onCancel,
  onSettings,
  onToggleShortcuts,
  onToggleSearch,
  onToggleFileRank,
  onShowCode,
  onShowStructure,
  hasContent,
  busyState = null,
  activeView,
}) => {
  const shortcutModifier = getShortcutModifier();
  const isBusy = busyState !== null;
  const isLoading = busyState === 'loading';
  const isExporting = busyState === 'exporting';
  const secondaryButtonClass = 'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-light-subtle-text transition-colors hover:bg-light-hover hover:text-light-text disabled:cursor-not-allowed disabled:opacity-50 dark:text-dark-subtle-text dark:hover:bg-dark-hover dark:hover:text-dark-text';
  const primaryButtonClass = 'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:px-3';
  const activeButtonClass = 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-disabled';
  const iconClass = 'text-[0.86rem]';

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-light-border bg-light-header px-2 py-1 shadow-sm shadow-slate-900/5 dark:border-dark-border dark:bg-dark-header dark:shadow-black/20 sm:px-3 z-20" role="banner">
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <a href="https://structure-insight-website.pages.dev/" target="_blank" rel="noopener noreferrer" title="访问 Structure Insight 主页">
          <img src={iconUrl} alt="Structure Insight Logo" className="h-8 w-8" />
        </a>
        <div className="hidden min-w-0 lg:block">
          <h1 className="truncate text-sm font-bold tracking-tight text-light-text dark:text-dark-text">Structure Insight</h1>
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-light-subtle-text dark:text-dark-subtle-text">本地仓库上下文</p>
        </div>
      </div>

      <div className="no-scrollbar flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-1 overflow-x-auto" role="toolbar" aria-label="工具栏">
        <button
          onClick={onOpenFolder}
          className={primaryButtonClass}
          title={`打开项目 (${shortcutModifier}+O)`}
          aria-label="打开项目"
          disabled={isBusy}
        >
          <i className={`fa-solid fa-folder-open ${iconClass}`}></i>
          <span className="hidden sm:inline">打开项目</span>
        </button>

        {hasContent && (
          <>
            <div data-toolbar-group="view" className="flex shrink-0 items-center gap-0.5 rounded-xl border border-light-border/70 bg-light-panel/70 p-0.5 dark:border-dark-border/70 dark:bg-dark-panel/70">
              <button
                onClick={onShowCode}
                className={`${secondaryButtonClass} ${activeView === 'code' ? activeButtonClass : ''}`}
                title="代码视图"
                aria-label="代码视图"
                aria-pressed={activeView === 'code'}
                disabled={isBusy}
              >
                <i className={`fa-solid fa-code ${iconClass}`}></i>
                <span className="hidden md:inline">代码视图</span>
              </button>
              <button
                onClick={onShowStructure}
                className={`${secondaryButtonClass} ${activeView === 'structure' ? activeButtonClass : ''}`}
                title="结构视图"
                aria-label="结构视图"
                aria-pressed={activeView === 'structure'}
                disabled={isBusy}
              >
                <i className={`fa-solid fa-sitemap ${iconClass}`}></i>
                <span className="hidden md:inline">结构视图</span>
              </button>
            </div>

            <div data-toolbar-group="analysis" className="flex shrink-0 items-center gap-0.5 rounded-xl border border-light-border/70 bg-light-panel/70 p-0.5 dark:border-dark-border/70 dark:bg-dark-panel/70">
              <button
                onClick={onToggleSearch}
                className={secondaryButtonClass}
                title={`在文件中查找 (${shortcutModifier}+F)`}
                aria-label="查找"
                disabled={isBusy}
              >
                <i className={`fa-solid fa-search ${iconClass}`}></i>
                <span className="hidden md:inline">查找</span>
              </button>
              <button
                onClick={onToggleFileRank}
                className={secondaryButtonClass}
                title="文件排行"
                aria-label="文件排行"
                disabled={isBusy}
              >
                <i className={`fa-solid fa-arrow-down-short-wide ${iconClass}`}></i>
                <span className="hidden lg:inline">文件排行</span>
              </button>
            </div>

            <div data-toolbar-group="export" className="flex shrink-0 items-center gap-0.5 rounded-xl border border-light-border/70 bg-light-panel/70 p-0.5 dark:border-dark-border/70 dark:bg-dark-panel/70">
              <button
                onClick={onCopyAll}
                className={secondaryButtonClass}
                title="复制全部"
                aria-label="复制全部"
                disabled={isBusy}
              >
                <i className={`fa-solid fa-copy ${iconClass}`}></i>
                <span className="hidden md:inline">复制全部</span>
              </button>
              <button
                onClick={onSave}
                className={secondaryButtonClass}
                title={`保存 (${shortcutModifier}+S)`}
                aria-label="保存"
                disabled={isBusy}
              >
                <i className={`fa-solid fa-download ${iconClass}`}></i>
                <span className="hidden md:inline">保存</span>
              </button>
              <button
                onClick={onReset}
                className={`${secondaryButtonClass} hover:!text-red-500`}
                title="重置"
                aria-label="重置"
                disabled={isBusy}
              >
                <i className={`fa-solid fa-trash-can ${iconClass}`}></i>
                <span className="hidden lg:inline">重置</span>
              </button>
            </div>
          </>
        )}

        <button
          onClick={onToggleShortcuts}
          className={secondaryButtonClass}
          title={`快捷键 (${shortcutModifier}+/)`}
          aria-label="快捷键"
          disabled={isBusy}
        >
          <i className={`fa-solid fa-keyboard ${iconClass}`}></i>
          <span className="hidden xl:inline">快捷键</span>
        </button>

        {isExporting && (
          <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2 text-xs font-medium text-primary dark:border-primary-disabled/40 dark:bg-primary/15 dark:text-primary-disabled">
            <i className={`fa-solid fa-file-arrow-down ${iconClass}`}></i>
            <span>正在导出</span>
          </span>
        )}

        {isLoading ? (
          <button onClick={onCancel} className={`${secondaryButtonClass} !text-red-500 hover:!bg-red-500/10`} title="取消 (Esc)" aria-label="取消">
            <i className={`fa-solid fa-ban ${iconClass}`}></i>
            <span>取消</span>
          </button>
        ) : (
          <button onClick={onSettings} className={secondaryButtonClass} title="设置" aria-label="设置" disabled={isBusy}>
            <i className={`fa-solid fa-cog ${iconClass}`}></i>
            <span className="hidden xl:inline">设置</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default React.memo(Header);
