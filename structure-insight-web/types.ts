
export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileNode[];
  status?: 'processed' | 'skipped' | 'error';
  lines?: number;
  chars?: number;
}

export interface FileContent {
  path: string;
  content: string;
  language: string;
  stats: {
    lines: number;
    chars: number;
  }
}

export interface ProcessedFiles {
    treeData: FileNode[];
    fileContents: FileContent[];
    structureString: string;
    rootName: string;
}

export interface SearchOptions {
  caseSensitive: boolean;
  useRegex: boolean;
  wholeWord: boolean;
  fuzzySearch: boolean;
}

export interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}