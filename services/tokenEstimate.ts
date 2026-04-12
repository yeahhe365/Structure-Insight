const CJK_CHARACTER = /[\u3400-\u9FFF]/g;

export function estimateTokens(content: string): number {
    if (content.length === 0) {
        return 0;
    }

    const cjkCount = content.match(CJK_CHARACTER)?.length ?? 0;
    const nonCjkCount = content.length - cjkCount;

    return cjkCount + Math.ceil(nonCjkCount / 4);
}
