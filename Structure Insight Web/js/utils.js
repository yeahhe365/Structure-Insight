/**
 * Structure Insight Web - Utility Modules
 * Contains all utility functions organized by module
 */

//=============================================================================
// STORAGE MODULE
//=============================================================================

/**
 * Storage module - Local storage operations with error handling
 */
const Storage = {
    /**
     * Save data to local storage
     * @param {string} key - Storage key 
     * @param {any} value - Value to store (will be JSON stringified)
     */
    save: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('无法保存设置', error);
        }
    },
    
    /**
     * Load data from local storage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Parsed value or default value
     */
    load: (key, defaultValue) => {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('无法加载设置', error);
            return defaultValue;
        }
    },
    
    /**
     * Remove item from local storage
     * @param {string} key - Storage key to remove
     */
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('无法删除设置', error);
        }
    },
    
    /**
     * Clear all items from local storage
     */
    clear: () => {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('无法清除设置', error);
        }
    }
};

//=============================================================================
// FILE MODULE
//=============================================================================

/**
 * Detect file language based on extension
 * @param {string} fileName - Name of the file to detect language for
 * @returns {string} Language identifier or empty string
 */
const detectLanguage = (fileName) => {
    if (!fileName) return '';
    const extension = fileName.split('.').pop().toLowerCase();
    const langMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'html': 'html',
        'xml': 'xml',
        'css': 'css',
        'scss': 'scss',
        'less': 'less',
        'json': 'json',
        'md': 'markdown',
        'txt': 'plaintext',
        'yaml': 'yaml',
        'yml': 'yaml',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'h': 'cpp',
        'cs': 'csharp',
        'php': 'php',
        'sql': 'sql',
        'sh': 'bash',
        'bat': 'batch',
        'ps1': 'powershell',
        'rb': 'ruby',
        'go': 'go',
        'rust': 'rust',
        'rs': 'rust'
    };
    return langMap[extension] || '';
};

/**
 * File utilities module - File operations and structure processing
 */
const FileUtils = {
    /**
     * Read file content as text
     * @param {File} file - File object to read
     * @returns {Promise<string>} Promise resolving to file content
     */
    readFileContent: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('File read error'));
            reader.readAsText(file);
        });
    },
    
    /**
     * Build text representation of file structure
     * @param {FileList|Array<File>} files - File list to process
     * @returns {string} Text representation of file structure
     */
    buildFileStructure: (files) => {
        if (!files || files.length === 0) {
            return "无文件";
        }
        
        // Build tree structure
        const rootName = files[0]?.webkitRelativePath?.split('/')[0] || 'Files';
        const root = { 
            name: rootName, 
            children: [], 
            isDirectory: true 
        };
        
        // File mapping for quick lookup
        const nodesMap = new Map();
        nodesMap.set(rootName, root);
        
        // Process all files to build directory tree
        for (const file of files) {
            const path = file.webkitRelativePath || file.name;
            const parts = path.split('/');
            
            // Skip the first part (root folder name)
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                const parentPath = parts.slice(0, i).join('/');
                const currentPath = parts.slice(0, i + 1).join('/');
                const isFile = i === parts.length - 1;
                
                // Skip if node already exists
                if (nodesMap.has(currentPath)) continue;
                
                // Get parent node
                const parent = nodesMap.get(parentPath);
                if (!parent) continue;  // This shouldn't happen with well-formed paths
                
                // Create new node
                const newNode = {
                    name: part,
                    children: [],
                    isDirectory: !isFile,
                    file: isFile ? file : null
                };
                
                // Add to parent's children
                parent.children.push(newNode);
                
                // Add to map for quick lookup
                nodesMap.set(currentPath, newNode);
            }
        }
        
        // Sort the tree (directories first, then alphabetically)
        const sortNode = (node) => {
            node.children.sort((a, b) => {
                if (a.isDirectory !== b.isDirectory) {
                    return a.isDirectory ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
            
            for (const child of node.children) {
                if (child.isDirectory) {
                    sortNode(child);
                }
            }
            
            return node;
        };
        
        sortNode(root);
        
        // Generate string representation
        let result = [rootName];
        
        // Recursive function to build ASCII tree
        const buildTreeLines = (node, prefix = '', lastChild = true) => {
            const children = node.children;
            
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const isLast = i === children.length - 1;
                
                // Line for current node
                result.push(`${prefix}${isLast ? '└── ' : '├── '}${child.name}`);
                
                // If directory with children, process children
                if (child.isDirectory && child.children.length > 0) {
                    // Next level prefix
                    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
                    buildTreeLines(child, nextPrefix, isLast);
                }
            }
        };
        
        buildTreeLines(root);
        
        return result.join('\n');
    },
    
    /**
     * Build tree data structure for UI rendering
     * @param {FileList|Array<File>} files - File list to process
     * @returns {Array} Tree data structure for UI rendering
     */
    buildTreeData: (files) => {
        if (!files || files.length === 0) {
            return [];
        }
        
        const tree = [];
        const folders = {};
        
        // Get root folder name or use "Files" as default
        const rootFolderName = files[0]?.webkitRelativePath?.split('/')[0] || 'Files';
        folders[rootFolderName] = {
            name: rootFolderName,
            path: rootFolderName,
            isDirectory: true,
            children: []
        };
        
        tree.push(folders[rootFolderName]);
        
        // Process each file
        files.forEach(file => {
            const path = file.webkitRelativePath || file.name;
            const parts = path.split('/');
            
            // If it's a file without folder structure, add directly to root
            if (parts.length === 1) {
                tree.push({
                    name: file.name,
                    path: file.name,
                    isDirectory: false,
                    file
                });
                return;
            }
            
            // Create folder structure
            let currentPath = '';
            let currentFolder = folders[rootFolderName];
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                currentPath += (i > 0 ? '/' : '') + part;
                
                // If it's the last part, it's a file
                if (i === parts.length - 1) {
                    currentFolder.children.push({
                        name: part,
                        path: currentPath,
                        isDirectory: false,
                        file
                    });
                    
                    // Sort children after adding new file (maintain alphabetical order)
                    currentFolder.children.sort((a, b) => {
                        // Directories first
                        if (a.isDirectory !== b.isDirectory) {
                            return a.isDirectory ? -1 : 1;
                        }
                        // Then sort by name (alphabetically)
                        return a.name.localeCompare(b.name);
                    });
                }
                // Otherwise it's a folder
                else {
                    if (!folders[currentPath]) {
                        folders[currentPath] = {
                            name: part,
                            path: currentPath,
                            isDirectory: true,
                            children: []
                        };
                        currentFolder.children.push(folders[currentPath]);
                        
                        // Sort children after adding new folder
                        currentFolder.children.sort((a, b) => {
                            // Directories first
                            if (a.isDirectory !== b.isDirectory) {
                                return a.isDirectory ? -1 : 1;
                            }
                            // Then sort by name (alphabetically)
                            return a.name.localeCompare(b.name);
                        });
                    }
                    currentFolder = folders[currentPath];
                }
            }
        });
        
        // Final sort of top-level items if there are direct files added to tree
        tree.sort((a, b) => {
            // Directories first
            if (a.isDirectory !== b.isDirectory) {
                return a.isDirectory ? -1 : 1;
            }
            // Then sort by name
            return a.name.localeCompare(b.name);
        });
        
        return tree;
    }
};

//=============================================================================
// SEARCH MODULE
//=============================================================================

/**
 * Search utilities module - Advanced text search functionality
 */
const SearchUtils = {
    /**
     * Execute search with options
     * @param {string} content - Text content to search in
     * @param {string} query - Search query
     * @param {Object} options - Search options (caseSensitive, useRegex, wholeWord)
     * @returns {Array} Array of match objects with positions
     */
    performSearch: (content, query, options = {}) => {
        if (!query || !content) return [];
        
        const matches = [];
        
        try {
            // Create regex based on search options
            let searchRegex;
            if (options.useRegex) {
                try {
                    const flags = options.caseSensitive ? 'g' : 'gi';
                    searchRegex = new RegExp(query, flags);
                } catch (e) {
                    console.error('Invalid regex:', e);
                    searchRegex = new RegExp(SearchUtils.escapeRegExp(query), options.caseSensitive ? 'g' : 'gi');
                }
            } else if (options.wholeWord) {
                searchRegex = new RegExp(`\\b${SearchUtils.escapeRegExp(query)}\\b`, options.caseSensitive ? 'g' : 'gi');
            } else {
                searchRegex = new RegExp(SearchUtils.escapeRegExp(query), options.caseSensitive ? 'g' : 'gi');
            }
            
            // Find all matches
            let match;
            while ((match = searchRegex.exec(content)) !== null) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                });
            }
        } catch (error) {
            console.error('Search error:', error);
        }
        
        return matches;
    },
    
    /**
     * Escape special regex characters
     * @param {string} string - String to escape
     * @returns {string} Escaped string safe for regex
     */
    escapeRegExp: (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};

//=============================================================================
// DOM MODULE
//=============================================================================

/**
 * DOM utilities module - DOM manipulation functions
 */
const DOMUtils = {
    /**
     * Find text nodes with positions for highlighting
     * @param {Node} rootNode - Root node to search in
     * @param {number} targetStart - Start position in text
     * @param {number} targetEnd - End position in text
     * @param {Function} callback - Callback function for found text nodes
     */
    findTextNodes: (rootNode, targetStart, targetEnd, callback) => {
        // Recursive function to find and process text nodes
        const processNode = (node, currentOffset) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const nodeLength = node.nodeValue.length;
                const nodeEnd = currentOffset + nodeLength;
                
                // Check if the match is within this text node
                if (targetStart < nodeEnd && targetEnd > currentOffset) {
                    const startOffset = Math.max(0, targetStart - currentOffset);
                    const endOffset = Math.min(nodeLength, targetEnd - currentOffset);
                    
                    callback(node, startOffset, endOffset);
                }
                
                return nodeEnd;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                let offset = currentOffset;
                const childNodes = Array.from(node.childNodes);
                
                // Process child nodes
                for (const child of childNodes) {
                    offset = processNode(child, offset);
                }
                
                return offset;
            }
            
            return currentOffset;
        };
        
        processNode(rootNode, 0);
    }
};

// Export all utilities modules
window.Utils = {
    Storage,
    detectLanguage,
    FileUtils,
    SearchUtils,
    DOMUtils
};