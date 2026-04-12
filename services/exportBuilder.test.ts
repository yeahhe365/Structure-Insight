import { describe, expect, it, vi } from 'vitest';
import type { ProcessedFiles } from '../types';
import { buildExportOutput } from './exportBuilder';

const CURRENT_DATA: ProcessedFiles = {
    rootName: 'demo',
    structureString: 'demo\n└── src\n    └── app.ts\n',
    treeData: [
        {
            name: 'src',
            path: 'src',
            isDirectory: true,
            children: [
                {
                    name: 'app.ts',
                    path: 'src/app.ts',
                    isDirectory: false,
                    children: [],
                    status: 'processed',
                },
            ],
        },
    ],
    fileContents: [
        {
            path: 'src/app.ts',
            content: 'const answer = 42;\n\nconst encoded = "data:image/png;base64,ABCDEFGHIJKLMNOPQRSTUVWXYZ";\n',
            originalContent: 'const answer = 0;\n\nconst encoded = "data:image/png;base64,ABCDEFGHIJKLMNOPQRSTUVWXYZ";\n',
            language: 'typescript',
            stats: { lines: 3, chars: 82, estimatedTokens: 21 },
        },
    ],
    analysisSummary: {
        totalEstimatedTokens: 21,
        securityFindingCount: 0,
        scannedFileCount: 1,
    },
    securityFindings: [],
    exportMetadata: {
        usesDefaultIgnorePatterns: true,
        usesGitignorePatterns: true,
        sortsByGitChangeCount: false,
    },
    removedPaths: ['src/removed.ts'],
};

function createFile(path: string, content: string): File {
    const file = new File([content], path.split('/').pop() || path, { type: 'text/plain' });
    Object.defineProperty(file, 'webkitRelativePath', {
        value: path,
        configurable: true,
    });
    return file;
}

describe('buildExportOutput', () => {
    it('renders XML, Markdown, and JSON export styles', async () => {
        const files = [createFile('demo/src/app.ts', 'const answer = 42;\n')];

        const [xml, markdown, json] = await Promise.all([
            buildExportOutput({
                currentData: CURRENT_DATA,
                rawFiles: files,
                emptyDirectoryPaths: [],
                exportOptions: {
                    format: 'xml',
                    includeFileSummary: true,
                    includeDirectoryStructure: true,
                    includeFiles: true,
                    includeGitDiffs: false,
                    includeEmptyDirectories: false,
                    includePatterns: '',
                    ignorePatterns: '',
                    useDefaultPatterns: true,
                    useGitignore: true,
                    showLineNumbers: false,
                    removeEmptyLines: false,
                    truncateBase64: false,
                    userProvidedHeader: '',
                    instruction: '',
                },
                extractContent: true,
                maxCharsThreshold: 100000,
                progressCallback: vi.fn(),
            }),
            buildExportOutput({
                currentData: CURRENT_DATA,
                rawFiles: files,
                emptyDirectoryPaths: [],
                exportOptions: {
                    format: 'markdown',
                    includeFileSummary: true,
                    includeDirectoryStructure: true,
                    includeFiles: true,
                    includeGitDiffs: false,
                    includeEmptyDirectories: false,
                    includePatterns: '',
                    ignorePatterns: '',
                    useDefaultPatterns: true,
                    useGitignore: true,
                    showLineNumbers: false,
                    removeEmptyLines: false,
                    truncateBase64: false,
                    userProvidedHeader: '',
                    instruction: '',
                },
                extractContent: true,
                maxCharsThreshold: 100000,
                progressCallback: vi.fn(),
            }),
            buildExportOutput({
                currentData: CURRENT_DATA,
                rawFiles: files,
                emptyDirectoryPaths: [],
                exportOptions: {
                    format: 'json',
                    includeFileSummary: true,
                    includeDirectoryStructure: true,
                    includeFiles: true,
                    includeGitDiffs: false,
                    includeEmptyDirectories: false,
                    includePatterns: '',
                    ignorePatterns: '',
                    useDefaultPatterns: true,
                    useGitignore: true,
                    showLineNumbers: false,
                    removeEmptyLines: false,
                    truncateBase64: false,
                    userProvidedHeader: '',
                    instruction: '',
                },
                extractContent: true,
                maxCharsThreshold: 100000,
                progressCallback: vi.fn(),
            }),
        ]);

        expect(xml).toContain('<file_summary>');
        expect(xml).toContain('<directory_structure>');
        expect(xml).toContain('<file path="src/app.ts">');

        expect(markdown).toContain('# File Summary');
        expect(markdown).toContain('# Directory Structure');
        expect(markdown).toContain('## File: src/app.ts');

        expect(json).toContain('"fileSummary"');
        expect(json).toContain('"directoryStructure"');
        expect(json).toContain('"src/app.ts"');
    });

    it('supports include, ignore, no-default-patterns, and no-gitignore export filters', async () => {
        const files = [
            createFile('demo/.gitignore', 'ignored.ts\n'),
            createFile('demo/src/kept.ts', 'export const kept = true;\n'),
            createFile('demo/ignored.ts', 'export const ignored = true;\n'),
            createFile('demo/node_modules/pkg/index.ts', 'export const pkg = true;\n'),
        ];

        const noFilters = await buildExportOutput({
            currentData: {
                ...CURRENT_DATA,
                fileContents: [],
                treeData: [],
                structureString: '',
                removedPaths: [],
            },
            rawFiles: files,
            emptyDirectoryPaths: [],
            exportOptions: {
                format: 'json',
                includeFileSummary: true,
                includeDirectoryStructure: true,
                includeFiles: true,
                includeGitDiffs: false,
                includeEmptyDirectories: false,
                includePatterns: '',
                ignorePatterns: '',
                useDefaultPatterns: false,
                useGitignore: false,
                showLineNumbers: false,
                removeEmptyLines: false,
                truncateBase64: false,
                userProvidedHeader: '',
                instruction: '',
            },
            extractContent: true,
            maxCharsThreshold: 100000,
            progressCallback: vi.fn(),
        });

        expect(noFilters).toContain('ignored.ts');
        expect(noFilters).toContain('node_modules/pkg/index.ts');

        const filtered = await buildExportOutput({
            currentData: {
                ...CURRENT_DATA,
                fileContents: [],
                treeData: [],
                structureString: '',
                removedPaths: [],
            },
            rawFiles: files,
            emptyDirectoryPaths: [],
            exportOptions: {
                format: 'json',
                includeFileSummary: true,
                includeDirectoryStructure: true,
                includeFiles: true,
                includeGitDiffs: false,
                includeEmptyDirectories: false,
                includePatterns: 'src/**/*.ts',
                ignorePatterns: '**/ignored.ts',
                useDefaultPatterns: true,
                useGitignore: true,
                showLineNumbers: false,
                removeEmptyLines: false,
                truncateBase64: false,
                userProvidedHeader: '',
                instruction: '',
            },
            extractContent: true,
            maxCharsThreshold: 100000,
            progressCallback: vi.fn(),
        });

        expect(filtered).toContain('src/kept.ts');
        expect(filtered).not.toContain('ignored.ts');
        expect(filtered).not.toContain('node_modules/pkg/index.ts');
    });

    it('supports line numbers, empty-line removal, base64 truncation, and empty directories', async () => {
        const files = [createFile('demo/src/app.ts', CURRENT_DATA.fileContents[0].content)];

        const output = await buildExportOutput({
            currentData: CURRENT_DATA,
            rawFiles: files,
            emptyDirectoryPaths: ['demo/empty-folder'],
            exportOptions: {
                format: 'plain',
                includeFileSummary: true,
                includeDirectoryStructure: true,
                includeFiles: true,
                includeGitDiffs: false,
                includeEmptyDirectories: true,
                includePatterns: '',
                ignorePatterns: '',
                useDefaultPatterns: true,
                useGitignore: true,
                showLineNumbers: true,
                removeEmptyLines: true,
                truncateBase64: true,
                userProvidedHeader: '',
                instruction: '',
            },
            extractContent: true,
            maxCharsThreshold: 100000,
            progressCallback: vi.fn(),
        });

        expect(output).toContain('empty-folder/');
        expect(output).toContain('1 | const answer = 42;');
        expect(output).not.toContain('\n\nconst encoded');
        expect(output).toContain('[TRUNCATED_BASE64_DATA]');
    });
});
