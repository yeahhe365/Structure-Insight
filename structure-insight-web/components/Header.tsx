import React from 'react';
import { useLocalization } from '../hooks/useLocalization';

export interface HeaderProps {
  onOpenFolder: () => void;
  onCopyAll: () => void;
  onSave: () => void;
  onReset: () => void;
  onRefresh: () => void;
  onCancel: () => void;
  onSearch: () => void;
  onSettings: () => void;
  onToggleAIChat: () => void;
  hasContent: boolean;
  canRefresh: boolean;
  isLoading: boolean;
  isOnline: boolean;
  isAiChatOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
    onOpenFolder, onCopyAll, onSave, onReset, onRefresh, onCancel, onSearch,
    onSettings, onToggleAIChat, hasContent, canRefresh, isLoading, isOnline, isAiChatOpen
}) => {
  const { t } = useLocalization();
  const buttonClass = "flex items-center justify-center h-10 w-10 rounded-full bg-light-panel dark:bg-dark-panel text-light-subtle-text dark:text-dark-subtle-text hover:bg-light-border dark:hover:bg-dark-border disabled:opacity-50 disabled:cursor-not-allowed transition-all";
  const iconClass = "text-lg";

  return (
    <header className="flex items-center justify-between p-2 h-16 bg-light-header dark:bg-dark-header border-b border-light-border dark:border-dark-border shrink-0 z-20">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold hidden sm:block">{t('app_title')}</h1>
        <div className={`flex items-center space-x-1.5 text-xs ${isOnline ? 'text-green-500' : 'text-red-500'}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isOnline ? t('online') : t('offline')}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={onOpenFolder} className={buttonClass} title={t('open_folder_title')} disabled={isLoading}>
          <i className={`fa-regular fa-folder-open ${iconClass}`}></i>
        </button>
        <button onClick={onSearch} className={buttonClass} title={t('search_title')} disabled={!hasContent || isLoading}>
            <i className={`fa-solid fa-magnifying-glass ${iconClass}`}></i>
        </button>
        <button onClick={onToggleAIChat} className={`${buttonClass} ${isAiChatOpen ? '!bg-primary/20 !text-primary' : ''}`} title={t('ai_chat_title_short')} disabled={!hasContent || isLoading}>
            <i className={`fa-solid fa-wand-magic-sparkles ${iconClass}`}></i>
        </button>
        <button onClick={onCopyAll} className={buttonClass} title={t('copy_all_title')} disabled={!hasContent || isLoading}>
          <i className={`fa-solid fa-copy ${iconClass}`}></i>
        </button>
        <button onClick={onSave} className={buttonClass} title={t('save_as_text_title')} disabled={!hasContent || isLoading}>
          <i className={`fa-solid fa-download ${iconClass}`}></i>
        </button>
        <button onClick={onReset} className={buttonClass} title={t('reset_title')} disabled={!hasContent || isLoading}>
          <i className={`fa-solid fa-trash-can ${iconClass}`}></i>
        </button>
        <button onClick={onRefresh} className={buttonClass} title={t('refresh_title')} disabled={!canRefresh || isLoading}>
          <i className={`fa-solid fa-arrows-rotate ${iconClass}`}></i>
        </button>

        {isLoading ? (
         <button onClick={onCancel} className={`${buttonClass} w-auto px-4 !text-red-500 hover:!bg-red-500/10`} title={t('cancel_esc_title')}>
             <i className={`fa-solid fa-ban ${iconClass} mr-2`}></i> {t('cancel')}
         </button>
        ) : (
        <button onClick={onSettings} className={buttonClass} title={t('settings_title')}>
          <i className={`fa-solid fa-cog ${iconClass}`}></i>
        </button>
        )}
      </div>
    </header>
  );
};

export default Header;