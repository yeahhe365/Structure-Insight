export function getCurrentTimeMs(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now();
    }

    return Date.now();
}

export async function yieldToMainThread(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
}
