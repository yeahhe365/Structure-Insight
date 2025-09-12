import React from 'react';

interface InitialPromptProps {
    onOpenFolder: () => void;
}

const InitialPrompt: React.FC<InitialPromptProps> = ({ onOpenFolder }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-enter">
            <div className="max-w-md">
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6 mx-auto">
                     <i className="fa-solid fa-rocket text-5xl text-primary"></i>
                </div>
                <h2 className="text-2xl font-bold mb-2">欢迎使用 Structure Insight</h2>
                <p className="text-light-subtle-text dark:text-dark-subtle-text mb-6">拖放文件夹或点击下方按钮以分析其结构和内容。</p>
                <button
                    onClick={onOpenFolder}
                    className="bg-primary text-white font-bold py-2.5 px-5 rounded-lg hover:bg-primary-hover transition-all duration-200 active:scale-95 shadow-lg shadow-primary/30"
                >
                    <i className="fa-regular fa-folder-open mr-2"></i>
                    选择文件夹
                </button>
            </div>
        </div>
    );
};

export default React.memo(InitialPrompt);