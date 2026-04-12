
import JSZip from 'jszip';
import ignore from 'ignore';
import { minimatch } from 'minimatch';
import { FileNode, FileContent, ProcessedFiles } from '../types';
import { summarizeAnalysis } from './analysisSummary';
import { IGNORED_EXTENSIONS, IGNORED_DIRS, LANG_MAP, FILE_PROCESS_BATCH_SIZE } from './constants';
import { generateRepomixPlainOutput } from './repomixPlainOutput';
import { scanSensitiveContent } from './securityScan';
import { estimateTokens } from './tokenEstimate';

const IGNORE_FILE_NAMES = new Set(['.gitignore', '.ignore']);

interface IgnoreMatcher {
    basePath: string;
    matcher: ReturnType<typeof ignore>;
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

export interface DroppedItemsResult {
    files: File[];
    emptyDirectoryPaths: string[];
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

        matchers.push({
            basePath: parts.slice(0, -1).join('/'),
            matcher: ignore().add(patterns),
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

export function buildASCIITree(treeData: FileNode[], rootName: string, showStats: boolean = false): string {
    let structure = `${rootName}\n`;
    const generateLines = (nodes: FileNode[], prefix: string) => {
        nodes.forEach((node, index) => {
            const isLast = index === nodes.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            let displayName = node.name;
            
            if (node.excluded) {
                displayName += " (已排除)";
            } else if (node.status === 'error') {
                displayName += " (错误)";
            } else if (showStats && !node.isDirectory && node.status === 'processed' && typeof node.chars === 'number') {
                displayName += ` (${node.chars} 字符)`;
            } else if (node.status === 'skipped' && !node.isDirectory) {
                displayName += " (已跳过)";
            }

            structure += `${prefix}${connector}${displayName}\n`;
            if (node.isDirectory && node.children.length > 0) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                generateLines(node.children, newPrefix);
            }
        });
    };

    // If we passed a specific root name (likely from a single root dir), generate lines for its children.
    // Otherwise, if rootName is generic ("Project"), generate lines for all top-level items.
    if (treeData.length === 1 && treeData[0].isDirectory && treeData[0].name === rootName) {
        generateLines(treeData[0].children, '');
    } else {
        generateLines(treeData, '');
    }
    return structure;
}

async function handleZipFile(zipFile: File): Promise<File[]> {
    const zip = await JSZip.loadAsync(zipFile);
    const files: File[] = [];
    const zipRoot = zipFile.name.replace(/\.zip$/i, '');
    const directoryCandidates = new Set<string>();

    const promises = Object.values(zip.files).map(async (entry: any) => {
        if (entry.dir) {
            const normalized = entry.name.replace(/\/$/, '');
            if (normalized) {
                directoryCandidates.add(`${zipRoot}/${normalized}`);
            }
            return;
        }
        if (!entry.dir) {
            const blob = await entry.async('blob');
            const file = new File([blob], entry.name, { type: blob.type, lastModified: entry.date.getTime() });
            Object.defineProperty(file, 'webkitRelativePath', {
                value: `${zipRoot}/${entry.name}`,
                writable: true,
            });
            files.push(file);
        }
    });

    await Promise.all(promises);
    const filePathSet = new Set(files.map(file => getFilePath(file)));
    const emptyDirectoryPaths = [...directoryCandidates].filter(dirPath => {
        const prefix = `${dirPath}/`;
        return ![...filePathSet].some(filePath => filePath.startsWith(prefix));
    });

    return files;
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
                // Fallback for single files (e.g. a zip file) dropped from desktop
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
                    if(!file.webkitRelativePath){
                         Object.defineProperty(file, 'webkitRelativePath', {
                            value: entry.fullPath.startsWith('/') ? entry.fullPath.substring(1) : entry.fullPath,
                            writable: true,
                        });
                    }
                    resolve({ files: [file], emptyDirectoryPaths: [] })
                }, err => reject(err));
            });
        }
        if (entry.isDirectory) {
            const dirName = entry.name;
            if(IGNORED_DIRS.has(dirName)) return { files: [], emptyDirectoryPaths: [] };

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
                        } catch(error) {
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

    // Unzipping logic has been moved to processFiles.
    // This function now just returns all discovered files, including zips.
    return {
        files: allFiles,
        emptyDirectoryPaths,
    };
}

function getPathVariants(path: string): string[] {
    const normalized = path.replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);

    if (parts.length <= 1) {
        return [normalized];
    }

    return [normalized, parts.slice(1).join('/')];
}

function matchesPatterns(path: string, patterns: string[]): boolean {
    const variants = getPathVariants(path);
    return patterns.some(pattern => variants.some(variant => minimatch(variant, pattern, { dot: true })));
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

function filterDirectoryPaths(directoryPaths: string[], options: ProcessFilesOptions, rootGitignoreMatchers: IgnoreMatcher[]): string[] {
    const useDefaultIgnorePatterns = options.useDefaultIgnorePatterns ?? true;
    const useGitignorePatterns = options.useGitignorePatterns ?? true;
    const includePatterns = options.includePatterns ?? [];
    const ignorePatterns = options.ignorePatterns ?? [];

    return directoryPaths.filter(path => {
        const defaultIgnored = useDefaultIgnorePatterns && path.split('/').some(part => IGNORED_DIRS.has(part));
        const gitignored = useGitignorePatterns && isIgnoredByGitignore(path, rootGitignoreMatchers, true);
        const includeMismatch = includePatterns.length > 0 && !matchesPatterns(path, includePatterns);
        const ignoreMatched = ignorePatterns.length > 0 && matchesPatterns(path, ignorePatterns);

        return !defaultIgnored && !gitignored && !includeMismatch && !ignoreMatched;
    });
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
    if (files.some(f => f.name.toLowerCase().endsWith('.zip'))) {
        onProgress("正在检查压缩文件...");
    }
    for (const file of files) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        if (file.name.toLowerCase().endsWith('.zip')) {
            onProgress(`正在解压 ${file.name}...`);
            try {
                const unzipped = await handleZipFile(file);
                allNonZipFiles.push(...unzipped);
            } catch (err) {
                console.error(`Error unzipping file ${file.name}:`, err);
                // We could create an error node for the zip file, but for now we'll just log and skip.
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

    const validFiles = allNonZipFiles.filter(file => {
        const path = getFilePath(file);
        const defaultIgnored = useDefaultIgnorePatterns && path.split('/').some(part => IGNORED_DIRS.has(part));
        const gitignored = useGitignorePatterns && isIgnoredByGitignore(path, rootGitignoreMatchers);
        const includeMismatch = includePatterns.length > 0 && !matchesPatterns(path, includePatterns);
        const ignoreMatched = ignorePatterns.length > 0 && matchesPatterns(path, ignorePatterns);

        return path &&
            !defaultIgnored &&
            !gitignored &&
            !includeMismatch &&
            !ignoreMatched;
    });

    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    
    let processedCount = 0;
    const totalFiles = validFiles.length;
    const BATCH_SIZE = FILE_PROCESS_BATCH_SIZE;

    for (const file of validFiles) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

        processedCount++;
        onProgress(`正在处理文件 ${processedCount}/${totalFiles}: ${file.name}`);

        // Yield to UI thread every BATCH_SIZE files
        if (processedCount % BATCH_SIZE === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
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
        // Skip reading very large binary files based on byte size (rough heuristic)
        const isLikelyTooLarge = file.size > maxCharsThreshold * 3;

        if (!extractContent || isIgnored) {
            fileNode.status = 'skipped';
            fileNode.chars = file.size;
        } else if (isLikelyTooLarge) {
            // For files with very large byte size, read content and check actual char count
            try {
                const content = await readFileContent(file);
                if (content.length > maxCharsThreshold) {
                    fileNode.status = 'skipped';
                    fileNode.chars = content.length;
                } else {
                    const lineCount = content.split('\n').length;
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
                const content = await readFileContent(file);
                const lineCount = content.split('\n').length;
                if (content.length > maxCharsThreshold) {
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

    fileContents.sort((a,b) => a.path.localeCompare(b.path));

    // Sort tree once at the end instead of on every insertion
    const sortNodes = (nodes: FileNode[]): FileNode[] => {
        nodes.sort((a, b) => {
            if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        for (const node of nodes) {
            if (node.isDirectory) sortNodes(node.children);
        }
        return nodes;
    };
    sortNodes(roots);

    onProgress("正在完成输出...");
    
    let rootNameForDisplay = "项目";
    if (roots.length === 1 && roots[0].isDirectory) {
        rootNameForDisplay = roots[0].name;
    }

    const filteredEmptyDirectoryPaths = options.includeEmptyDirectories
        ? filterDirectoryPaths(options.emptyDirectoryPaths ?? [], options, rootGitignoreMatchers)
        : [];

    for (const emptyDirPath of filteredEmptyDirectoryPaths) {
        ensureDirectoryPath(emptyDirPath, nodeMap, roots);
    }

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
