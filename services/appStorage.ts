import { clearRecentProjectHandles } from './recentProjectHandles';

interface ClearPersistedAppDataOptions {
    localStorage?: Storage;
    indexedDB?: IDBFactory;
    caches?: Pick<CacheStorage, 'keys' | 'delete'>;
    navigator?: Navigator;
}

async function clearCacheStorage(cachesLike?: Pick<CacheStorage, 'keys' | 'delete'>): Promise<void> {
    if (!cachesLike) {
        return;
    }

    const cacheKeys = await cachesLike.keys();
    await Promise.all(cacheKeys.map(cacheName => cachesLike.delete(cacheName)));
}

async function unregisterServiceWorkers(navigatorLike?: Navigator): Promise<void> {
    if (!navigatorLike?.serviceWorker?.getRegistrations) {
        return;
    }

    const registrations = await navigatorLike.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
}

export async function clearPersistedAppData(options: ClearPersistedAppDataOptions = {}): Promise<void> {
    options.localStorage?.clear();

    await Promise.allSettled([
        options.indexedDB ? clearRecentProjectHandles(options.indexedDB) : Promise.resolve(),
        clearCacheStorage(options.caches),
        unregisterServiceWorkers(options.navigator),
    ]);
}
