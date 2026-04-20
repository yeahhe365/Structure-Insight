import React from 'react';
import { motion } from 'framer-motion';
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
    return (
        <div className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden p-6 select-none bg-light-bg dark:bg-dark-bg">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                        backgroundSize: '24px 24px'
                    }}
                ></div>
                <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent"></div>
            </div>

            <div className="z-10 w-full max-w-5xl flex flex-col items-center">
                {/* Hero */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20 mb-8 transform rotate-3 hover:rotate-6 transition-transform duration-500">
                        <i className="fa-solid fa-layer-group text-5xl text-white drop-shadow-md"></i>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-light-text dark:text-dark-text mb-6 tracking-tight">
                        Structure <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Insight</span>
                    </h1>
                    <p className="text-lg md:text-xl text-light-subtle-text dark:text-dark-subtle-text max-w-2xl mx-auto leading-relaxed">
                        您的本地代码分析专家。
                        <br className="hidden md:block"/>
                        无需上传文件，直接在浏览器中解析项目结构与内容。
                    </p>
                </motion.div>

                {/* Main Action */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-lg mb-16"
                >
                    <button
                        onClick={onOpenFolder}
                        className="group relative w-full bg-light-panel dark:bg-dark-panel border-2 border-dashed border-light-border dark:border-dark-border hover:border-primary dark:hover:border-primary rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 flex flex-col items-center gap-4 text-center cursor-pointer outline-none focus:ring-4 focus:ring-primary/10"
                    >
                         <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            <i className="fa-solid fa-folder-open text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-1 group-hover:text-primary transition-colors">选择文件夹</h3>
                            <p className="text-sm text-light-subtle-text dark:text-dark-subtle-text">或将文件夹拖放到页面任意位置</p>
                        </div>
                    </button>
                </motion.div>

                {/* Recent Projects */}
                {recentProjects.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="w-full max-w-lg mb-16"
                    >
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
                    </motion.div>
                )}
            </div>
            
            {/* Footer Info */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="absolute bottom-4 text-xs text-light-subtle-text/50 dark:text-dark-subtle-text/50"
            >
                Secure & Local • Browser-based Processing
            </motion.div>
        </div>
    );
};

export default React.memo(InitialPrompt);
