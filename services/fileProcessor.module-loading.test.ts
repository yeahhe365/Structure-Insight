import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('fileProcessor module loading', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('does not eagerly load optional matcher modules on import', async () => {
        const gitignoreModuleLoaded = vi.fn();
        const globMatcherModuleLoaded = vi.fn();

        vi.doMock('./gitignoreMatcher', () => {
            gitignoreModuleLoaded();
            return {
                createIgnoreMatcher: vi.fn(),
            };
        });

        vi.doMock('./pathPatternMatcher', () => {
            globMatcherModuleLoaded();
            return {
                matchesGlobPatterns: vi.fn(),
            };
        });

        await import('./fileProcessor');

        expect(gitignoreModuleLoaded).not.toHaveBeenCalled();
        expect(globMatcherModuleLoaded).not.toHaveBeenCalled();
    });
});
