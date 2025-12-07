import React from 'react';

interface StatusBarProps {
    fileCount: number;
    totalLines: number;
    totalChars: number;
}

const StatusBarItem: React.FC<{icon: string, value: number, label: string}> = ({icon, value, label}) => (
    <span className="flex items-center" title={label}>
        <i className={`fa-solid ${icon} w-4 text-center mr-1.5`}></i>
        {value.toLocaleString()}
    </span>
);

const StatusBar: React.FC<StatusBarProps> = ({ fileCount, totalLines, totalChars }) => {
    return (
        <footer className="h-8 flex items-center justify-end px-4 space-x-6 bg-light-header dark:bg-dark-header border-t border-light-border dark:border-dark-border text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0">
            <StatusBarItem icon="fa-file-lines" value={fileCount} label="文件" />
            <StatusBarItem icon="fa-align-left" value={totalLines} label="行数" />
            <StatusBarItem icon="fa-quote-left" value={totalChars} label="字符数" />
        </footer>
    );
}

export default React.memo(StatusBar);