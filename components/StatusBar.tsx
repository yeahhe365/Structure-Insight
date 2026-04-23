import React from 'react';
import type { AnalysisSummary, FileStats } from '../types';
import { compareFileTypeLabels, getFileTypeLabel } from '../services/fileTypeLabel';

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
    <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-light-border bg-light-panel px-2.5 text-light-subtle-text dark:border-dark-border dark:bg-dark-panel dark:text-dark-subtle-text" title={label}>
        <i className={`fa-solid ${icon} w-3.5 text-center text-primary`}></i>
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
        <span className="font-mono font-semibold text-light-text dark:text-dark-text">{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </span>
);

const StatusBar: React.FC<StatusBarProps> = ({ fileCount, totalLines, totalChars, selectedFileName, isDark, processedData, onShowSecurityFindings }) => {
    const typeSummary = React.useMemo(() => {
        if (!processedData?.fileContents) return null;
        const counts = new Map<string, number>();
        for (const f of processedData.fileContents) {
            if (f.excluded) continue;
            const label = getFileTypeLabel(f.path);
            counts.set(label, (counts.get(label) || 0) + 1);
        }
        const sorted = [...counts.entries()]
            .sort((a, b) => (b[1] - a[1]) || compareFileTypeLabels(a[0], b[0]))
            .slice(0, 3);
        return sorted.map(([label, count]) => `${label}: ${count}`).join(' · ');
    }, [processedData]);

    const analysisSummary = processedData?.analysisSummary;

    return (
        <footer className="min-h-10 flex items-center gap-2 overflow-x-auto whitespace-nowrap px-3 py-1.5 bg-light-header dark:bg-dark-header border-t border-light-border dark:border-dark-border text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0">
            {selectedFileName && (
                <span className="inline-flex h-7 items-center gap-1.5 shrink-0 mr-auto min-w-0 rounded-full border border-light-border bg-light-panel px-2.5 dark:border-dark-border dark:bg-dark-panel" title="当前文件">
                    <i className="fa-solid fa-file-code w-3.5 text-center text-primary"></i>
                    <span className="text-[10px] font-semibold uppercase tracking-wide">当前</span>
                    <span className="truncate max-w-[40vw] font-medium text-light-text dark:text-dark-text sm:max-w-none">{selectedFileName}</span>
                </span>
            )}
            {!selectedFileName && <span className="mr-auto shrink-0" />}
            {typeSummary && (
                <span className="inline-flex h-7 items-center gap-1.5 shrink-0 rounded-full border border-light-border bg-light-panel px-2.5 dark:border-dark-border dark:bg-dark-panel" title="文件类型分布">
                    <i className="fa-solid fa-chart-pie w-3.5 text-center text-primary"></i>
                    <span className="text-[10px] font-semibold uppercase tracking-wide">类型</span>
                    <span className="truncate max-w-[35vw] font-medium text-light-text dark:text-dark-text sm:max-w-none">{typeSummary}</span>
                </span>
            )}
            <span className="inline-flex h-7 items-center gap-1.5 shrink-0 rounded-full border border-light-border bg-light-panel px-2.5 dark:border-dark-border dark:bg-dark-panel" title="编码">
                <i className="fa-solid fa-text-width w-3.5 text-center text-primary"></i>
                <span className="text-[10px] font-semibold uppercase tracking-wide">编码</span>
                <span className="font-mono font-semibold text-light-text dark:text-dark-text">UTF-8</span>
            </span>
            <span className="inline-flex h-7 items-center gap-1.5 shrink-0 rounded-full border border-light-border bg-light-panel px-2.5 dark:border-dark-border dark:bg-dark-panel" title={isDark ? '深色主题' : '浅色主题'}>
                <i className={`fa-solid ${isDark ? 'fa-moon' : 'fa-sun'} w-3.5 text-center text-primary`}></i>
                <span className="text-[10px] font-semibold uppercase tracking-wide">主题</span>
                <span className="font-semibold text-light-text dark:text-dark-text">{isDark ? '深色' : '浅色'}</span>
            </span>
            <StatusBarItem icon="fa-file-lines" value={fileCount} label="文件" />
            <StatusBarItem icon="fa-align-left" value={totalLines} label="行数" />
            <StatusBarItem icon="fa-quote-left" value={totalChars} label="字符" />
            {analysisSummary && (
                <StatusBarItem icon="fa-cubes-stacked" value={analysisSummary.totalEstimatedTokens} label="预计 Token" />
            )}
            {analysisSummary && analysisSummary.securityFindingCount > 0 && (
                <button
                    onClick={onShowSecurityFindings}
                    className="inline-flex h-7 items-center gap-1.5 shrink-0 rounded-full border border-amber-400/40 bg-amber-50 px-2.5 text-amber-700 transition-colors hover:border-amber-500 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300"
                    title="敏感信息提示"
                >
                    <i className="fa-solid fa-triangle-exclamation w-3.5 text-center"></i>
                    <span className="text-[10px] font-semibold uppercase tracking-wide">安全</span>
                    <span className="font-mono font-semibold">{analysisSummary.securityFindingCount.toLocaleString()}</span>
                </button>
            )}
        </footer>
    );
}

export default React.memo(StatusBar);
