import { describe, expect, it, vi } from 'vitest';
import { clearPersistedAppData } from './appStorage';

describe('clearPersistedAppData', () => {
    it('clears local storage, recent project handles, service workers, and cache storage', async () => {
        const localStorage = {
            clear: vi.fn(),
        } as unknown as Storage;
        const deleteDatabase = vi.fn(() => {
            const request = {} as IDBOpenDBRequest;
            queueMicrotask(() => {
                request.onsuccess?.(new Event('success'));
            });
            return request;
        });
        const indexedDB = {
            deleteDatabase,
        } as unknown as IDBFactory;
        const cacheDelete = vi.fn(() => Promise.resolve(true));
        const cacheKeys = vi.fn(() => Promise.resolve(['structure-insight-shell-v1', 'legacy-cache']));
        const cachesLike = {
            keys: cacheKeys,
            delete: cacheDelete,
        } as unknown as CacheStorage;
        const unregister = vi.fn(() => Promise.resolve(true));
        const navigatorLike = {
            serviceWorker: {
                getRegistrations: vi.fn(() => Promise.resolve([{ unregister }])),
            },
        } as unknown as Navigator;

        await clearPersistedAppData({
            localStorage,
            indexedDB,
            caches: cachesLike,
            navigator: navigatorLike,
        });

        expect(localStorage.clear).toHaveBeenCalledTimes(1);
        expect(deleteDatabase).toHaveBeenCalledWith('structure-insight');
        expect(cacheKeys).toHaveBeenCalledTimes(1);
        expect(cacheDelete).toHaveBeenCalledWith('structure-insight-shell-v1');
        expect(cacheDelete).toHaveBeenCalledWith('legacy-cache');
        expect(unregister).toHaveBeenCalledTimes(1);
    });
});
