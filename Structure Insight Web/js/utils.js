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
     * Read file as ArrayBuffer for binary operations
     * @param {File} file - File object to read
     * @returns {Promise<ArrayBuffer>} Promise resolving to file content as ArrayBuffer
     */
    readFileAsArrayBuffer: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('File read error'));
            reader.readAsArrayBuffer(file);
        });
    },
    
    /**
     * Check if a file is a ZIP file
     * @param {File} file - File to check
     * @returns {boolean} True if file is a ZIP file
     */
    isZipFile: (file) => {
        if (!file) return false;
        const fileName = file.name.toLowerCase();
        return fileName.endsWith('.zip') || 
               file.type === 'application/zip' || 
               file.type === 'application/x-zip-compressed';
    },
    
    /**
     * Process ZIP file and extract contents
     * @param {File} zipFile - ZIP file to process
     * @param {Function} progressCallback - Callback for progress updates
     * @returns {Promise<Array<File>>} Promise resolving to array of extracted files
     */
    processZipFile: async (zipFile, progressCallback) => {
        try {
            // Load the ZIP file
            const zipData = await FileUtils.readFileAsArrayBuffer(zipFile);
            
            // Update progress
            if (progressCallback) progressCallback('正在加载ZIP文件...');
            
            // Load the ZIP with JSZip
            const zip = await JSZip.loadAsync(zipData);
            
            // Create File objects from the ZIP contents
            const extractedFiles = [];
            const zipRoot = zipFile.name.replace(/\.zip$/i, '');
            
            // Get total number of files
            const totalFiles = Object.keys(zip.files).length;
            let processedFiles = 0;
            
            // Process each file in the ZIP
            const zipPromises = [];
            
            // Update progress
            if (progressCallback) progressCallback(`正在提取 ${zipFile.name} 中的文件... (0/${totalFiles})`);
            
            zip.forEach((relativePath, entry) => {
                if (!entry.dir) {
                    const promise = entry.async('blob').then(content => {
                        // Create a File object
                        const file = new File([content], entry.name, {
                            type: '',  // Let browser determine type
                            lastModified: entry.date.getTime()
                        });
                        
                        // Add webkitRelativePath to match expected format
                        Object.defineProperty(file, 'webkitRelativePath', {
                            value: `${zipRoot}/${relativePath}`
                        });
                        
                        extractedFiles.push(file);
                        
                        // Update progress
                        processedFiles++;
                        if (progressCallback && processedFiles % 10 === 0) {
                            progressCallback(`正在提取 ${zipFile.name} 中的文件... (${processedFiles}/${totalFiles})`);
                        }
                    });
                    zipPromises.push(promise);
                }
            });
            
            // Wait for all files to be processed
            await Promise.all(zipPromises);
            
            // Final progress update
            if (progressCallback) progressCallback(`已完成提取 ${zipFile.name} 中的 ${extractedFiles.length} 个文件`);
            
            return extractedFiles;
        } catch (error) {
            console.error('处理ZIP文件时出错:', error);
            if (progressCallback) progressCallback(`处理ZIP文件时出错: ${error.message}`);
            throw error;
        }
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
// SEARCH MODULE - 全面重写的搜索模块
//=============================================================================

/**
 * Search utilities module - 全功能文本搜索
 * 修复变量名错误和搜索逻辑问题
 */
const SearchUtils = {
    /**
     * 执行全功能的文本搜索
     * @param {string} content - 要搜索的文本内容
     * @param {string} query - 搜索查询
     * @param {Object} options - 搜索选项(caseSensitive, useRegex, wholeWord, fuzzySearch)
     * @returns {Array} 匹配对象数组
     */
    performSearch: (content, query, options = {}) => {
        // 基本检查
        if (!query || !content) return [];
        if (query.trim() === '') return [];
        
        console.log('执行搜索:', { 
            query, 
            options, 
            contentLength: content.length
        });
        
        try {
            // 处理模糊搜索选项
            if (options.fuzzySearch) {
                return SearchUtils.performFuzzySearch(content, query, options);
            }
            
            // 使用正则表达式搜索
            if (options.useRegex) {
                try {
                    return SearchUtils.performRegexSearch(content, query, options);
                } catch (error) {
                    console.error('正则表达式搜索错误:', error);
                    // 回退到简单搜索
                    return SearchUtils.performSimpleSearch(content, query, options);
                }
            } 
            // 全词匹配搜索
            else if (options.wholeWord) {
                try {
                    return SearchUtils.performWholeWordSearch(content, query, options);
                } catch (error) {
                    console.error('全词匹配搜索错误:', error);
                    // 回退到简单搜索
                    return SearchUtils.performSimpleSearch(content, query, options);
                }
            } 
            // 普通字符串搜索
            else {
                return SearchUtils.performSimpleSearch(content, query, options);
            }
        } catch (error) {
            console.error('搜索处理错误:', error);
            // 出错时使用最简单的搜索方法
            return SearchUtils.performBasicSearch(content, query, options);
        }
    },
    
    /**
     * 执行正则表达式搜索
     * @param {string} content - 要搜索的文本内容
     * @param {string} query - 搜索查询
     * @param {Object} options - 搜索选项
     * @returns {Array} 匹配对象数组
     */
    performRegexSearch: (content, query, options = {}) => {
        const matches = [];
        
        try {
            // 创建正则表达式对象
            const flags = options.caseSensitive ? 'gm' : 'gim';
            const regex = new RegExp(query, flags);
            
            // 执行正则搜索
            let match;
            while ((match = regex.exec(content)) !== null) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                });
                
                // 避免零宽匹配导致的无限循环
                if (match.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
            }
            
            console.log('正则搜索结果:', matches.length);
            return matches;
        } catch (error) {
            console.error('正则表达式创建或执行错误:', error);
            throw error; // 重新抛出错误以便外层处理
        }
    },
    
    /**
     * 执行全词匹配搜索
     * @param {string} content - 要搜索的文本内容
     * @param {string} query - 搜索查询
     * @param {Object} options - 搜索选项
     * @returns {Array} 匹配对象数组
     */
    performWholeWordSearch: (content, query, options = {}) => {
        const matches = [];
        
        try {
            // 创建全词匹配的正则表达式
            const flags = options.caseSensitive ? 'gm' : 'gim';
            const escapedQuery = SearchUtils.escapeRegExp(query);
            const regex = new RegExp(`\\b${escapedQuery}\\b`, flags);
            
            // 执行全词搜索
            let match;
            while ((match = regex.exec(content)) !== null) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                });
                
                // 避免零宽匹配导致的无限循环
                if (match.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
            }
            
            console.log('全词搜索结果:', matches.length);
            return matches;
        } catch (error) {
            console.error('全词匹配搜索错误:', error);
            throw error;
        }
    },
    
    /**
     * 执行简单字符串搜索
     * @param {string} content - 要搜索的文本内容
     * @param {string} query - 搜索查询
     * @param {Object} options - 搜索选项
     * @returns {Array} 匹配对象数组
     */
    performSimpleSearch: (content, query, options = {}) => {
        const matches = [];
        
        // 准备用于搜索的内容
        const searchContent = options.caseSensitive ? content : content.toLowerCase();
        const searchQuery = options.caseSensitive ? query : query.toLowerCase();
        
        // 简单字符串匹配
        let position = 0;
        while (position < searchContent.length) {
            const foundIndex = searchContent.indexOf(searchQuery, position);
            if (foundIndex === -1) break;
            
            // 创建匹配对象
            matches.push({
                start: foundIndex,
                end: foundIndex + searchQuery.length,
                text: content.substring(foundIndex, foundIndex + searchQuery.length)
            });
            
            // 移动到下一个位置
            position = foundIndex + 1;
        }
        
        console.log('简单搜索结果:', matches.length);
        return matches;
    },
    
    /**
     * 最基础的搜索方法 - 出错时的最后手段
     */
    performBasicSearch: (content, query, options = {}) => {
        try {
            const matches = [];
            
            // 根据大小写敏感选项进行处理
            const searchContent = options.caseSensitive ? content : content.toLowerCase();
            const searchQuery = options.caseSensitive ? query : query.toLowerCase();
            
            let position = 0;
            while (position < searchContent.length) {
                const foundIndex = searchContent.indexOf(searchQuery, position);
                if (foundIndex === -1) break;
                
                matches.push({
                    start: foundIndex,
                    end: foundIndex + searchQuery.length,
                    text: content.substring(foundIndex, foundIndex + searchQuery.length)
                });
                
                position = foundIndex + 1;
            }
            
            console.log('基础搜索结果:', matches.length);
            return matches;
        } catch (e) {
            console.error('基础搜索也失败了:', e);
            return []; // 最后返回空数组
        }
    },
    
    /**
     * 执行模糊搜索
     * @param {string} content - 要搜索的文本内容
     * @param {string} query - 搜索查询
     * @param {Object} options - 搜索选项
     * @returns {Array} 匹配对象数组
     */
    performFuzzySearch: (content, query, options = {}) => {
        // 由于模糊搜索复杂度高，先对内容进行分段处理
        const matches = [];
        const contentToSearch = options.caseSensitive ? content : content.toLowerCase();
        const queryToSearch = options.caseSensitive ? query : query.toLowerCase();
        
        if (queryToSearch.length === 0) return [];
        
        // 按行处理文本内容
        const lines = content.split('\n');
        let lineStartOffset = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineContent = options.caseSensitive ? line : line.toLowerCase();
            
            // 检查行中是否包含至少第一个查询字符
            if (lineContent.includes(queryToSearch[0])) {
                // 在行中搜索可能的匹配
                for (let j = 0; j < lineContent.length; j++) {
                    let matchFound = false;
                    let matchedIndices = [];
                    
                    // 尝试从当前位置开始匹配查询
                    if (lineContent[j] === queryToSearch[0]) {
                        matchedIndices.push(j);
                        let queryIndex = 1;
                        let lineIndex = j + 1;
                        
                        // 继续匹配剩余的查询字符
                        while (queryIndex < queryToSearch.length && lineIndex < lineContent.length) {
                            if (lineContent[lineIndex] === queryToSearch[queryIndex]) {
                                matchedIndices.push(lineIndex);
                                queryIndex++;
                            }
                            lineIndex++;
                        }
                        
                        // 如果找到完整匹配
                        if (queryIndex === queryToSearch.length) {
                            matchFound = true;
                            const globalStartOffset = lineStartOffset + j;
                            const globalEndOffset = lineStartOffset + matchedIndices[matchedIndices.length - 1] + 1;
                            
                            matches.push({
                                start: globalStartOffset,
                                end: globalEndOffset,
                                text: content.substring(globalStartOffset, globalEndOffset)
                            });
                        }
                    }
                    
                    // 如果找到匹配，继续搜索下一个位置
                    if (matchFound) {
                        continue;
                    }
                }
            }
            
            // 更新行偏移量
            lineStartOffset += line.length + 1; // +1 是为了换行符
        }
        
        console.log('模糊搜索结果:', matches.length);
        return matches;
    },
    
    /**
     * 转义正则表达式特殊字符
     * @param {string} string - 要转义的字符串
     * @returns {string} 转义后的字符串
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
     * 查找和处理文本节点
     * @param {Node} rootNode - 搜索的根节点
     * @param {number} targetStart - 文本中的开始位置
     * @param {number} targetEnd - 文本中的结束位置
     * @param {Function} callback - 回调函数
     */
    findTextNodes: (rootNode, targetStart, targetEnd, callback) => {
        // 先提取所有的文本节点和内容
        const textNodesWithOffsets = [];
        let totalOffset = 0;
        
        function extractTextNodes(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                // 保存文本节点和偏移量
                textNodesWithOffsets.push({
                    node: node,
                    startOffset: totalOffset,
                    text: node.nodeValue
                });
                totalOffset += node.nodeValue.length;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // 递归处理所有子节点
                for (const child of Array.from(node.childNodes)) {
                    extractTextNodes(child);
                }
            }
        }
        
        // 提取所有节点
        extractTextNodes(rootNode);
        
        // 查找包含目标范围的节点
        for (const item of textNodesWithOffsets) {
            const nodeStartOffset = item.startOffset;
            const nodeEndOffset = nodeStartOffset + item.text.length;
            
            // 检查节点文本是否与目标范围重叠
            if (nodeStartOffset <= targetEnd && nodeEndOffset >= targetStart) {
                // 计算节点内的相对位置
                const relativeStart = Math.max(0, targetStart - nodeStartOffset);
                const relativeEnd = Math.min(item.text.length, targetEnd - nodeStartOffset);
                
                // 调用回调处理这个节点
                if (relativeStart < relativeEnd) {
                    callback(item.node, relativeStart, relativeEnd);
                }
            }
        }
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