import { describe, expect, it } from 'vitest';
import { splitOutputText } from './exportSplit';

describe('splitOutputText', () => {
    it('returns a single part when content is below the threshold', () => {
        expect(splitOutputText('hello world', 100)).toEqual(['hello world']);
    });

    it('splits content on line boundaries when possible', () => {
        const output = 'alpha\nbeta\ncharlie\ndelta\n';
        const parts = splitOutputText(output, 12);

        expect(parts.length).toBe(3);
        expect(parts.join('')).toBe(output);
        expect(parts.every(part => part.length <= 12)).toBe(true);
    });

    it('falls back to hard splitting when a single line is too long', () => {
        const output = 'abcdefghijklmnopqrstuvwxyz';
        const parts = splitOutputText(output, 10);

        expect(parts).toEqual(['abcdefghij', 'klmnopqrst', 'uvwxyz']);
        expect(parts.join('')).toBe(output);
    });
});
