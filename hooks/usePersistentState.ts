
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

    React.useEffect(() => {
        try {
            if (state !== undefined) {
                window.localStorage.setItem(key, JSON.stringify(state));
            }
        } catch (error) {
            if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
                console.warn(`localStorage quota exceeded for key "${key}". Value not persisted.`);
            } else if (error instanceof TypeError && error.message.includes('circular structure')) {
                console.error(`Could not persist state for key "${key}" due to a circular reference.`, {key, state});
            } else {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        }
    }, [key, state]);

    return [state, setState];
}
