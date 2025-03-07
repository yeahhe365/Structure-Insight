/**
 * Structure Insight Web - Utility Functions
 * Contains all utility functions organized by category
 */

//=============================================================================
// STORAGE UTILITIES
//=============================================================================

const Storage = {
    save: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('无法保存设置', error);
        }
    },
    
    load: (key, defaultValue) => {
        try {
            const value = localStorage.getItem(key);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error('无法加载设置', error);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('无法删除设置', error);
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('无法清除设置', error);
        }
    }
};

//=============================================================================
// FILE UTILITIES
//=============================================================================

// Detect file language based on extension
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

// File structure and processing utilities
const FileUtils = {
    // Read file content as text
    readFileContent: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('File read error'));
            reader.readAsText(file);
        });
    },
    
    // Build text representation of file structure
    buildFileStructure: (files) => {
        if (!files || files.length === 0) {
            return "无文件";
        }
        
        // Build tree structure
        const root = { name: files[0]?.webkitRelativePath?.split('/')[0] || 'Files', children: {}, isFolder: true };
        
        // Process all files to build directory tree
        files.forEach(file => {
            const path = file.webkitRelativePath || file.name;
            const parts = path.split('/');
            
            let current = root;
            
            // Create file path
            for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                const isFile = i === parts.length - 1;
                
                if (!current.children[part]) {
                    current.children[part] = { 
                        name: part, 
                        children: {}, 
                        isFolder: !isFile 
                    };
                }
                
                current = current.children[part];
            }
        });
        
        // Generate formatted output
        const result = [];
        result.push(root.name);
        
        // Recursive function to generate structure text
        const generateStructure = (node, prefix = '', isLast = true) => {
            // Convert children object to array and sort (folders first)
            const childrenArray = Object.values(node.children).sort((a, b) => {
                // Folders first
                if (a.isFolder !== b.isFolder) {
                    return a.isFolder ? -1 : 1;
                }
                // By name
                return a.name.localeCompare(b.name);
            });
            
            // Process each child node
            childrenArray.forEach((child, index) => {
                const isChildLast = index === childrenArray.length - 1;
                const childPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
                const lineSymbol = isChildLast ? '└── ' : '├── ';
                
                result.push(`${prefix}${lineSymbol}${child.name}`);
                
                if (child.isFolder && Object.keys(child.children).length > 0) {
                    generateStructure(child, childPrefix, isChildLast);
                }
            });
        };
        
        generateStructure(root);
        
        return result.join('\n');
    },
    
    // Build tree data structure for UI
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
// SEARCH UTILITIES
//=============================================================================

const SearchUtils = {
    // Execute search with options
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
    
    // Escape special regex characters
    escapeRegExp: (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};

//=============================================================================
// DOM UTILITIES
//=============================================================================

const DOMUtils = {
    // Find text nodes with positions
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

// Export all utilities
window.Utils = {
    Storage,
    detectLanguage,
    FileUtils,
    SearchUtils,
    DOMUtils
};