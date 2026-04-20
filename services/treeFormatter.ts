import type { FileNode } from '../types';

export function buildASCIITree(treeData: FileNode[], rootName: string, showStats: boolean = false): string {
    let structure = `${rootName}\n`;
    const generateLines = (nodes: FileNode[], prefix: string) => {
        nodes.forEach((node, index) => {
            const isLast = index === nodes.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            let displayName = node.name;

            if (node.excluded) {
                displayName += ' (已排除)';
            } else if (node.status === 'error') {
                displayName += ' (错误)';
            } else if (showStats && !node.isDirectory && node.status === 'processed' && typeof node.chars === 'number') {
                displayName += ` (${node.chars} 字符)`;
            } else if (node.status === 'skipped' && !node.isDirectory) {
                displayName += ' (已跳过)';
            }

            structure += `${prefix}${connector}${displayName}\n`;
            if (node.isDirectory && node.children.length > 0) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                generateLines(node.children, newPrefix);
            }
        });
    };

    if (treeData.length === 1 && treeData[0].isDirectory && treeData[0].name === rootName) {
        generateLines(treeData[0].children, '');
    } else {
        generateLines(treeData, '');
    }

    return structure;
}
