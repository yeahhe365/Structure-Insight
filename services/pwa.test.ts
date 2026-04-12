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
            { addEventListener } as unknown as Window
        );

        expect(addEventListener).toHaveBeenCalledWith('load', expect.any(Function));
        expect(register).toHaveBeenCalledWith('/sw.js');
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
