import { describe, expect, it, vi } from 'vitest';
import { processDroppedItems, processFiles } from './fileProcessor';

describe('processDroppedItems', () => {
    it('handles dropped entries even when no abort signal is available yet', async () => {
        const file = new File(['console.log("ok");'], 'index.ts', { type: 'text/plain' });
        const entry = {
            isFile: true,
            isDirectory: false,
            fullPath: '/src/index.ts',
            file: (onSuccess: (value: File) => void) => onSuccess(file),
        } as unknown as FileSystemFileEntry;

        const items = [
            {
                kind: 'file',
                webkitGetAsEntry: () => entry,
                getAsFile: () => file,
            },
        ] as unknown as DataTransferItemList;

        await expect(
            processDroppedItems(items, vi.fn(), undefined as unknown as AbortSignal)
        ).resolves.toMatchObject({
            files: [expect.any(File)],
            emptyDirectoryPaths: [],
        });
    });
});

describe('processFiles', () => {
    it('excludes files matched by the root .gitignore file', async () => {
        const gitignore = new File(['ignored.ts\n'], '.gitignore', { type: 'text/plain' });
        Object.defineProperty(gitignore, 'webkitRelativePath', {
            value: 'demo/.gitignore',
            configurable: true,
        });

        const ignoredFile = new File(['export const ignored = true;\n'], 'ignored.ts', { type: 'text/plain' });
        Object.defineProperty(ignoredFile, 'webkitRelativePath', {
            value: 'demo/ignored.ts',
            configurable: true,
        });

        const keptFile = new File(['export const kept = true;\n'], 'kept.ts', { type: 'text/plain' });
        Object.defineProperty(keptFile, 'webkitRelativePath', {
            value: 'demo/kept.ts',
            configurable: true,
        });

        const result = await processFiles(
            [gitignore, ignoredFile, keptFile],
            vi.fn(),
            true,
            100_000,
            new AbortController().signal
        );

        expect(result.fileContents.map(file => file.path)).toEqual(['demo/.gitignore', 'demo/kept.ts']);
        expect(result.exportMetadata).toEqual({
            usesDefaultIgnorePatterns: true,
            usesGitignorePatterns: true,
            sortsByGitChangeCount: false,
        });
        expect(result.analysisSummary).toEqual({
            totalEstimatedTokens: 10,
            securityFindingCount: 0,
            scannedFileCount: 2,
        });
        expect(result.fileContents[1].stats.estimatedTokens).toBe(7);
    });

    it('supports layered .gitignore and .ignore rules while aggregating security findings', async () => {
        const rootGitignore = new File(['dist/\n'], '.gitignore', { type: 'text/plain' });
        Object.defineProperty(rootGitignore, 'webkitRelativePath', {
            value: 'demo/.gitignore',
            configurable: true,
        });

        const nestedIgnore = new File(['secret.ts\n!keep-secret.ts\n'], '.ignore', { type: 'text/plain' });
        Object.defineProperty(nestedIgnore, 'webkitRelativePath', {
            value: 'demo/src/.ignore',
            configurable: true,
        });

        const distFile = new File(['export const build = true;\n'], 'out.ts', { type: 'text/plain' });
        Object.defineProperty(distFile, 'webkitRelativePath', {
            value: 'demo/dist/out.ts',
            configurable: true,
        });

        const ignoredNestedFile = new File(['export const secret = true;\n'], 'secret.ts', { type: 'text/plain' });
        Object.defineProperty(ignoredNestedFile, 'webkitRelativePath', {
            value: 'demo/src/secret.ts',
            configurable: true,
        });

        const restoredNestedFile = new File(['export const keep = true;\n'], 'keep-secret.ts', { type: 'text/plain' });
        Object.defineProperty(restoredNestedFile, 'webkitRelativePath', {
            value: 'demo/src/keep-secret.ts',
            configurable: true,
        });

        const envFile = new File(['OPENAI_API_KEY="sk-proj-abcdefghijklmnopqrstuvwxyz123456"\n'], '.env', { type: 'text/plain' });
        Object.defineProperty(envFile, 'webkitRelativePath', {
            value: 'demo/src/.env',
            configurable: true,
        });

        const result = await processFiles(
            [rootGitignore, nestedIgnore, distFile, ignoredNestedFile, restoredNestedFile, envFile],
            vi.fn(),
            true,
            100_000,
            new AbortController().signal
        );

        expect(result.fileContents.map(file => file.path)).toEqual([
            'demo/.gitignore',
            'demo/src/.env',
            'demo/src/.ignore',
            'demo/src/keep-secret.ts',
        ]);
        expect(result.analysisSummary?.securityFindingCount).toBe(1);
        expect(result.securityFindings?.[0].ruleId).toBe('openai-api-key');
    });
});
