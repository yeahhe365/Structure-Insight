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
    title: string;
}

const APP_VERSION = '5.4.0';

const SETTINGS_SECTIONS: SettingsSectionDefinition[] = [
    {
        id: 'workspace',
        label: '工作区',
        title: '工作区设置',
    },
    {
        id: 'export',
        label: '导出',
        title: '导出设置',
    },
    {
        id: 'about',
        label: '关于',
        title: '项目与版本',
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
    exportSplitMaxChars, onSetExportSplitMaxChars, exportHeaderText, onSetExportHeaderText,
    exportInstructionText, onSetExportInstructionText,
}) => {
    const [stars, setStars] = React.useState<number | null>(null);
    const [starsLoading, setStarsLoading] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState<SettingsSectionId>('workspace');

    React.useEffect(() => {
        if (!isOpen) return;

        setActiveSection('workspace');
        setStarsLoading(true);

        fetch('https://api.github.com/repos/yeahhe365/Structure-Insight')
            .then(res => res.json())
            .then(data => {
                if (typeof data?.stargazers_count === 'number') {
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
    const panelId = `settings-panel-${activeSection}`;
    const panelLabelId = `settings-tab-${activeSection}`;
    const maxCharsThresholdInKb = Math.round(maxCharsThreshold / 1024);

    const TabButton = ({ section }: { section: SettingsSectionDefinition }) => {
        const isActive = section.id === activeSection;

        return (
            <button
                id={`settings-tab-${section.id}`}
                type="button"
                role="tab"
                aria-label={section.label}
                aria-controls={`settings-panel-${section.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveSection(section.id)}
                className={[
                    'flex items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 dark:focus:ring-offset-dark-panel',
                    isActive
                        ? 'border-black/10 bg-white text-light-text dark:border-white/10 dark:bg-slate-900 dark:text-dark-text'
                        : 'border-transparent bg-transparent text-light-subtle-text hover:bg-white/80 hover:text-light-text dark:text-dark-subtle-text dark:hover:bg-slate-900/80 dark:hover:text-dark-text',
                ].join(' ')}
            >
                <span className="font-medium">{section.label}</span>
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
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 dark:focus:ring-offset-dark-panel',
                checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700',
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

    const SectionBlock = ({
        title,
        description,
        children,
    }: {
        title: string;
        description?: string;
        children: React.ReactNode;
    }) => (
        <section className="rounded-2xl border border-black/5 bg-white dark:border-white/5 dark:bg-slate-900">
            <div className="border-b border-black/5 px-4 py-3 dark:border-white/5">
                <h4 className="text-sm font-semibold text-light-text dark:text-dark-text">{title}</h4>
                {description ? (
                    <p className="mt-1 text-xs leading-5 text-light-subtle-text dark:text-dark-subtle-text">{description}</p>
                ) : null}
            </div>
            <div>{children}</div>
        </section>
    );

    const Row = ({
        title,
        description,
        control,
        stacked = false,
        children,
    }: {
        title: string;
        description: string;
        control?: React.ReactNode;
        stacked?: boolean;
        children?: React.ReactNode;
    }) => (
        <div className="border-b border-black/5 px-4 py-3 last:border-b-0 dark:border-white/5">
            <div className={stacked ? 'space-y-3' : 'flex items-start gap-4'}>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-light-text dark:text-dark-text">{title}</div>
                    <div className="mt-1 text-xs leading-5 text-light-subtle-text dark:text-dark-subtle-text">{description}</div>
                </div>
                {!stacked && control ? <div className="shrink-0">{control}</div> : null}
            </div>
            {stacked && children ? <div className="mt-3">{children}</div> : null}
            {!stacked && children ? <div className="mt-3">{children}</div> : null}
        </div>
    );

    const Field = ({
        id,
        value,
        onChange,
        placeholder,
        multiline = false,
        rows = 3,
        type = 'text',
        min,
    }: {
        id: string;
        value: string | number;
        onChange: (value: string) => void;
        placeholder?: string;
        multiline?: boolean;
        rows?: number;
        type?: string;
        min?: number;
    }) => {
        const className = 'w-full rounded-xl border border-light-border bg-light-bg px-3 py-2.5 text-sm text-light-text outline-none transition placeholder:text-light-subtle-text focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text dark:placeholder:text-dark-subtle-text';

        if (multiline) {
            return (
                <textarea
                    id={id}
                    value={String(value)}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows}
                    className={className}
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
                onChange={(e) => onChange(e.target.value)}
                className={className}
                placeholder={placeholder}
            />
        );
    };

    const renderWorkspaceSection = () => (
        <div className="space-y-3">
            <SectionBlock title="显示" description="高频的阅读体验设置。">
                <Row
                    title="深色主题"
                    description="切换整体界面明暗风格。"
                    control={<Switch id="theme-toggle" label="深色主题" checked={isDarkTheme} onChange={onToggleTheme} />}
                />
                <Row
                    title="显示统计信息"
                    description="在文件树中显示字符数和行数。"
                    control={<Switch id="char-count-toggle" label="显示统计信息" checked={showCharCount} onChange={onToggleShowCharCount} />}
                />
                <Row title="字体大小" description={`当前 ${fontSize}px，可即时调整代码阅读密度。`} stacked>
                    <div className="flex items-center gap-3">
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
                        <span className="text-sm font-semibold text-light-text dark:text-dark-text">A</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {fontSize}px
                        </span>
                    </div>
                </Row>
            </SectionBlock>

            <SectionBlock title="工作区" description="控制文件处理和本地行为。">
                <Row
                    title="自动换行"
                    description="代码超出宽度时自动换行，减少横向滚动。"
                    control={<Switch id="word-wrap-toggle" label="自动换行" checked={wordWrap} onChange={onToggleWordWrap} />}
                />
                <Row
                    title="提取文件内容"
                    description="关闭后仅保留目录结构，适合超大项目快速查看。"
                    control={<Switch id="extract-toggle" label="提取文件内容" checked={extractContent} onChange={onToggleExtractContent} />}
                />
                <Row title="自动跳过大文件" description="0 表示不限制；超过阈值的文件只保留路径。">
                    <div className="mt-3 flex items-center gap-2">
                        <div className="w-24">
                            <Field
                                id="max-chars-input"
                                type="number"
                                min={0}
                                value={maxCharsThresholdInKb}
                                onChange={(value) => onSetMaxCharsThreshold((Math.max(0, Number(value) || 0)) * 1024)}
                            />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-light-subtle-text dark:text-dark-subtle-text">KB</span>
                    </div>
                </Row>
                <Row title="应用缓存" description="清空所有本地设置和缓存项目数据。">
                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={onClearCache}
                            className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/50"
                        >
                            清除缓存
                        </button>
                    </div>
                </Row>
            </SectionBlock>
        </div>
    );

    const renderExportSection = () => (
        <div className="space-y-3">
            <SectionBlock title="导出结构" description="决定最终上下文的组织方式。">
                <Row title="导出格式" description="支持 plain、xml、markdown 和 json。">
                    <div className="mt-3 max-w-xs">
                        <select
                            id="export-format-select"
                            value={exportFormat}
                            onChange={(e) => onSetExportFormat(e.target.value as ExportFormat)}
                            className="w-full rounded-xl border border-light-border bg-light-bg px-3 py-2.5 text-sm text-light-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text"
                        >
                            <option value="plain">Plain</option>
                            <option value="xml">XML</option>
                            <option value="markdown">Markdown</option>
                            <option value="json">JSON</option>
                        </select>
                    </div>
                </Row>
                <Row
                    title="文件摘要"
                    description="保留摘要头部。"
                    control={<Switch id="file-summary-toggle" label="文件摘要" checked={includeFileSummary} onChange={onToggleIncludeFileSummary} />}
                />
                <Row
                    title="包含目录结构"
                    description="在导出中保留目录树。"
                    control={<Switch id="directory-structure-toggle" label="包含目录结构" checked={includeDirectoryStructure} onChange={onToggleIncludeDirectoryStructure} />}
                />
            </SectionBlock>

            <SectionBlock title="内容处理" description="直接影响输出文本的体积和可读性。">
                <Row
                    title="显示行号"
                    description="为每一行内容添加编号。"
                    control={<Switch id="line-numbers-toggle" label="显示行号" checked={showLineNumbers} onChange={onToggleShowLineNumbers} />}
                />
                <Row
                    title="移除空行"
                    description="压缩导出内容中的冗余空白。"
                    control={<Switch id="remove-empty-lines-toggle" label="移除空行" checked={removeEmptyLines} onChange={onToggleRemoveEmptyLines} />}
                />
                <Row
                    title="截断 Base64"
                    description="将长 data URL 和 Base64 内容替换成占位符。"
                    control={<Switch id="truncate-base64-toggle" label="截断 Base64" checked={truncateBase64} onChange={onToggleTruncateBase64} />}
                />
                <Row title="导出拆分阈值" description="0 表示不拆分；按字符数自动拆分保存。">
                    <div className="mt-3 max-w-xs">
                        <Field
                            id="export-split-max-chars"
                            type="number"
                            min={0}
                            value={exportSplitMaxChars}
                            onChange={(value) => onSetExportSplitMaxChars(Math.max(0, Number(value) || 0))}
                        />
                    </div>
                </Row>
            </SectionBlock>

            <SectionBlock title="过滤规则" description="定义哪些内容进入导出。">
                <Row title="包含模式" description="例如 src/**/*.ts,docs/**。">
                    <div className="mt-3">
                        <Field
                            id="include-patterns"
                            value={includePatterns}
                            onChange={onSetIncludePatterns}
                            placeholder="例如 src/**/*.ts,docs/**"
                        />
                    </div>
                </Row>
                <Row title="忽略模式" description="例如 **/*.test.ts,dist/**。">
                    <div className="mt-3">
                        <Field
                            id="ignore-patterns"
                            value={ignorePatterns}
                            onChange={onSetIgnorePatterns}
                            placeholder="例如 **/*.test.ts,dist/**"
                        />
                    </div>
                </Row>
                <Row
                    title="默认忽略规则"
                    description="启用内置的忽略目录和文件模式。"
                    control={<Switch id="default-patterns-toggle" label="默认忽略规则" checked={useDefaultPatterns} onChange={onToggleUseDefaultPatterns} />}
                />
                <Row
                    title="使用 .gitignore / .ignore"
                    description="应用项目中的分层忽略规则。"
                    control={<Switch id="gitignore-toggle" label="使用 .gitignore / .ignore" checked={useGitignore} onChange={onToggleUseGitignore} />}
                />
                <Row
                    title="包含空目录"
                    description="在目录结构中保留没有文件的目录。"
                    control={<Switch id="empty-directories-toggle" label="包含空目录" checked={includeEmptyDirectories} onChange={onToggleIncludeEmptyDirectories} />}
                />
            </SectionBlock>

            <SectionBlock title="附加说明" description="给导出内容补充背景。">
                <Row title="Header 文本" description="为空时不输出；适合放项目背景和任务说明。">
                    <div className="mt-3">
                        <Field
                            id="export-header-text"
                            multiline
                            rows={3}
                            value={exportHeaderText}
                            onChange={onSetExportHeaderText}
                            placeholder="例如：请先理解项目结构，再指出风险最大的模块。"
                        />
                    </div>
                </Row>
                <Row title="Instruction 文本" description="为空时不输出；适合告诉 AI 你想要的结果。">
                    <div className="mt-3">
                        <Field
                            id="export-instruction-text"
                            multiline
                            rows={3}
                            value={exportInstructionText}
                            onChange={onSetExportInstructionText}
                            placeholder="例如：先列 P0 / P1 问题，再给分步骤修改建议。"
                        />
                    </div>
                </Row>
            </SectionBlock>
        </div>
    );

    const renderAboutSection = () => (
        <div className="space-y-3">
            <SectionBlock title="项目与版本" description="项目状态和仓库入口。">
                <Row title="版本" description="当前应用版本。">
                    <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        v{APP_VERSION}
                    </div>
                </Row>
                <Row title="GitHub 仓库" description="打开项目主页和 issue / PR 页面。">
                    <div className="mt-3">
                        <a
                            href="https://github.com/yeahhe365/Structure-Insight"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-light-border bg-white px-3 py-1.5 text-xs font-semibold text-light-text transition hover:border-primary/25 hover:text-primary dark:border-dark-border dark:bg-slate-900 dark:text-dark-text dark:hover:border-primary/25 dark:hover:text-primary"
                        >
                            <i className="fa-solid fa-code-branch"></i>
                            打开 GitHub
                        </a>
                    </div>
                </Row>
                <Row title="GitHub Stars" description="实时读取仓库星标数。">
                    <div className="mt-3 text-xs font-semibold text-light-text dark:text-dark-text">
                        {starsLoading ? '正在获取最新星标数…' : stars !== null ? `${stars.toLocaleString()} stars` : '暂时无法获取'}
                    </div>
                </Row>
            </SectionBlock>

            <SectionBlock title="设计说明" description="这版设置页更接近 ChatGPT 的紧凑设置模型。">
                <div className="space-y-2 px-4 py-3 text-sm text-light-text dark:text-dark-text">
                    {[
                        '左侧是窄导航，只保留分区入口。',
                        '右侧改成扁平分组列表，不再使用展示型大卡片。',
                        '设置项统一成标题、说明、控件三段式行布局。',
                        '整体收紧边距、圆角和视觉装饰，优先保证扫描效率。',
                    ].map(item => (
                        <div key={item} className="flex items-start gap-2.5">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></span>
                            <span className="leading-6">{item}</span>
                        </div>
                    ))}
                </div>
            </SectionBlock>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-2 backdrop-blur-sm sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[20px] border border-black/5 bg-light-panel shadow-2xl shadow-slate-900/12 dark:border-white/10 dark:bg-slate-950"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.98, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0, y: 8 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
            >
                <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/5 sm:px-5">
                    <div className="min-w-0">
                        <h3 className="text-base font-semibold text-light-text dark:text-dark-text">设置</h3>
                    </div>
                    <button
                        type="button"
                        title="关闭设置"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white text-light-subtle-text transition hover:text-light-text dark:border-white/10 dark:bg-slate-900 dark:text-dark-subtle-text dark:hover:text-dark-text"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <aside className="border-b border-black/5 bg-slate-50/80 px-3 py-3 dark:border-white/5 dark:bg-slate-950 lg:border-b-0 lg:border-r dark:lg:bg-slate-950">
                        <div role="tablist" aria-label="设置导航" className="space-y-1.5">
                            {SETTINGS_SECTIONS.map(section => (
                                <TabButton key={section.id} section={section} />
                            ))}
                        </div>
                    </aside>

                    <main className="min-h-0 overflow-y-auto bg-light-bg/70 px-3 py-3 no-scrollbar dark:bg-slate-950/80 sm:px-4 sm:py-4">
                        <section
                            id={panelId}
                            role="tabpanel"
                            aria-labelledby={panelLabelId}
                            className="space-y-3"
                        >
                            <div className="px-1 pb-1">
                                <h2 className="text-2xl font-semibold tracking-tight text-light-text dark:text-dark-text">{currentSection.title}</h2>
                            </div>
                            {renderSectionContent()}
                        </section>
                    </main>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default React.memo(SettingsDialog);
