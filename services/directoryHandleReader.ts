import type { DroppedItemsResult } from './droppedItems';
import { IGNORED_DIRS } from './constants';

function attachRelativePath(file: File, relativePath: string): File {
    Object.defineProperty(file, 'webkitRelativePath', {
        configurable: true,
        value: relativePath,
    });
    return file;
}

async function readDirectory(
    handle: FileSystemDirectoryHandle,
    relativePath: string,
    files: File[],
    emptyDirectoryPaths: string[]
): Promise<boolean> {
    let sawAnySupportedEntries = false;

    for await (const entry of handle.values()) {
        if (entry.kind === 'directory') {
            const directoryEntry = entry as FileSystemDirectoryHandle;
            if (IGNORED_DIRS.has(directoryEntry.name)) {
                continue;
            }

            sawAnySupportedEntries = true;
            await readDirectory(directoryEntry, `${relativePath}/${directoryEntry.name}`, files, emptyDirectoryPaths);
            continue;
        }

        sawAnySupportedEntries = true;
        const file = await (entry as FileSystemFileHandle).getFile();
        files.push(attachRelativePath(file, `${relativePath}/${file.name}`));
    }

    if (!sawAnySupportedEntries) {
        emptyDirectoryPaths.push(relativePath);
    }

    return sawAnySupportedEntries;
}

export async function readDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<DroppedItemsResult> {
    const files: File[] = [];
    const emptyDirectoryPaths: string[] = [];

    await readDirectory(handle, handle.name, files, emptyDirectoryPaths);

    return {
        files,
        emptyDirectoryPaths,
    };
}
