
export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileNode[];
  status?: 'processed' | 'skipped' | 'error';
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
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'loading';
  content: string;
}

export interface SearchOptions {
  caseSensitive: boolean;
  useRegex: boolean;
  wholeWord: boolean;
  fuzzySearch: boolean;
}