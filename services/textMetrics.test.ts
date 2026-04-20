import { describe, expect, it } from 'vitest';
import { buildLineStartIndices, countLines, findLineNumber } from './textMetrics';

describe('textMetrics', () => {
    it('counts lines without allocating split arrays', () => {
        expect(countLines('alpha')).toBe(1);
        expect(countLines('alpha\nbeta\n')).toBe(3);
        expect(countLines('')).toBe(0);
    });

    it('builds line starts and resolves character offsets to line numbers', () => {
        const lineStarts = buildLineStartIndices('one\ntwo\nthree');

        expect(lineStarts).toEqual([0, 4, 8]);
        expect(findLineNumber(lineStarts, 0)).toBe(1);
        expect(findLineNumber(lineStarts, 6)).toBe(2);
        expect(findLineNumber(lineStarts, 10)).toBe(3);
    });
});
