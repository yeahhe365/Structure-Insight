export const EXTENSIONLESS_FILE_LABEL = '无扩展名';

export function getFileTypeLabel(filePath: string): string {
    const fileName = filePath.split('/').pop() ?? filePath;

    if (!fileName) {
        return EXTENSIONLESS_FILE_LABEL;
    }

    if (fileName.startsWith('.') && fileName.indexOf('.', 1) === -1) {
        return fileName.toLowerCase();
    }

    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex > 0 && dotIndex < fileName.length - 1) {
        return fileName.slice(dotIndex).toLowerCase();
    }

    return EXTENSIONLESS_FILE_LABEL;
}

export function compareFileTypeLabels(a: string, b: string): number {
    if (a === EXTENSIONLESS_FILE_LABEL) {
        return 1;
    }

    if (b === EXTENSIONLESS_FILE_LABEL) {
        return -1;
    }

    return a.localeCompare(b, 'zh-Hans-CN', { sensitivity: 'base' });
}
