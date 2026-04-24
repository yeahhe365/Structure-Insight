import React from 'react';
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
    maxCharsThreshold: number;
    onSetMaxCharsThreshold: (val: number) => void;
    wordWrap: boolean;
    onToggleWordWrap: () => void;
    includeFileSummary: boolean;
    onToggleIncludeFileSummary: () => void;
    includeDirectoryStructure: boolean;
    onToggleIncludeDirectoryStructure: () => void;
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

type SettingsSectionId = 'workspace' | 'export' | 'about';

interface SettingsSectionDefinition {
    id: SettingsSectionId;
    label: string;
    title: string;
    icon: string;
}

const APP_VERSION = '5.4.0';
const iconUrl = `${import.meta.env.BASE_URL}icon.svg`;

const SETTINGS_SECTIONS: SettingsSectionDefinition[] = [
    {
        id: 'workspace',
        label: '工作区',
        title: '工作区设置',
        icon: 'fa-sliders',
    },
    {
        id: 'export',
        label: '导出',
        title: '导出设置',
        icon: 'fa-file-export',
    },
    {
        id: 'about',
        label: '关于',
        title: '项目与版本',
        icon: 'fa-circle-info',
    },
];

interface ToggleProps {
    checked: boolean;
    onChange: () => void;
    label: string;
    id: string;
}

const Toggle = ({ checked, onChange, label, id }: ToggleProps) => (
    <button
        id={id}
        type="button"
        aria-label={label}
        aria-pressed={checked}
        onClick={onChange}
        className={[
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-slate-950',
            checked
                ? 'border-primary/30 bg-primary shadow-sm shadow-primary/25'
                : 'border-light-border bg-light-panel dark:border-dark-border dark:bg-slate-800',
        ].join(' ')}
    >
        <span
            className={[
                'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
                checked ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
        />
    </button>
);

interface SidebarTabButtonProps {
    section: SettingsSectionDefinition;
    activeSection: SettingsSectionId;
    onSelectSection: (sectionId: SettingsSectionId) => void;
}

const SidebarTabButton = ({ section, activeSection, onSelectSection }: SidebarTabButtonProps) => {
    const isActive = activeSection === section.id;

    return (
        <button
            id={`settings-tab-${section.id}`}
            type="button"
            role="tab"
            aria-label={section.label}
            aria-controls={`settings-panel-${section.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelectSection(section.id)}
            className={[
                'flex flex-shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors outline-none select-none',
                'w-auto md:w-full focus-visible:ring-2 focus-visible:ring-primary/50',
                isActive
                    ? 'bg-light-bg text-light-text shadow-sm dark:bg-slate-900 dark:text-dark-text'
                    : 'text-light-subtle-text hover:bg-light-hover hover:text-light-text dark:text-dark-subtle-text dark:hover:bg-slate-900/60 dark:hover:text-dark-text',
            ].join(' ')}
        >
            <i
                className={[
                    'fa-solid w-4 text-center transition-colors',
                    section.icon,
                    isActive ? 'text-primary' : 'text-light-subtle-text dark:text-dark-subtle-text',
                ].join(' ')}
            />
            <span>{section.label}</span>
        </button>
    );
};

interface SectionGroupProps {
    title: string;
    icon?: string;
    children: React.ReactNode;
}

const SectionGroup = ({ title, icon, children }: SectionGroupProps) => (
    <section className="py-2">
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-light-subtle-text dark:text-dark-subtle-text">
            {icon ? <i className={`fa-solid ${icon} w-3.5 text-center`} /> : null}
            {title}
        </h4>
        <div className="divide-y divide-light-border/80 rounded-2xl border border-light-border/80 bg-light-panel px-4 dark:divide-dark-border/80 dark:border-dark-border/80 dark:bg-slate-900">
            {children}
        </div>
    </section>
);

interface SettingsRowProps {
    label: string;
    description?: string;
    control?: React.ReactNode;
    children?: React.ReactNode;
    stacked?: boolean;
}

const SettingsRow = ({ label, description, control, children, stacked = false }: SettingsRowProps) => (
    <div className="py-3">
        <div className={stacked ? 'space-y-3' : 'flex items-start justify-between gap-4'}>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-light-text dark:text-dark-text">{label}</div>
                {description ? (
                    <p className="mt-0.5 text-xs leading-5 text-light-subtle-text dark:text-dark-subtle-text">
                        {description}
                    </p>
                ) : null}
            </div>
            {!stacked && control ? <div className="shrink-0">{control}</div> : null}
        </div>
        {stacked && children ? <div className="mt-3">{children}</div> : null}
        {!stacked && children ? <div className="mt-3">{children}</div> : null}
    </div>
);

interface FieldProps {
    id: string;
    value: string | number;
    onChange: (value: string) => void;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    type?: string;
    min?: number;
}

const Field = ({
    id,
    value,
    onChange,
    placeholder,
    multiline = false,
    rows = 3,
    type = 'text',
    min,
}: FieldProps) => {
    const className = 'w-full rounded-lg border border-light-border bg-light-bg px-3 py-2.5 text-sm text-light-text outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-slate-950 dark:text-dark-text';

    if (multiline) {
        return (
            <textarea
                id={id}
                value={String(value)}
                onChange={(event) => onChange(event.target.value)}
                rows={rows}
                className={`${className} resize-y`}
                placeholder={placeholder}
            />
        );
    }

    return (
        <input
            id={id}
            type={type}
            min={min}
            value={String(value)}
            onChange={(event) => onChange(event.target.value)}
            className={className}
            placeholder={placeholder}
        />
    );
};

const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen,
    onClose,
    isDarkTheme,
    onToggleTheme,
    extractContent,
    onToggleExtractContent,
    fontSize,
    onSetFontSize,
    onClearCache,
    maxCharsThreshold,
    onSetMaxCharsThreshold,
    wordWrap,
    onToggleWordWrap,
    includeFileSummary,
    onToggleIncludeFileSummary,
    includeDirectoryStructure,
    onToggleIncludeDirectoryStructure,
    exportFormat,
    onSetExportFormat,
    includePatterns,
    onSetIncludePatterns,
    ignorePatterns,
    onSetIgnorePatterns,
    useDefaultPatterns,
    onToggleUseDefaultPatterns,
    useGitignore,
    onToggleUseGitignore,
    includeEmptyDirectories,
    onToggleIncludeEmptyDirectories,
    showLineNumbers,
    onToggleShowLineNumbers,
    removeEmptyLines,
    onToggleRemoveEmptyLines,
    truncateBase64,
    onToggleTruncateBase64,
    exportSplitMaxChars,
    onSetExportSplitMaxChars,
    exportHeaderText,
    onSetExportHeaderText,
    exportInstructionText,
    onSetExportInstructionText,
}) => {
    const [stars, setStars] = React.useState<number | null>(null);
    const [starsLoading, setStarsLoading] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState<SettingsSectionId>('workspace');

    React.useEffect(() => {
        if (!isOpen) {
            return;
        }

        setActiveSection('workspace');
        setStars(null);
        setStarsLoading(false);
    }, [isOpen]);

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

    React.useEffect(() => {
        if (!isOpen || activeSection !== 'about') {
            return;
        }

        let cancelled = false;
        setStarsLoading(true);

        fetch('https://api.github.com/repos/yeahhe365/Structure-Insight')
            .then(res => res.json())
            .then(data => {
                if (cancelled) {
                    return;
                }
                setStars(typeof data?.stargazers_count === 'number' ? data.stargazers_count : null);
            })
            .catch(() => {
                if (!cancelled) {
                    setStars(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setStarsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen, activeSection]);

    if (!isOpen) {
        return null;
    }

    const currentSection = SETTINGS_SECTIONS.find(section => section.id === activeSection) ?? SETTINGS_SECTIONS[0];
    const panelId = `settings-panel-${activeSection}`;
    const panelLabelId = `settings-tab-${activeSection}`;
    const maxCharsThresholdInKb = Math.round(maxCharsThreshold / 1024);
    const starStatusText = starsLoading ? '正在获取 GitHub 数据…' : stars !== null ? `${stars.toLocaleString()} Stars` : 'GitHub 数据暂不可用';

    const ThemeSegmentedControl = () => (
        <div className="inline-flex rounded-lg border border-light-border bg-light-bg p-1 dark:border-dark-border dark:bg-slate-950">
            {[
                { id: 'light', label: '浅色', active: !isDarkTheme },
                { id: 'dark', label: '深色', active: isDarkTheme },
            ].map(option => (
                <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                        if (option.active) {
                            return;
                        }
                        onToggleTheme();
                    }}
                    className={[
                        'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                        option.active
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-light-subtle-text hover:text-light-text dark:text-dark-subtle-text dark:hover:text-dark-text',
                    ].join(' ')}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );

    const renderWorkspaceSection = () => (
        <div className="max-w-3xl mx-auto w-full space-y-6">
            <SectionGroup title="外观" icon="fa-palette">
                <SettingsRow label="主题模式" description="在浅色与深色阅读环境之间快速切换。">
                    <ThemeSegmentedControl />
                </SettingsRow>
                <SettingsRow label="字体大小" description="即时调整阅读密度。" stacked>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-light-subtle-text dark:text-dark-subtle-text">
                                阅读尺寸
                            </span>
                            <span className="rounded-md bg-light-bg px-2 py-0.5 font-mono text-sm text-primary dark:bg-slate-950">
                                {fontSize}px
                            </span>
                        </div>
                        <input
                            type="range"
                            id="font-size-slider"
                            min="10"
                            max="24"
                            step="1"
                            value={fontSize}
                            onChange={(event) => onSetFontSize(Number(event.target.value))}
                            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-light-border accent-primary dark:bg-dark-border"
                        />
                        <div className="flex justify-between px-1 text-[11px] font-mono text-light-subtle-text dark:text-dark-subtle-text">
                            <span>10px</span>
                            <span>17px</span>
                            <span>24px</span>
                        </div>
                    </div>
                </SettingsRow>
            </SectionGroup>

            <SectionGroup title="工作区行为" icon="fa-folder-tree">
                <SettingsRow
                    label="自动换行"
                    description="减少代码横向滚动，更接近聊天产品里的阅读方式。"
                    control={<Toggle id="word-wrap-toggle" label="自动换行" checked={wordWrap} onChange={onToggleWordWrap} />}
                />
                <SettingsRow
                    label="提取文件内容"
                    description="关闭后仅分析结构，适合体量更大的仓库。"
                    control={<Toggle id="extract-toggle" label="提取文件内容" checked={extractContent} onChange={onToggleExtractContent} />}
                />
                <SettingsRow label="大文件阈值" description="超过阈值时只保留路径，不提取正文。">
                    <div className="flex items-center gap-2">
                        <div className="w-24">
                            <Field
                                id="max-chars-input"
                                type="number"
                                min={0}
                                value={maxCharsThresholdInKb}
                                onChange={(value) => onSetMaxCharsThreshold((Math.max(0, Number(value) || 0)) * 1024)}
                            />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-light-subtle-text dark:text-dark-subtle-text">
                            KB
                        </span>
                    </div>
                </SettingsRow>
            </SectionGroup>

            <section className="rounded-2xl bg-gradient-to-br from-red-600 to-red-700 p-5 text-white shadow-lg shadow-red-900/20">
                <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                    <i className="fa-solid fa-triangle-exclamation w-4 text-center" />
                    <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-white">Danger Zone</h4>
                </div>
                <div className="divide-y divide-white/10">
                    <div className="flex items-center justify-between gap-4 py-3">
                        <div>
                            <div className="text-sm font-semibold text-white">清除缓存</div>
                            <p className="mt-0.5 text-xs leading-5 text-white/75">重置所有本地设置与缓存项目数据。</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClearCache}
                            className="rounded-lg border border-white/20 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-white/40"
                        >
                            清除缓存
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );

    const renderExportSection = () => (
        <div className="max-w-3xl mx-auto w-full space-y-6">
            <SectionGroup title="导出结构" icon="fa-layer-group">
                <SettingsRow label="导出格式" description="决定上下文输出的最终载体。">
                    <div className="w-full sm:w-64">
                        <select
                            id="export-format-select"
                            value={exportFormat}
                            onChange={(event) => onSetExportFormat(event.target.value as ExportFormat)}
                            className="w-full rounded-lg border border-light-border bg-light-bg px-3 py-2.5 text-sm text-light-text outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-slate-950 dark:text-dark-text"
                        >
                            <option value="plain">Plain</option>
                            <option value="xml">XML</option>
                            <option value="markdown">Markdown</option>
                            <option value="json">JSON</option>
                        </select>
                    </div>
                </SettingsRow>
                <SettingsRow
                    label="文件摘要"
                    description="在导出开头保留概览信息。"
                    control={<Toggle id="file-summary-toggle" label="文件摘要" checked={includeFileSummary} onChange={onToggleIncludeFileSummary} />}
                />
                <SettingsRow
                    label="目录结构"
                    description="保留完整目录树，方便快速理解仓库轮廓。"
                    control={<Toggle id="directory-structure-toggle" label="目录结构" checked={includeDirectoryStructure} onChange={onToggleIncludeDirectoryStructure} />}
                />
            </SectionGroup>

            <SectionGroup title="内容处理" icon="fa-wand-magic-sparkles">
                <SettingsRow
                    label="导出时显示行号"
                    description="只影响导出正文；代码预览保留阅读行号，便于定位。"
                    control={<Toggle id="line-numbers-toggle" label="导出时显示行号" checked={showLineNumbers} onChange={onToggleShowLineNumbers} />}
                />
                <SettingsRow
                    label="移除空行"
                    description="收紧输出内容的空白体积。"
                    control={<Toggle id="remove-empty-lines-toggle" label="移除空行" checked={removeEmptyLines} onChange={onToggleRemoveEmptyLines} />}
                />
                <SettingsRow
                    label="截断 Base64"
                    description="避免长 data URL 直接淹没上下文。"
                    control={<Toggle id="truncate-base64-toggle" label="截断 Base64" checked={truncateBase64} onChange={onToggleTruncateBase64} />}
                />
                <SettingsRow label="拆分阈值" description="大于 0 时按字符数自动拆分导出文件。">
                    <div className="w-full sm:w-48">
                        <Field
                            id="export-split-max-chars"
                            type="number"
                            min={0}
                            value={exportSplitMaxChars}
                            onChange={(value) => onSetExportSplitMaxChars(Math.max(0, Number(value) || 0))}
                        />
                    </div>
                </SettingsRow>
            </SectionGroup>

            <SectionGroup title="过滤规则" icon="fa-filter">
                <SettingsRow label="包含模式" description="例如 `src/**/*.ts`、`docs/**`。" stacked>
                    <Field
                        id="include-patterns"
                        value={includePatterns}
                        onChange={onSetIncludePatterns}
                        placeholder="例如 src/**/*.ts,docs/**"
                    />
                </SettingsRow>
                <SettingsRow label="忽略模式" description="例如 `**/*.test.ts`、`dist/**`。" stacked>
                    <Field
                        id="ignore-patterns"
                        value={ignorePatterns}
                        onChange={onSetIgnorePatterns}
                        placeholder="例如 **/*.test.ts,dist/**"
                    />
                </SettingsRow>
                <SettingsRow
                    label="默认忽略规则"
                    description="使用内置忽略模式。"
                    control={<Toggle id="default-patterns-toggle" label="默认忽略规则" checked={useDefaultPatterns} onChange={onToggleUseDefaultPatterns} />}
                />
                <SettingsRow
                    label="应用忽略文件"
                    description="复用项目里的 `.gitignore`、`.ignore` 与 `.repomixignore` 规则。"
                    control={<Toggle id="gitignore-toggle" label="应用忽略文件" checked={useGitignore} onChange={onToggleUseGitignore} />}
                />
                <SettingsRow
                    label="包含空目录"
                    description="导出目录树时保留空目录节点。"
                    control={<Toggle id="empty-directories-toggle" label="包含空目录" checked={includeEmptyDirectories} onChange={onToggleIncludeEmptyDirectories} />}
                />
            </SectionGroup>

            <SectionGroup title="附加说明" icon="fa-pen-ruler">
                <SettingsRow label="Header 文本" description="适合放项目背景、任务上下文或外部限制。" stacked>
                    <Field
                        id="export-header-text"
                        multiline
                        rows={3}
                        value={exportHeaderText}
                        onChange={onSetExportHeaderText}
                        placeholder="例如：请先理解项目结构，再指出最值得优先重构的模块。"
                    />
                </SettingsRow>
                <SettingsRow label="Instruction 文本" description="适合告诉 AI 希望得到的输出形式。" stacked>
                    <Field
                        id="export-instruction-text"
                        multiline
                        rows={3}
                        value={exportInstructionText}
                        onChange={onSetExportInstructionText}
                        placeholder="例如：先列 P0 / P1 问题，再给可执行的修改方案。"
                    />
                </SettingsRow>
            </SectionGroup>
        </div>
    );

    const renderAboutSection = () => (
        <div className="flex min-h-full flex-col items-center px-4 py-3 text-center">
            <div className="relative">
                <img
                    src={iconUrl}
                    alt="Structure Insight Logo"
                    className="h-24 w-24 rounded-[28px] drop-shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                />
            </div>

            <div className="mt-5 max-w-xl space-y-4">
                <h3 className="text-[1.9rem] font-bold tracking-tight text-light-text dark:text-dark-text">Structure Insight</h3>

                <div className="flex flex-wrap items-center justify-center gap-2">
                    <div className="inline-flex items-center gap-3 rounded-full border border-light-border bg-light-panel px-4 py-2 shadow-sm dark:border-dark-border dark:bg-slate-900">
                        <span className="font-mono text-sm font-bold text-light-text dark:text-dark-text">v{APP_VERSION}</span>
                        <span className="h-3.5 w-px bg-light-border dark:bg-dark-border" />
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-light-subtle-text dark:text-dark-subtle-text">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {starStatusText}
                        </span>
                    </div>
                </div>

                <p className="text-sm leading-6 text-light-subtle-text dark:text-dark-subtle-text">
                    面向代码结构理解、项目导出与目录探索的本地工作台。设置面板围绕导入、阅读和导出流程组织，
                    让常用调整更容易扫描，也保持控件层级一致。
                </p>
            </div>

            <div className="mt-5 flex w-full max-w-md flex-col items-stretch justify-center gap-2.5 sm:flex-row">
                <a
                    href="https://github.com/yeahhe365/Structure-Insight"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
                >
                    <i className="fa-solid fa-code-branch text-sm" />
                    <span>查看 GitHub</span>
                </a>
                <a
                    href="https://github.com/yeahhe365/Structure-Insight/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-light-border bg-light-panel px-5 py-2.5 text-sm font-medium text-light-text shadow-sm hover:border-primary/30 hover:text-primary dark:border-dark-border dark:bg-slate-900 dark:text-dark-text dark:hover:border-primary/30 dark:hover:text-primary"
                >
                    <i className="fa-solid fa-bug text-sm" />
                    <span>反馈问题</span>
                </a>
            </div>
        </div>
    );

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'workspace':
                return renderWorkspaceSection();
            case 'export':
                return renderExportSection();
            case 'about':
                return renderAboutSection();
            default:
                return renderWorkspaceSection();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="w-full h-[100dvh] sm:h-[85vh] sm:w-[90vw] max-w-6xl overflow-hidden bg-light-panel shadow-2xl sm:rounded-xl dark:bg-slate-950 md:flex md:flex-row"
                onClick={(event) => event.stopPropagation()}
            >
                <aside className="flex w-full flex-shrink-0 flex-col border-b border-light-border bg-light-header dark:border-dark-border dark:bg-slate-900 md:w-64 md:border-b-0 md:border-r">
                    <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-5">
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="关闭设置"
                            className="flex h-9 w-9 items-center justify-center rounded-md text-light-subtle-text transition hover:bg-light-hover hover:text-light-text focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-dark-subtle-text dark:hover:bg-slate-800 dark:hover:text-dark-text"
                        >
                            <i className="fa-solid fa-times" />
                        </button>
                        <span className="font-semibold text-light-text dark:text-dark-text md:hidden">设置</span>
                        <div className="w-9 md:hidden" />
                    </div>

                    <nav
                        role="tablist"
                        aria-label="设置导航"
                        className="flex flex-1 gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:px-3 md:pb-3"
                    >
                        {SETTINGS_SECTIONS.map(section => (
                            <SidebarTabButton
                                key={section.id}
                                section={section}
                                activeSection={activeSection}
                                onSelectSection={setActiveSection}
                            />
                        ))}
                    </nav>
                </aside>

                <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-light-bg dark:bg-slate-950">
                    <header className="hidden flex-shrink-0 items-center px-8 py-6 md:flex">
                        <h2 className="text-2xl font-bold tracking-tight text-light-text dark:text-dark-text">
                            {currentSection.title}
                        </h2>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 no-scrollbar">
                        <section
                            id={panelId}
                            role="tabpanel"
                            aria-labelledby={panelLabelId}
                            className="space-y-4"
                        >
                            {renderSectionContent()}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default React.memo(SettingsDialog);
