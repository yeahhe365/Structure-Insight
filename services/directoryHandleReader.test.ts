import { describe, expect, it } from 'vitest';
import { readDirectoryHandle } from './directoryHandleReader';

function createFileHandle(name: string, content: string): FileSystemFileHandle {
    return {
        kind: 'file',
        name,
        getFile: () => Promise.resolve(new File([content], name, { type: 'text/plain' })),
    } as unknown as FileSystemFileHandle;
}

function createDirectoryHandle(name: string, entries: Array<FileSystemDirectoryHandle | FileSystemFileHandle>): FileSystemDirectoryHandle {
    return {
        kind: 'directory',
        name,
        async *values() {
            for (const entry of entries) {
                yield entry;
            }
        },
    } as unknown as FileSystemDirectoryHandle;
}

describe('readDirectoryHandle', () => {
    it('skips default ignored directories by default', async () => {
        const handle = createDirectoryHandle('demo', [
            createDirectoryHandle('node_modules', [
                createFileHandle('index.ts', 'export const pkg = true;\n'),
            ]),
            createDirectoryHandle('src', [
                createFileHandle('app.ts', 'export const app = true;\n'),
            ]),
        ]);

        const result = await readDirectoryHandle(handle);

        expect(result.files.map(file => file.webkitRelativePath)).toEqual([
            'demo/src/app.ts',
        ]);
    });

    it('keeps default ignored directories when skipping is disabled', async () => {
        const handle = createDirectoryHandle('demo', [
            createDirectoryHandle('node_modules', [
                createFileHandle('index.ts', 'export const pkg = true;\n'),
            ]),
            createDirectoryHandle('src', [
                createFileHandle('app.ts', 'export const app = true;\n'),
            ]),
        ]);

        const result = await readDirectoryHandle(handle, {
            skipDefaultIgnoredDirectories: false,
        });

        expect(result.files.map(file => file.webkitRelativePath)).toEqual([
            'demo/node_modules/index.ts',
            'demo/src/app.ts',
        ]);
    });
});
