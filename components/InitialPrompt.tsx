import React from 'react';
import { RecentProject } from '../types';

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "刚刚";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}天前`;
    return new Date(timestamp).toLocaleDateString();
}

interface InitialPromptProps {
    onOpenFolder: () => void;
    recentProjects?: RecentProject[];
    onOpenRecentProject?: (project: RecentProject) => void;
}

const InitialPrompt: React.FC<InitialPromptProps> = ({ onOpenFolder, recentProjects = [], onOpenRecentProject }) => {
    const capabilities = [
        {
            icon: 'fa-shield-halved',
            title: '浏览器本地处理',
            description: '源代码不上传，导入、扫描和导出都在当前浏览器完成。',
        },
        {
            icon: 'fa-file-zipper',
            title: '文件夹与 ZIP',
            description: '支持选择目录、拖放文件夹，也可以直接导入压缩包。',
        },
        {
            icon: 'fa-layer-group',
            title: '多格式导出',
            description: '生成 Plain、Markdown、XML 或 JSON，方便喂给 AI。',
        },
    ];

    return (
        <div className="relative h-full w-full overflow-y-auto select-none bg-light-bg dark:bg-dark-bg">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08]" 
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                        backgroundSize: '24px 24px'
                    }}
                ></div>
                <div className="absolute left-1/2 top-[-12rem] h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/15 via-amber-400/10 to-cyan-400/10 blur-3xl"></div>
                <div className="absolute bottom-[-10rem] right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-amber-500/10 blur-3xl"></div>
            </div>

            <div className="relative z-10 mx-auto flex min-h-full w-full max-w-5xl flex-col items-center justify-start px-4 py-10 pb-16 sm:px-6 lg:justify-center">
                {/* Hero */}
                <div className="text-center mb-10 px-2">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-light-border bg-light-panel/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-light-subtle-text shadow-sm dark:border-dark-border dark:bg-dark-panel/80 dark:text-dark-subtle-text">
                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                        浏览器优先，本地分析
                    </div>
                    <h1 className="mx-auto max-w-[10ch] text-3xl font-extrabold leading-tight tracking-tight text-light-text dark:text-dark-text sm:max-w-none sm:text-4xl md:text-6xl mb-5">
                        Structure <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-600 to-amber-500 dark:from-primary-disabled dark:via-cyan-300 dark:to-amber-300">Insight</span>
                    </h1>
                    <p className="mx-auto max-w-sm px-2 text-sm leading-relaxed text-light-subtle-text dark:text-dark-subtle-text sm:text-lg md:max-w-2xl md:text-xl">
                        将代码库整理为 AI 友好格式
                    </p>
                    <p className="mx-auto mt-3 max-w-2xl px-2 text-xs leading-6 text-light-subtle-text dark:text-dark-subtle-text sm:text-sm">
                        快速理解目录结构、估算上下文体积、发现潜在敏感内容，并生成适合分享给 AI 的仓库快照。
                    </p>
                </div>

                {/* Main Action */}
                <div className="w-full max-w-xl mb-8">
                    <button
                        onClick={onOpenFolder}
                        className="group relative w-full overflow-hidden rounded-3xl border border-primary/20 bg-light-panel/90 p-5 text-left shadow-xl shadow-primary/10 outline-none hover:border-primary/50 focus:ring-4 focus:ring-primary/15 dark:bg-dark-panel/90 sm:p-6"
                        aria-label="选择项目文件夹"
                    >
                        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent"></div>
                        <div className="relative flex items-center gap-4">
                         <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
                            <i className="fa-solid fa-folder-open text-2xl"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-light-text dark:text-dark-text mb-1 group-hover:text-primary transition-colors">选择项目文件夹</h3>
                            <p className="text-xs sm:text-sm text-light-subtle-text dark:text-dark-subtle-text">支持文件夹、ZIP 与拖放导入，几秒内生成可导航结构。</p>
                        </div>
                        <i className="fa-solid fa-arrow-right hidden text-xl text-primary sm:block"></i>
                        </div>
                    </button>
                </div>

                <div className="mb-10 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
                    {capabilities.map(item => (
                        <div key={item.title} className="rounded-2xl border border-light-border bg-light-panel/80 p-4 shadow-sm dark:border-dark-border dark:bg-dark-panel/80">
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-disabled">
                                <i className={`fa-solid ${item.icon}`}></i>
                            </div>
                            <h3 className="text-sm font-bold text-light-text dark:text-dark-text">{item.title}</h3>
                            <p className="mt-1 text-xs leading-5 text-light-subtle-text dark:text-dark-subtle-text">{item.description}</p>
                        </div>
                    ))}
                </div>

                {/* Recent Projects */}
                {recentProjects.length > 0 && (
                    <div className="w-full max-w-lg mb-10">
                        <p className="text-xs font-medium text-light-subtle-text dark:text-dark-subtle-text mb-3 uppercase tracking-wider">最近项目</p>
                        <div className="grid grid-cols-1 gap-2">
                            {recentProjects.map((project) => (
                                <button
                                    type="button"
                                    key={project.name + project.openedAt}
                                    onClick={() => onOpenRecentProject?.(project)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-light-panel dark:bg-dark-panel border border-light-border dark:border-dark-border transition-colors hover:border-primary/40 hover:bg-light-border/40 dark:hover:bg-dark-border/40 text-left"
                                >
                                    <i className="fa-solid fa-folder text-sm text-primary"></i>
                                    <span className="text-sm font-medium text-light-text dark:text-dark-text flex-1 truncate">{project.name}</span>
                                    <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text whitespace-nowrap">{timeAgo(project.openedAt)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {/* Footer Info */}
                <div
                    data-landing-footer
                    className="mt-auto px-4 pt-6 text-center text-[11px] sm:text-xs text-light-subtle-text dark:text-dark-subtle-text"
                >
                    安全本地处理 · 浏览器运行
                </div>
            </div>
        </div>
    );
};

export default React.memo(InitialPrompt);
