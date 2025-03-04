// 本地存储工具
const Storage = {
    save: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('无法保存设置', error);
        }
    },
    
    load: (key, defaultValue) => {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('无法加载设置', error);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('无法删除设置', error);
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('无法清除设置', error);
        }
    }
};

// 检测文件类型的辅助函数
const detectLanguage = (fileName) => {
    if (!fileName) return '';
    const extension = fileName.split('.').pop().toLowerCase();
    const langMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'html': 'html',
        'xml': 'xml',
        'css': 'css',
        'scss': 'scss',
        'less': 'less',
        'json': 'json',
        'md': 'markdown',
        'txt': 'plaintext',
        'yaml': 'yaml',
        'yml': 'yaml',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'h': 'cpp',
        'cs': 'csharp',
        'php': 'php',
        'sql': 'sql',
        'sh': 'bash',
        'bat': 'batch',
        'ps1': 'powershell',
        'rb': 'ruby',
        'go': 'go',
        'rust': 'rust',
        'rs': 'rust'
    };
    return langMap[extension] || '';
};

// 导出工具函数供其他模块使用
window.Utils = {
    Storage,
    detectLanguage
};