import React from 'react';
import { motion } from 'framer-motion';
import type { ExportFormat } from '../services/exportBuilder';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkTheme: boolean;
    onToggleTheme: () => void;
    extractContent: boolean;
    onToggleExtractContent: () => void;
    fontSize: number;
    onSetFontSize: (size: number) => void;
    onClearCache: () => void;
    showCharCount: boolean;
    onToggleShowCharCount: () => void;
    maxCharsThreshold: number;
    onSetMaxCharsThreshold: (val: number) => void;
    wordWrap: boolean;
    onToggleWordWrap: () => void;
    includeFileSummary: boolean;
    onToggleIncludeFileSummary: () => void;
    includeDirectoryStructure: boolean;
    onToggleIncludeDirectoryStructure: () => void;
    includeGitDiffs: boolean;
    onToggleIncludeGitDiffs: () => void;
    exportFormat: ExportFormat;
    onSetExportFormat: (value: ExportFormat) => void;
    includePatterns: string;
    onSetIncludePatterns: (value: string) => void;
    ignorePatterns: string;
    onSetIgnorePatterns: (value: string) => void;
    useDefaultPatterns: boolean;
    onToggleUseDefaultPatterns: () => void;
    useGitignore: boolean;
    onToggleUseGitignore: () => void;
    includeEmptyDirectories: boolean;
    onToggleIncludeEmptyDirectories: () => void;
    showLineNumbers: boolean;
    onToggleShowLineNumbers: () => void;
    removeEmptyLines: boolean;
    onToggleRemoveEmptyLines: () => void;
    truncateBase64: boolean;
    onToggleTruncateBase64: () => void;
    exportSplitMaxChars: number;
    onSetExportSplitMaxChars: (value: number) => void;
    exportHeaderText: string;
    onSetExportHeaderText: (value: string) => void;
    exportInstructionText: string;
    onSetExportInstructionText: (value: string) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen, onClose, isDarkTheme, onToggleTheme, extractContent, onToggleExtractContent, fontSize, onSetFontSize, onClearCache,
    showCharCount, onToggleShowCharCount, maxCharsThreshold, onSetMaxCharsThreshold, wordWrap, onToggleWordWrap,
    includeFileSummary, onToggleIncludeFileSummary, includeDirectoryStructure, onToggleIncludeDirectoryStructure,
    includeGitDiffs, onToggleIncludeGitDiffs, exportFormat, onSetExportFormat, includePatterns, onSetIncludePatterns,
    ignorePatterns, onSetIgnorePatterns, useDefaultPatterns, onToggleUseDefaultPatterns, useGitignore,
    onToggleUseGitignore, includeEmptyDirectories, onToggleIncludeEmptyDirectories, showLineNumbers,
    onToggleShowLineNumbers, removeEmptyLines, onToggleRemoveEmptyLines, truncateBase64, onToggleTruncateBase64,
    exportSplitMaxChars, onSetExportSplitMaxChars,
    exportHeaderText, onSetExportHeaderText, exportInstructionText, onSetExportInstructionText,
}) => {
    const dialogRef = React.useRef<HTMLDivElement>(null);
    const [stars, setStars] = React.useState<number | null>(null);
    const [starsLoading, setStarsLoading] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setStarsLoading(true);
            fetch('https://api.github.com/repos/yeahhe365/Structure-Insight')
                .then(res => res.json())
                .then(data => {
                    if (data && typeof data.stargazers_count === 'number') {
                        setStars(data.stargazers_count);
                    }
                })
                .catch(err => console.error('Failed to fetch GitHub stars:', err))
                .finally(() => setStarsLoading(false));

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const appVersion = '5.4.0';

    const SectionTitle = ({ children }: { children: React.ReactNode }) => (
        <h4 className="text-xs font-semibold text-light-subtle-text dark:text-dark-subtle-text uppercase tracking-wider mb-3 mt-1 px-1">
            {children}
        </h4>
    );

    const Switch = ({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) => (
        <button
            id={id}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-panel ${checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
            <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
        </button>
    );

    const TextField = ({
        id,
        value,
        onChange,
        placeholder,
    }: {
        id: string;
        value: string;
        onChange: (value: string) => void;
        placeholder: string;
    }) => (
        <input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder={placeholder}
        />
    );

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                ref={dialogRef}
                className="bg-light-panel dark:bg-dark-panel rounded-xl shadow-2xl border border-light-border dark:border-dark-border w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/50 backdrop-blur-md">
                    <h3 className="font-bold text-lg text-light-text dark:text-dark-text">设置</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center text-light-subtle-text dark:text-dark-subtle-text transition-colors"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8 no-scrollbar">
                    <div>
                        <SectionTitle>外观</SectionTitle>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                        <i className="fa-solid fa-moon"></i>
                                    </div>
                                    <label htmlFor="theme-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">
                                        深色主题
                                    </label>
                                </div>
                                <Switch id="theme-toggle" checked={isDarkTheme} onChange={onToggleTheme} />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
                                        <i className="fa-solid fa-list-ol"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="char-count-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">
                                            显示统计信息
                                        </label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">在文件树中显示字符和行数</span>
                                    </div>
                                </div>
                                <Switch id="char-count-toggle" checked={showCharCount} onChange={onToggleShowCharCount} />
                            </div>

                            <div className="flex flex-col p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm">
                                            <i className="fa-solid fa-font"></i>
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="font-size-slider" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">
                                                字体大小
                                            </label>
                                            <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">{fontSize}px</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-12 flex items-center gap-4">
                                    <span className="text-xs text-light-subtle-text shrink-0">A</span>
                                    <input
                                        type="range"
                                        id="font-size-slider"
                                        min="10"
                                        max="24"
                                        step="1"
                                        value={fontSize}
                                        onChange={(e) => onSetFontSize(Number(e.target.value))}
                                        className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="text-lg text-light-text dark:text-dark-text shrink-0">A</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <SectionTitle>代码显示</SectionTitle>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                                        <i className="fa-solid fa-text-width"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="word-wrap-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">
                                            自动换行
                                        </label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">代码超出宽度时自动换行</span>
                                    </div>
                                </div>
                                <Switch id="word-wrap-toggle" checked={wordWrap} onChange={onToggleWordWrap} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <SectionTitle>导出输出</SectionTitle>
                        <div className="space-y-4">
                            <div className="flex flex-col p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm">
                                        <i className="fa-solid fa-file-export"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="export-format-select" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">
                                            导出格式
                                        </label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">选择 plain、xml、markdown 或 json</span>
                                    </div>
                                </div>
                                <select
                                    id="export-format-select"
                                    value={exportFormat}
                                    onChange={(e) => onSetExportFormat(e.target.value as ExportFormat)}
                                    className="w-full px-3 py-2 text-sm bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="plain">Plain</option>
                                    <option value="xml">XML</option>
                                    <option value="markdown">Markdown</option>
                                    <option value="json">JSON</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm">
                                        <i className="fa-solid fa-file-lines"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="file-summary-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">文件摘要</label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">在导出上下文中包含 Repomix 风格的摘要部分</span>
                                    </div>
                                </div>
                                <Switch id="file-summary-toggle" checked={includeFileSummary} onChange={onToggleIncludeFileSummary} />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-sm">
                                        <i className="fa-solid fa-sitemap"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="directory-structure-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">包含目录结构</label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">在导出上下文中保留目录树结构</span>
                                    </div>
                                </div>
                                <Switch id="directory-structure-toggle" checked={includeDirectoryStructure} onChange={onToggleIncludeDirectoryStructure} />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                                        <i className="fa-solid fa-code-compare"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="git-diffs-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">Edited Changes</label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">在导出上下文中包含应用内编辑改动的 diff 视图</span>
                                    </div>
                                </div>
                                <Switch id="git-diffs-toggle" checked={includeGitDiffs} onChange={onToggleIncludeGitDiffs} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <TextField
                                    id="include-patterns"
                                    value={includePatterns}
                                    onChange={onSetIncludePatterns}
                                    placeholder="Include patterns, e.g. src/**/*.ts,docs/**"
                                />
                                <TextField
                                    id="ignore-patterns"
                                    value={ignorePatterns}
                                    onChange={onSetIgnorePatterns}
                                    placeholder="Ignore patterns, e.g. **/*.test.ts,dist/**"
                                />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex flex-col">
                                    <label htmlFor="default-patterns-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">默认忽略规则</label>
                                    <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">启用内置忽略目录和文件模式</span>
                                </div>
                                <Switch id="default-patterns-toggle" checked={useDefaultPatterns} onChange={onToggleUseDefaultPatterns} />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex flex-col">
                                    <label htmlFor="gitignore-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">使用 .gitignore / .ignore</label>
                                    <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">应用项目中的分层 .gitignore 与 .ignore 模式</span>
                                </div>
                                <Switch id="gitignore-toggle" checked={useGitignore} onChange={onToggleUseGitignore} />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex flex-col">
                                    <label htmlFor="empty-directories-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">包含空目录</label>
                                    <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">在导出结构中保留空目录</span>
                                </div>
                                <Switch id="empty-directories-toggle" checked={includeEmptyDirectories} onChange={onToggleIncludeEmptyDirectories} />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex flex-col">
                                    <label htmlFor="line-numbers-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">显示行号</label>
                                    <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">在导出内容前添加行号</span>
                                </div>
                                <Switch id="line-numbers-toggle" checked={showLineNumbers} onChange={onToggleShowLineNumbers} />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex flex-col">
                                    <label htmlFor="remove-empty-lines-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">移除空行</label>
                                    <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">压缩导出内容中的空白行</span>
                                </div>
                                <Switch id="remove-empty-lines-toggle" checked={removeEmptyLines} onChange={onToggleRemoveEmptyLines} />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex flex-col">
                                    <label htmlFor="truncate-base64-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">截断 Base64</label>
                                    <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">用占位符替换长 data URL / base64 内容</span>
                                </div>
                                <Switch id="truncate-base64-toggle" checked={truncateBase64} onChange={onToggleTruncateBase64} />
                            </div>

                            <div className="flex flex-col p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
                                        <i className="fa-solid fa-layer-group"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="export-split-max-chars" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">导出拆分阈值</label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">按字符数拆分保存。填 0 表示不拆分。</span>
                                    </div>
                                </div>
                                <input
                                    id="export-split-max-chars"
                                    type="number"
                                    min="0"
                                    value={exportSplitMaxChars}
                                    onChange={(e) => onSetExportSplitMaxChars(Math.max(0, Number(e.target.value) || 0))}
                                    className="w-full px-3 py-2 text-sm bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex flex-col p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm">
                                        <i className="fa-solid fa-heading"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="export-header-text" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">User Provided Header</label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">为空时不输出该段</span>
                                    </div>
                                </div>
                                <textarea
                                    id="export-header-text"
                                    value={exportHeaderText}
                                    onChange={(e) => onSetExportHeaderText(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                                    placeholder="Optional context shown in the User Provided Header section"
                                />
                            </div>

                            <div className="flex flex-col p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-9 h-9 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 shadow-sm">
                                        <i className="fa-solid fa-list-check"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="export-instruction-text" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">Instruction</label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">为空时不输出该段</span>
                                    </div>
                                </div>
                                <textarea
                                    id="export-instruction-text"
                                    value={exportInstructionText}
                                    onChange={(e) => onSetExportInstructionText(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                                    placeholder="Optional guidance shown in the Instruction section"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <SectionTitle>通用</SectionTitle>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm">
                                        <i className="fa-solid fa-file-code"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="extract-toggle" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">提取文件内容</label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">禁用以仅查看目录结构</span>
                                    </div>
                                </div>
                                <Switch id="extract-toggle" checked={extractContent} onChange={onToggleExtractContent} />
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-sm">
                                        <i className="fa-solid fa-weight-hanging"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <label htmlFor="max-chars-input" className="text-sm font-medium text-light-text dark:text-dark-text cursor-pointer select-none">自动跳过大文件</label>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">0 表示不限制，超过此限制的文件不提取内容</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            id="max-chars-input"
                                            value={Math.round(maxCharsThreshold / 1024)}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                onSetMaxCharsThreshold(isNaN(val) ? 0 : val * 1024);
                                            }}
                                            className="w-24 px-3 py-1.5 text-sm font-mono font-bold text-right bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-primary"
                                            min="0"
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-light-subtle-text dark:text-dark-subtle-text w-6 uppercase">KB</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/50 transition-colors -mx-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                                        <i className="fa-solid fa-database"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-light-text dark:text-dark-text">应用缓存</span>
                                        <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">清除所有本地存储的数据</span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClearCache}
                                    className="px-3 py-1.5 text-xs font-medium rounded-md text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-900/50"
                                >
                                    清除
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <SectionTitle>关于</SectionTitle>
                        <div className="bg-light-bg dark:bg-dark-bg rounded-xl p-4 border border-light-border dark:border-dark-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <i className="fa-solid fa-layer-group"></i>
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-light-text dark:text-dark-text">Structure Insight</h5>
                                        <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text">v{appVersion}</p>
                                    </div>
                                </div>
                                <a
                                    href="https://github.com/yeahhe365/Structure-Insight"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg bg-light-panel dark:bg-dark-panel border border-light-border dark:border-dark-border hover:border-primary dark:hover:border-primary text-light-subtle-text dark:text-dark-subtle-text hover:text-primary transition-all"
                                >
                                    <i className="fa-solid fa-code-branch text-sm"></i>
                                    <span>GitHub</span>
                                    {starsLoading ? (
                                        <span className="flex items-center pl-2 border-l border-light-border dark:border-dark-border ml-2">
                                            <i className="fa-solid fa-spinner fa-spin text-light-subtle-text mr-1 text-[10px]"></i>
                                        </span>
                                    ) : stars !== null && (
                                        <span className="flex items-center pl-2 border-l border-light-border dark:border-dark-border ml-2 group-hover:border-primary/30">
                                            <i className="fa-solid fa-star text-yellow-500 mr-1 text-[10px]"></i>
                                            {stars.toLocaleString()}
                                        </span>
                                    )}
                                </a>
                            </div>
                            <p className="text-xs text-light-subtle-text dark:text-dark-subtle-text leading-relaxed">
                                一个基于浏览器的本地代码分析工具，旨在帮助开发人员快速可视化项目结构并浏览代码内容。
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default React.memo(SettingsDialog);
