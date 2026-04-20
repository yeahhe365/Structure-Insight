import { describe, expect, it } from 'vitest';
import type { ProcessedFiles } from '../types';
import { generateRepomixPlainOutput } from './repomixPlainOutput';

const PROJECT_DATA: ProcessedFiles = {
    rootName: 'demo-project',
    structureString: `demo-project
└── src
    └── app.ts
`,
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
                    lines: 2,
                    chars: 27,
                },
            ],
        },
    ],
    fileContents: [
        {
            path: 'src/app.ts',
            content: 'const message = "edited";\n',
            originalContent: 'const message = "original";\n',
            language: 'typescript',
            stats: { lines: 1, chars: 26, estimatedTokens: 7 },
        },
        {
            path: 'README.md',
            content: '# Hidden\n',
            language: 'markdown',
            stats: { lines: 1, chars: 9, estimatedTokens: 3 },
            excluded: true,
        },
    ],
    exportMetadata: {
        usesDefaultIgnorePatterns: true,
        usesGitignorePatterns: true,
        sortsByGitChangeCount: false,
    },
    analysisSummary: {
        totalEstimatedTokens: 7,
        securityFindingCount: 0,
        scannedFileCount: 1,
    },
    securityFindings: [],
};

const EXPECTED_DEFAULT_OUTPUT = [
    'This file is a merged representation of the current codebase, prepared by Structure Insight.',
    '',
    '================================================================',
    'File Summary',
    '================================================================',
    '',
    'Purpose:',
    '--------',
    "This file contains a packed representation of the entire repository's contents.",
    'It is designed to be easily consumable by AI systems for analysis, code review,',
    'or other automated processes.',
    '',
    'File Format:',
    '------------',
    'The content is organized as follows:',
    '1. This summary section',
    '2. Repository information',
    '3. Directory structure',
    '4. Repository files (if enabled)',
    '5. Multiple file entries, each consisting of:',
    '  a. A separator line (================)',
    '  b. The file path (File: path/to/file)',
    '  c. Another separator line',
    '  d. The full contents of the file',
    '  e. A blank line',
    '',
    'Usage Guidelines:',
    '-----------------',
    '- This file should be treated as read-only. Any changes should be made to the',
    '  original repository files, not this packed version.',
    '- When processing this file, use the file path to distinguish',
    '  between different files in the repository.',
    '- Be aware that this file may contain sensitive information. Handle it with',
    '  the same level of security as you would the original repository.',
    '',
    'Notes:',
    '------',
    '- Some files may have been excluded based on detected ignore files and Structure Insight\'s export settings',
    '- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files',
    '- Files matching patterns in .gitignore, .ignore, or .repomixignore are excluded',
    '- Files matching default ignore patterns are excluded',
    '',
    '================================================================',
    'Directory Structure',
    '================================================================',
    'src/',
    '  app.ts',
    '',
    '================================================================',
    'Files',
    '================================================================',
    '',
    '================',
    'File: src/app.ts',
    '================',
    'const message = "edited";\n',
    '',
    '',
    '',
    '================================================================',
    'End of Codebase',
    '================================================================',
    '',
].join('\n');

const EXPECTED_OUTPUT_WITH_HEADER_AND_INSTRUCTION = [
    'This file is a merged representation of the current codebase, prepared by Structure Insight.',
    '',
    '================================================================',
    'File Summary',
    '================================================================',
    '',
    'Purpose:',
    '--------',
    "This file contains a packed representation of the entire repository's contents.",
    'It is designed to be easily consumable by AI systems for analysis, code review,',
    'or other automated processes.',
    '',
    'File Format:',
    '------------',
    'The content is organized as follows:',
    '1. This summary section',
    '2. Repository information',
    '3. Directory structure',
    '4. Repository files (if enabled)',
    '5. Multiple file entries, each consisting of:',
    '  a. A separator line (================)',
    '  b. The file path (File: path/to/file)',
    '  c. Another separator line',
    '  d. The full contents of the file',
    '  e. A blank line',
    '',
    'Usage Guidelines:',
    '-----------------',
    '- This file should be treated as read-only. Any changes should be made to the',
    '  original repository files, not this packed version.',
    '- When processing this file, use the file path to distinguish',
    '  between different files in the repository.',
    '- Be aware that this file may contain sensitive information. Handle it with',
    '  the same level of security as you would the original repository.',
    '- Pay special attention to the Repository Description. These contain important context and guidelines specific to this project.',
    '- Pay special attention to the Repository Instruction. These contain important context and guidelines specific to this project.',
    '',
    'Notes:',
    '------',
    "- Some files may have been excluded based on detected ignore files and Structure Insight's export settings",
    '- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files',
    '- Files matching patterns in .gitignore, .ignore, or .repomixignore are excluded',
    '- Files matching default ignore patterns are excluded',
    '',
    '',
    '================================================================',
    'User Provided Header',
    '================================================================',
    'Project overview',
    '',
    '================================================================',
    'Directory Structure',
    '================================================================',
    'src/',
    '  app.ts',
    '',
    '================================================================',
    'Files',
    '================================================================',
    '',
    '================',
    'File: src/app.ts',
    '================',
    'const message = "edited";\n',
    '',
    '',
    '',
    '',
    '================================================================',
    'Instruction',
    '================================================================',
    'Focus on architecture decisions.',
    '',
    '================================================================',
    'End of Codebase',
    '================================================================',
    '',
].join('\n');

describe('generateRepomixPlainOutput', () => {
    it('renders the repomix plain template structure by default', () => {
        const output = generateRepomixPlainOutput(PROJECT_DATA, {
            includeFileSummary: true,
            includeDirectoryStructure: true,
            includeFiles: true,
            userProvidedHeader: '',
            instruction: '',
        });

        expect(output).toBe(EXPECTED_DEFAULT_OUTPUT);
        expect(output).not.toContain('File: README.md');
    });

    it('omits the summary section and top header when disabled', () => {
        const output = generateRepomixPlainOutput(PROJECT_DATA, {
            includeFileSummary: false,
            includeDirectoryStructure: true,
            includeFiles: true,
            userProvidedHeader: '',
            instruction: '',
        });

        expect(output).not.toContain('File Summary');
        expect(output).not.toContain('combined into a single document by Repomix');
        expect(output).toContain('Directory Structure');
    });

    it('omits the directory structure section when disabled', () => {
        const output = generateRepomixPlainOutput(PROJECT_DATA, {
            includeFileSummary: true,
            includeDirectoryStructure: false,
            includeFiles: true,
            userProvidedHeader: '',
            instruction: '',
        });

        expect(output).toContain('File Summary');
        expect(output).not.toContain('Directory Structure');
        expect(output).not.toContain(PROJECT_DATA.structureString.trim());
    });

    it('keeps edited content in the exported file section', () => {
        const output = generateRepomixPlainOutput(PROJECT_DATA, {
            includeFileSummary: true,
            includeDirectoryStructure: true,
            includeFiles: true,
            userProvidedHeader: '',
            instruction: '',
        });

        expect(output).toContain('const message = "edited";');
    });

    it('keeps an empty Files section when no file contents are available', () => {
        const output = generateRepomixPlainOutput(
            {
                ...PROJECT_DATA,
                fileContents: [],
            },
            {
                includeFileSummary: true,
                includeDirectoryStructure: true,
                includeFiles: true,
                userProvidedHeader: '',
                instruction: '',
            }
        );

        expect(output).toContain('File Summary');
        expect(output).toContain('Directory Structure');
        expect(output).toContain('Files');
        expect(output).not.toContain('File: src/app.ts');
    });

    it('only includes notes for capabilities that are actually enabled', () => {
        const output = generateRepomixPlainOutput(
            {
                ...PROJECT_DATA,
                exportMetadata: {
                    usesDefaultIgnorePatterns: true,
                    usesGitignorePatterns: false,
                    sortsByGitChangeCount: false,
                },
            },
            {
                includeFileSummary: true,
                includeDirectoryStructure: true,
                includeFiles: true,
                userProvidedHeader: '',
                instruction: '',
            }
        );

        expect(output).toContain('- Files matching default ignore patterns are excluded');
        expect(output).not.toContain('- Files matching patterns in .gitignore, .ignore, or .repomixignore are excluded');
        expect(output).not.toContain('- Files are sorted by Git change count (files with more changes are at the bottom)');
    });

    it('renders multi-root directory structures using repomix root sections', () => {
        const output = generateRepomixPlainOutput(
            {
                rootName: '项目',
                structureString: '',
                treeData: [
                    {
                        name: 'repo-a',
                        path: 'repo-a',
                        isDirectory: true,
                        children: [
                            {
                                name: 'a.ts',
                                path: 'repo-a/a.ts',
                                isDirectory: false,
                                children: [],
                            },
                        ],
                    },
                    {
                        name: 'repo-b',
                        path: 'repo-b',
                        isDirectory: true,
                        children: [
                            {
                                name: 'b.ts',
                                path: 'repo-b/b.ts',
                                isDirectory: false,
                                children: [],
                            },
                        ],
                    },
                ],
                fileContents: [],
            },
            {
                includeFileSummary: false,
                includeDirectoryStructure: true,
                includeFiles: false,
                userProvidedHeader: '',
                instruction: '',
            }
        );

        expect(output).toContain('[repo-a]/\n  a.ts');
        expect(output).toContain('[repo-b]/\n  b.ts');
        expect(output).not.toContain('repo-a/\n  a.ts\nrepo-b/');
    });

    it('renders directory structures with directories first and natural case-insensitive ordering', () => {
        const output = generateRepomixPlainOutput(
            {
                rootName: 'demo',
                structureString: '',
                treeData: [
                    {
                        name: 'demo',
                        path: 'demo',
                        isDirectory: true,
                        children: [
                            {
                                name: 'file-10.ts',
                                path: 'demo/file-10.ts',
                                isDirectory: false,
                                children: [],
                            },
                            {
                                name: 'file-2.ts',
                                path: 'demo/file-2.ts',
                                isDirectory: false,
                                children: [],
                            },
                            {
                                name: 'Beta.ts',
                                path: 'demo/Beta.ts',
                                isDirectory: false,
                                children: [],
                            },
                            {
                                name: 'alpha.ts',
                                path: 'demo/alpha.ts',
                                isDirectory: false,
                                children: [],
                            },
                            {
                                name: 'empty-12',
                                path: 'demo/empty-12',
                                isDirectory: true,
                                children: [],
                            },
                            {
                                name: 'docs',
                                path: 'demo/docs',
                                isDirectory: true,
                                children: [],
                            },
                            {
                                name: 'empty-3',
                                path: 'demo/empty-3',
                                isDirectory: true,
                                children: [],
                            },
                        ],
                    },
                ],
                fileContents: [],
            },
            {
                includeFileSummary: false,
                includeDirectoryStructure: true,
                includeFiles: false,
                userProvidedHeader: '',
                instruction: '',
            }
        );

        expect(output).toContain(
            ['docs/', 'empty-3/', 'empty-12/', 'alpha.ts', 'Beta.ts', 'file-2.ts', 'file-10.ts'].join('\n')
        );
    });

    it('renders user provided header and instruction sections when text is present', () => {
        const output = generateRepomixPlainOutput(PROJECT_DATA, {
            includeFileSummary: true,
            includeDirectoryStructure: true,
            includeFiles: true,
            userProvidedHeader: 'Project overview',
            instruction: 'Focus on architecture decisions.',
        });

        expect(output).toBe(EXPECTED_OUTPUT_WITH_HEADER_AND_INSTRUCTION);
        expect(output.indexOf('User Provided Header')).toBeLessThan(output.indexOf('Directory Structure'));
        expect(output).toContain(
            '- Pay special attention to the Repository Description. These contain important context and guidelines specific to this project.'
        );
    });

    it('renders a security warning section when findings are available', () => {
        const output = generateRepomixPlainOutput(
            {
                ...PROJECT_DATA,
                analysisSummary: {
                    totalEstimatedTokens: 7,
                    securityFindingCount: 1,
                    scannedFileCount: 1,
                },
                securityFindings: [
                    {
                        filePath: 'src/.env',
                        ruleId: 'openai-api-key',
                        severity: 'high',
                        message: 'Potential OpenAI API key detected.',
                        preview: 'sk-proj-abc123',
                        line: 1,
                        column: 1,
                    },
                ],
            },
            {
                includeFileSummary: true,
                includeDirectoryStructure: true,
                includeFiles: true,
                userProvidedHeader: '',
                instruction: '',
            }
        );

        expect(output).toContain('Security Warnings');
        expect(output).toContain('[high] src/.env');
        expect(output).toContain('Potential OpenAI API key detected.');
    });

    it('matches repomix trailing blank lines after the last file when content ends with a newline', () => {
        const output = generateRepomixPlainOutput(
            {
                rootName: 'demo-project',
                structureString: '',
                treeData: [],
                fileContents: [
                    {
                        path: 'a.txt',
                        content: 'x\n',
                        language: 'text',
                        stats: { lines: 1, chars: 2, estimatedTokens: 1 },
                    },
                ],
                analysisSummary: {
                    totalEstimatedTokens: 1,
                    securityFindingCount: 0,
                    scannedFileCount: 1,
                },
                securityFindings: [],
            },
            {
                includeFileSummary: false,
                includeDirectoryStructure: false,
                includeFiles: true,
                userProvidedHeader: '',
                instruction: '',
            }
        );

        expect(output).toBe(
            [
                '================================================================',
                'Files',
                '================================================================',
                '',
                '================',
                'File: a.txt',
                '================',
                'x',
                '',
                '',
                '',
                '',
                '================================================================',
                'End of Codebase',
                '================================================================',
                '',
            ].join('\n')
        );
    });

    it('matches repomix trailing blank lines before the instruction section when the last file ends with a newline', () => {
        const output = generateRepomixPlainOutput(
            {
                rootName: 'demo-project',
                structureString: '',
                treeData: [],
                fileContents: [
                    {
                        path: 'a.txt',
                        content: 'x\n',
                        language: 'text',
                        stats: { lines: 1, chars: 2, estimatedTokens: 1 },
                    },
                ],
                analysisSummary: {
                    totalEstimatedTokens: 1,
                    securityFindingCount: 0,
                    scannedFileCount: 1,
                },
                securityFindings: [],
            },
            {
                includeFileSummary: false,
                includeDirectoryStructure: false,
                includeFiles: true,
                userProvidedHeader: '',
                instruction: 'note',
            }
        );

        expect(output).toBe(
            [
                '================================================================',
                'Files',
                '================================================================',
                '',
                '================',
                'File: a.txt',
                '================',
                'x',
                '',
                '',
                '',
                '',
                '',
                '================================================================',
                'Instruction',
                '================================================================',
                'note',
                '',
                '================================================================',
                'End of Codebase',
                '================================================================',
                '',
            ].join('\n')
        );
    });
});
