export function countLines(content: string): number {
    if (content.length === 0) {
        return 0;
    }

    let lines = 1;
    for (let index = 0; index < content.length; index++) {
        if (content.charCodeAt(index) === 10) {
            lines++;
        }
    }

    return lines;
}

export function buildLineStartIndices(content: string): number[] {
    if (content.length === 0) {
        return [];
    }

    const lineStarts = [0];
    for (let index = 0; index < content.length; index++) {
        if (content.charCodeAt(index) === 10 && index + 1 < content.length) {
            lineStarts.push(index + 1);
        }
    }

    return lineStarts;
}

export function findLineNumber(lineStarts: number[], index: number): number {
    if (lineStarts.length === 0) {
        return 0;
    }

    let low = 0;
    let high = lineStarts.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const current = lineStarts[mid];
        const next = lineStarts[mid + 1] ?? Number.POSITIVE_INFINITY;

        if (index >= current && index < next) {
            return mid + 1;
        }

        if (index < current) {
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }

    return lineStarts.length;
}
