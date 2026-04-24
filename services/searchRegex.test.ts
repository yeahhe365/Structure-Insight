import { describe, expect, it } from 'vitest';
import { buildSearchRegex } from './searchRegex';

describe('buildSearchRegex', () => {
    it('escapes literal queries and supports whole-word matching', () => {
        const regex = buildSearchRegex('foo.bar', {
            caseSensitive: false,
            useRegex: false,
            wholeWord: true,
        });

        expect(regex?.test('fooXbar')).toBe(false);
        expect(regex?.test('foo.bar')).toBe(true);
    });

    it('rejects empty-match regexes that can stall highlighting loops', () => {
        expect(buildSearchRegex('.*', { caseSensitive: false, useRegex: true, wholeWord: false })).toBeNull();
        expect(buildSearchRegex('a*', { caseSensitive: false, useRegex: true, wholeWord: false })).toBeNull();
    });

    it('rejects nested quantifiers that are prone to catastrophic backtracking', () => {
        expect(buildSearchRegex('(a+)+$', { caseSensitive: false, useRegex: true, wholeWord: false })).toBeNull();
        expect(buildSearchRegex('(foo.*)+', { caseSensitive: false, useRegex: true, wholeWord: false })).toBeNull();
    });

    it('rejects overly long regex queries', () => {
        expect(buildSearchRegex('a'.repeat(257), { caseSensitive: false, useRegex: true, wholeWord: false })).toBeNull();
    });
});
