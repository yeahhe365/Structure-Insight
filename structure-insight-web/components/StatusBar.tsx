import React from 'react';

interface StatusBarProps {
    fileCount: number;
    totalLines: number;
    totalChars: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ fileCount, totalLines, totalChars }) => {
    return (
        <footer className="h-8 flex items-center justify-end px-4 space-x-6 bg-light-header dark:bg-dark-header border-t border-light-border dark:border-dark-border text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0">
            <span>文件: {fileCount}</span>
            <span>行数: {totalLines}</span>
            <span>字符数: {totalChars}</span>
        </footer>
    );
}

export default StatusBar;