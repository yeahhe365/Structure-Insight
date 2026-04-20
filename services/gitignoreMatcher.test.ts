import { describe, expect, it } from 'vitest';
import { createIgnoreMatcher } from './gitignoreMatcher';

describe('createIgnoreMatcher', () => {
    it('matches basename rules in the current subtree', () => {
        const matcher = createIgnoreMatcher(['ignored.ts']);

        expect(matcher.test('ignored.ts')).toEqual({
            ignored: true,
            unignored: false,
        });
        expect(matcher.test('nested/ignored.ts')).toEqual({
            ignored: true,
            unignored: false,
        });
        expect(matcher.test('nested/kept.ts')).toEqual({
            ignored: false,
            unignored: false,
        });
    });

    it('matches directory rules and supports negation', () => {
        const matcher = createIgnoreMatcher(['dist/', 'secret.ts', '!keep-secret.ts']);

        expect(matcher.test('dist/out.ts')).toEqual({
            ignored: true,
            unignored: false,
        });
        expect(matcher.test('secret.ts')).toEqual({
            ignored: true,
            unignored: false,
        });
        expect(matcher.test('keep-secret.ts')).toEqual({
            ignored: false,
            unignored: true,
        });
    });
});
