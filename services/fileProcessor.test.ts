import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { processDroppedItems } from './droppedItems';
import { processFiles } from './fileProcessor';

const { processZipFileMock, createIgnoreMatcherMock, matchesGlobPatternsMock } = vi.hoisted(() => ({
    processZipFileMock: vi.fn(),
    createIgnoreMatcherMock: vi.fn((patterns: string[]) => {
        const literalIgnored = new Set(patterns);
        return {
            test(path: string) {
                return {
                    ignored: literalIgnored.has(path) || literalIgnored.has(`${path}/`),
                    unignored: false,
                };
            },
        };
    }),
    matchesGlobPatternsMock: vi.fn((path: string, patterns: string[]) => patterns.includes(path)),
}));

vi.mock('./zipProcessor', () => ({
    processZipFile: processZipFileMock,
}));

vi.mock('./gitignoreMatcher', () => ({
    createIgnoreMatcher: createIgnoreMatcherMock,
}));

vi.mock('./pathPatternMatcher', () => ({
    matchesGlobPatterns: matchesGlobPatternsMock,
}));

afterEach(() => {
    vi.restoreAllMocks();
});

beforeEach(() => {
    processZipFileMock.mockReset();
    createIgnoreMatcherMock.mockClear();
    matchesGlobPatternsMock.mockClear();
});

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
    it('does not load the zip processor for regular files', async () => {
        const file = new File(['export const value = 1;\n'], 'kept.ts', { type: 'text/plain' });
        Object.defineProperty(file, 'webkitRelativePath', {
            value: 'demo/kept.ts',
            configurable: true,
        });

        await processFiles(
            [file],
            vi.fn(),
            true,
            0,
            new AbortController().signal
        );

        expect(processZipFileMock).not.toHaveBeenCalled();
    });

    it('does not load optional filter modules when no ignore files or glob patterns are present', async () => {
        const file = new File(['export const value = 1;\n'], 'kept.ts', { type: 'text/plain' });
        Object.defineProperty(file, 'webkitRelativePath', {
            value: 'demo/kept.ts',
            configurable: true,
        });

        await processFiles(
            [file],
            vi.fn(),
            true,
            0,
            new AbortController().signal
        );

        expect(createIgnoreMatcherMock).not.toHaveBeenCalled();
        expect(matchesGlobPatternsMock).not.toHaveBeenCalled();
    });

    it('skips files that exceed the byte-size threshold without reading content', async () => {
        const file = new File(['this content must not be read'], 'huge.log', { type: 'text/plain' });
        Object.defineProperty(file, 'size', {
            value: 10_000,
            configurable: true,
        });
        const readAsTextSpy = vi.spyOn(FileReader.prototype, 'readAsText');

        const result = await processFiles(
            [file],
            vi.fn(),
            true,
            1_000,
            new AbortController().signal
        );

        expect(readAsTextSpy).not.toHaveBeenCalled();
        expect(result.fileContents).toEqual([]);
        expect(result.treeData[0]).toMatchObject({
            name: 'huge.log',
            status: 'skipped',
            chars: 10_000,
        });
    });

    it('loads the gitignore matcher module when ignore files are present', async () => {
        const gitignore = new File(['ignored.ts\n'], '.gitignore', { type: 'text/plain' });
        Object.defineProperty(gitignore, 'webkitRelativePath', {
            value: 'demo/.gitignore',
            configurable: true,
        });

        const keptFile = new File(['export const kept = true;\n'], 'kept.ts', { type: 'text/plain' });
        Object.defineProperty(keptFile, 'webkitRelativePath', {
            value: 'demo/kept.ts',
            configurable: true,
        });

        await processFiles(
            [gitignore, keptFile],
            vi.fn(),
            true,
            100_000,
            new AbortController().signal
        );

        expect(createIgnoreMatcherMock).toHaveBeenCalled();
    });

    it('loads the glob matcher module when include patterns are configured', async () => {
        const keptFile = new File(['export const kept = true;\n'], 'kept.ts', { type: 'text/plain' });
        Object.defineProperty(keptFile, 'webkitRelativePath', {
            value: 'demo/kept.ts',
            configurable: true,
        });

        await processFiles(
            [keptFile],
            vi.fn(),
            true,
            100_000,
            new AbortController().signal,
            {
                includePatterns: ['demo/kept.ts'],
            }
        );

        expect(matchesGlobPatternsMock).toHaveBeenCalled();
    });

    it('preserves empty directories discovered inside zip archives', async () => {
        const zipFile = new File(['fake zip'], 'demo.zip', { type: 'application/zip' });

        processZipFileMock.mockResolvedValueOnce({
            files: [
                (() => {
                    const file = new File(['export const zipped = true;\n'], 'src/app.ts', { type: 'text/plain' });
                    Object.defineProperty(file, 'webkitRelativePath', {
                        value: 'demo/src/app.ts',
                        configurable: true,
                    });
                    return file;
                })(),
            ],
            emptyDirectoryPaths: ['demo/empty'],
        });

        const result = await processFiles(
            [zipFile],
            vi.fn(),
            true,
            100_000,
            new AbortController().signal,
            {
                includeEmptyDirectories: true,
            }
        );

        expect(result.fileContents.map(file => file.path)).toEqual(['demo/src/app.ts']);
        expect(result.emptyDirectoryPaths).toEqual(['demo/empty']);
        expect(result.structureString).toContain('empty');
    });

    it('does not expand zip files discovered inside imported directories', async () => {
        const zipFile = new File(['fake zip'], 'docs.zip', { type: 'application/zip' });
        Object.defineProperty(zipFile, 'webkitRelativePath', {
            value: 'demo/downloads/docs.zip',
            configurable: true,
        });

        const result = await processFiles(
            [zipFile],
            vi.fn(),
            true,
            100_000,
            new AbortController().signal
        );

        expect(processZipFileMock).not.toHaveBeenCalled();
        expect(result.fileContents).toEqual([]);
        expect(result.structureString).toContain('docs.zip');
    });

    it('throws a descriptive error when zip extraction fails', async () => {
        const zipFile = new File(['broken zip'], 'broken.zip', { type: 'application/zip' });

        processZipFileMock.mockRejectedValueOnce(new Error('corrupt archive'));

        await expect(
            processFiles(
                [zipFile],
                vi.fn(),
                true,
                100_000,
                new AbortController().signal
            )
        ).rejects.toThrow('Failed to unzip broken.zip: corrupt archive');
    });

    it('treats a zero maxCharsThreshold as disabled and still extracts content', async () => {
        const file = new File(['export const value = 1;\n'], 'kept.ts', { type: 'text/plain' });
        Object.defineProperty(file, 'webkitRelativePath', {
            value: 'demo/kept.ts',
            configurable: true,
        });

        const result = await processFiles(
            [file],
            vi.fn(),
            true,
            0,
            new AbortController().signal
        );

        expect(result.fileContents).toHaveLength(1);
        expect(result.fileContents[0].path).toBe('demo/kept.ts');
        expect(result.treeData[0]?.children?.[0]).toMatchObject({
            path: 'demo/kept.ts',
            status: 'processed',
        });
    });

    it('skips macOS metadata files like .DS_Store from exported file contents', async () => {
        const dsStore = new File(['binaryish\0content'], '.DS_Store', { type: 'application/octet-stream' });
        Object.defineProperty(dsStore, 'webkitRelativePath', {
            value: 'demo/.DS_Store',
            configurable: true,
        });

        const result = await processFiles(
            [dsStore],
            vi.fn(),
            true,
            0,
            new AbortController().signal
        );

        expect(result.fileContents).toEqual([]);
        expect(result.treeData[0].children[0]).toMatchObject({
            path: 'demo/.DS_Store',
            status: 'skipped',
        });
    });

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

    it('sorts tree nodes with directories first using natural case-insensitive order including empty directories', async () => {
        const alphaFile = new File(['export const alpha = true;\n'], 'alpha.ts', { type: 'text/plain' });
        Object.defineProperty(alphaFile, 'webkitRelativePath', {
            value: 'demo/alpha.ts',
            configurable: true,
        });

        const betaFile = new File(['export const beta = true;\n'], 'Beta.ts', { type: 'text/plain' });
        Object.defineProperty(betaFile, 'webkitRelativePath', {
            value: 'demo/Beta.ts',
            configurable: true,
        });

        const file2 = new File(['export const two = true;\n'], 'file-2.ts', { type: 'text/plain' });
        Object.defineProperty(file2, 'webkitRelativePath', {
            value: 'demo/file-2.ts',
            configurable: true,
        });

        const file10 = new File(['export const ten = true;\n'], 'file-10.ts', { type: 'text/plain' });
        Object.defineProperty(file10, 'webkitRelativePath', {
            value: 'demo/file-10.ts',
            configurable: true,
        });

        const result = await processFiles(
            [alphaFile, betaFile, file2, file10],
            vi.fn(),
            true,
            100_000,
            new AbortController().signal,
            {
                includeEmptyDirectories: true,
                emptyDirectoryPaths: ['demo/empty-12', 'demo/docs', 'demo/empty-3'],
            }
        );

        expect(result.fileContents.map(file => file.path)).toEqual([
            'demo/alpha.ts',
            'demo/Beta.ts',
            'demo/file-2.ts',
            'demo/file-10.ts',
        ]);
        expect(result.treeData[0]?.children.map(node => node.name)).toEqual([
            'docs',
            'empty-3',
            'empty-12',
            'alpha.ts',
            'Beta.ts',
            'file-2.ts',
            'file-10.ts',
        ]);
    });
});
