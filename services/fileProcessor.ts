import { FileNode, FileContent, ProcessedFiles } from '../types';
import { summarizeAnalysis } from './analysisSummary';
import { MAIN_THREAD_YIELD_INTERVAL_MS, IGNORED_EXTENSIONS, IGNORED_DIRS, LANG_MAP, FILE_PROCESS_BATCH_SIZE } from './constants';
import { generateRepomixPlainOutput } from './repomixPlainOutput';
import { scanSensitiveContent } from './securityScan';
import { estimateTokens } from './tokenEstimate';
import { yieldToMainThread, getCurrentTimeMs } from './scheduler';
import { countLines } from './textMetrics';
import { buildASCIITree } from './treeFormatter';
import { compareFilePaths, sortTreeNodes } from './treeSort';

const IGNORE_FILE_NAMES = new Set(['.gitignore', '.ignore']);

interface IgnoreMatcher {
    basePath: string;
    matcher: {
        test(path: string): {
            ignored: boolean;
            unignored: boolean;
        };
    };
}

function getLanguage(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return LANG_MAP[extension] || 'plaintext';
}

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function readTextFileWithMetrics(file: File): Promise<ReadTextFileResult> {
    const content = await readFileContent(file);
    return {
        content,
        lineCount: countLines(content),
    };
}

interface ReadTextFileResult {
    content: string;
    lineCount: number;
}

export interface ProcessFilesOptions {
    useDefaultIgnorePatterns?: boolean;
    useGitignorePatterns?: boolean;
    includePatterns?: string[];
    ignorePatterns?: string[];
    includeEmptyDirectories?: boolean;
    emptyDirectoryPaths?: string[];
}

function getFilePath(file: File): string {
    return (file.webkitRelativePath || file.name).replace(/\\/g, '/');
}

function parseGitignorePatterns(content: string): string[] {
    return content
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));
}

async function buildRootGitignoreMatchers(files: File[]): Promise<IgnoreMatcher[]> {
    const matchers: IgnoreMatcher[] = [];
    let createIgnoreMatcher: ((patterns: string[]) => IgnoreMatcher['matcher']) | null = null;

    for (const file of files) {
        const path = getFilePath(file);
        const parts = path.split('/').filter(Boolean);
        const fileName = parts[parts.length - 1];

        if (!fileName || !IGNORE_FILE_NAMES.has(fileName)) {
            continue;
        }

        const patterns = parseGitignorePatterns(await readFileContent(file));
        if (patterns.length === 0) {
            continue;
        }

        if (!createIgnoreMatcher) {
            ({ createIgnoreMatcher } = await import('./gitignoreMatcher'));
        }

        matchers.push({
            basePath: parts.slice(0, -1).join('/'),
            matcher: createIgnoreMatcher(patterns),
        });
    }

    matchers.sort((a, b) => a.basePath.split('/').filter(Boolean).length - b.basePath.split('/').filter(Boolean).length);
    return matchers;
}

function isPathWithinBase(basePath: string, path: string): boolean {
    if (!basePath) {
        return true;
    }

    return path === basePath || path.startsWith(`${basePath}/`);
}

function relativeToBase(path: string, basePath: string, isDirectory: boolean): string {
    const relative = basePath ? path.slice(basePath.length + 1) : path;
    if (!relative) {
        return relative;
    }

    return isDirectory && !relative.endsWith('/') ? `${relative}/` : relative;
}

function isIgnoredByGitignore(path: string, matchers: IgnoreMatcher[], isDirectory = false): boolean {
    if (path.split('/').filter(Boolean).length < 2) {
        return false;
    }

    let ignored = false;

    for (const matcher of matchers) {
        if (!isPathWithinBase(matcher.basePath, path)) {
            continue;
        }

        const relativePath = relativeToBase(path, matcher.basePath, isDirectory);
        if (!relativePath) {
            continue;
        }

        const result = matcher.matcher.test(relativePath);
        if (result.ignored) {
            ignored = true;
        }
        if (result.unignored) {
            ignored = false;
        }
    }

    return ignored;
}

function getPathVariants(path: string): string[] {
    const normalized = path.replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);

    if (parts.length <= 1) {
        return [normalized];
    }

    return [normalized, parts.slice(1).join('/')];
}

async function matchesPatterns(path: string, patterns: string[]): Promise<boolean> {
    const variants = getPathVariants(path);
    const { matchesGlobPatterns } = await import('./pathPatternMatcher');
    for (const variant of variants) {
        if (await matchesGlobPatterns(variant, patterns)) {
            return true;
        }
    }
    return false;
}

function ensureDirectoryPath(path: string, nodeMap: Map<string, FileNode>, roots: FileNode[]): void {
    const parts = path.split('/').filter(Boolean);
    let parentNode: FileNode | undefined;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const currentPath = parts.slice(0, i + 1).join('/');

        if (nodeMap.has(currentPath)) {
            parentNode = nodeMap.get(currentPath);
            continue;
        }

        const newNode: FileNode = {
            name: part,
            path: currentPath,
            isDirectory: true,
            children: [],
        };
        nodeMap.set(currentPath, newNode);

        if (parentNode) {
            parentNode.children.push(newNode);
        } else {
            roots.push(newNode);
        }
        parentNode = newNode;
    }
}

async function filterDirectoryPaths(directoryPaths: string[], options: ProcessFilesOptions, rootGitignoreMatchers: IgnoreMatcher[]): Promise<string[]> {
    const useDefaultIgnorePatterns = options.useDefaultIgnorePatterns ?? true;
    const useGitignorePatterns = options.useGitignorePatterns ?? true;
    const includePatterns = options.includePatterns ?? [];
    const ignorePatterns = options.ignorePatterns ?? [];

    const results = await Promise.all(directoryPaths.map(async path => {
        const defaultIgnored = useDefaultIgnorePatterns && path.split('/').some(part => IGNORED_DIRS.has(part));
        const gitignored = useGitignorePatterns && isIgnoredByGitignore(path, rootGitignoreMatchers, true);
        const includeMismatch = includePatterns.length > 0 && !await matchesPatterns(path, includePatterns);
        const ignoreMatched = ignorePatterns.length > 0 && await matchesPatterns(path, ignorePatterns);

        return !defaultIgnored && !gitignored && !includeMismatch && !ignoreMatched ? path : null;
    }));

    return results.filter((path): path is string => path !== null);
}

export async function processFiles(
    files: File[],
    onProgress: (msg: string) => void,
    extractContent: boolean,
    maxCharsThreshold: number,
    signal: AbortSignal,
    options: ProcessFilesOptions = {}
): Promise<ProcessedFiles> {
    const fileContents: FileContent[] = [];
    const nodeMap = new Map<string, FileNode>();
    const roots: FileNode[] = [];

    // --- Start Unzipping logic ---
    const allNonZipFiles: File[] = [];
    const zipEmptyDirectoryPaths: string[] = [];
    if (files.some(f => f.name.toLowerCase().endsWith('.zip'))) {
        onProgress("正在检查压缩文件...");
    }
    for (const file of files) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        if (file.name.toLowerCase().endsWith('.zip')) {
            onProgress(`正在解压 ${file.name}...`);
            try {
                const { processZipFile } = await import('./zipProcessor');
                const unzipped = await processZipFile(file);
                allNonZipFiles.push(...unzipped.files);
                zipEmptyDirectoryPaths.push(...unzipped.emptyDirectoryPaths);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                throw new Error(`Failed to unzip ${file.name}: ${message}`);
            }
        } else {
            allNonZipFiles.push(file);
        }
    }
    // --- End Unzipping logic ---

    const rootGitignoreMatchers = await buildRootGitignoreMatchers(allNonZipFiles);
    const useDefaultIgnorePatterns = options.useDefaultIgnorePatterns ?? true;
    const useGitignorePatterns = options.useGitignorePatterns ?? true;
    const includePatterns = options.includePatterns ?? [];
    const ignorePatterns = options.ignorePatterns ?? [];

    const validFilesWithDecision = await Promise.all(allNonZipFiles.map(async file => {
        const path = getFilePath(file);
        const defaultIgnored = useDefaultIgnorePatterns && path.split('/').some(part => IGNORED_DIRS.has(part));
        const gitignored = useGitignorePatterns && isIgnoredByGitignore(path, rootGitignoreMatchers);
        const includeMismatch = includePatterns.length > 0 && !await matchesPatterns(path, includePatterns);
        const ignoreMatched = ignorePatterns.length > 0 && await matchesPatterns(path, ignorePatterns);

        return path &&
            !defaultIgnored &&
            !gitignored &&
            !includeMismatch &&
            !ignoreMatched
            ? file
            : null;
    }));

    const validFiles = validFilesWithDecision.filter((file): file is File => file !== null);

    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    
    let processedCount = 0;
    const totalFiles = validFiles.length;
    const BATCH_SIZE = FILE_PROCESS_BATCH_SIZE;
    let lastYieldAt = getCurrentTimeMs();

    for (const file of validFiles) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

        processedCount++;
        onProgress(`正在处理文件 ${processedCount}/${totalFiles}: ${file.name}`);

        if (processedCount % BATCH_SIZE === 0 || getCurrentTimeMs() - lastYieldAt >= MAIN_THREAD_YIELD_INTERVAL_MS) {
            await yieldToMainThread();
            lastYieldAt = getCurrentTimeMs();
        }

        const path = getFilePath(file);
        const parts = path.split('/').filter(p => p);

        let parentNode: FileNode | undefined = undefined;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const currentPath = parts.slice(0, i + 1).join('/');
            
            if (nodeMap.has(currentPath)) {
                parentNode = nodeMap.get(currentPath);
                continue;
            }
            
            const isDir = i < parts.length - 1;
            const newNode: FileNode = {
                name: part,
                path: currentPath,
                isDirectory: isDir,
                children: [],
            };
            nodeMap.set(currentPath, newNode);

            if (parentNode) {
                parentNode.children.push(newNode);
            } else {
                roots.push(newNode);
            }
            parentNode = newNode;
        }

        const fileNode = nodeMap.get(path);
        if (!fileNode) continue;
        
        const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const isIgnored = IGNORED_EXTENSIONS.has(extension);
        const hasCharLimit = maxCharsThreshold > 0;
        // Skip reading very large binary files based on byte size (rough heuristic)
        const isLikelyTooLarge = hasCharLimit && file.size > maxCharsThreshold * 3;

        if (!extractContent || isIgnored) {
            fileNode.status = 'skipped';
            fileNode.chars = file.size;
        } else if (isLikelyTooLarge) {
            try {
                const { content, lineCount } = await readTextFileWithMetrics(file);
                if (hasCharLimit && content.length > maxCharsThreshold) {
                    fileNode.status = 'skipped';
                    fileNode.chars = content.length;
                } else {
                    fileContents.push({
                        path: path,
                        content: content,
                        originalContent: content,
                        language: getLanguage(file.name),
                        stats: {
                            lines: lineCount,
                            chars: content.length,
                            estimatedTokens: estimateTokens(content),
                        },
                        securityFindings: scanSensitiveContent(path, content),
                    });
                    fileNode.status = 'processed';
                    fileNode.lines = lineCount;
                    fileNode.chars = content.length;
                }
            } catch (e) {
                fileNode.status = 'error';
                console.warn(`Could not read file as text: ${file.name}`);
            }
        } else {
            try {
                const { content, lineCount } = await readTextFileWithMetrics(file);
                if (hasCharLimit && content.length > maxCharsThreshold) {
                    fileNode.status = 'skipped';
                    fileNode.chars = content.length;
                } else {
                    fileContents.push({
                        path: path,
                        content: content,
                        originalContent: content,
                        language: getLanguage(file.name),
                        stats: {
                            lines: lineCount,
                            chars: content.length,
                            estimatedTokens: estimateTokens(content),
                        },
                        securityFindings: scanSensitiveContent(path, content),
                    });
                    fileNode.status = 'processed';
                    fileNode.lines = lineCount;
                    fileNode.chars = content.length;
                }
            } catch (e) {
                fileNode.status = 'error';
                console.warn(`Could not read file as text: ${file.name}`);
            }
        }
    }

    fileContents.sort((a, b) => compareFilePaths(a.path, b.path));

    onProgress("正在完成输出...");
    
    let rootNameForDisplay = "项目";
    if (roots.length === 1 && roots[0].isDirectory) {
        rootNameForDisplay = roots[0].name;
    }

    const mergedEmptyDirectoryPaths = Array.from(new Set([
        ...(options.emptyDirectoryPaths ?? []),
        ...zipEmptyDirectoryPaths,
    ]));

    const filteredEmptyDirectoryPaths = options.includeEmptyDirectories
        ? await filterDirectoryPaths(mergedEmptyDirectoryPaths, options, rootGitignoreMatchers)
        : [];

    for (const emptyDirPath of filteredEmptyDirectoryPaths) {
        ensureDirectoryPath(emptyDirPath, nodeMap, roots);
    }

    sortTreeNodes(roots);

    const structureString = buildASCIITree(roots, rootNameForDisplay);

    const { analysisSummary, securityFindings } = summarizeAnalysis(fileContents);

    return {
        treeData: roots,
        fileContents,
        structureString,
        rootName: rootNameForDisplay,
        emptyDirectoryPaths: filteredEmptyDirectoryPaths,
        removedPaths: [],
        analysisSummary,
        securityFindings,
        exportMetadata: {
            usesDefaultIgnorePatterns: useDefaultIgnorePatterns,
            usesGitignorePatterns: useGitignorePatterns && rootGitignoreMatchers.length > 0,
            sortsByGitChangeCount: false,
        },
    };
}


export function generateFullOutput(structureString: string, fileContents: FileContent[]): string {
    return generateRepomixPlainOutput(
        {
            rootName: structureString.split('\n')[0] || 'Project',
            structureString,
            treeData: [],
            fileContents,
        },
        {
            includeFileSummary: true,
            includeDirectoryStructure: true,
            includeFiles: true,
        }
    );
}
