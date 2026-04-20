export interface IgnoreTestResult {
    ignored: boolean;
    unignored: boolean;
}

export interface IgnoreMatcherInstance {
    test(path: string): IgnoreTestResult;
}

interface CompiledRule {
    isNegated: boolean;
    matches: (path: string) => boolean;
}

function normalizePath(value: string): string {
    return value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

function createBasenameMatcher(pattern: string): (path: string) => boolean {
    return (path: string) => {
        const normalizedPath = normalizePath(path);
        return normalizedPath.split('/').some(segment => segment === pattern);
    };
}

function createDirectoryMatcher(pattern: string): (path: string) => boolean {
    return (path: string) => {
        const normalizedPath = normalizePath(path);
        return normalizedPath === pattern || normalizedPath.startsWith(`${pattern}/`);
    };
}

function createPathMatcher(pattern: string): (path: string) => boolean {
    return (path: string) => normalizePath(path) === pattern;
}

function compileRule(pattern: string): CompiledRule {
    const isNegated = pattern.startsWith('!');
    const rawPattern = normalizePath(isNegated ? pattern.slice(1) : pattern);
    const isDirectory = pattern.endsWith('/');
    const hasSlash = rawPattern.includes('/');

    return {
        isNegated,
        matches: isDirectory
            ? createDirectoryMatcher(rawPattern)
            : hasSlash
                ? createPathMatcher(rawPattern)
                : createBasenameMatcher(rawPattern),
    };
}

export function createIgnoreMatcher(patterns: string[]): IgnoreMatcherInstance {
    const rules = patterns.map(compileRule);

    return {
        test(path: string) {
            let ignored = false;
            let unignored = false;

            for (const rule of rules) {
                if (!rule.matches(path)) {
                    continue;
                }

                if (rule.isNegated) {
                    ignored = false;
                    unignored = true;
                } else {
                    ignored = true;
                    unignored = false;
                }
            }

            return {
                ignored,
                unignored,
            };
        },
    };
}
