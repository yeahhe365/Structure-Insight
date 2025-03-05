/**
 * Structure Insight Web - Main Application
 * Core application logic and state management
 */

const { useState, useEffect, useRef, useCallback } = React;
const { LineNumbers, HighlightedContent, FileTree, Resizer, ScrollToTop, SearchDialog } = window.Components;
const { Storage, FileUtils, SearchUtils, DOMUtils } = window.Utils;

// Main application component
const App = () => {
    // Load state from local storage
    const [isDarkTheme, setIsDarkTheme] = useState(Storage.load('theme', false));
    const [extractContent, setExtractContent] = useState(Storage.load('extractContent', true));
    const [fontSize, setFontSize] = useState(Storage.load('fontSize', 16));
    const [leftPanelWidth, setLeftPanelWidth] = useState(Storage.load('leftPanelWidth', 75));
    const [mobileView, setMobileView] = useState(Storage.load('mobileView', 'editor')); // 'editor' or 'tree'
    
    // Content state loaded from storage
    const [fileStructure, setFileStructure] = useState(Storage.load('fileStructure', ''));
    const [filesContent, setFilesContent] = useState(Storage.load('filesContent', []));
    const [treeData, setTreeData] = useState(Storage.load('treeData', []));
    const [currentContent, setCurrentContent] = useState(Storage.load('currentContent', ''));
    const [filePositions, setFilePositions] = useState(Storage.load('filePositions', {}));
    
    // Processing state
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [maxProgress, setMaxProgress] = useState(100);
    const [statusMessage, setStatusMessage] = useState('就绪');
    const [lineCount, setLineCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [lineHeight, setLineHeight] = useState(Math.round(fontSize * 1.5));
    
    // Device and view state
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    
    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditingFile, setCurrentEditingFile] = useState(null);
    const [editedContent, setEditedContent] = useState({});
    
    // History and UI state
    const [lastOpenedFiles, setLastOpenedFiles] = useState(Storage.load('lastOpenedFiles', null));
    const [isDragging, setIsDragging] = useState(false);
    const [receivedFiles, setReceivedFiles] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // Mobile UI optimization state
    const [scrollToTopVisible, setScrollToTopVisible] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    
    // Search state
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMatches, setSearchMatches] = useState([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [searchOptions, setSearchOptions] = useState({
        caseSensitive: false,
        useRegex: false,
        wholeWord: false
    });
    
    // References
    const containerRef = useRef(null);
    const editorScrollRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const appRef = useRef(null);
    const mobileToggleRef = useRef(null);
    const highlightedContentRef = useRef(null);

    //=========================================================================
    // EFFECTS & LIFECYCLE
    //=========================================================================

    // Detect device size and orientation
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            const newIsLandscape = window.innerWidth > window.innerHeight;
            
            setIsMobile(newIsMobile);
            setIsLandscape(newIsLandscape);
            
            // Special handling for tablets in landscape mode
            if (newIsMobile && newIsLandscape && window.innerWidth > 480) {
                document.documentElement.classList.add('tablet-landscape');
            } else {
                document.documentElement.classList.remove('tablet-landscape');
            }
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        // Initial run
        handleResize();
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);
    
    // Save current mobile view state
    useEffect(() => {
        if (isMobile) {
            Storage.save('mobileView', mobileView);
        }
    }, [mobileView, isMobile]);
    
    // Initialize line and character count from cached content
    useEffect(() => {
        if (currentContent) {
            const lines = currentContent.split('\n').length;
            const chars = currentContent.length;
            setLineCount(lines);
            setCharCount(chars);
            setStatusMessage(`就绪 - 共 ${lines} 行, ${chars} 字符`);
        }
    }, []);
    
    // Save state to local storage
    useEffect(() => {
        Storage.save('theme', isDarkTheme);
    }, [isDarkTheme]);
    
    useEffect(() => {
        Storage.save('extractContent', extractContent);
    }, [extractContent]);
    
    useEffect(() => {
        Storage.save('fontSize', fontSize);
    }, [fontSize]);
    
    useEffect(() => {
        Storage.save('leftPanelWidth', leftPanelWidth);
    }, [leftPanelWidth]);
    
    // Cache file content state
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
    
    // Calculate line height
    useEffect(() => {
        setLineHeight(Math.round(fontSize * 1.5));
    }, [fontSize]);

    // Calculate line and character count
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

    // Apply theme
    useEffect(() => {
        document.body.className = isDarkTheme ? 'dark-theme' : '';
    }, [isDarkTheme]);

    //=========================================================================
    // PANEL RESIZING
    //=========================================================================

    // Handle panel resize update
    const handleResizeUpdate = useCallback((newPercentage) => {
        setLeftPanelWidth(newPercentage);
    }, []);

    //=========================================================================
    // THEME AND UI CONTROLS
    //=========================================================================

    // Toggle theme
    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
    };

    // Handle mobile scroll
    const handleMobileScroll = useCallback(() => {
        if (!isMobile || !editorScrollRef.current) return;
        
        // Show/hide scroll to top button
        const scrollPosition = editorScrollRef.current.scrollTop;
        const showScrollButton = scrollPosition > 300;
        
        if (showScrollButton !== scrollToTopVisible) {
            setScrollToTopVisible(showScrollButton);
        }
        
        // Track scrolling state
        if (!isScrolling) {
            setIsScrolling(true);
            setTimeout(() => setIsScrolling(false), 100);
        }
    }, [isMobile, scrollToTopVisible, isScrolling]);

    // Mobile scroll event listener
    useEffect(() => {
        if (isMobile && editorScrollRef.current) {
            const editorElement = editorScrollRef.current;
            editorElement.addEventListener('scroll', handleMobileScroll);
            
            return () => {
                editorElement.removeEventListener('scroll', handleMobileScroll);
            };
        }
    }, [isMobile, editorScrollRef, handleMobileScroll]);

    // Scroll to top method
    const scrollToTop = () => {
        if (editorScrollRef.current) {
            editorScrollRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    // Handle view toggle button click animation
    const handleViewToggleClick = () => {
        // Add animation class
        if (mobileToggleRef.current) {
            mobileToggleRef.current.classList.add('clicked');
            setTimeout(() => {
                if (mobileToggleRef.current) {
                    mobileToggleRef.current.classList.remove('clicked');
                }
            }, 300);
        }
        
        // Add animation effect
        setIsTransitioning(true);
        setTimeout(() => {
            setMobileView(prev => prev === 'editor' ? 'tree' : 'editor');
            // Delay ending animation state to match CSS transition time
            setTimeout(() => setIsTransitioning(false), 300);
        }, 50);
    };

    // Toggle mobile view - enhanced version with animation
    const toggleMobileView = useCallback(() => {
        handleViewToggleClick();
    }, [mobileToggleRef]);

    // Font size adjustment
    const increaseFontSize = () => {
        if (fontSize < 28) setFontSize(fontSize + 2);
    };

    const decreaseFontSize = () => {
        if (fontSize > 12) setFontSize(fontSize - 2);
    };

    //=========================================================================
    // FILE HANDLING FUNCTIONS
    //=========================================================================

    // Select local folder using File System Access API
    const handleLocalFolderSelect = () => {
        // Use showDirectoryPicker API
        if (window.showDirectoryPicker) {
            showDirectoryPicker()
                .then(async (dirHandle) => {
                    const files = [];
                    
                    // Recursively read all files in the folder
                    async function readFilesRecursively(dirHandle, path = '') {
                        for await (const entry of dirHandle.values()) {
                            if (entry.kind === 'file') {
                                const file = await entry.getFile();
                                // Add relative path information to file
                                Object.defineProperty(file, 'webkitRelativePath', {
                                    value: path ? `${path}/${entry.name}` : entry.name
                                });
                                files.push(file);
                            } else if (entry.kind === 'directory') {
                                const newPath = path ? `${path}/${entry.name}` : entry.name;
                                await readFilesRecursively(entry, newPath);
                            }
                        }
                    }
                    
                    try {
                        await readFilesRecursively(dirHandle, dirHandle.name);
                        // Process files
                        handleReceivedFiles(files);
                    } catch (error) {
                        console.error('读取文件夹时出错:', error);
                        setStatusMessage('读取文件夹失败');
                        setTimeout(() => setStatusMessage('就绪'), 2000);
                    }
                })
                .catch(error => {
                    // User canceled selection or error occurred
                    console.log('选择文件夹取消或失败:', error);
                });
        } else {
            // Browser doesn't support File System Access API
            setStatusMessage('您的浏览器不支持文件夹选择，请使用拖放功能');
            setTimeout(() => setStatusMessage('就绪'), 3000);
        }
    };

    // Handle received files
    const handleReceivedFiles = (files) => {
        if (files && files.length > 0) {
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
            
            // Automatically switch to editor view on mobile
            if (isMobile) {
                setMobileView('editor');
            }
        }
    };

    //=========================================================================
    // DRAG AND DROP HANDLERS
    //=========================================================================

    // Drag enter handler
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isEditing) {
            setIsDragging(true);
        }
    };

    // Drag over handler
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isEditing) {
            setIsDragging(true);
        }
    };

    // Drag leave handler
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    // Drop handler - fixed version to handle folder recursion properly
    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        if (isEditing) return;

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
        } else {
            setStatusMessage('没有检测到文件或文件夹');
            setTimeout(() => setStatusMessage('就绪'), 2000);
        }
    };

    //=========================================================================
    // FILE PROCESSING FUNCTIONS
    //=========================================================================

    // Process files
    const processFiles = async (files) => {
        if (!files || files.length === 0) return;
        
        resetContent();
        setProcessing(true);
        setStatusMessage('处理中...');
        
        // Convert FileList to array
        const filesArray = Array.from(files);
        setMaxProgress(filesArray.length);
        
        // First process directory structure
        const structure = FileUtils.buildFileStructure(filesArray);
        setFileStructure(structure);
        
        // Create initial content
        let fullContent = `文件结构:\n${structure}\n\n`;
        if (extractContent) {
            fullContent += "文件内容:\n";
        }
        setCurrentContent(fullContent);
        
        // Build tree data
        const tree = FileUtils.buildTreeData(filesArray);
        setTreeData(tree);
        
        // Process each file
        const fileContents = [];
        const positions = {};
        let currentPosition = fullContent.length;
        let processedCount = 0;
        
        for (const file of filesArray) {
            if (file.type.startsWith('text/') || 
                file.name.endsWith('.js') || 
                file.name.endsWith('.jsx') ||
                file.name.endsWith('.ts') ||
                file.name.endsWith('.tsx') ||
                file.name.endsWith('.json') ||
                file.name.endsWith('.md') ||
                file.name.endsWith('.py') ||
                file.name.endsWith('.html') ||
                file.name.endsWith('.css') ||
                file.name.endsWith('.scss') ||
                file.name.endsWith('.less') ||
                file.name.endsWith('.xml') ||
                file.name.endsWith('.yml') ||
                file.name.endsWith('.yaml') ||
                file.name.endsWith('.java') ||
                file.name.endsWith('.c') ||
                file.name.endsWith('.cpp') ||
                file.name.endsWith('.h') ||
                file.name.endsWith('.cs') ||
                file.name.endsWith('.php') ||
                file.name.endsWith('.sql') ||
                file.name.endsWith('.sh') ||
                file.name.endsWith('.rb') ||
                file.name.endsWith('.go')) {
                
                try {
                    // Read file content
                    const content = await FileUtils.readFileContent(file);
                    fileContents.push({ name: file.name, content });
                    
                    // Add to main content
                    if (extractContent) {
                        const separator = `${'='.repeat(40)}\n文件名: ${file.name}\n${'-'.repeat(71)}\n`;
                        
                        // Record current file position in global content
                        positions[file.name] = currentPosition;
                        currentPosition += separator.length + content.length + 2; // Add separator, content, and newlines
                        
                        // Use functional update to ensure latest state
                        setCurrentContent(prev => {
                            const newContent = prev + separator + content + "\n\n";
                            return newContent;
                        });
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
        
        setFilesContent(fileContents);
        setFilePositions(positions);
        setProcessing(false);
        
        // Update status bar info with latest line and character count
        setTimeout(() => {
            setStatusMessage(`就绪 - 共 ${document.querySelectorAll('.line-numbers > div').length} 行, ${currentContent.length} 字符`);
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

    //=========================================================================
    // CONTENT MANAGEMENT FUNCTIONS
    //=========================================================================

    // Copy content
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

    // Save content
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

    // Reset content
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
        
        // Clear search state
        clearSearchHighlights();
        setSearchMatches([]);
        setCurrentMatchIndex(0);
        
        // Clear cache
        Storage.remove('fileStructure');
        Storage.remove('filesContent');
        Storage.remove('treeData');
        Storage.remove('currentContent');
        Storage.remove('filePositions');
    };

    // Cancel processing
    const cancelProcessing = () => {
        if (!processing) return;
        
        setProcessing(false);
        setStatusMessage('已取消');
        setTimeout(() => {
            setStatusMessage('就绪');
        }, 2000);
    };

    //=========================================================================
    // FILE TREE INTERACTION
    //=========================================================================

    // File tree selection handler
    const handleFileTreeSelect = (node) => {
        if (!node || !node.name) return;
        
        // Exit edit mode without dialog
        if (isEditing) {
            setIsEditing(false);
            setCurrentEditingFile(null);
        }
        
        if (filePositions[node.name]) {
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
            
            // Scroll to file position
            const position = filePositions[node.name];
            const targetElement = editorScrollRef.current;
            
            if (targetElement) {
                // Calculate approximate scroll position
                const textBeforePosition = currentContent.substring(0, position);
                const linesBefore = textBeforePosition.split('\n').length;
                
                // Estimate scroll position
                const scrollPosition = linesBefore * lineHeight;
                
                // Use smooth scrolling on mobile for better experience
                if (isMobile) {
                    targetElement.scrollTo({
                        top: scrollPosition,
                        behavior: 'smooth'
                    });
                } else {
                    targetElement.scrollTop = scrollPosition;
                }
                
                // Update status message
                setStatusMessage(`已跳转到: ${node.name}`);
                setTimeout(() => {
                    setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
                }, 2000);
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
        
        // Update text content
        if (filePositions[node.name] && extractContent) {
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

    //=========================================================================
    // FILE EDITING FUNCTIONS
    //=========================================================================

    // Handle file content editing
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
            
            // Update complete content string
            if (filePositions[fileName]) {
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
                    
                    // Update positions of subsequent files
                    const updatedPositions = { ...filePositions };
                    Object.keys(updatedPositions).forEach(name => {
                        if (updatedPositions[name] > position + oldContent.length) {
                            updatedPositions[name] += lengthDifference;
                        }
                    });
                    setFilePositions(updatedPositions);
                    
                    // Exit edit mode
                    setIsEditing(false);
                    setCurrentEditingFile(null);
                    
                    // Update status info
                    setStatusMessage(`已保存修改: ${fileName}`);
                    setTimeout(() => {
                        setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
                    }, 2000);
                }
            }
        }
    };

    // Edit specific file
    const editFile = (fileName) => {
        if (!fileName || isEditing) return;
        
        // Find file content
        const fileData = filesContent.find(f => f.name === fileName);
        if (fileData) {
            setCurrentEditingFile(fileName);
            setIsEditing(true);
        }
    };

    //=========================================================================
    // SEARCH FUNCTIONS
    //=========================================================================

    // Open search dialog
    const openSearchDialog = () => {
        if (!currentContent) return;
        
        // Ensure editor view on mobile
        if (isMobile && mobileView !== 'editor') {
            setIsTransitioning(true);
            setTimeout(() => {
                setMobileView('editor');
                setTimeout(() => {
                    setIsTransitioning(false);
                    setIsSearchDialogOpen(true);
                }, 300);
            }, 50);
        } else {
            setIsSearchDialogOpen(true);
        }
    };
    
    // Close search dialog
    const closeSearchDialog = () => {
        setIsSearchDialogOpen(false);
    };
    
    // Clear search highlights
    const clearSearchHighlights = () => {
        // Skip if not in DOM
        if (!editorScrollRef.current) return;
        
        // Use more efficient approach to remove all highlights
        const highlights = editorScrollRef.current.querySelectorAll('.search-highlight');
        
        if (highlights.length === 0) return;
        
        // Optimize: batch DOM operations
        const fragment = document.createDocumentFragment();
        const toReplace = [];
        
        highlights.forEach(el => {
            toReplace.push({
                element: el,
                text: el.textContent
            });
        });
        
        // Perform replacements
        toReplace.forEach(item => {
            const parent = item.element.parentNode;
            if (parent) {
                // Replace highlight element with text node
                parent.replaceChild(document.createTextNode(item.text), item.element);
                // Normalize text nodes, merging adjacent ones
                parent.normalize();
            }
        });
    };
    
    // Perform search with optimizations
    const performSearch = (query, options = {}) => {
        if (!query || !currentContent) {
            setSearchMatches([]);
            setCurrentMatchIndex(0);
            clearSearchHighlights();
            return;
        }
        
        // Save search parameters
        setSearchQuery(query);
        setSearchOptions(options);
        
        // Prepare search content and matches
        const content = currentContent;
        let matches = [];
        
        try {
            // Find all matches using utility function
            matches = SearchUtils.performSearch(content, query, options);
        } catch (error) {
            console.error('Search error:', error);
            setStatusMessage(`搜索错误: ${error.message}`);
            setTimeout(() => {
                setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
            }, 2000);
            return;
        }
        
        // Update search results
        setSearchMatches(matches);
        
        // If matches found, highlight and scroll to first match
        if (matches.length > 0) {
            setCurrentMatchIndex(0);
            highlightMatches(matches, 0);
            scrollToMatch(matches[0]);
            setStatusMessage(`找到 ${matches.length} 个匹配结果`);
        } else {
            setCurrentMatchIndex(-1);
            clearSearchHighlights();
            setStatusMessage(`未找到匹配项: "${query}"`);
            setTimeout(() => {
                setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
            }, 2000);
        }
    };
    
    // Highlight matches - optimized version
    const highlightMatches = (matches, currentIndex) => {
        if (!editorScrollRef.current || !matches.length) return;
        
        // First clear previous highlights
        clearSearchHighlights();
        
        // Use DOM interface to add highlights
        const range = document.createRange();
        
        // Batch processing of highlights
        const batchSize = 50; // Process 50 matches at a time to avoid blocking UI
        let processed = 0;
        
        const processNextBatch = () => {
            const startIdx = processed;
            const endIdx = Math.min(processed + batchSize, matches.length);
            
            for (let i = startIdx; i < endIdx; i++) {
                const match = matches[i];
                
                // Convert match position to DOM node context
                DOMUtils.findTextNodes(editorScrollRef.current, match.start, match.end, (textNode, startOffset, endOffset) => {
                    try {
                        range.setStart(textNode, startOffset);
                        range.setEnd(textNode, endOffset);
                        
                        // Create highlight element
                        const highlight = document.createElement('span');
                        highlight.className = `search-highlight ${i === currentIndex ? 'current' : ''}`;
                        
                        // Wrap text with highlight element
                        range.surroundContents(highlight);
                    } catch (e) {
                        // Ignore highlighting errors, usually due to DOM structure changes
                    }
                });
            }
            
            processed = endIdx;
            
            // If more matches remain, schedule next batch
            if (processed < matches.length) {
                requestAnimationFrame(processNextBatch);
            }
        };
        
        // Start batch processing
        processNextBatch();
    };
    
    // Scroll to match
    const scrollToMatch = (match) => {
        if (!match || !editorScrollRef.current) return;
        
        // Calculate approximate line number of match
        const textBeforeMatch = currentContent.substring(0, match.start);
        const linesBefore = textBeforeMatch.split('\n').length;
        
        // Estimate scroll position - center the match in view
        const scrollPosition = linesBefore * lineHeight - editorScrollRef.current.clientHeight / 3;
        
        // Scroll to position
        editorScrollRef.current.scrollTo({
            top: Math.max(0, scrollPosition),
            behavior: 'smooth'
        });
        
        // Enhanced visual feedback
        setTimeout(() => {
            const currentHighlight = editorScrollRef.current.querySelector('.search-highlight.current');
            if (currentHighlight) {
                currentHighlight.classList.add('blink');
                setTimeout(() => {
                    if (currentHighlight) {
                        currentHighlight.classList.remove('blink');
                    }
                }, 600);
            }
        }, 300);
    };
    
    // Go to next match
    const goToNextMatch = () => {
        const { length } = searchMatches;
        if (length === 0) return;
        
        const newIndex = (currentMatchIndex + 1) % length;
        setCurrentMatchIndex(newIndex);
        highlightMatches(searchMatches, newIndex);
        scrollToMatch(searchMatches[newIndex]);
    };
    
    // Go to previous match
    const goToPreviousMatch = () => {
        const { length } = searchMatches;
        if (length === 0) return;
        
        const newIndex = (currentMatchIndex - 1 + length) % length;
        setCurrentMatchIndex(newIndex);
        highlightMatches(searchMatches, newIndex);
        scrollToMatch(searchMatches[newIndex]);
    };
    
    // Clear search state when content changes
    useEffect(() => {
        if (searchMatches.length > 0) {
            clearSearchHighlights();
            setSearchMatches([]);
            setCurrentMatchIndex(0);
        }
    }, [currentContent]);

    //=========================================================================
    // KEYBOARD SHORTCUTS
    //=========================================================================

    // Set up keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+F Search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                openSearchDialog();
            }
            
            // Ctrl+S Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveContent();
            }
            
            // Ctrl+C Copy
            if (e.ctrlKey && e.key === 'c' && !window.getSelection().toString()) {
                // Only trigger global copy if no text is selected
                copyContent();
            }
            
            // Esc Exit edit mode
            if (e.key === 'Escape' && isEditing) {
                e.preventDefault();
                setIsEditing(false);
                setCurrentEditingFile(null);
            }
            
            // F3 Find next
            if ((e.key === 'F3' || (e.ctrlKey && e.key === 'g')) && searchMatches.length > 0) {
                e.preventDefault();
                if (e.shiftKey) {
                    goToPreviousMatch();
                } else {
                    goToNextMatch();
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentContent, isEditing, processing, searchMatches, currentMatchIndex]);

    //=========================================================================
    // SYNCHRONIZATION AND EVENT LISTENERS
    //=========================================================================

    // Sync line numbers with content scrolling
    useEffect(() => {
        const syncScroll = () => {
            if (editorScrollRef.current && lineNumbersRef.current) {
                lineNumbersRef.current.scrollTop = editorScrollRef.current.scrollTop;
            }
        };
        
        const editorElement = editorScrollRef.current;
        if (editorElement) {
            // Add scroll event listener
            editorElement.addEventListener('scroll', syncScroll);
            
            // Use ResizeObserver to monitor size changes
            if (typeof ResizeObserver !== 'undefined') {
                const observer = new ResizeObserver(syncScroll);
                observer.observe(editorElement);
                
                // Also observe container size changes
                if (containerRef.current) {
                    observer.observe(containerRef.current);
                }
                
                return () => {
                    editorElement.removeEventListener('scroll', syncScroll);
                    observer.disconnect();
                };
            } else {
                // Fallback: listen to window resize
                window.addEventListener('resize', syncScroll);
                return () => {
                    editorElement.removeEventListener('scroll', syncScroll);
                    window.removeEventListener('resize', syncScroll);
                };
            }
        }
    }, [editorScrollRef.current, lineNumbersRef.current, containerRef.current]);
    
    // Force sync scrolling after divider adjustment
    useEffect(() => {
        // Force sync scrolling
        if (editorScrollRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = editorScrollRef.current.scrollTop;
        }
    }, [leftPanelWidth]);

    // Set up drag and drop event listeners
    useEffect(() => {
        const app = document.getElementById('app');
        if (app) {
            app.addEventListener('dragenter', handleDragEnter);
            app.addEventListener('dragover', handleDragOver);
            app.addEventListener('dragleave', handleDragLeave);
            app.addEventListener('drop', handleDrop);
            
            return () => {
                app.removeEventListener('dragenter', handleDragEnter);
                app.removeEventListener('dragover', handleDragOver);
                app.removeEventListener('dragleave', handleDragLeave);
                app.removeEventListener('drop', handleDrop);
            };
        }
    }, [isEditing]);

    // Check if scroll-to-top button should be shown when content length changes
    useEffect(() => {
        if (isMobile && editorScrollRef.current) {
            const scrollHeight = editorScrollRef.current.scrollHeight;
            const clientHeight = editorScrollRef.current.clientHeight;
            
            // Only enable scroll button when content is long enough
            setScrollToTopVisible(scrollHeight > clientHeight * 1.5);
        }
    }, [isMobile, currentContent, editorScrollRef]);

    //=========================================================================
    // RENDERING HELPERS
    //=========================================================================

    // Mobile class names
    const getLeftPanelClassNames = () => {
        if (!isMobile) return '';
        const classNames = [
            mobileView === 'editor' ? 'mobile-full' : 'mobile-hidden'
        ];
        if (isTransitioning) classNames.push('mobile-transition');
        return classNames.join(' ');
    };
    
    const getRightPanelClassNames = () => {
        if (!isMobile) return '';
        const classNames = [
            mobileView === 'tree' ? 'mobile-full' : 'mobile-hidden'
        ];
        if (isTransitioning) classNames.push('mobile-transition');
        return classNames.join(' ');
    };

    // Special handling for tablet devices
    const isTabletLandscape = isMobile && isLandscape && window.innerWidth > 480;

    //=========================================================================
    // MAIN RENDER
    //=========================================================================

    return (
        <>
            {/* Header with integrated buttons */}
            <div className="app-header">
                <div className="app-logo">
                    <img src="favicon_io/android-chrome-192x192.png" alt="Structure Insight Logo" />
                    <span>Structure Insight Web</span>
                    
                    {/* Mobile device controls in title bar */}
                    {isMobile && (
                        <div className="mobile-title-controls">
                            <button 
                                className="header-button font-size-button" 
                                onClick={decreaseFontSize}
                                title="减小字体"
                            >
                                <i className="fas fa-minus"></i>
                            </button>
                            <span className="font-size-display-mobile">{fontSize}</span>
                            <button 
                                className="header-button font-size-button" 
                                onClick={increaseFontSize}
                                title="增大字体"
                            >
                                <i className="fas fa-plus"></i>
                            </button>
                            
                            <button 
                                className="header-button theme-button" 
                                onClick={toggleTheme}
                                title="在深色和浅色主题之间切换"
                            >
                                {isDarkTheme ? 
                                    <i className="fas fa-sun"></i> : 
                                    <i className="fas fa-moon"></i>}
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="header-buttons">
                    <button 
                        className="header-button" 
                        onClick={handleLocalFolderSelect}
                        title="选择一个文件夹开始分析"
                        disabled={isEditing}
                    >
                        <i className="fas fa-folder-open"></i>
                        {isMobile && <span className="tooltip">选择文件夹</span>}
                    </button>
                    <button 
                        className="header-button" 
                        onClick={copyContent} 
                        disabled={!currentContent || isEditing}
                        title="复制全部内容到剪贴板"
                    >
                        <i className="fas fa-copy"></i>
                        {isMobile && <span className="tooltip">复制内容</span>}
                    </button>
                    <button 
                        className="header-button" 
                        onClick={saveContent} 
                        disabled={!currentContent || isEditing}
                        title="将内容保存为文本文件"
                    >
                        <i className="fas fa-save"></i>
                        {isMobile && <span className="tooltip">保存文件</span>}
                    </button>
                    <button 
                        className="header-button" 
                        onClick={resetContent} 
                        disabled={!currentContent || processing}
                        title="清空当前结果并重置"
                    >
                        <i className="fas fa-redo"></i>
                        {isMobile && <span className="tooltip">重置</span>}
                    </button>
                    <button 
                        className="header-button" 
                        onClick={cancelProcessing} 
                        disabled={!processing}
                        title="取消当前处理"
                    >
                        <i className="fas fa-stop"></i>
                        {isMobile && <span className="tooltip">取消</span>}
                    </button>
                    <button
                        className="header-button"
                        onClick={openSearchDialog}
                        disabled={!currentContent || isEditing}
                        title="搜索内容 (Ctrl+F)"
                    >
                        <i className="fas fa-search"></i>
                        {isMobile && <span className="tooltip">搜索</span>}
                    </button>
                    
                    <div className="header-controls">
                        {/* Extract content toggle button */}
                        <button 
                            className={`header-button extract-content-button ${extractContent ? 'active' : ''}`}
                            onClick={() => setExtractContent(!extractContent)}
                            disabled={processing || isEditing}
                            title={extractContent ? "关闭文件内容提取" : "开启文件内容提取"}
                        >
                            <i className="fas fa-code"></i>
                            {isMobile && <span className="tooltip">{extractContent ? "关闭提取" : "开启提取"}</span>}
                        </button>
                        
                        {/* Font size controls - desktop only */}
                        {!isMobile && (
                            <div className="font-size-controls">
                                <button 
                                    className="header-button font-size-button" 
                                    onClick={decreaseFontSize}
                                    title="减小字体"
                                >
                                    <i className="fas fa-minus"></i>
                                </button>
                                <span className="font-size-display">{fontSize}px</span>
                                <button 
                                    className="header-button font-size-button" 
                                    onClick={increaseFontSize}
                                    title="增大字体"
                                >
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Theme button - desktop only */}
                    {!isMobile && (
                        <button 
                            className="header-button theme-button" 
                            onClick={toggleTheme}
                            title="在深色和浅色主题之间切换"
                        >
                            {isDarkTheme ? 
                                <i className="fas fa-sun"></i> : 
                                <i className="fas fa-moon"></i>}
                        </button>
                    )}
                </div>
            </div>
            
            <div 
                className={`container ${isDragging ? 'dragging' : ''}`} 
                ref={containerRef}
            >
                <div 
                    className={`left-panel ${getLeftPanelClassNames()}`} 
                    style={!isMobile || isTabletLandscape ? { width: `${leftPanelWidth}%` } : {}}
                >
                    <div className="code-editor">
                        <LineNumbers 
                            ref={lineNumbersRef}
                            content={currentContent} 
                            lineHeight={lineHeight}
                            fontSize={fontSize}
                        />
                        <div 
                            ref={editorScrollRef}
                            className="highlighted-content" 
                            style={{ 
                                fontSize: `${fontSize}px`,
                                lineHeight: `${lineHeight}px` 
                            }}
                        >
                            <HighlightedContent 
                                content={currentContent}
                                fontSize={fontSize}
                                lineHeight={lineHeight}
                                isEditing={isEditing}
                                currentEditingFile={currentEditingFile}
                                onEditContent={handleEditContent}
                            />
                        </div>
                    </div>
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${Math.min(100, (progress / Math.max(1, maxProgress)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                
                {/* Resizable divider - only for non-mobile or tablet landscape */}
                {(!isMobile || isTabletLandscape) && (
                    <Resizer 
                        onResize={handleResizeUpdate} 
                        position={leftPanelWidth}
                        isVertical={true}
                    />
                )}
                
                <div 
                    className={`right-panel ${getRightPanelClassNames()}`}
                    style={!isMobile || isTabletLandscape ? { width: `${100 - leftPanelWidth}%` } : {}}
                >
                    <FileTree 
                        nodes={treeData} 
                        onFileSelect={handleFileTreeSelect}
                        onFileDelete={handleFileDelete}
                    />
                </div>
            </div>
            
            <div className="status-bar">
                {processing ? statusMessage : `${statusMessage} - 共 ${lineCount} 行, ${charCount} 字符`}
                {isEditing && !processing && " - 编辑模式"}
                {searchMatches.length > 0 && !processing && !isEditing && 
                    ` - 找到 ${searchMatches.length} 个匹配项 (${currentMatchIndex + 1}/${searchMatches.length})`}
            </div>
            
            {/* Mobile view toggle button */}
            {isMobile && !isTabletLandscape && (
                <button 
                    ref={mobileToggleRef}
                    className="view-toggle"
                    onClick={toggleMobileView}
                    title={mobileView === 'editor' ? "切换到文件列表" : "切换到编辑器"}
                >
                    {mobileView === 'editor' ? 
                        <i className="fas fa-folder"></i> : 
                        <i className="fas fa-file-alt"></i>}
                </button>
            )}

            {/* Drop overlay */}
            {isDragging && (
                <div className="drop-overlay">
                    <div className="drop-message">
                        <i className="fas fa-upload"></i>
                        <span>释放鼠标以导入文件夹</span>
                    </div>
                </div>
            )}
            
            {/* Initial prompt */}
            {!currentContent && !processing && (
                <div className="initial-prompt">
                    <div className="prompt-content">
                        <i className="fas fa-folder-open"></i>
                        <p>拖放文件夹到此处，或点击左上角的文件夹图标</p>
                    </div>
                </div>
            )}
            
            {/* Mobile scroll to top button */}
            {isMobile && (
                <ScrollToTop targetRef={editorScrollRef} />
            )}
            
            {/* Search dialog */}
            <SearchDialog 
                isOpen={isSearchDialogOpen}
                onClose={closeSearchDialog}
                onSearch={performSearch}
                onNext={goToNextMatch}
                onPrevious={goToPreviousMatch}
                resultCount={searchMatches.length}
                currentMatchIndex={currentMatchIndex < 0 ? 0 : currentMatchIndex}
                initialQuery={searchQuery}
            />
            
            {/* Quick search button */}
            {currentContent && !isEditing && !isSearchDialogOpen && (
                <button 
                    className="quick-search-button"
                    onClick={openSearchDialog}
                    title="搜索 (Ctrl+F)"
                >
                    <i className="fas fa-search"></i>
                </button>
            )}
        </>
    );
};

// Render the application
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);