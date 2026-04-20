import { IGNORED_DIRS } from './constants';

export interface DroppedItemsResult {
    files: File[];
    emptyDirectoryPaths: string[];
}

export async function processDroppedItems(items: DataTransferItemList, onProgress: (msg: string) => void, signal?: AbortSignal): Promise<DroppedItemsResult> {
    const allFiles: File[] = [];
    const emptyDirectoryPaths: string[] = [];
    const entries: FileSystemEntry[] = [];

    for (const item of Array.from(items)) {
        if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry();
            if (entry) {
                entries.push(entry);
            } else {
                const file = item.getAsFile();
                if (file) {
                    allFiles.push(file);
                }
            }
        }
    }

    const readEntries = async (entry: FileSystemEntry): Promise<DroppedItemsResult> => {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        if (entry.isFile) {
            return new Promise((resolve, reject) => {
                (entry as FileSystemFileEntry).file(file => {
                    if (!file.webkitRelativePath) {
                        Object.defineProperty(file, 'webkitRelativePath', {
                            value: entry.fullPath.startsWith('/') ? entry.fullPath.substring(1) : entry.fullPath,
                            writable: true,
                        });
                    }
                    resolve({ files: [file], emptyDirectoryPaths: [] });
                }, err => reject(err));
            });
        }

        if (entry.isDirectory) {
            const dirName = entry.name;
            if (IGNORED_DIRS.has(dirName)) return { files: [], emptyDirectoryPaths: [] };

            const dirReader = (entry as FileSystemDirectoryEntry).createReader();
            const allDirFiles: File[] = [];
            const allEmptyDirs: string[] = [];

            return new Promise((resolve, reject) => {
                const readBatch = () => {
                    dirReader.readEntries(async (batch) => {
                        if (signal?.aborted) {
                            reject(new DOMException('Aborted', 'AbortError'));
                            return;
                        }
                        if (batch.length === 0) {
                            if (allDirFiles.length === 0) {
                                const dirPath = entry.fullPath.startsWith('/') ? entry.fullPath.substring(1) : entry.fullPath;
                                allEmptyDirs.push(dirPath);
                            }
                            resolve({ files: allDirFiles, emptyDirectoryPaths: allEmptyDirs });
                            return;
                        }
                        try {
                            const batchResults = await Promise.all(batch.map(readEntries));
                            allDirFiles.push(...batchResults.flatMap(result => result.files));
                            allEmptyDirs.push(...batchResults.flatMap(result => result.emptyDirectoryPaths));
                            readBatch();
                        } catch (error) {
                            reject(error);
                        }
                    }, err => reject(err));
                };
                readBatch();
            });
        }

        return { files: [], emptyDirectoryPaths: [] };
    };

    const filesFromEntries = await Promise.all(entries.map(readEntries));
    allFiles.push(...filesFromEntries.flatMap(result => result.files));
    emptyDirectoryPaths.push(...filesFromEntries.flatMap(result => result.emptyDirectoryPaths));

    return {
        files: allFiles,
        emptyDirectoryPaths,
    };
}
