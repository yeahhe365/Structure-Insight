// Centralized constants for the application

export const IGNORED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.ico', '.webp',
  '.mp3', '.wav', '.ogg', '.mp4', '.mov', '.avi', '.webm',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.exe', '.dll', '.so', '.o', '.a', '.obj',
  '.class', '.jar', '.pyc', '.pyd',
  '.DS_Store',
  '.eot', '.ttf', '.woff', '.woff2',
]);

export const IGNORED_DIRS = new Set([
  '.git', 'node_modules', '__pycache__', '.vscode', '.idea',
  'dist', 'build', 'out', 'target',
]);

export const LANG_MAP: Record<string, string> = {
  'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
  'py': 'python', 'html': 'xml', 'xml': 'xml', 'css': 'css', 'scss': 'css', 'less': 'css',
  'json': 'json', 'md': 'markdown', 'yml': 'yaml', 'yaml': 'yaml', 'sh': 'bash',
  'java': 'java', 'c': 'c', 'h': 'c', 'cpp': 'cpp', 'hpp': 'cpp', 'cs': 'csharp', 'go': 'go', 'php': 'php',
  'rb': 'ruby', 'rs': 'rust', 'sql': 'sql', 'swift': 'swift', 'kt': 'kotlin', 'kts': 'kotlin',
  'dockerfile': 'dockerfile', 'gradle': 'groovy', 'vue': 'html', 'svelte': 'html',
  'log': 'plaintext', 'txt': 'plaintext', 'env': 'properties', 'ini': 'ini',
};

export const MAX_CHARS_DEFAULT = 1000000;
export const SEARCH_HISTORY_LIMIT = 10;
export const RECENT_PROJECTS_LIMIT = 5;
export const FILE_PROCESS_BATCH_SIZE = 50;
export const MAIN_THREAD_YIELD_INTERVAL_MS = 12;
export const SEARCH_MATCH_BATCH_SIZE = 100;
