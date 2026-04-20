import type { FileNode } from '../types';

const naturalCollator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
});

const stableCollator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'variant',
});

export function compareNaturalText(a: string, b: string): number {
    return naturalCollator.compare(a, b) || stableCollator.compare(a, b);
}

export function compareFilePaths(a: string, b: string): number {
    return compareNaturalText(a, b);
}

export function compareTreeNodes(a: FileNode, b: FileNode): number {
    if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
    }

    return compareNaturalText(a.name, b.name) || compareNaturalText(a.path, b.path);
}

export function sortTreeNodes(nodes: FileNode[]): FileNode[] {
    nodes.sort(compareTreeNodes);

    for (const node of nodes) {
        if (node.isDirectory) {
            sortTreeNodes(node.children);
        }
    }

    return nodes;
}
