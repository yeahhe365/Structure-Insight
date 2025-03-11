/**
 * Structure Insight Web - File Hooks
 * Hooks for file management and operations
 */

const { useState, useEffect, useRef, useCallback } = React;
const { Storage, FileUtils } = window.Utils;

//=============================================================================
// FILE MANAGEMENT HOOKS MODULE
//=============================================================================

/**
 * Hook for managing file operations and content
 * @param {Boolean} extractContentProp Whether to extract file content
 * @returns {Object} File operations state and handlers
 */
const useFileManagement = (extractContentProp) => {
    // Use a ref to track the current value of extractContent
    const extractContentRef = useRef(extractContentProp);
    
    // Update the ref when the prop changes
    useEffect(() => {
        extractContentRef.current = extractContentProp;
    }, [extractContentProp]);
    
    // 添加拖放计数器引用
    const dragCounter = useRef(0);
    
    // File content state
    const [fileStructure, setFileStructure] = useState(Storage.load('fileStructure', ''));
    const [filesContent, setFilesContent] = useState(Storage.load('filesContent', []));
    const [treeData, setTreeData] = useState(Storage.load('treeData', []));
    const [currentContent, setCurrentContent] = useState(Storage.load('currentContent', ''));
    const [filePositions, setFilePositions] = useState(Storage.load('filePositions', {}));
    
    // File processing state
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [maxProgress, setMaxProgress] = useState(100);
    const [statusMessage, setStatusMessage] = useState('就绪');
    const [lineCount, setLineCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    
    // History and state
    const [lastOpenedFiles, setLastOpenedFiles] = useState(Storage.load('lastOpenedFiles', null));
    const [receivedFiles, setReceivedFiles] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditingFile, setCurrentEditingFile] = useState(null);
    const [editedContent, setEditedContent] = useState({});
    
    // ZIP processing state
    const [isProcessingZip, setIsProcessingZip] = useState(false);
    const [zipProgress, setZipProgress] = useState('');

    // Hidden file input reference
    const fileInputRef = useRef(null);
    
    // 确保在组件卸载时重置拖放计数器
    useEffect(() => {
        return () => {
            dragCounter.current = 0;
        };
    }, []);

    // Save state to storage when it changes
    useEffect(() => {
        if (fileStructure) Storage.save('fileStructure', fileStructure);
    }, [fileStructure]);
    
    useEffect(() => {
        if (filesContent.length > 0) Storage.save('filesContent', filesContent);
    }, [filesContent]);
    
    useEffect(() => {
        if (treeData.length > 0) Storage.save('treeData', treeData);
    }, [treeData]);
    
    useEffect(() => {
        if (currentContent) Storage.save('currentContent', currentContent);
    }, [currentContent]);
    
    useEffect(() => {
        if (Object.keys(filePositions).length > 0) Storage.save('filePositions', filePositions);
    }, [filePositions]);
    
    // Initialize line and character count
    useEffect(() => {
        if (currentContent) {
            const lines = currentContent.split('\n').length;
            const chars = currentContent.length;
            setLineCount(lines);
            setCharCount(chars);
            setStatusMessage(`就绪 - 共 ${lines} 行, ${chars} 字符`);
        }
    }, []);
    
    // Update line and character count when content changes
    useEffect(() => {
        if (currentContent) {
            const lines = currentContent.split('\n').length;
            const chars = currentContent.length;
            setLineCount(lines);
            setCharCount(chars);
        } else {
            setLineCount(0);
            setCharCount(0);
        }
    }, [currentContent]);
    
    // Create file input element for directory selection
    useEffect(() => {
        // Create a hidden file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        input.style.display = 'none';
        
        // Add change event listener
        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleReceivedFiles(e.target.files);
                
                // Automatically switch to editor view on mobile
                if (isMobile) {
                    setMobileView('editor');
                }
            }
        });
        
        // Add to document and save ref
        document.body.appendChild(input);
        fileInputRef.current = input;
        
        // Clean up on unmount
        return () => {
            document.body.removeChild(input);
        };
    }, []);
    
    // Process ZIP file
    const processZipFile = async (zipFile) => {
        if (!zipFile || !FileUtils.isZipFile(zipFile)) return null;
        
        setIsProcessingZip(true);
        setZipProgress('开始处理ZIP文件...');
        
        try {
            // Progress callback function for ZIP extraction
            const progressCallback = (message) => {
                setZipProgress(message);
            };
            
            // Extract files from ZIP
            const extractedFiles = await FileUtils.processZipFile(zipFile, progressCallback);
            
            setIsProcessingZip(false);
            setZipProgress('');
            
            return extractedFiles;
        } catch (error) {
            console.error('处理ZIP文件失败:', error);
            setStatusMessage(`处理ZIP文件失败: ${error.message}`);
            setIsProcessingZip(false);
            setZipProgress('');
            return null;
        }
    };
    
    // Process files main function - 修改为使用ref
    const processFiles = async (files) => {
        if (!files || files.length === 0) return;
        
        resetContent();
        setProcessing(true);
        setStatusMessage('处理中...');
        
        // Convert FileList to array
        let filesArray = Array.from(files);
        setMaxProgress(filesArray.length);
        
        // Check for ZIP files and process them
        const zipFiles = filesArray.filter(file => FileUtils.isZipFile(file));
        const nonZipFiles = filesArray.filter(file => !FileUtils.isZipFile(file));
        
        // Process ZIP files if found
        if (zipFiles.length > 0) {
            setStatusMessage(`发现${zipFiles.length}个ZIP文件，正在处理...`);
            
            // Process each ZIP file
            for (const zipFile of zipFiles) {
                setStatusMessage(`正在处理 ${zipFile.name}...`);
                const extractedFiles = await processZipFile(zipFile);
                
                if (extractedFiles && extractedFiles.length > 0) {
                    // Add extracted files to non-zip files
                    nonZipFiles.push(...extractedFiles);
                    setStatusMessage(`已从 ${zipFile.name} 中提取 ${extractedFiles.length} 个文件`);
                }
            }
        }
        
        // Update files array with all files (original non-ZIP + extracted from ZIPs)
        filesArray = nonZipFiles;
        setMaxProgress(filesArray.length);
        
        // First process directory structure
        const structure = FileUtils.buildFileStructure(filesArray);
        setFileStructure(structure);
        
        // Create initial content
        let fullContent = `文件结构:\n${structure}\n\n`;
        
        // 只有当 extractContentRef.current 为true时才添加"文件内容:"标题
        if (extractContentRef.current) {
            fullContent += "文件内容:\n";
        }
        
        // Build tree data
        const tree = FileUtils.buildTreeData(filesArray);
        setTreeData(tree);
        
        // Process each file
        const fileContents = [];
        const positions = {};
        let currentPosition = fullContent.length;
        let processedCount = 0;
        
        // 构建内容为单个字符串而不是通过状态更新
        let accumulatedContent = fullContent;
        
        for (const file of filesArray) {
            // Get lowercase filename for better extension matching
            const fileName = file.name.toLowerCase();
            
            if (file.type.startsWith('text/') || 
                fileName.endsWith('.js') || 
                fileName.endsWith('.jsx') ||
                fileName.endsWith('.ts') ||
                fileName.endsWith('.tsx') ||
                fileName.endsWith('.json') ||
                fileName.endsWith('.md') ||
                fileName.endsWith('.py') ||
                fileName.endsWith('.html') ||
                fileName.endsWith('.css') ||
                fileName.endsWith('.scss') ||
                fileName.endsWith('.less') ||
                fileName.endsWith('.xml') ||
                fileName.endsWith('.yml') ||
                fileName.endsWith('.yaml') ||
                fileName.endsWith('.java') ||
                fileName.endsWith('.c') ||
                fileName.endsWith('.cpp') ||
                fileName.endsWith('.h') ||
                fileName.endsWith('.cs') ||
                fileName.endsWith('.php') ||
                fileName.endsWith('.sql') ||
                fileName.endsWith('.sh') ||
                fileName.endsWith('.rb') ||
                fileName.endsWith('.go') ||
                fileName.endsWith('.config') ||
                fileName.endsWith('.properties') ||
                fileName.endsWith('.txt') ||
                fileName.endsWith('.ini') ||
                fileName.endsWith('.env') ||
                fileName.endsWith('.gitignore') ||
                fileName.endsWith('.htaccess') ||
                fileName.endsWith('.vue') ||
                fileName.endsWith('.svelte') ||
                // 检测无扩展名的常见配置文件
                fileName === 'dockerfile' ||
                fileName === 'makefile' ||
                fileName === 'readme' ||
                fileName === 'license' ||
                fileName === 'changelog') {
                
                try {
                    // Read file content
                    const content = await FileUtils.readFileContent(file);
                    
                    // 始终将文件内容添加到filesContent数组以备后用
                    fileContents.push({ name: file.name, content });
                    
                    // 仅当extractContentRef.current为true时添加到主内容
                    if (extractContentRef.current) {
                        const separator = `${'='.repeat(40)}\n文件名: ${file.name}\n${'-'.repeat(71)}\n`;
                        
                        // Record current file position in global content
                        positions[file.name] = currentPosition;
                        currentPosition += separator.length + content.length + 2; // Add separator, content, and newlines
                        
                        // 附加到本地字符串而不是更新状态
                        accumulatedContent += separator + content + "\n\n";
                    }
                } catch (error) {
                    console.error(`Error reading file ${file.name}:`, error);
                    fileContents.push({ name: file.name, error: true });
                    updateTreeNodeStatus(file.name, 'error');
                }
            } else {
                // Skip non-text files
                updateTreeNodeStatus(file.name, 'skipped');
            }
            
            processedCount++;
            setProgress(processedCount);
        }
        
        // 在所有文件处理完成后一次性设置内容
        setCurrentContent(accumulatedContent);
        
        setFilesContent(fileContents);
        
        // 根据是否提取内容来决定是否设置filePositions
        if (extractContentRef.current) {
            setFilePositions(positions);
        } else {
            // 如果不提取内容，则清空filePositions
            setFilePositions({});
        }
        
        setProcessing(false);
        
        // Update line and character count with the new content
        const newLineCount = accumulatedContent.split('\n').length;
        const newCharCount = accumulatedContent.length;
        setLineCount(newLineCount);
        setCharCount(newCharCount);
        
        // Update status bar info
        setTimeout(() => {
            setStatusMessage(`就绪 - 共 ${newLineCount} 行, ${newCharCount} 字符`);
        }, 100);
    };
    
    // Update tree node status
    const updateTreeNodeStatus = (fileName, status) => {
        setTreeData(prevTree => {
            if (!prevTree || !Array.isArray(prevTree)) {
                return prevTree;
            }
            
            const updateNode = (nodes) => {
                return nodes.map(node => {
                    if (!node) return node;
                    
                    if (!node.isDirectory && node.name === fileName) {
                        return { ...node, status };
                    }
                    if (node.children && Array.isArray(node.children)) {
                        return {
                            ...node,
                            children: updateNode(node.children)
                        };
                    }
                    return node;
                });
            };
            
            return updateNode(prevTree);
        });
    };
    
    // File operation functions
    
    // Handle received files
    const handleReceivedFiles = (files) => {
        if (files && files.length > 0) {
            // 确保完全重置之前的状态
            resetContent();
            
            // Save file reference for refresh
            setReceivedFiles(files);
            
            try {
                // Save basic info to lastOpenedFiles
                const fileInfo = Array.from(files).map(file => ({
                    name: file.name,
                    path: file.webkitRelativePath || file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified
                }));
                setLastOpenedFiles(fileInfo);
                Storage.save('lastOpenedFiles', fileInfo);
            } catch (error) {
                console.error('无法保存文件信息:', error);
            }
            
            // Process files
            processFiles(files);
        }
    };
    
    // Select local folder - UPDATED TO USE STANDARD FILE INPUT
    const handleLocalFolderSelect = (isMobile, setMobileView) => {
        // 先重置当前file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };
    
    // Reset content and state
    const resetContent = () => {
        setFileStructure('');
        setFilesContent([]);
        setTreeData([]);
        setCurrentContent('');
        setFilePositions({});
        setProgress(0);
        setStatusMessage('就绪');
        setLineCount(0);
        setCharCount(0);
        setIsEditing(false);
        setCurrentEditingFile(null);
        setEditedContent({});
        setIsProcessingZip(false);
        setZipProgress('');
        
        // 清除所有文件引用
        setReceivedFiles(null);
        
        // Clear cache
        Storage.remove('fileStructure');
        Storage.remove('filesContent');
        Storage.remove('treeData');
        Storage.remove('currentContent');
        Storage.remove('filePositions');
        Storage.remove('lastOpenedFiles');
    };
    
    // Clear all cache data - 清除缓存功能
    const clearCache = useCallback(() => {
        // 先重置内容
        resetContent();
        
        // 清空接收的文件引用
        setReceivedFiles(null);
        setLastOpenedFiles(null);
        
        // 重置文件输入框
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        
        // 清除所有本地存储
        Storage.clear();
        
        // 更新状态消息
        setStatusMessage('已清除所有缓存数据');
        setTimeout(() => {
            setStatusMessage('就绪');
        }, 2000);
    }, []);
    
    // Cancel file processing
    const cancelProcessing = () => {
        if (!processing) return;
        
        setProcessing(false);
        setStatusMessage('已取消');
        setTimeout(() => {
            setStatusMessage('就绪');
        }, 2000);
    };
    
    // Copy content to clipboard
    const copyContent = () => {
        if (!currentContent) return;
        
        navigator.clipboard.writeText(currentContent)
            .then(() => {
                setStatusMessage("内容已复制到剪贴板");
                setTimeout(() => {
                    setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
                }, 2000);
            })
            .catch(err => {
                console.error('复制失败:', err);
                alert("复制失败，请手动选择内容复制");
            });
    };
    
    // Save content to file
    const saveContent = () => {
        if (!currentContent) return;
        
        const blob = new Blob([currentContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'structure-insight-export.txt';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };
    
    // File tree selection handler - FIXED JUMPING FUNCTIONALITY
    const handleFileTreeSelect = (node, editorScrollRef, isMobile, setMobileView, isTransitioning, setIsTransitioning, lineHeight) => {
        if (!node || !node.name) return;
        
        // Exit edit mode without dialog
        if (isEditing) {
            setIsEditing(false);
            setCurrentEditingFile(null);
        }
        
        // 只有在extractContentRef.current为true且文件位置存在时才跳转到文件位置
        if (extractContentRef.current && filePositions[node.name]) {
            // Switch to editor view on mobile
            if (isMobile) {
                // Trigger transition animation
                setIsTransitioning(true);
                
                // Delay to allow CSS transition
                setTimeout(() => {
                    setMobileView('editor');
                    
                    // Delay ending animation state
                    setTimeout(() => setIsTransitioning(false), 300);
                }, 50);
            }
            
            // Try to find file element by ID first (most reliable method)
            const fileId = `file-${encodeURIComponent(node.name)}`;
            const fileElement = document.getElementById(fileId);
            
            if (fileElement) {
                // Use scrollIntoView for more reliable scrolling
                fileElement.scrollIntoView({
                    behavior: isMobile ? 'smooth' : 'auto',
                    block: 'start'
                });
                
                // Add a small offset to account for header/spacing
                setTimeout(() => {
                    if (editorScrollRef.current) {
                        editorScrollRef.current.scrollTop -= 60; // Adjust based on header size
                    }
                }, isMobile ? 50 : 0);
            } else {
                // Fallback to position-based scrolling if element not found
                const position = filePositions[node.name];
                const targetElement = editorScrollRef.current;
                
                if (targetElement) {
                    // Calculate approximate scroll position
                    const textBeforePosition = currentContent.substring(0, position);
                    const linesBefore = textBeforePosition.split('\n').length;
                    
                    // Estimate scroll position with improved calculation
                    const scrollPosition = linesBefore * lineHeight - 60; // Subtract header offset
                    
                    // Use smooth scrolling on mobile for better experience
                    targetElement.scrollTo({
                        top: Math.max(0, scrollPosition),
                        behavior: isMobile ? 'smooth' : 'auto'
                    });
                }
            }
            
            // Highlight file section temporarily
            setTimeout(() => {
                const fileElement = document.getElementById(fileId);
                if (fileElement) {
                    // Add highlight animation
                    fileElement.classList.add('highlight-file');
                    setTimeout(() => {
                        fileElement.classList.remove('highlight-file');
                    }, 1500);
                }
            }, isMobile ? 300 : 100);
            
            // Update status message
            setStatusMessage(`已跳转到: ${node.name}`);
            setTimeout(() => {
                setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
            }, 2000);
        } else if (!extractContentRef.current) {
            // 如果未提取内容，则显示相应提示
            if (isMobile) {
                setIsTransitioning(true);
                setTimeout(() => {
                    setMobileView('editor');
                    setTimeout(() => setIsTransitioning(false), 300);
                }, 50);
            }
            
            // 提示用户未提取文件内容
            setStatusMessage(`未提取文件内容，无法跳转到: ${node.name}`);
            setTimeout(() => {
                setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
            }, 2000);
            
            // 找出文件在filesContent数组中的内容
            const fileData = filesContent.find(f => f.name === node.name);
            if (fileData && fileData.content) {
                // 目前不做任何操作，只是显示提示
                console.log(`文件 ${node.name} 的内容长度: ${fileData.content.length}`);
            }
        }
    };
    
    // File deletion handler
    const handleFileDelete = (node) => {
        if (!node || !node.name) return;
        
        // If file is being edited, exit edit mode
        if (isEditing && currentEditingFile === node.name) {
            setIsEditing(false);
            setCurrentEditingFile(null);
        }
        
        // Remove from tree data
        setTreeData(prevTree => {
            if (!prevTree || !Array.isArray(prevTree)) {
                return prevTree;
            }
            
            const removeNode = (nodes) => {
                return nodes.filter(n => {
                    if (!n) return false;
                    if (!n.isDirectory && n.name === node.name) {
                        return false;
                    }
                    if (n.children && Array.isArray(n.children)) {
                        n.children = removeNode(n.children);
                    }
                    return true;
                });
            };
            
            return removeNode(prevTree);
        });
        
        // Remove from file contents
        setFilesContent(prev => prev.filter(f => f.name !== node.name));
        
        // Update text content - 只有在extractContentRef.current为true时才需要处理
        if (filePositions[node.name] && extractContentRef.current) {
            const beforePos = currentContent.substring(0, filePositions[node.name]);
            const afterStartIndex = currentContent.indexOf('\n\n', filePositions[node.name]);
            if (afterStartIndex !== -1) {
                const afterStart = afterStartIndex + 2;
                const afterPos = currentContent.substring(afterStart);
                
                setCurrentContent(beforePos + afterPos);
                
                // Update file positions
                const newPositions = {};
                const removedLength = afterStart - filePositions[node.name];
                
                Object.entries(filePositions).forEach(([name, pos]) => {
                    if (name !== node.name) {
                        if (pos > filePositions[node.name]) {
                            newPositions[name] = pos - removedLength;
                        } else {
                            newPositions[name] = pos;
                        }
                    }
                });
                
                setFilePositions(newPositions);
            }
        }
        
        // Update status info
        setStatusMessage(`已移除: ${node.name}`);
        setTimeout(() => {
            setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
        }, 2000);
    };
    
    // Handle file content editing - 修改后的函数，更新了文件位置计算逻辑
    const handleEditContent = (fileName, newContent, startEditing = false) => {
        // If starting edit mode
        if (startEditing) {
            setIsEditing(true);
            setCurrentEditingFile(fileName);
            return;
        }
        
        // If canceling edit
        if (fileName === null) {
            setIsEditing(false);
            setCurrentEditingFile(null);
            return;
        }
        
        // If saving edit
        if (newContent !== null) {
            // Update file content array
            setFilesContent(prev => 
                prev.map(file => 
                    file.name === fileName 
                        ? { ...file, content: newContent } 
                        : file
                )
            );
            
            // Update complete content string - 只有在extractContentRef.current为true时才需要更新
            if (filePositions[fileName] && extractContentRef.current) {
                const position = filePositions[fileName];
                
                // Find file content start and end positions
                const start = currentContent.indexOf('-'.repeat(71) + '\n', position) + 72; // 71 dashes plus newline
                const end = currentContent.indexOf('\n\n', start);
                
                if (start !== -1 && end !== -1) {
                    const oldContent = currentContent.substring(start, end);
                    const lengthDifference = newContent.length - oldContent.length;
                    
                    // Update main content
                    const before = currentContent.substring(0, start);
                    const after = currentContent.substring(end);
                    setCurrentContent(before + newContent + after);
                    
                    // Update positions of subsequent files - 使用文件实际结束位置(end)
                    const updatedPositions = { ...filePositions };
                    Object.keys(updatedPositions).forEach(name => {
                        if (updatedPositions[name] > end) {
                            updatedPositions[name] += lengthDifference;
                        }
                    });
                    setFilePositions(updatedPositions);
                }
            }
            
            // Exit edit mode
            setIsEditing(false);
            setCurrentEditingFile(null);
            
            // Update status info
            setStatusMessage(`已保存修改: ${fileName}`);
            setTimeout(() => {
                setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
            }, 2000);
        }
    };
    
    // 修复拖放闪烁问题的拖放处理函数
    const dragDropHandlers = {
        handleDragEnter: (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 增加计数器
            dragCounter.current++;
            
            if (!isEditing) {
                setIsDragging(true);
            }
        },
        
        handleDragOver: (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 不需要在这里设置 isDragging，这样可以避免不必要的渲染
        },
        
        handleDragLeave: (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 减少计数器
            dragCounter.current--;
            
            // 只有当计数器归零时，才真正认为离开了拖放区域
            if (dragCounter.current === 0) {
                setIsDragging(false);
            }
        },
        
        handleDrop: async (e, setMobileView, isMobile) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 重置计数器
            dragCounter.current = 0;
            setIsDragging(false);
            
            if (isEditing) return;

            // 完全重置现有状态
            resetContent();

            // Show processing status
            setStatusMessage('正在处理拖放的文件...');
            
            // Get dropped files and items
            const items = e.dataTransfer.items;
            const droppedFiles = e.dataTransfer.files;
            let allFiles = [];
            
            // Check for folder items
            if (items && items.length > 0) {
                // Use more reliable method to handle folders
                try {
                    const fileEntries = [];
                    
                    // Collect all file entries
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
                        
                        if (entry) {
                            fileEntries.push(entry);
                        }
                    }
                    
                    // Use entry API if available, otherwise use files API
                    if (fileEntries.length > 0) {
                        // Recursively read all files
                        const readEntryContentsRecursively = async (entry, path = '') => {
                            return new Promise(async (resolve) => {
                                if (entry.isFile) {
                                    entry.file(file => {
                                        // Add relative path to match webkitdirectory behavior
                                        Object.defineProperty(file, 'webkitRelativePath', {
                                            value: path ? `${path}/${entry.name}` : entry.name
                                        });
                                        allFiles.push(file);
                                        resolve();
                                    }, () => resolve()); // Continue even if error occurs
                                } else if (entry.isDirectory) {
                                    const dirReader = entry.createReader();
                                    const readEntries = async () => {
                                        dirReader.readEntries(async (entries) => {
                                            if (entries.length === 0) {
                                                resolve();
                                            } else {
                                                // Use Promise.all to ensure all entries are processed
                                                const promises = entries.map(childEntry => {
                                                    const childPath = path ? `${path}/${entry.name}` : entry.name;
                                                    return readEntryContentsRecursively(childEntry, childPath);
                                                });
                                                
                                                await Promise.all(promises);
                                                
                                                // Continue reading more entries (handles >100 entries)
                                                readEntries();
                                            }
                                        }, () => resolve()); // Continue even if error occurs
                                    };
                                    
                                    readEntries();
                                } else {
                                    resolve();
                                }
                            });
                        };
                        
                        // Process all top-level entries in parallel
                        const entryPromises = fileEntries.map(entry => readEntryContentsRecursively(entry));
                        await Promise.all(entryPromises);
                    } else if (droppedFiles.length > 0) {
                        // Fall back to simple file list
                        allFiles = Array.from(droppedFiles);
                    }
                    
                    // Ensure all files have webkitRelativePath property
                    allFiles = allFiles.map(file => {
                        if (!file.webkitRelativePath) {
                            Object.defineProperty(file, 'webkitRelativePath', {
                                value: file.name
                            });
                        }
                        return file;
                    });
                    
                    // Process all collected files
                    if (allFiles.length > 0) {
                        handleReceivedFiles(allFiles);
                        
                        // Automatically switch to editor view on mobile
                        if (isMobile) {
                            setMobileView('editor');
                        }
                    } else {
                        setStatusMessage('未找到有效文件');
                        setTimeout(() => setStatusMessage('就绪'), 2000);
                    }
                } catch (error) {
                    console.error('处理拖放文件时出错:', error);
                    setStatusMessage('处理文件时出错');
                    setTimeout(() => setStatusMessage('就绪'), 2000);
                }
            } else if (droppedFiles.length > 0) {
                // Process file list directly
                handleReceivedFiles(Array.from(droppedFiles));
                
                // Automatically switch to editor view on mobile
                if (isMobile) {
                    setMobileView('editor');
                }
            } else {
                setStatusMessage('没有检测到文件或文件夹');
                setTimeout(() => setStatusMessage('就绪'), 2000);
            }
        }
    };
    
    // Add effect to reprocess files when extractContent changes
    useEffect(() => {
        // Check if extractContent changed and there are files to reprocess
        if (receivedFiles && !processing) {
            // Reprocess the current files
            processFiles(receivedFiles);
        }
    }, [extractContentProp]);
    
    return {
        // State
        fileStructure,
        filesContent,
        treeData,
        currentContent,
        filePositions,
        processing,
        progress,
        maxProgress,
        statusMessage,
        lineCount,
        charCount,
        isDragging,
        isEditing,
        currentEditingFile,
        isProcessingZip,
        zipProgress,
        
        // File operations
        processFiles,
        resetContent,
        cancelProcessing,
        copyContent,
        saveContent,
        handleLocalFolderSelect,
        handleReceivedFiles,
        handleFileTreeSelect,
        handleFileDelete,
        handleEditContent,
        dragDropHandlers,
        clearCache, // 清除缓存功能
        
        // Status info
        setStatusMessage
    };
};

// Export hooks
window.Hooks = window.Hooks || {};
window.Hooks.useFileManagement = useFileManagement;