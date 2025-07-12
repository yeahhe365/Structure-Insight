
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
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    React.useEffect(() => {
        try {
            if (state !== undefined) {
                window.localStorage.setItem(key, JSON.stringify(state));
            }
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('circular structure')) {
                console.error(`Could not persist state for key "${key}" due to a circular reference. This is likely caused by storing a DOM element or event object.`, {key, state: state});
            } else {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        }
    }, [key, state]);

    return [state, setState];
}
