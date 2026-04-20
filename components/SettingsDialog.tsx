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
    shortLabel: string;
    eyebrow: string;
    title: string;
    description: string;
    icon: string;
    accent: string;
}

const APP_VERSION = '5.4.0';

const SETTINGS_SECTIONS: SettingsSectionDefinition[] = [
    {
        id: 'workspace',
        label: '工作区',
        shortLabel: 'Workspace',
        eyebrow: 'Workspace',
        title: '工作区设置',
        description: '控制阅读体验、文件处理方式和本地工作区行为，让日常浏览更顺手。',
        icon: 'fa-solid fa-sliders',
        accent: 'from-sky-500 via-cyan-500 to-blue-600',
    },
    {
        id: 'export',
        label: '导出',
        shortLabel: 'Export',
        eyebrow: 'Export',
        title: '导出设置',
        description: '决定上下文打包的结构、过滤规则和附加说明，输出更适合发给 AI。',
        icon: 'fa-solid fa-box-archive',
        accent: 'from-emerald-500 via-teal-500 to-cyan-600',
    },
    {
        id: 'about',
        label: '关于',
        shortLabel: 'About',
        eyebrow: 'About',
        title: '项目与版本',
        description: '查看版本、仓库入口和项目说明，也可以从这里做少量维护操作。',
        icon: 'fa-solid fa-sparkles',
        accent: 'from-amber-500 via-orange-500 to-rose-500',
    },
];

const SettingsDialog: React.FC<SettingsDialogProps> = ({
    isOpen, onClose, isDarkTheme, onToggleTheme, extractContent, onToggleExtractContent, fontSize, onSetFontSize, onClearCache,
    showCharCount, onToggleShowCharCount, maxCharsThreshold, onSetMaxCharsThreshold, wordWrap, onToggleWordWrap,
    includeFileSummary, onToggleIncludeFileSummary, includeDirectoryStructure, onToggleIncludeDirectoryStructure,
    exportFormat, onSetExportFormat, includePatterns, onSetIncludePatterns,
    ignorePatterns, onSetIgnorePatterns, useDefaultPatterns, onToggleUseDefaultPatterns, useGitignore,
    onToggleUseGitignore, includeEmptyDirectories, onToggleIncludeEmptyDirectories, showLineNumbers,
    onToggleShowLineNumbers, removeEmptyLines, onToggleRemoveEmptyLines, truncateBase64, onToggleTruncateBase64,
    exportSplitMaxChars, onSetExportSplitMaxChars,
    exportHeaderText, onSetExportHeaderText, exportInstructionText, onSetExportInstructionText,
}) => {
    const [stars, setStars] = React.useState<number | null>(null);
    const [starsLoading, setStarsLoading] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState<SettingsSectionId>('workspace');

    React.useEffect(() => {
        if (!isOpen) {
            return;
        }

        setActiveSection('workspace');
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
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const currentSection = SETTINGS_SECTIONS.find(section => section.id === activeSection) ?? SETTINGS_SECTIONS[0];
    const maxCharsThresholdInKb = Math.round(maxCharsThreshold / 1024);

    const SectionNavButton = ({ section }: { section: SettingsSectionDefinition }) => {
        const isActive = section.id === activeSection;

        return (
            <button
                type="button"
                aria-pressed={isActive}
                aria-label={section.label}
                onClick={() => setActiveSection(section.id)}
                className={[
                    'group relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-2 dark:focus:ring-offset-dark-panel',
                    isActive
                        ? 'border-primary/30 bg-white text-light-text shadow-lg shadow-sky-500/10 dark:border-sky-400/30 dark:bg-slate-800 dark:text-dark-text'
                        : 'border-black/5 bg-white/70 text-light-text/90 hover:border-primary/20 hover:bg-white dark:border-white/5 dark:bg-slate-900/50 dark:text-dark-text/90 dark:hover:border-sky-400/20 dark:hover:bg-slate-900',
                ].join(' ')}
            >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${section.accent} ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
                <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${section.accent} text-white shadow-lg shadow-sky-500/20`}>
                        <i className={section.icon}></i>
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold">{section.label}</div>
                        <div className="mt-1 text-xs text-light-subtle-text dark:text-dark-subtle-text">{section.description}</div>
                    </div>
                </div>
            </button>
        );
    };

    const Switch = ({
        checked,
        onChange,
        label,
        id,
    }: {
        checked: boolean;
        onChange: () => void;
        label: string;
        id: string;
    }) => (
        <button
            id={id}
            type="button"
            aria-label={label}
            aria-pressed={checked}
            onClick={onChange}
            className={[
                'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-2 dark:focus:ring-offset-dark-panel',
                checked
                    ? 'border-primary/20 bg-primary shadow-lg shadow-sky-500/25'
                    : 'border-light-border bg-slate-200 dark:border-dark-border dark:bg-slate-700',
            ].join(' ')}
        >
            <span
                className={[
                    'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200',
                    checked ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
            />
        </button>
    );

    const PanelCard = ({
        title,
        eyebrow,
        description,
        icon,
        children,
        className = '',
    }: {
        title: string;
        eyebrow?: string;
        description?: string;
        icon?: string;
        children: React.ReactNode;
        className?: string;
    }) => (
        <section className={`rounded-[28px] border border-black/5 bg-white/90 p-5 shadow-sm shadow-slate-200/70 backdrop-blur dark:border-white/5 dark:bg-slate-900/80 dark:shadow-black/10 ${className}`}>
            <div className="mb-4 flex items-start gap-3">
                {icon ? (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <i className={icon}></i>
                    </div>
                ) : null}
                <div className="min-w-0">
                    {eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-light-subtle-text dark:text-dark-subtle-text">{eyebrow}</div> : null}
                    <h4 className="text-base font-semibold text-light-text dark:text-dark-text">{title}</h4>
                    {description ? <p className="mt-1 text-sm leading-6 text-light-subtle-text dark:text-dark-subtle-text">{description}</p> : null}
                </div>
            </div>
            <div className="space-y-3">{children}</div>
        </section>
    );

    const SettingRow = ({
        icon,
        title,
        description,
        control,
    }: {
        icon: string;
        title: string;
        description: string;
        control: React.ReactNode;
    }) => (
        <div className="flex items-center gap-4 rounded-2xl border border-black/5 bg-slate-50/90 px-4 py-3 dark:border-white/5 dark:bg-slate-800/70">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-100">
                <i className={icon}></i>
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-light-text dark:text-dark-text">{title}</div>
                <div className="mt-1 text-xs leading-5 text-light-subtle-text dark:text-dark-subtle-text">{description}</div>
            </div>
            <div className="shrink-0">{control}</div>
        </div>
    );

    const NumberInput = ({
        id,
        label,
        value,
        onChange,
        suffix,
        placeholder,
    }: {
        id: string;
        label: string;
        value: number;
        onChange: (value: number) => void;
        suffix: string;
        placeholder: string;
    }) => (
        <label htmlFor={id} className="flex items-center gap-3 rounded-2xl border border-black/5 bg-slate-50/90 px-4 py-3 dark:border-white/5 dark:bg-slate-800/70">
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-light-text dark:text-dark-text">{label}</span>
                <span className="mt-1 block text-xs leading-5 text-light-subtle-text dark:text-dark-subtle-text">
                    {placeholder}
                </span>
            </span>
            <div className="flex items-center gap-2">
                <input
                    id={id}
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
                    className="w-24 rounded-2xl border border-light-border bg-white px-3 py-2 text-right text-sm font-semibold text-light-text outline-none ring-0 transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-slate-900 dark:text-dark-text"
                />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-light-subtle-text dark:text-dark-subtle-text">{suffix}</span>
            </div>
        </label>
    );

    const TextField = ({
        id,
        label,
        value,
        onChange,
        placeholder,
    }: {
        id: string;
        label: string;
        value: string;
        onChange: (value: string) => void;
        placeholder: string;
    }) => (
        <label htmlFor={id} className="block">
            <div className="mb-2 text-sm font-medium text-light-text dark:text-dark-text">{label}</div>
            <input
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-2xl border border-light-border bg-slate-50 px-4 py-3 text-sm text-light-text outline-none transition placeholder:text-light-subtle-text focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-dark-border dark:bg-slate-800 dark:text-dark-text dark:placeholder:text-dark-subtle-text"
                placeholder={placeholder}
            />
        </label>
    );

    const TextAreaField = ({
        id,
        label,
        description,
        value,
        onChange,
        placeholder,
    }: {
        id: string;
        label: string;
        description: string;
        value: string;
        onChange: (value: string) => void;
        placeholder: string;
    }) => (
        <label htmlFor={id} className="block">
            <div className="mb-2 text-sm font-medium text-light-text dark:text-dark-text">{label}</div>
            <div className="mb-3 text-xs leading-5 text-light-subtle-text dark:text-dark-subtle-text">{description}</div>
            <textarea
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-light-border bg-slate-50 px-4 py-3 text-sm text-light-text outline-none transition placeholder:text-light-subtle-text focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-dark-border dark:bg-slate-800 dark:text-dark-text dark:placeholder:text-dark-subtle-text"
                placeholder={placeholder}
            />
        </label>
    );

    const renderWorkspaceSection = () => (
        <div className="grid gap-5 xl:grid-cols-2">
            <PanelCard
                eyebrow="Appearance"
                title="阅读与界面"
                description="把高频的视觉设置集中在一起，避免每次都在长列表里来回找。"
                icon="fa-solid fa-brush"
            >
                <SettingRow
                    icon="fa-solid fa-moon"
                    title="深色主题"
                    description="切换整体界面明暗风格。"
                    control={<Switch id="theme-toggle" label="深色主题" checked={isDarkTheme} onChange={onToggleTheme} />}
                />
                <SettingRow
                    icon="fa-solid fa-list-ol"
                    title="显示统计信息"
                    description="在文件树中显示字符数和行数。"
                    control={<Switch id="char-count-toggle" label="显示统计信息" checked={showCharCount} onChange={onToggleShowCharCount} />}
                />
                <div className="rounded-2xl border border-black/5 bg-slate-50/90 px-4 py-4 dark:border-white/5 dark:bg-slate-800/70">
                    <div className="mb-3 flex items-center justify-between gap-4">
                        <div>
                            <label htmlFor="font-size-slider" className="text-sm font-medium text-light-text dark:text-dark-text">字体大小</label>
                            <div className="mt-1 text-xs text-light-subtle-text dark:text-dark-subtle-text">当前 {fontSize}px</div>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                            {fontSize}px
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-light-subtle-text dark:text-dark-subtle-text">A</span>
                        <input
                            type="range"
                            id="font-size-slider"
                            min="10"
                            max="24"
                            step="1"
                            value={fontSize}
                            onChange={(e) => onSetFontSize(Number(e.target.value))}
                            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-700"
                        />
                        <span className="text-lg font-semibold text-light-text dark:text-dark-text">A</span>
                    </div>
                </div>
            </PanelCard>

            <PanelCard
                eyebrow="Behavior"
                title="阅读与处理"
                description="控制加载内容的颗粒度，以及日常浏览时更舒服的代码阅读方式。"
                icon="fa-solid fa-gauge"
            >
                <SettingRow
                    icon="fa-solid fa-text-width"
                    title="自动换行"
                    description="代码超出宽度时自动换行，减少横向滚动。"
                    control={<Switch id="word-wrap-toggle" label="自动换行" checked={wordWrap} onChange={onToggleWordWrap} />}
                />
                <SettingRow
                    icon="fa-solid fa-file-code"
                    title="提取文件内容"
                    description="关闭后只保留目录结构，适合超大项目快速查看。"
                    control={<Switch id="extract-toggle" label="提取文件内容" checked={extractContent} onChange={onToggleExtractContent} />}
                />
                <NumberInput
                    id="max-chars-input"
                    label="自动跳过大文件"
                    value={maxCharsThresholdInKb}
                    onChange={(value) => onSetMaxCharsThreshold(value * 1024)}
                    suffix="KB"
                    placeholder="0 表示不限制，超过阈值的文件只保留路径，不提取内容。"
                />
                <div className="rounded-2xl border border-red-200/70 bg-red-50/90 px-4 py-4 dark:border-red-900/40 dark:bg-red-950/20">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-medium text-red-700 dark:text-red-300">应用缓存</div>
                            <div className="mt-1 text-xs leading-5 text-red-600/80 dark:text-red-300/80">
                                清空所有本地设置和缓存项目数据。
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClearCache}
                            className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/50"
                        >
                            清除缓存
                        </button>
                    </div>
                </div>
            </PanelCard>
        </div>
    );

    const renderExportSection = () => (
        <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <PanelCard
                    eyebrow="Shape"
                    title="导出结构"
                    description="先决定输出的大形状，再去微调过滤和文本处理。"
                    icon="fa-solid fa-diagram-project"
                >
                    <label htmlFor="export-format-select" className="block">
                        <div className="mb-2 text-sm font-medium text-light-text dark:text-dark-text">导出格式</div>
                        <div className="mb-3 text-xs leading-5 text-light-subtle-text dark:text-dark-subtle-text">支持 plain、xml、markdown 和 json。</div>
                        <select
                            id="export-format-select"
                            value={exportFormat}
                            onChange={(e) => onSetExportFormat(e.target.value as ExportFormat)}
                            className="w-full rounded-2xl border border-light-border bg-slate-50 px-4 py-3 text-sm text-light-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-dark-border dark:bg-slate-800 dark:text-dark-text"
                        >
                            <option value="plain">Plain</option>
                            <option value="xml">XML</option>
                            <option value="markdown">Markdown</option>
                            <option value="json">JSON</option>
                        </select>
                    </label>
                    <SettingRow
                        icon="fa-solid fa-file-lines"
                        title="文件摘要"
                        description="保留 Repomix 风格的摘要部分。"
                        control={<Switch id="file-summary-toggle" label="文件摘要" checked={includeFileSummary} onChange={onToggleIncludeFileSummary} />}
                    />
                    <SettingRow
                        icon="fa-solid fa-sitemap"
                        title="包含目录结构"
                        description="在导出中加入目录树，提升结构可读性。"
                        control={<Switch id="directory-structure-toggle" label="包含目录结构" checked={includeDirectoryStructure} onChange={onToggleIncludeDirectoryStructure} />}
                    />
                </PanelCard>

                <PanelCard
                    eyebrow="Cleanup"
                    title="输出处理"
                    description="这些选项会直接改变最终文本内容，适合在 token 紧张时快速瘦身。"
                    icon="fa-solid fa-filter-circle-dollar"
                >
                    <SettingRow
                        icon="fa-solid fa-list-ol"
                        title="显示行号"
                        description="为每一行内容加上编号，方便和 AI 对齐讨论。"
                        control={<Switch id="line-numbers-toggle" label="显示行号" checked={showLineNumbers} onChange={onToggleShowLineNumbers} />}
                    />
                    <SettingRow
                        icon="fa-solid fa-arrows-up-down"
                        title="移除空行"
                        description="压缩文件内容中的冗余空白。"
                        control={<Switch id="remove-empty-lines-toggle" label="移除空行" checked={removeEmptyLines} onChange={onToggleRemoveEmptyLines} />}
                    />
                    <SettingRow
                        icon="fa-solid fa-file-zipper"
                        title="截断 Base64"
                        description="将长 data URL 与 Base64 内容替换成占位符。"
                        control={<Switch id="truncate-base64-toggle" label="截断 Base64" checked={truncateBase64} onChange={onToggleTruncateBase64} />}
                    />
                    <NumberInput
                        id="export-split-max-chars"
                        label="导出拆分阈值"
                        value={exportSplitMaxChars}
                        onChange={onSetExportSplitMaxChars}
                        suffix="chars"
                        placeholder="按字符数自动拆分保存；0 表示不拆分。"
                    />
                </PanelCard>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <PanelCard
                    eyebrow="Filter"
                    title="过滤规则"
                    description="定义哪些内容会进入导出，适合为 AI 减少噪音。"
                    icon="fa-solid fa-compass-drafting"
                >
                    <TextField
                        id="include-patterns"
                        label="包含模式"
                        value={includePatterns}
                        onChange={onSetIncludePatterns}
                        placeholder="例如 src/**/*.ts,docs/**"
                    />
                    <TextField
                        id="ignore-patterns"
                        label="忽略模式"
                        value={ignorePatterns}
                        onChange={onSetIgnorePatterns}
                        placeholder="例如 **/*.test.ts,dist/**"
                    />
                    <SettingRow
                        icon="fa-solid fa-eye-slash"
                        title="默认忽略规则"
                        description="启用内置的忽略目录和文件模式。"
                        control={<Switch id="default-patterns-toggle" label="默认忽略规则" checked={useDefaultPatterns} onChange={onToggleUseDefaultPatterns} />}
                    />
                    <SettingRow
                        icon="fa-solid fa-code-branch"
                        title="使用 .gitignore / .ignore"
                        description="应用项目中的分层忽略规则。"
                        control={<Switch id="gitignore-toggle" label="使用 .gitignore / .ignore" checked={useGitignore} onChange={onToggleUseGitignore} />}
                    />
                    <SettingRow
                        icon="fa-solid fa-folder-tree"
                        title="包含空目录"
                        description="在目录结构中保留没有文件的目录。"
                        control={<Switch id="empty-directories-toggle" label="包含空目录" checked={includeEmptyDirectories} onChange={onToggleIncludeEmptyDirectories} />}
                    />
                </PanelCard>

                <PanelCard
                    eyebrow="Prompting"
                    title="附加说明"
                    description="给导出内容再加一层上下文，减少每次粘贴后重复补充背景。"
                    icon="fa-solid fa-pen-ruler"
                >
                    <TextAreaField
                        id="export-header-text"
                        label="Header 文本"
                        description="为空时不输出；适合放项目背景、目标或当前任务。"
                        value={exportHeaderText}
                        onChange={onSetExportHeaderText}
                        placeholder="例如：这是一个正在做性能优化的 React 项目，请优先关注导入链路与主线程阻塞。"
                    />
                    <TextAreaField
                        id="export-instruction-text"
                        label="Instruction 文本"
                        description="为空时不输出；适合告诉 AI 你更想要什么样的分析或输出。"
                        value={exportInstructionText}
                        onChange={onSetExportInstructionText}
                        placeholder="例如：请先给出高优先级问题，再给出分步骤修改建议。"
                    />
                </PanelCard>
            </div>
        </div>
    );

    const renderAboutSection = () => (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <PanelCard
                eyebrow="Project"
                title="项目与版本"
                description="这里保留项目入口信息和版本状态，方便在调试或协作时快速确认上下文。"
                icon="fa-solid fa-layer-group"
            >
                <div className="rounded-[24px] border border-black/5 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-5 text-white shadow-xl shadow-slate-900/20 dark:border-white/10">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-sky-200/80">Structure Insight</div>
                            <div className="mt-2 text-2xl font-semibold">v{APP_VERSION}</div>
                            <p className="mt-3 max-w-md text-sm leading-6 text-slate-200/85">
                                一个浏览器优先的本地代码分析工具，帮助你整理项目结构并生成更适合和 AI 讨论的上下文。
                            </p>
                        </div>
                        <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-sky-100">
                            Browser First
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <a
                        href="https://github.com/yeahhe365/Structure-Insight"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-2xl border border-black/5 bg-slate-50/90 p-4 transition hover:border-primary/20 hover:bg-white dark:border-white/5 dark:bg-slate-800/70 dark:hover:border-sky-400/20 dark:hover:bg-slate-800"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-700">
                                <i className="fa-solid fa-code-branch text-lg"></i>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-light-text dark:text-dark-text">GitHub 仓库</div>
                                <div className="mt-1 text-xs text-light-subtle-text dark:text-dark-subtle-text">
                                    打开项目主页与 issue / PR 页面
                                </div>
                            </div>
                        </div>
                    </a>

                    <div className="rounded-2xl border border-black/5 bg-slate-50/90 p-4 dark:border-white/5 dark:bg-slate-800/70">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
                                <i className="fa-solid fa-star"></i>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-light-text dark:text-dark-text">GitHub Stars</div>
                                <div className="mt-1 text-xs text-light-subtle-text dark:text-dark-subtle-text">
                                    {starsLoading ? '正在获取最新星标数…' : stars !== null ? `${stars.toLocaleString()} stars` : '暂时无法获取'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PanelCard>

            <PanelCard
                eyebrow="Notes"
                title="当前设计原则"
                description="这版设置界面改成偏工作台的组织方式，后续继续加设置时不会再变成长列表。"
                icon="fa-solid fa-thumbtack"
            >
                <div className="space-y-3 rounded-2xl border border-black/5 bg-slate-50/90 p-4 dark:border-white/5 dark:bg-slate-800/70">
                    {[
                        '高频设置优先展示，减少在长列表中扫视的成本。',
                        '导出相关配置集中在同一个区域，避免跨分区来回找。',
                        '卡片和导航的视觉层级拉开，让用户一眼看出当前所在的上下文。',
                        '在移动端自动退化成顶部导航，不需要维护两套组件。',
                    ].map(item => (
                        <div key={item} className="flex items-start gap-3 text-sm text-light-text dark:text-dark-text">
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"></span>
                            <span className="leading-6">{item}</span>
                        </div>
                    ))}
                </div>
            </PanelCard>
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
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.45),rgba(2,6,23,0.78))] p-3 backdrop-blur-md sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-black/5 bg-light-panel shadow-2xl shadow-slate-900/15 dark:border-white/10 dark:bg-slate-950"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.96, opacity: 0, y: 12 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_52%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_46%)] pointer-events-none" />

                <div className="relative flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${currentSection.accent} text-white shadow-lg shadow-sky-500/25`}>
                            <i className={currentSection.icon}></i>
                        </div>
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-light-subtle-text dark:text-dark-subtle-text">
                                {currentSection.eyebrow}
                            </div>
                            <h3 className="text-xl font-semibold text-light-text dark:text-dark-text">偏好设置</h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        title="关闭设置"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white/80 text-light-subtle-text transition hover:bg-white hover:text-light-text dark:border-white/10 dark:bg-slate-900/70 dark:text-dark-subtle-text dark:hover:bg-slate-900 dark:hover:text-dark-text"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <div className="grid min-h-0 flex-1 lg:grid-cols-[290px_minmax(0,1fr)]">
                    <aside className="border-b border-black/5 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.9))] px-4 py-4 dark:border-white/5 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.95),rgba(15,23,42,0.88))] sm:px-5 lg:border-b-0 lg:border-r lg:px-6 lg:py-6">
                        <div className="rounded-[28px] border border-black/5 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-light-subtle-text dark:text-dark-subtle-text">
                                Structure Insight
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-light-text dark:text-dark-text">设置工作台</div>
                            <p className="mt-3 text-sm leading-6 text-light-subtle-text dark:text-dark-subtle-text">
                                把常用设置按任务场景重新组织。左边选区域，右边专注调整当前上下文。
                            </p>
                        </div>

                        <div className="mt-5 flex gap-3 overflow-x-auto pb-1 no-scrollbar lg:flex-col lg:overflow-visible">
                            {SETTINGS_SECTIONS.map(section => (
                                <div key={section.id} className="min-w-[220px] lg:min-w-0">
                                    <SectionNavButton section={section} />
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 hidden rounded-[24px] border border-black/5 bg-white/70 px-4 py-3 text-xs text-light-subtle-text backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-dark-subtle-text lg:block">
                            <div className="font-semibold uppercase tracking-[0.18em]">Tips</div>
                            <div className="mt-2 leading-6">
                                这套布局会在移动端自动收成顶部导航，在桌面端保持双栏工作台。
                            </div>
                            <div className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                Esc 关闭
                            </div>
                        </div>
                    </aside>

                    <main className="min-h-0 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))] px-4 py-4 no-scrollbar dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] sm:px-6 sm:py-6">
                        <div className="mb-6 rounded-[30px] border border-black/5 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/5 dark:bg-slate-900/75">
                            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                <div className="max-w-2xl">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-light-subtle-text dark:text-dark-subtle-text">
                                        {currentSection.shortLabel}
                                    </div>
                                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-light-text dark:text-dark-text">{currentSection.title}</h2>
                                    <p className="mt-3 text-sm leading-7 text-light-subtle-text dark:text-dark-subtle-text">
                                        {currentSection.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        v{APP_VERSION}
                                    </div>
                                    <div className={`rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-semibold text-white ${currentSection.accent}`}>
                                        {currentSection.label}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {renderSectionContent()}
                    </main>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default React.memo(SettingsDialog);
