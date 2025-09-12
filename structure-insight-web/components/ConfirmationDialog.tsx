import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-light-panel dark:bg-dark-panel rounded-lg shadow-2xl border border-light-border dark:border-dark-border w-full max-w-sm m-4"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <div className="p-6">
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:h-10 sm:w-10">
                                    <i className="fa-solid fa-triangle-exclamation text-red-600 dark:text-red-400"></i>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-light-text dark:text-dark-text" id="modal-title">
                                        {title}
                                    </h3>
                                    <p className="mt-2 text-sm text-light-subtle-text dark:text-dark-subtle-text">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-light-bg dark:bg-dark-bg/50 px-6 py-3 flex flex-row-reverse rounded-b-lg">
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-dark-panel ml-3"
                                onClick={() => { onConfirm(); onClose(); }}
                            >
                                确认
                            </button>
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-light-border dark:border-dark-border bg-light-panel dark:bg-dark-panel px-4 py-2 text-sm font-medium text-light-text dark:text-dark-text shadow-sm hover:bg-light-border dark:hover:bg-dark-border/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-panel"
                                onClick={onClose}
                            >
                                取消
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default React.memo(ConfirmationDialog);