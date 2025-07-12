import React from 'react';
import { useLocalization } from '../hooks/useLocalization';

interface StatusBarProps {
    fileCount: number;
    totalLines: number;
    totalChars: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ fileCount, totalLines, totalChars }) => {
    const { t } = useLocalization();
    return (
        <footer className="h-8 flex items-center justify-end px-4 space-x-6 bg-light-header dark:bg-dark-header border-t border-light-border dark:border-dark-border text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0">
            <span>{t('files')}: {fileCount}</span>
            <span>{t('lines')}: {totalLines}</span>
            <span>{t('characters')}: {totalChars}</span>
        </footer>
    );
}

export default StatusBar;