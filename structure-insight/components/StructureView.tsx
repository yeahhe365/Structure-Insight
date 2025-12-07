
import React from 'react';
import { motion } from 'framer-motion';

interface StructureViewProps {
  structureString: string;
  fontSize: number;
  onShowToast: (message: string) => void;
}

const StructureView: React.FC<StructureViewProps> = ({ structureString, fontSize, onShowToast }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(structureString);
    onShowToast('项目结构已复制');
  };

  return (
    <div className="h-full p-4 md:p-6 bg-light-bg dark:bg-dark-bg min-h-min">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-light-panel dark:bg-dark-panel rounded-lg overflow-hidden border border-light-border dark:border-dark-border"
        >
             <div className="flex justify-between items-center p-3 bg-light-header/80 dark:bg-dark-header/80 border-b border-light-border dark:border-dark-border sticky top-0 z-[1] backdrop-blur-sm">
                <div className="font-mono text-sm text-light-text dark:text-dark-text font-semibold flex items-center">
                  <i className="fa-solid fa-sitemap mr-2 text-light-subtle-text dark:text-dark-subtle-text"></i>
                  项目结构
                </div>
                <button 
                    onClick={handleCopy}
                    className="w-8 h-8 rounded-md hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center text-light-subtle-text dark:text-dark-subtle-text hover:text-primary transition-colors"
                    title="复制结构"
                >
                    <i className="fa-regular fa-copy"></i>
                </button>
            </div>
            <div className="p-4 bg-light-bg dark:bg-dark-bg overflow-x-auto">
                <pre className="font-mono text-light-text dark:text-dark-text whitespace-pre" style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}>
                    {structureString}
                </pre>
            </div>
        </motion.div>
    </div>
  );
};

export default React.memo(StructureView);
