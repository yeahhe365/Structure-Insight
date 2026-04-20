const DATABASE_NAME = 'structure-insight';
const STORE_NAME = 'recent-project-handles';
const DATABASE_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Failed to open recent project handle store'));
    });
}

function withStore<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
    return openDatabase().then(database => new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = run(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
        transaction.oncomplete = () => database.close();
        transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    }));
}

export async function saveRecentProjectHandle(projectId: string, handle: FileSystemDirectoryHandle): Promise<void> {
    await withStore('readwrite', store => store.put(handle, projectId));
}

export async function loadRecentProjectHandle(projectId: string): Promise<FileSystemDirectoryHandle | null> {
    return (await withStore('readonly', store => store.get(projectId))) ?? null;
}

export async function deleteRecentProjectHandle(projectId: string): Promise<void> {
    await withStore('readwrite', store => store.delete(projectId));
}
