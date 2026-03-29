import React from 'react';

interface StatusBarProps {
    fileCount: number;
    totalLines: number;
    totalChars: number;
    selectedFileName?: string;
    isDark?: boolean;
}

const StatusBarItem: React.FC<{icon: string, value: number, label: string}> = ({icon, value, label}) => (
    <span className="flex items-center" title={label}>
        <i className={`fa-solid ${icon} w-4 text-center mr-1.5`}></i>
        {value.toLocaleString()}
    </span>
);

const StatusBar: React.FC<StatusBarProps> = ({ fileCount, totalLines, totalChars, selectedFileName, isDark }) => {
    return (
        <footer className="h-8 flex items-center px-4 space-x-6 bg-light-header dark:bg-dark-header border-t border-light-border dark:border-dark-border text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0">
            {selectedFileName && (
                <span className="flex items-center mr-auto" title="当前文件">
                    <i className="fa-solid fa-file-code w-4 text-center mr-1.5"></i>
                    {selectedFileName}
                </span>
            )}
            {!selectedFileName && <span className="mr-auto" />}
            <span className="flex items-center" title="编码">
                <i className="fa-solid fa-text-width w-4 text-center mr-1.5"></i>
                UTF-8
            </span>
            <span className="flex items-center" title={isDark ? '深色主题' : '浅色主题'}>
                <i className={`fa-solid ${isDark ? 'fa-moon' : 'fa-sun'} w-4 text-center mr-1.5`}></i>
                {isDark ? 'Dark' : 'Light'}
            </span>
            <StatusBarItem icon="fa-file-lines" value={fileCount} label="文件" />
            <StatusBarItem icon="fa-align-left" value={totalLines} label="行数" />
            <StatusBarItem icon="fa-quote-left" value={totalChars} label="字符数" />
        </footer>
    );
}

export default React.memo(StatusBar);