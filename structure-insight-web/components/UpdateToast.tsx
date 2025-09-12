import React from 'react';
import { motion } from 'framer-motion';

interface UpdateToastProps {
    onUpdate: () => void;
}

const UpdateToast: React.FC<UpdateToastProps> = ({ onUpdate }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center space-x-4"
        >
            <span>有新版本可用！</span>
            <button onClick={onUpdate} className="bg-white text-blue-600 font-bold px-3 py-1 rounded-md text-sm">
                刷新
            </button>
        </motion.div>
    );
};

export default React.memo(UpdateToast);