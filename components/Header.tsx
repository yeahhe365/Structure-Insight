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
  const secondaryButtonClass = 'inline-flex shrink-0 items-center justify-center gap-2 h-9 rounded-xl px-2.5 text-sm font-medium text-light-subtle-text dark:text-dark-subtle-text hover:bg-light-hover dark:hover:bg-dark-hover hover:text-light-text dark:hover:text-dark-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
  const primaryButtonClass = 'inline-flex shrink-0 items-center justify-center gap-2 h-9 rounded-xl bg-primary px-3.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors';
  const activeButtonClass = 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-disabled';
  const iconClass = 'text-[0.95rem]';

  return (
    <header className="flex min-h-[60px] flex-wrap items-center justify-between gap-3 border-b border-light-border bg-light-header px-3 py-2 shadow-sm shadow-slate-900/5 dark:border-dark-border dark:bg-dark-header dark:shadow-black/20 shrink-0 z-20" role="banner">
      <div className="flex min-w-0 items-center gap-3">
        <a href="https://structure-insight-website.pages.dev/" target="_blank" rel="noopener noreferrer" title="访问 Structure Insight 主页">
          <img src="/icon.svg" alt="Structure Insight Logo" className="h-9 w-9" />
        </a>
        <div className="hidden min-w-0 sm:block">
          <h1 className="truncate text-lg font-bold tracking-tight text-light-text dark:text-dark-text">Structure Insight</h1>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-light-subtle-text dark:text-dark-subtle-text">本地仓库上下文</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5 sm:gap-2" role="toolbar" aria-label="工具栏">
        <button
          onClick={onOpenFolder}
          className={primaryButtonClass}
          title={`打开项目 (${shortcutModifier}+O)`}
          aria-label="打开项目"
          disabled={isBusy}
        >
          <i className={`fa-solid fa-folder-open ${iconClass}`}></i>
          <span>打开项目</span>
        </button>

        {hasContent && (
          <>
            <div data-toolbar-group="view" className="flex min-w-0 items-center gap-1 rounded-2xl border border-light-border/70 bg-light-panel/70 p-1 dark:border-dark-border/70 dark:bg-dark-panel/70">
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

            <div data-toolbar-group="analysis" className="flex min-w-0 items-center gap-1 rounded-2xl border border-light-border/70 bg-light-panel/70 p-1 dark:border-dark-border/70 dark:bg-dark-panel/70">
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

            <div data-toolbar-group="export" className="flex min-w-0 items-center gap-1 rounded-2xl border border-light-border/70 bg-light-panel/70 p-1 dark:border-dark-border/70 dark:bg-dark-panel/70">
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
          className={`${secondaryButtonClass} px-2.5`}
          title={`快捷键 (${shortcutModifier}+/)`}
          aria-label="快捷键"
          disabled={isBusy}
        >
          <i className={`fa-solid fa-keyboard ${iconClass}`}></i>
          <span className="hidden lg:inline">快捷键</span>
        </button>

        {isExporting && (
          <span className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 text-sm font-medium text-primary dark:border-primary-disabled/40 dark:bg-primary/15 dark:text-primary-disabled">
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
          <button onClick={onSettings} className={`${secondaryButtonClass} px-2.5`} title="设置" aria-label="设置" disabled={isBusy}>
            <i className={`fa-solid fa-cog ${iconClass}`}></i>
            <span className="hidden lg:inline">设置</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default React.memo(Header);
