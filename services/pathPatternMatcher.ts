function escapeRegExp(value: string): string {
    return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function normalizeSegments(value: string): string[] {
    return value.replace(/\\/g, '/').split('/').filter(Boolean);
}

function matchSegment(pathSegment: string, patternSegment: string): boolean {
    if (patternSegment === '*') {
        return true;
    }

    let regexBody = '';
    for (const char of patternSegment) {
        if (char === '*') {
            regexBody += '.*';
            continue;
        }
        if (char === '?') {
            regexBody += '.';
            continue;
        }
        regexBody += escapeRegExp(char);
    }

    const pattern = `^${regexBody}$`;
    return new RegExp(pattern).test(pathSegment);
}

function matchSegments(pathSegments: string[], patternSegments: string[], pathIndex: number, patternIndex: number): boolean {
    if (patternIndex === patternSegments.length) {
        return pathIndex === pathSegments.length;
    }

    const currentPattern = patternSegments[patternIndex];
    if (currentPattern === '**') {
        for (let nextPathIndex = pathIndex; nextPathIndex <= pathSegments.length; nextPathIndex++) {
            if (matchSegments(pathSegments, patternSegments, nextPathIndex, patternIndex + 1)) {
                return true;
            }
        }
        return false;
    }

    if (pathIndex >= pathSegments.length) {
        return false;
    }

    if (!matchSegment(pathSegments[pathIndex], currentPattern)) {
        return false;
    }

    return matchSegments(pathSegments, patternSegments, pathIndex + 1, patternIndex + 1);
}

function matchesPattern(path: string, pattern: string): boolean {
    if (path === pattern) {
        return true;
    }

    const pathSegments = normalizeSegments(path);
    const patternSegments = normalizeSegments(pattern);
    return matchSegments(pathSegments, patternSegments, 0, 0);
}

export async function matchesGlobPatterns(path: string, patterns: string[]): Promise<boolean> {
    return patterns.some(pattern => matchesPattern(path, pattern));
}
