import React from 'react';
import { useLocalization } from '../hooks/useLocalization';

interface InitialPromptProps {
    onOpenFolder: () => void;
}

const InitialPrompt: React.FC<InitialPromptProps> = ({ onOpenFolder }) => {
    const { t } = useLocalization();
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="max-w-md">
                <i className="fa-solid fa-rocket text-5xl text-primary mb-6"></i>
                <h2 className="text-2xl font-bold mb-2">{t('welcome_message')}</h2>
                <p className="text-light-subtle-text dark:text-dark-subtle-text mb-6">{t('welcome_prompt')}</p>
                <button
                    onClick={onOpenFolder}
                    className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors duration-200 active:scale-95"
                >
                    <i className="fa-regular fa-folder-open mr-2"></i>
                    {t('select_folder')}
                </button>
            </div>
        </div>
    );
};

export default InitialPrompt;