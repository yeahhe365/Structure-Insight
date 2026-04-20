import type { FileContent, FileNode, ProcessedFiles } from '../types';
import { summarizeAnalysis } from './analysisSummary';
import { createFileProcessingTask } from './fileProcessingClient';
import { generateRepomixPlainOutput } from './repomixPlainOutput';
import { scanSensitiveContent } from './securityScan';
import { estimateTokens } from './tokenEstimate';
import { countLines } from './textMetrics';
import { compareFilePaths, sortTreeNodes } from './treeSort';

export type ExportFormat = 'plain' | 'xml' | 'markdown' | 'json';

export interface ExportOptions {
    format: ExportFormat;
    includeFileSummary: boolean;
    includeDirectoryStructure: boolean;
    includeFiles: boolean;
    includeEmptyDirectories: boolean;
    includePatterns: string;
    ignorePatterns: string;
    useDefaultPatterns: boolean;
    useGitignore: boolean;
    showLineNumbers: boolean;
    removeEmptyLines: boolean;
    truncateBase64: boolean;
    userProvidedHeader: string;
    instruction: string;
}

interface BuildExportOutputParams {
    currentData: ProcessedFiles;
    rawFiles: File[];
    emptyDirectoryPaths: string[];
    exportOptions: ExportOptions;
    extractContent: boolean;
    maxCharsThreshold: number;
    progressCallback: (message: string) => void;
}

const SUMMARY_PURPOSE = [
    "This file contains a packed representation of the entire repository's contents.",
    'It is designed to be easily consumable by AI systems for analysis, code review,',
    'or other automated processes.',
].join('\n');

const SUMMARY_FILE_FORMAT_PLAIN = [
    'The content is organized as follows:',
    '1. This summary section',
    '2. Repository information',
    '3. Directory structure',
    '4. Repository files (if enabled)',
].join('\n');

const SUMMARY_FILE_FORMAT_JSON = [
    'The content is organized as follows:',
    '1. This summary section',
    '2. Repository information',
    '3. Directory structure',
    '4. Repository files, each consisting of:',
    '   - File path as a key',
    '   - Full contents of the file as the value',
].join('\n');

const SUMMARY_USAGE_GUIDELINES = [
    '- This file should be treated as read-only. Any changes should be made to the',
    '  original repository files, not this packed version.',
    '- When processing this file, use the file path to distinguish',
    '  between different files in the repository.',
    '- Be aware that this file may contain sensitive information. Handle it with',
    '  the same level of security as you would the original repository.',
].join('\n');

function parsePatternList(value: string): string[] {
    return value
        .split(',')
        .map(pattern => pattern.trim())
        .filter(Boolean);
}

function escapeXml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

function applyBase64Truncation(content: string): string {
    return content.replace(
        /data:[^"'\s]+;base64,[A-Za-z0-9+/=]{16,}/g,
        'data:[TRUNCATED_BASE64_DATA]'
    );
}

function applyEmptyLineRemoval(content: string): string {
    const lines = content.split('\n');
    const filtered = lines.filter(line => line.trim().length > 0);
    return filtered.join('\n');
}

function applyLineNumbers(content: string): string {
    return content
        .split('\n')
        .map((line, index) => `${index + 1} | ${line}`)
        .join('\n');
}

function transformContent(content: string, options: ExportOptions): string {
    let transformed = content;

    if (options.truncateBase64) {
        transformed = applyBase64Truncation(transformed);
    }

    if (options.removeEmptyLines) {
        transformed = applyEmptyLineRemoval(transformed);
    }

    if (options.showLineNumbers) {
        transformed = applyLineNumbers(transformed);
    }

    return transformed;
}

function normalizeFile(file: FileContent, options: ExportOptions): FileContent {
    const content = transformContent(file.content, options);
    return {
        ...file,
        content,
        stats: {
            lines: countLines(content),
            chars: content.length,
            estimatedTokens: estimateTokens(content),
        },
        securityFindings: scanSensitiveContent(file.path, content),
    };
}

function buildTree(files: FileContent[], emptyDirectoryPaths: string[], preferredRootName?: string): { rootName: string; treeData: FileNode[] } {
    const nodeMap = new Map<string, FileNode>();
    const roots: FileNode[] = [];

    const ensurePath = (path: string, isFile: boolean) => {
        const parts = path.split('/').filter(Boolean);
        let parent: FileNode | undefined;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const currentPath = parts.slice(0, i + 1).join('/');
            const isDirectory = i < parts.length - 1 || !isFile;

            let node = nodeMap.get(currentPath);
            if (!node) {
                node = {
                    name: part,
                    path: currentPath,
                    isDirectory,
                    children: [],
                };
                nodeMap.set(currentPath, node);
                if (parent) {
                    parent.children.push(node);
                } else {
                    roots.push(node);
                }
            }
            parent = node;
        }
    };

    for (const file of files) {
        ensurePath(file.path, true);
    }

    for (const directoryPath of emptyDirectoryPaths) {
        ensurePath(directoryPath, false);
    }

    sortTreeNodes(roots);

    let rootName = preferredRootName || 'Project';
    if (!preferredRootName && roots.length === 1 && roots[0].isDirectory) {
        rootName = roots[0].name;
    }

    return {
        rootName,
        treeData: roots,
    };
}

function applyManualState(exportData: ProcessedFiles, currentData: ProcessedFiles): ProcessedFiles {
    const currentByPath = new Map(currentData.fileContents.map(file => [file.path, file]));
    const removedPaths = new Set(currentData.removedPaths ?? []);

    const mergedFiles = exportData.fileContents
        .filter(file => !removedPaths.has(file.path))
        .map(file => {
            const current = currentByPath.get(file.path);
            return current ? { ...file, ...current } : file;
        });
    mergedFiles.sort((a, b) => compareFilePaths(a.path, b.path));

    const visibleFiles = mergedFiles.filter(file => !file.excluded);
    const tree = buildTree(visibleFiles, exportData.emptyDirectoryPaths ?? [], currentData.rootName);
    const { analysisSummary, securityFindings } = summarizeAnalysis(visibleFiles);

    return {
        ...exportData,
        fileContents: visibleFiles,
        treeData: tree.treeData,
        rootName: tree.rootName,
        structureString: exportData.structureString,
        removedPaths: [...removedPaths],
        analysisSummary,
        securityFindings,
    };
}

function normalizeExportPaths(data: ProcessedFiles): ProcessedFiles {
    const stripRootPrefix = (path: string) => {
        const prefix = `${data.rootName}/`;
        return path.startsWith(prefix) ? path.slice(prefix.length) : path;
    };

    return {
        ...data,
        fileContents: data.fileContents.map(file => ({
            ...file,
            path: stripRootPrefix(file.path),
        })),
        emptyDirectoryPaths: (data.emptyDirectoryPaths ?? []).map(stripRootPrefix),
    };
}

function buildDirectoryString(data: ProcessedFiles): string {
    const render = (nodes: FileNode[], indent = ''): string[] => {
        const lines: string[] = [];
        for (const node of nodes) {
            lines.push(`${indent}${node.name}${node.isDirectory ? '/' : ''}`);
            if (node.isDirectory && node.children.length > 0) {
                lines.push(...render(node.children, `${indent}  `));
            }
        }
        return lines;
    };

    if (data.rootName === 'Project' && data.treeData.length > 1 && data.treeData.every(node => node.isDirectory)) {
        return data.treeData
            .map(node => `[${node.name}]/\n${render(node.children, '  ').join('\n')}`)
            .join('\n\n');
    }

    const rootNode =
        data.treeData.length === 1 &&
        data.treeData[0].isDirectory &&
        data.treeData[0].name === data.rootName
            ? data.treeData[0]
            : null;

    return render(rootNode ? rootNode.children : data.treeData).join('\n');
}

function buildNotes(data: ProcessedFiles): string {
    const metadata = data.exportMetadata ?? {
        usesDefaultIgnorePatterns: false,
        usesGitignorePatterns: false,
        sortsByGitChangeCount: false,
    };
    const notes = [
        "- Some files may have been excluded based on .gitignore/.ignore rules and Repomix's configuration",
        '- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files',
    ];

    if (metadata.usesGitignorePatterns) {
        notes.push('- Files matching patterns in .gitignore or .ignore are excluded');
    }

    if (metadata.usesDefaultIgnorePatterns) {
        notes.push('- Files matching default ignore patterns are excluded');
    }

    return notes.join('\n');
}

function buildAnalysisSummary(data: ProcessedFiles) {
    return data.analysisSummary ?? summarizeAnalysis(data.fileContents).analysisSummary;
}

function buildSecurityWarnings(data: ProcessedFiles) {
    return data.securityFindings ?? data.fileContents.flatMap(file => file.securityFindings ?? []);
}

function renderMarkdown(data: ProcessedFiles, options: ExportOptions): string {
    const directoryString = buildDirectoryString(data);
    const analysisSummary = buildAnalysisSummary(data);
    const securityWarnings = buildSecurityWarnings(data);
    const sections: string[] = [];

    if (options.includeFileSummary) {
        sections.push(
            `${SUMMARY_PURPOSE ? `${'This file is a merged representation of the entire codebase, combined into a single document by Repomix.'}\n\n` : ''}# File Summary\n\n## Purpose\n${SUMMARY_PURPOSE}\n\n## File Format\n${SUMMARY_FILE_FORMAT_PLAIN}\n5. Multiple file entries, each consisting of:\n  a. A header with the file path (## File: path/to/file)\n  b. The full contents of the file in a code block\n\n## Usage Guidelines\n${SUMMARY_USAGE_GUIDELINES}\n\n## Notes\n${buildNotes(data)}`
        );
    }

    if (options.userProvidedHeader.trim()) {
        sections.push(`# User Provided Header\n${options.userProvidedHeader.trim()}`);
    }

    if (options.includeDirectoryStructure) {
        sections.push(`# Directory Structure\n\`\`\`\n${directoryString}\n\`\`\``);
    }

    sections.push(
        [
            '# Repository Analysis',
            `- Files: ${data.fileContents.length}`,
            `- Lines: ${data.fileContents.reduce((sum, file) => sum + file.stats.lines, 0)}`,
            `- Characters: ${data.fileContents.reduce((sum, file) => sum + file.stats.chars, 0)}`,
            `- Estimated Tokens: ${analysisSummary.totalEstimatedTokens}`,
            `- Sensitive Findings: ${analysisSummary.securityFindingCount}`,
        ].join('\n')
    );

    if (options.includeFiles) {
        sections.push(
            `# Files\n\n${data.fileContents.map(file => `## File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``).join('\n\n')}`
        );
    }

    if (securityWarnings.length > 0) {
        sections.push(
            `# Security Warnings\n${securityWarnings.map(finding => `- [${finding.severity}] ${finding.filePath}: ${finding.message}`).join('\n')}`
        );
    }

    if (options.instruction.trim()) {
        sections.push(`# Instruction\n${options.instruction.trim()}`);
    }

    return `${sections.join('\n\n')}\n`;
}

function renderXml(data: ProcessedFiles, options: ExportOptions): string {
    const directoryString = buildDirectoryString(data);
    const analysisSummary = buildAnalysisSummary(data);
    const securityWarnings = buildSecurityWarnings(data);
    const parts: string[] = [];

    if (options.includeFileSummary) {
        parts.push(
            `<file_summary>\n<purpose>${escapeXml(SUMMARY_PURPOSE)}</purpose>\n<file_format>${escapeXml(SUMMARY_FILE_FORMAT_PLAIN)}</file_format>\n<usage_guidelines>${escapeXml(SUMMARY_USAGE_GUIDELINES)}</usage_guidelines>\n<notes>${escapeXml(buildNotes(data))}</notes>\n</file_summary>`
        );
    }

    if (options.userProvidedHeader.trim()) {
        parts.push(`<user_provided_header>${escapeXml(options.userProvidedHeader.trim())}</user_provided_header>`);
    }

    if (options.includeDirectoryStructure) {
        parts.push(`<directory_structure>${escapeXml(directoryString)}</directory_structure>`);
    }

    parts.push(
        `<repository_analysis><files>${data.fileContents.length}</files><lines>${data.fileContents.reduce((sum, file) => sum + file.stats.lines, 0)}</lines><characters>${data.fileContents.reduce((sum, file) => sum + file.stats.chars, 0)}</characters><estimated_tokens>${analysisSummary.totalEstimatedTokens}</estimated_tokens><sensitive_findings>${analysisSummary.securityFindingCount}</sensitive_findings></repository_analysis>`
    );

    if (options.includeFiles) {
        parts.push(`<files>\n${data.fileContents.map(file => `<file path="${escapeXml(file.path)}">${escapeXml(file.content)}</file>`).join('\n')}\n</files>`);
    }

    if (securityWarnings.length > 0) {
        parts.push(`<security_warnings>\n${securityWarnings.map(finding => `<warning severity="${escapeXml(finding.severity)}" path="${escapeXml(finding.filePath)}">${escapeXml(finding.message)}</warning>`).join('\n')}\n</security_warnings>`);
    }

    if (options.instruction.trim()) {
        parts.push(`<instruction>${escapeXml(options.instruction.trim())}</instruction>`);
    }

    return parts.join('\n\n');
}

function renderJson(data: ProcessedFiles, options: ExportOptions): string {
    const analysisSummary = buildAnalysisSummary(data);
    const securityWarnings = buildSecurityWarnings(data);
    return JSON.stringify(
        {
            ...(options.includeFileSummary && {
                fileSummary: {
                    generationHeader: 'This file is a merged representation of the entire codebase, combined into a single document by Repomix.',
                    purpose: SUMMARY_PURPOSE,
                    fileFormat: SUMMARY_FILE_FORMAT_JSON,
                    usageGuidelines: SUMMARY_USAGE_GUIDELINES,
                    notes: buildNotes(data),
                },
            }),
            ...(options.userProvidedHeader.trim() && {
                userProvidedHeader: options.userProvidedHeader.trim(),
            }),
            ...(options.includeDirectoryStructure && {
                directoryStructure: buildDirectoryString(data),
            }),
            analysis: {
                fileCount: data.fileContents.length,
                totalLines: data.fileContents.reduce((sum, file) => sum + file.stats.lines, 0),
                totalChars: data.fileContents.reduce((sum, file) => sum + file.stats.chars, 0),
                estimatedTokens: analysisSummary.totalEstimatedTokens,
                securityFindingCount: analysisSummary.securityFindingCount,
            },
            ...(options.includeFiles && {
                files: Object.fromEntries(data.fileContents.map(file => [file.path, file.content])),
            }),
            ...(securityWarnings.length > 0 && {
                securityWarnings: securityWarnings.map(finding => ({
                    severity: finding.severity,
                    filePath: finding.filePath,
                    message: finding.message,
                })),
            }),
            ...(options.instruction.trim() && {
                instruction: options.instruction.trim(),
            }),
        },
        null,
        2
    );
}

export async function buildExportOutput(params: BuildExportOutputParams): Promise<string> {
    const includePatterns = parsePatternList(params.exportOptions.includePatterns);
    const ignorePatterns = parsePatternList(params.exportOptions.ignorePatterns);

    const exportTask = createFileProcessingTask({
        files: params.rawFiles,
        onProgress: params.progressCallback,
        extractContent: params.extractContent,
        maxCharsThreshold: params.maxCharsThreshold,
        options: {
            useDefaultIgnorePatterns: params.exportOptions.useDefaultPatterns,
            useGitignorePatterns: params.exportOptions.useGitignore,
            includePatterns,
            ignorePatterns,
            includeEmptyDirectories: params.exportOptions.includeEmptyDirectories,
            emptyDirectoryPaths: params.emptyDirectoryPaths,
        },
    });

    const exportData = await exportTask.promise;

    const normalizedData = normalizeExportPaths(exportData);
    const mergedData = applyManualState(normalizedData, params.currentData);
    mergedData.fileContents = mergedData.fileContents.map(file => normalizeFile(file, params.exportOptions));
    const recomputed = summarizeAnalysis(mergedData.fileContents);
    mergedData.analysisSummary = recomputed.analysisSummary;
    mergedData.securityFindings = recomputed.securityFindings;

    switch (params.exportOptions.format) {
        case 'plain':
            return generateRepomixPlainOutput(mergedData, params.exportOptions);
        case 'xml':
            return renderXml(mergedData, params.exportOptions);
        case 'markdown':
            return renderMarkdown(mergedData, params.exportOptions);
        case 'json':
            return renderJson(mergedData, params.exportOptions);
        default:
            return generateRepomixPlainOutput(mergedData, params.exportOptions);
    }
}
