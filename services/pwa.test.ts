import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerAppServiceWorker } from './pwa';

describe('registerAppServiceWorker', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('registers the app service worker after window load', () => {
        const register = vi.fn(() => Promise.resolve());
        const addEventListener = vi.fn((event: string, callback: () => void) => {
            if (event === 'load') {
                callback();
            }
        });

        registerAppServiceWorker(
            { serviceWorker: { register } } as unknown as Navigator,
            { addEventListener, location: { origin: 'http://localhost:3000' } } as unknown as Window
        );

        expect(addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
        expect(register).toHaveBeenCalledWith('http://localhost:3000/sw.js');
    });

    it('respects the configured Vite base path when registering the worker', () => {
        const originalBaseUrl = import.meta.env.BASE_URL;
        import.meta.env.BASE_URL = '/Structure-Insight/';
        const register = vi.fn(() => Promise.resolve());
        const addEventListener = vi.fn((event: string, callback: () => void) => {
            if (event === 'load') {
                callback();
            }
        });

        try {
            registerAppServiceWorker(
                { serviceWorker: { register } } as unknown as Navigator,
                { addEventListener, location: { origin: 'https://example.com' } } as unknown as Window
            );
        } finally {
            import.meta.env.BASE_URL = originalBaseUrl;
        }

        expect(register).toHaveBeenCalledWith('https://example.com/Structure-Insight/sw.js');
    });

    it('does nothing when service workers are unavailable', () => {
        const addEventListener = vi.fn();

        registerAppServiceWorker(
            {} as Navigator,
            { addEventListener } as unknown as Window
        );

        expect(addEventListener).not.toHaveBeenCalled();
    });
});
