import React from 'react';
import { motion } from 'framer-motion';
import type { SecurityFinding } from '../types';

interface SecurityFindingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    findings: SecurityFinding[];
}

const severityClass: Record<SecurityFinding['severity'], string> = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const SecurityFindingsDialog: React.FC<SecurityFindingsDialogProps> = ({ isOpen, onClose, findings }) => {
    React.useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-light-panel dark:bg-dark-panel rounded-xl shadow-2xl border border-light-border dark:border-dark-border w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
                onClick={(event) => event.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/50 backdrop-blur-md">
                    <div>
                        <h3 className="font-bold text-lg text-light-text dark:text-dark-text">安全提示</h3>
                        <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text mt-1">
                            浏览器端规则扫描发现的潜在敏感信息。请在复制或导出前再次确认。
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="关闭安全提示"
                        title="关闭安全提示"
                        className="w-8 h-8 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center text-light-subtle-text dark:text-dark-subtle-text transition-colors"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    {findings.length === 0 ? (
                        <div className="text-sm text-light-subtle-text dark:text-dark-subtle-text">
                            当前没有检测到敏感信息提示。
                        </div>
                    ) : (
                        findings.map((finding, index) => (
                            <div
                                key={`${finding.filePath}:${finding.ruleId}:${index}`}
                                className="rounded-lg border border-light-border dark:border-dark-border p-4 space-y-3 bg-light-bg/60 dark:bg-dark-bg/40"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="font-medium text-light-text dark:text-dark-text break-all">
                                                {finding.filePath}
                                            </div>
                                            <span className="rounded-full bg-light-border px-2 py-0.5 font-mono text-[11px] text-light-subtle-text dark:bg-dark-border dark:text-dark-subtle-text">
                                                {`L${finding.line}:C${finding.column}`}
                                            </span>
                                        </div>
                                        <div className="text-sm text-light-subtle-text dark:text-dark-subtle-text mt-1">
                                            {finding.message}
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase shrink-0 ${severityClass[finding.severity]}`}>
                                        {finding.severity}
                                    </span>
                                </div>
                                <div className="rounded-md border border-light-border dark:border-dark-border bg-light-panel dark:bg-dark-panel px-3 py-2 font-mono text-xs text-light-subtle-text dark:text-dark-subtle-text break-all">
                                    {finding.preview}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default React.memo(SecurityFindingsDialog);
