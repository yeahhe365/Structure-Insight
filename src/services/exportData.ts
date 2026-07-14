import type { AnalysisSummary, FileContent, FileNode, ProcessedFiles } from '../types';
import { summarizeAnalysis } from './analysisSummary';
import { createFileProcessingTask } from './fileProcessingClient';
import type { BuildExportOutputParams, ExportOptions } from './exportTypes';
import { parsePatternList } from './patternList';
import { scanSensitiveContent } from './securityScan';
import { estimateTokens } from './tokenEstimate';
import { countLines } from './textMetrics';
import { compareFilePaths, sortTreeNodes } from './treeSort';

interface PreparedExportData {
  data: ProcessedFiles;
  analysisSummary: AnalysisSummary;
}

function applyBase64Truncation(content: string): string {
  return content.replace(/data:[^"'\s]+;base64,[A-Za-z0-9+/=]{16,}/g, 'data:[TRUNCATED_BASE64_DATA]');
}

function applyEmptyLineRemoval(content: string): string {
  const lines = content.split('\n');
  const filtered = lines.filter((line) => line.trim().length > 0);
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

function buildTree(
  files: FileContent[],
  emptyDirectoryPaths: string[],
  preferredRootName?: string
): { rootName: string; treeData: FileNode[] } {
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

/**
 * processFiles stores paths with the project root segment (e.g. `demo/.env`).
 * Export rebuild strips that root so packed output uses repo-relative paths (`.env`).
 * Manual UI state (exclude / delete / edits) still carries the original paths, so
 * matching must strip the same root prefix before comparing.
 */
function stripRootPrefix(path: string, rootName: string): string {
  if (!rootName) {
    return path;
  }

  const prefix = `${rootName}/`;
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

function applyManualState(exportData: ProcessedFiles, currentData: ProcessedFiles): ProcessedFiles {
  const rootName = currentData.rootName || exportData.rootName;
  const currentByPath = new Map(
    currentData.fileContents.map((file) => {
      const path = stripRootPrefix(file.path, rootName);
      return [path, { ...file, path }] as const;
    })
  );
  const removedPaths = new Set((currentData.removedPaths ?? []).map((path) => stripRootPrefix(path, rootName)));

  const mergedFiles = exportData.fileContents
    .filter((file) => !removedPaths.has(file.path))
    .map((file) => {
      const current = currentByPath.get(file.path);
      if (!current) {
        return file;
      }
      // Keep the export-normalized path; never reintroduce the root prefix from UI state.
      return { ...file, ...current, path: file.path };
    });
  mergedFiles.sort((a, b) => compareFilePaths(a.path, b.path));

  const visibleFiles = mergedFiles.filter((file) => !file.excluded);
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
  return {
    ...data,
    fileContents: data.fileContents.map((file) => ({
      ...file,
      path: stripRootPrefix(file.path, data.rootName),
    })),
    emptyDirectoryPaths: (data.emptyDirectoryPaths ?? []).map((path) => stripRootPrefix(path, data.rootName)),
  };
}

export async function prepareExportData(params: BuildExportOutputParams): Promise<PreparedExportData> {
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

  mergedData.fileContents = mergedData.fileContents.map((file) => normalizeFile(file, params.exportOptions));

  const recomputed = summarizeAnalysis(mergedData.fileContents);
  mergedData.analysisSummary = recomputed.analysisSummary;
  mergedData.securityFindings = recomputed.securityFindings;

  return {
    data: mergedData,
    analysisSummary: recomputed.analysisSummary,
  };
}
