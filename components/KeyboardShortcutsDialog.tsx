import React from 'react';
import { motion } from 'framer-motion';

interface KeyboardShortcutsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const shortcuts = [
    { keys: ['Ctrl', 'O'], description: 'Open folder' },
    { keys: ['Ctrl', 'F'], description: 'Find in files' },
    { keys: ['Ctrl', 'S'], description: 'Save as text' },
    { keys: ['Escape'], description: 'Close dialog' },
    { keys: ['Ctrl', '/'], description: 'Show this help' },
];

const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ isOpen, onClose }) => {
    React.useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-light-panel dark:bg-dark-panel rounded-xl shadow-2xl border border-light-border dark:border-dark-border w-full max-w-sm overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border bg-light-bg/50 dark:bg-dark-bg/50 backdrop-blur-md">
                    <h3 className="font-bold text-lg text-light-text dark:text-dark-text">Keyboard Shortcuts</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center text-light-subtle-text dark:text-dark-subtle-text transition-colors"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid gap-3">
                        {shortcuts.map(({ keys, description }) => (
                            <div key={description} className="flex items-center justify-between py-1.5">
                                <span className="text-sm text-light-text dark:text-dark-text">{description}</span>
                                <div className="flex items-center gap-1">
                                    {keys.map((key, i) => (
                                        <React.Fragment key={key}>
                                            <kbd className="px-2 py-1 text-xs font-mono font-medium rounded-md bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-subtle-text dark:text-dark-subtle-text shadow-sm">
                                                {key}
                                            </kbd>
                                            {i < keys.length - 1 && (
                                                <span className="text-xs text-light-subtle-text dark:text-dark-subtle-text">+</span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default React.memo(KeyboardShortcutsDialog);
