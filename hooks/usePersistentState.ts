
import React from 'react';

export function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = React.useState<T>(() => {
        try {
            const storedValue = window.localStorage.getItem(key);
            if (storedValue !== null && storedValue !== 'undefined') {
                return JSON.parse(storedValue);
            }
            return defaultValue;
        } catch (error) {
            console.warn(`[usePersistentState] Corrupted value for key "${key}", resetting:`, error);
            try { window.localStorage.removeItem(key); } catch { /* ignore */ }
            return defaultValue;
        }
    });

    // Debounce writes for large objects to avoid blocking the main thread
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const stateRef = React.useRef(state);
    stateRef.current = state;

    React.useEffect(() => {
        const serialized = JSON.stringify(state);
        const sizeKB = serialized.length / 1024;

        if (sizeKB > 500) {
            console.warn(`[usePersistentState] Large value (${sizeKB.toFixed(0)}KB) for key "${key}"`);
        }

        const delay = sizeKB > 200 ? 500 : 0;

        const doWrite = () => {
            try {
                if (stateRef.current !== undefined) {
                    window.localStorage.setItem(key, JSON.stringify(stateRef.current));
                }
            } catch (error) {
                if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                    console.warn(`localStorage quota exceeded for key "${key}". Value not persisted.`);
                } else if (error instanceof TypeError && error.message.includes('circular structure')) {
                    console.error(`Could not persist state for key "${key}" due to a circular reference.`, {key, state: stateRef.current});
                } else {
                    console.warn(`Error setting localStorage key "${key}":`, error);
                }
            }
        };

        if (timerRef.current) clearTimeout(timerRef.current);
        if (delay > 0) {
            timerRef.current = setTimeout(doWrite, delay);
        } else {
            doWrite();
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [key, state]);

    return [state, setState];
}
