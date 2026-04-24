import type { SearchOptions } from '../types';

const MAX_REGEX_QUERY_LENGTH = 256;

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function canMatchEmptyString(regex: RegExp): boolean {
    regex.lastIndex = 0;
    return regex.test('');
}

function hasNestedQuantifier(pattern: string): boolean {
    return /\((?:[^()\\]|\\.|\.\*)*[+*](?:[^()\\]|\\.)*\)[+*?{]/.test(pattern);
}

export function buildSearchRegex(query: string, options: SearchOptions): RegExp | null {
    if (!query.trim()) {
        return null;
    }

    if (options.useRegex && query.length > MAX_REGEX_QUERY_LENGTH) {
        return null;
    }

    if (options.useRegex && hasNestedQuantifier(query)) {
        return null;
    }

    const flags = options.caseSensitive ? 'g' : 'gi';
    let pattern = options.useRegex ? query : escapeRegExp(query);
    if (options.wholeWord && !options.useRegex) {
        pattern = `\\b${pattern}\\b`;
    }

    try {
        const regex = new RegExp(pattern, flags);
        return canMatchEmptyString(regex) ? null : regex;
    } catch {
        return null;
    }
}
