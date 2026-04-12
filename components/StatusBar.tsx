import React from 'react';
import type { AnalysisSummary, FileStats } from '../types';

interface StatusBarProps {
    fileCount: number;
    totalLines: number;
    totalChars: number;
    selectedFileName?: string;
    isDark?: boolean;
    onShowSecurityFindings?: () => void;
    processedData?: {
        fileContents: { path: string; stats: FileStats; excluded?: boolean }[];
        analysisSummary?: AnalysisSummary;
    } | null;
}

const StatusBarItem: React.FC<{icon: string, value: number | string, label: string}> = ({icon, value, label}) => (
    <span className="flex items-center" title={label}>
        <i className={`fa-solid ${icon} w-4 text-center mr-1.5`}></i>
        {typeof value === 'number' ? value.toLocaleString() : value}
    </span>
);

const StatusBar: React.FC<StatusBarProps> = ({ fileCount, totalLines, totalChars, selectedFileName, isDark, processedData, onShowSecurityFindings }) => {
    const typeSummary = React.useMemo(() => {
        if (!processedData?.fileContents) return null;
        const counts = new Map<string, number>();
        for (const f of processedData.fileContents) {
            if (f.excluded) continue;
            const ext = f.path.split('.').pop()?.toLowerCase() || 'other';
            counts.set(ext, (counts.get(ext) || 0) + 1);
        }
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
        return sorted.map(([ext, count]) => `${ext}: ${count}`).join(' · ');
    }, [processedData]);

    const analysisSummary = processedData?.analysisSummary;

    return (
        <footer className="h-8 flex items-center px-4 space-x-6 bg-light-header dark:bg-dark-header border-t border-light-border dark:border-dark-border text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0">
            {selectedFileName && (
                <span className="flex items-center mr-auto" title="当前文件">
                    <i className="fa-solid fa-file-code w-4 text-center mr-1.5"></i>
                    {selectedFileName}
                </span>
            )}
            {!selectedFileName && <span className="mr-auto" />}
            {typeSummary && (
                <span className="flex items-center" title="文件类型分布">
                    <i className="fa-solid fa-chart-pie w-4 text-center mr-1.5"></i>
                    {typeSummary}
                </span>
            )}
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
            {analysisSummary && (
                <StatusBarItem icon="fa-cubes-stacked" value={analysisSummary.totalEstimatedTokens} label="预计 Token" />
            )}
            {analysisSummary && analysisSummary.securityFindingCount > 0 && (
                <button
                    onClick={onShowSecurityFindings}
                    className="flex items-center hover:text-amber-500 transition-colors"
                    title="敏感信息提示"
                >
                    <i className="fa-solid fa-triangle-exclamation w-4 text-center mr-1.5"></i>
                    {analysisSummary.securityFindingCount.toLocaleString()}
                </button>
            )}
        </footer>
    );
}

export default React.memo(StatusBar);
