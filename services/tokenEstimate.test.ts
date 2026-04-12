import { describe, expect, it } from 'vitest';
import { estimateTokens } from './tokenEstimate';

describe('estimateTokens', () => {
    it('returns zero for empty content', () => {
        expect(estimateTokens('')).toBe(0);
    });

    it('estimates ascii-heavy content in stable 4-char groups', () => {
        expect(estimateTokens('const answer = 42;')).toBe(5);
    });

    it('counts cjk content more densely than the ascii heuristic', () => {
        expect(estimateTokens('你好世界')).toBe(4);
        expect(estimateTokens('hello 你好')).toBe(4);
    });
});
