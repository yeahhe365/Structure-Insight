import { FileNode, FileContent, ProcessedFiles } from '../types';
import { TranslationKey } from '../hooks/useLocalization';

const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico', '.webp',
  '.mp3', '.wav', '.ogg', '.mp4', '.mov', '.avi', '.webm',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.exe', '.dll', '.so', '.o', '.a', '.obj',
  '.class', '.jar', '.pyc', '.pyd',
  '.DS_Store',
  '.eot', '.ttf', '.woff', '.woff2',
]);

const IGNORED_DIRS = new Set(['.git', 'node_modules', '__pycache__', '.vscode', '.idea', 'dist', 'build', 'out', 'target']);

function getLanguage(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const langMap: { [key: string]: string } = {
        'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
        'py': 'python', 'html': 'xml', 'xml': 'xml', 'css': 'css', 'scss': 'css', 'less': 'css',
        'json': 'json', 'md': 'markdown', 'yml': 'yaml', 'yaml': 'yaml', 'sh': 'bash',
        'java': 'java', 'c': 'c', 'h': 'c', 'cpp': 'cpp', 'hpp': 'cpp', 'cs': 'csharp', 'go': 'go', 'php': 'php',
        'rb': 'ruby', 'rs': 'rust', 'sql': 'sql', 'swift': 'swift', 'kt': 'kotlin', 'kts': 'kotlin',
        'dockerfile': 'dockerfile', 'gradle': 'groovy', 'vue': 'html', 'svelte': 'html',
        'log': 'plaintext', 'txt': 'plaintext', 'env': 'properties', 'ini': 'ini',
    };
    return langMap[extension] || 'plaintext';
}

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function buildASCIITree(treeData: FileNode[], rootName: string): string {
    let structure = `${rootName}\n`;
    const generateLines = (nodes: FileNode[], prefix: string) => {
        nodes.forEach((node, index) => {
            const isLast = index === nodes.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            let displayName = node.name;
            if (node.status === 'skipped') {
                displayName += " (skipped)";
            } else if (node.status === 'error') {
                displayName += " (error)";
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
    const jszip = (window as any).JSZip;
    if (!jszip) {
        console.error("JSZip library not found. Make sure it's loaded before processing zip files.");
        throw new Error("JSZip is not defined");
    }
    const zip = await jszip.loadAsync(zipFile);
    const files: File[] = [];
    const zipRoot = zipFile.name.replace(/\.zip$/i, '');

    const promises = Object.values(zip.files).map(async (entry: any) => {
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
    return files;
}

export async function processDroppedItems(items: DataTransferItemList, onProgress: (msg: string) => void, signal: AbortSignal): Promise<File[]> {
    const allFiles: File[] = [];
    const entries: FileSystemEntry[] = [];
    
    for (const item of Array.from(items)) {
        if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry();
            if (entry) {
                entries.push(entry);
            }
        }
    }

    const readEntries = async (entry: FileSystemEntry): Promise<File[]> => {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        if (entry.isFile) {
            return new Promise((resolve, reject) => {
                (entry as FileSystemFileEntry).file(file => {
                    if(!(file as any).webkitRelativePath){
                         Object.defineProperty(file, 'webkitRelativePath', {
                            value: entry.fullPath.startsWith('/') ? entry.fullPath.substring(1) : entry.fullPath,
                            writable: true,
                        });
                    }
                    resolve([file])
                }, err => reject(err));
            });
        }
        if (entry.isDirectory) {
            const dirName = entry.name;
            if(IGNORED_DIRS.has(dirName)) return [];

            const dirReader = (entry as FileSystemDirectoryEntry).createReader();
            const allDirFiles: File[] = [];
            
            return new Promise((resolve, reject) => {
                const readBatch = () => {
                    dirReader.readEntries(async (batch) => {
                         if (signal.aborted) {
                             reject(new DOMException('Aborted', 'AbortError'));
                             return;
                         }
                        if (batch.length === 0) {
                            resolve(allDirFiles);
                            return;
                        }
                        try {
                            const batchFiles = await Promise.all(batch.map(readEntries));
                            allDirFiles.push(...batchFiles.flat());
                            readBatch();
                        } catch(error) {
                            reject(error);
                        }
                    }, err => reject(err));
                };
                readBatch();
            });
        }
        return [];
    };

    const filesFromEntries = await Promise.all(entries.map(readEntries));
    allFiles.push(...filesFromEntries.flat());

    const finalFiles: File[] = [];
    for(const file of allFiles) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        if(file.name.toLowerCase().endsWith('.zip')) {
            onProgress(`Unzipping ${file.name}...`);
            const unzipped = await handleZipFile(file);
            finalFiles.push(...unzipped);
        } else {
            finalFiles.push(file);
        }
    }

    return finalFiles;
}

export async function processFiles(
    files: File[], 
    onProgress: (key: TranslationKey, options?: { [key: string]: string | number }) => void, 
    extractContent: boolean, 
    signal: AbortSignal
): Promise<ProcessedFiles> {
    const fileContents: FileContent[] = [];
    const nodeMap = new Map<string, FileNode>();
    const roots: FileNode[] = [];

    const validFiles = files.filter(file => {
        const path = (file as any).webkitRelativePath || file.name;
        return path && !path.split('/').some(part => IGNORED_DIRS.has(part) || part.startsWith('.'));
    });

    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    
    let processedCount = 0;
    const totalFiles = validFiles.length;

    for (const file of validFiles) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        
        processedCount++;
        onProgress('processing_file_progress', { current: processedCount, total: totalFiles, fileName: file.name });

        const path = (file as any).webkitRelativePath || file.name;
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
                parentNode.children.sort((a, b) => {
                    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
                    return a.name.localeCompare(b.name);
                });
            } else {
                roots.push(newNode);
                roots.sort((a, b) => {
                    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
                    return a.name.localeCompare(b.name);
                });
            }
            parentNode = newNode;
        }

        const fileNode = nodeMap.get(path);
        if (!fileNode) continue;
        
        const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        const isIgnored = IGNORED_EXTENSIONS.has(extension);
        const isTooLarge = file.size > 5 * 1024 * 1024; // 5MB limit

        if (!extractContent || isIgnored || isTooLarge) {
            fileNode.status = 'skipped';
        } else {
            try {
                const content = await readFileContent(file);
                fileContents.push({
                    path: path,
                    content: content,
                    language: getLanguage(file.name),
                    stats: { lines: content.split('\n').length, chars: content.length }
                });
                fileNode.status = 'processed';
            } catch (e) {
                fileNode.status = 'error';
                console.warn(`Could not read file as text: ${file.name}`);
            }
        }
    }

    fileContents.sort((a,b) => a.path.localeCompare(b.path));
    onProgress("finalizing_output");
    
    let rootNameForDisplay = "Project";
    if (roots.length === 1 && roots[0].isDirectory) {
        rootNameForDisplay = roots[0].name;
    }
    const structureString = buildASCIITree(roots, rootNameForDisplay);

    return {
        treeData: roots,
        fileContents,
        structureString,
    };
}


export function generateFullOutput(structureString: string, fileContents: FileContent[]): string {
    let output = "File Structure:\n";
    output += structureString;
    
    if (fileContents.length > 0) {
        output += "\n\nFile Contents:\n";

        for (const file of fileContents) {
            output += "========================================\n";
            output += `File: ${file.path}\n`;
            output += "----------------------------------------\n";
            output += `${file.content}\n\n`;
        }
    } else if (structureString !== `${structureString.split('\n')[0]}\n`) { // check if there is more than just the root
        output += "\n\n(File content not extracted)";
    }

    return output;
}