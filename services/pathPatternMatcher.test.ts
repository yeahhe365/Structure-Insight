import { describe, expect, it } from 'vitest';
import { matchesGlobPatterns } from './pathPatternMatcher';

describe('matchesGlobPatterns', () => {
    it('matches exact paths and common glob patterns', async () => {
        await expect(matchesGlobPatterns('demo/kept.ts', ['demo/kept.ts'])).resolves.toBe(true);
        await expect(matchesGlobPatterns('src/app.ts', ['src/**/*.ts'])).resolves.toBe(true);
        await expect(matchesGlobPatterns('demo/src/ignored.ts', ['**/ignored.ts'])).resolves.toBe(true);
        await expect(matchesGlobPatterns('demo/src/app.js', ['src/**/*.ts', '**/ignored.ts'])).resolves.toBe(false);
    });
});
