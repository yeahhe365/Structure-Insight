import React from 'react';

interface ToastProps {
  message: string;
  onDone: () => void;
  type?: 'success' | 'error' | 'info';
}

const Toast: React.FC<ToastProps> = ({ message, onDone, type = 'success' }) => {
  const iconMap: Record<NonNullable<ToastProps['type']>, string> = {
    success: 'fa-circle-check text-green-500',
    error: 'fa-circle-xmark text-red-500',
    info: 'fa-circle-info text-blue-500',
  };

  const borderMap: Record<NonNullable<ToastProps['type']>, string> = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    info: 'border-blue-500/30',
  };

  React.useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-light-panel dark:bg-dark-panel text-light-text dark:text-dark-text px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 border ${borderMap[type]}`}
    >
      <i className={`fa-solid ${iconMap[type]}`}></i>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Toast;
