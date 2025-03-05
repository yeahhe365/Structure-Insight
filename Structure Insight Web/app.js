const { useState, useEffect, useRef, useCallback } = React;
const { LineNumbers, HighlightedContent, FileTree, Resizer } = window.Components;
const { Storage, detectLanguage } = window.Utils;

// 主应用组件
const App = () => {
    // 从本地存储加载状态
    const [isDarkTheme, setIsDarkTheme] = useState(Storage.load('theme', false));
    const [extractContent, setExtractContent] = useState(Storage.load('extractContent', true));
    const [fontSize, setFontSize] = useState(Storage.load('fontSize', 16));
    const [leftPanelWidth, setLeftPanelWidth] = useState(Storage.load('leftPanelWidth', 75));
    const [mobileView, setMobileView] = useState('editor'); // 'editor' 或 'tree'
    
    // 新增：从本地存储加载内容状态
    const [fileStructure, setFileStructure] = useState(Storage.load('fileStructure', ''));
    const [filesContent, setFilesContent] = useState(Storage.load('filesContent', []));
    const [treeData, setTreeData] = useState(Storage.load('treeData', []));
    const [currentContent, setCurrentContent] = useState(Storage.load('currentContent', ''));
    const [filePositions, setFilePositions] = useState(Storage.load('filePositions', {}));
    
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [maxProgress, setMaxProgress] = useState(100);
    const [statusMessage, setStatusMessage] = useState('就绪');
    const [lineCount, setLineCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [lineHeight, setLineHeight] = useState(Math.round(fontSize * 1.5));
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    // 新增的编辑相关状态
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditingFile, setCurrentEditingFile] = useState(null);
    const [editedContent, setEditedContent] = useState({});
    
    // 新增：记录最后打开的文件夹
    const [lastOpenedFiles, setLastOpenedFiles] = useState(Storage.load('lastOpenedFiles', null));
    
    // 新增：拖放状态
    const [isDragging, setIsDragging] = useState(false);
    // 新增：接收的文件对象
    const [receivedFiles, setReceivedFiles] = useState(null);
    
    const containerRef = useRef(null);
    const editorScrollRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const appRef = useRef(null);

    // 检测设备大小
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // 新增：初始化行数和字符数（根据缓存的内容）
    useEffect(() => {
        if (currentContent) {
            const lines = currentContent.split('\n').length;
            const chars = currentContent.length;
            setLineCount(lines);
            setCharCount(chars);
            setStatusMessage(`就绪 - 共 ${lines} 行, ${chars} 字符`);
        }
    }, []);
    
    // 保存状态到本地存储
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
    
    // 新增：缓存文件内容状态
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
    
    // 计算行高
    useEffect(() => {
        setLineHeight(Math.round(fontSize * 1.5));
    }, [fontSize]);

    // 计算行数和字符数
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

    // 应用主题
    useEffect(() => {
        document.body.className = isDarkTheme ? 'dark-theme' : '';
    }, [isDarkTheme]);

    // 处理左右面板分割线拖动
    const handleHorizontalResize = useCallback((clientX) => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const newLeftPanelWidth = (clientX / containerWidth) * 100;
            // 限制最小宽度
            if (newLeftPanelWidth > 20 && newLeftPanelWidth < 85) {
                setLeftPanelWidth(newLeftPanelWidth);
            }
        }
    }, []);
    
    // 处理上下面板分割线拖动
    const handleVerticalResize = useCallback((clientY) => {
        if (containerRef.current) {
            const containerHeight = containerRef.current.offsetHeight;
            const newTopPanelHeight = (clientY / containerHeight) * 100;
            // 限制最小高度
            if (newTopPanelHeight > 20 && newTopPanelHeight < 80) {
                setLeftPanelWidth(newTopPanelHeight);
            }
        }
    }, []);

    // 切换主题
    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
    };

    // 切换移动视图
    const toggleMobileView = () => {
        setMobileView(mobileView === 'editor' ? 'tree' : 'editor');
    };

    // 字体大小调整
    const increaseFontSize = () => {
        if (fontSize < 28) setFontSize(fontSize + 2);
    };

    const decreaseFontSize = () => {
        if (fontSize > 12) setFontSize(fontSize - 2);
    };

    // 新增：通过File API读取本地文件夹
    const handleLocalFolderSelect = () => {
        // 使用showDirectoryPicker API代替input元素
        if (window.showDirectoryPicker) {
            showDirectoryPicker()
                .then(async (dirHandle) => {
                    const files = [];
                    
                    // 递归读取文件夹中的所有文件
                    async function readFilesRecursively(dirHandle, path = '') {
                        for await (const entry of dirHandle.values()) {
                            if (entry.kind === 'file') {
                                const file = await entry.getFile();
                                // 为文件添加相对路径信息
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
                        // 处理文件
                        handleReceivedFiles(files);
                    } catch (error) {
                        console.error('读取文件夹时出错:', error);
                        setStatusMessage('读取文件夹失败');
                        setTimeout(() => setStatusMessage('就绪'), 2000);
                    }
                })
                .catch(error => {
                    // 用户取消选择或发生错误
                    console.log('选择文件夹取消或失败:', error);
                });
        } else {
            // 浏览器不支持 File System Access API
            setStatusMessage('您的浏览器不支持文件夹选择，请使用拖放功能');
            setTimeout(() => setStatusMessage('就绪'), 3000);
        }
    };

    // 新增：处理接收到的文件
    const handleReceivedFiles = (files) => {
        if (files && files.length > 0) {
            // 保存文件引用以便刷新
            setReceivedFiles(files);
            
            try {
                // 保存一些基本信息到lastOpenedFiles
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
            
            // 处理文件
            processFiles(files);
        }
    };

    // 新增：拖放处理函数
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isEditing) {
            setIsDragging(true);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isEditing) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    // 修复版本：完全重写handleDrop函数，修复文件夹递归处理的问题
    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        if (isEditing) return;

        // 显示正在处理中的状态
        setStatusMessage('正在处理拖放的文件...');
        
        // 获取拖放的文件和项目
        const items = e.dataTransfer.items;
        const droppedFiles = e.dataTransfer.files;
        let allFiles = [];
        
        // 检查是否有文件夹项目
        if (items && items.length > 0) {
            // 使用更可靠的方法处理文件夹
            try {
                const fileEntries = [];
                
                // 收集所有文件入口点
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
                    
                    if (entry) {
                        fileEntries.push(entry);
                    }
                }
                
                // 如果有entry则使用entry API，否则使用files API
                if (fileEntries.length > 0) {
                    // 递归读取所有文件
                    const readEntryContentsRecursively = async (entry, path = '') => {
                        return new Promise(async (resolve) => {
                            if (entry.isFile) {
                                entry.file(file => {
                                    // 添加相对路径以匹配webkitdirectory的行为
                                    Object.defineProperty(file, 'webkitRelativePath', {
                                        value: path ? `${path}/${entry.name}` : entry.name
                                    });
                                    allFiles.push(file);
                                    resolve();
                                }, () => resolve()); // 如果出错也要继续
                            } else if (entry.isDirectory) {
                                const dirReader = entry.createReader();
                                const readEntries = async () => {
                                    dirReader.readEntries(async (entries) => {
                                        if (entries.length === 0) {
                                            resolve();
                                        } else {
                                            // 使用Promise.all确保所有子条目都被处理
                                            const promises = entries.map(childEntry => {
                                                const childPath = path ? `${path}/${entry.name}` : entry.name;
                                                return readEntryContentsRecursively(childEntry, childPath);
                                            });
                                            
                                            await Promise.all(promises);
                                            
                                            // 继续读取更多条目（处理超过100个条目的情况）
                                            readEntries();
                                        }
                                    }, () => resolve()); // 如果出错也要继续
                                };
                                
                                readEntries();
                            } else {
                                resolve();
                            }
                        });
                    };
                    
                    // 并行处理所有顶级条目
                    const entryPromises = fileEntries.map(entry => readEntryContentsRecursively(entry));
                    await Promise.all(entryPromises);
                } else if (droppedFiles.length > 0) {
                    // 退回到简单文件列表
                    allFiles = Array.from(droppedFiles);
                }
                
                // 确保所有文件都有webkitRelativePath属性
                allFiles = allFiles.map(file => {
                    if (!file.webkitRelativePath) {
                        Object.defineProperty(file, 'webkitRelativePath', {
                            value: file.name
                        });
                    }
                    return file;
                });
                
                // 处理所有收集到的文件
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
            // 直接处理文件列表
            handleReceivedFiles(Array.from(droppedFiles));
        } else {
            setStatusMessage('没有检测到文件或文件夹');
            setTimeout(() => setStatusMessage('就绪'), 2000);
        }
    };

    // 处理文件
    const processFiles = async (files) => {
        if (!files || files.length === 0) return;
        
        resetContent();
        setProcessing(true);
        setStatusMessage('处理中...');
        
        // 转换FileList为数组
        const filesArray = Array.from(files);
        setMaxProgress(filesArray.length);
        
        // 先处理目录结构
        const structure = buildFileStructure(filesArray);
        setFileStructure(structure);
        
        // 创建初始内容
        let fullContent = `文件结构:\n${structure}\n\n`;
        if (extractContent) {
            fullContent += "文件内容:\n";
        }
        setCurrentContent(fullContent);
        
        // 构建树形数据
        const tree = buildTreeData(filesArray);
        setTreeData(tree);
        
        // 处理每个文件
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
                    // 读取文件内容
                    const content = await readFileContent(file);
                    fileContents.push({ name: file.name, content });
                    
                    // 添加到主内容
                    if (extractContent) {
                        const separator = `${'='.repeat(40)}\n文件名: ${file.name}\n${'-'.repeat(71)}\n`;
                        
                        // 记录当前文件在全局内容中的位置
                        positions[file.name] = currentPosition;
                        currentPosition += separator.length + content.length + 2; // 加上分隔符、内容和换行符长度
                        
                        // 修复：使用函数式更新来确保最新的状态，并正确处理包含特殊字符的内容
                        setCurrentContent(prev => {
                            const newContent = prev + separator + content + "\n\n";
                            // 避免使用拼接方式，可能导致特殊字符的问题
                            return newContent;
                        });
                    }
                } catch (error) {
                    console.error(`Error reading file ${file.name}:`, error);
                    fileContents.push({ name: file.name, error: true });
                    updateTreeNodeStatus(file.name, 'error');
                }
            } else {
                // 跳过非文本文件
                updateTreeNodeStatus(file.name, 'skipped');
            }
            
            processedCount++;
            setProgress(processedCount);
        }
        
        setFilesContent(fileContents);
        setFilePositions(positions);
        setProcessing(false);
        
        // 更新状态栏信息（使用最新的行数和字符数）
        setTimeout(() => {
            setStatusMessage(`就绪 - 共 ${document.querySelectorAll('.line-numbers > div').length} 行, ${currentContent.length} 字符`);
        }, 100);
    };

    // 更新树节点状态
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

    // 读取文件内容
    const readFileContent = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('File read error'));
            reader.readAsText(file);
        });
    };

    // 构建文件结构 - 改进版本：正确显示文件夹结构
    const buildFileStructure = (files) => {
        if (!files || files.length === 0) {
            return "无文件";
        }
        
        // 构建树结构
        const root = { name: files[0]?.webkitRelativePath?.split('/')[0] || 'Files', children: {}, isFolder: true };
        
        // 处理所有文件，构建目录树
        files.forEach(file => {
            const path = file.webkitRelativePath || file.name;
            const parts = path.split('/');
            
            let current = root;
            
            // 创建文件路径
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
        
        // 生成格式化输出
        const result = [];
        result.push(root.name);
        
        // 递归生成结构文本
        const generateStructure = (node, prefix = '', isLast = true) => {
            // 将children对象转换为数组并排序（文件夹优先）
            const childrenArray = Object.values(node.children).sort((a, b) => {
                // 文件夹优先
                if (a.isFolder !== b.isFolder) {
                    return a.isFolder ? -1 : 1;
                }
                // 按名称排序
                return a.name.localeCompare(b.name);
            });
            
            // 处理每个子节点
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
    };

    // 构建树形数据
    const buildTreeData = (files) => {
        if (!files || files.length === 0) {
            return [];
        }
        
        const tree = [];
        const folders = {};
        
        // 获取根文件夹名或使用"Files"作为默认值
        const rootFolderName = files[0]?.webkitRelativePath?.split('/')[0] || 'Files';
        folders[rootFolderName] = {
            name: rootFolderName,
            path: rootFolderName,
            isDirectory: true,
            children: []
        };
        
        tree.push(folders[rootFolderName]);
        
        // 处理每个文件
        files.forEach(file => {
            const path = file.webkitRelativePath || file.name;
            const parts = path.split('/');
            
            // 如果是没有文件夹结构的文件，直接添加到根目录
            if (parts.length === 1) {
                tree.push({
                    name: file.name,
                    path: file.name,
                    isDirectory: false,
                    file
                });
                return;
            }
            
            // 创建文件夹结构
            let currentPath = '';
            let currentFolder = folders[rootFolderName];
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                currentPath += (i > 0 ? '/' : '') + part;
                
                // 如果是最后一部分，则为文件
                if (i === parts.length - 1) {
                    currentFolder.children.push({
                        name: part,
                        path: currentPath,
                        isDirectory: false,
                        file
                    });
                }
                // 否则是文件夹
                else {
                    if (!folders[currentPath]) {
                        folders[currentPath] = {
                            name: part,
                            path: currentPath,
                            isDirectory: true,
                            children: []
                        };
                        currentFolder.children.push(folders[currentPath]);
                    }
                    currentFolder = folders[currentPath];
                }
            }
        });
        
        return tree;
    };

    // 复制内容
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

    // 保存内容
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

    // 重置内容
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
        
        // 清除缓存
        Storage.remove('fileStructure');
        Storage.remove('filesContent');
        Storage.remove('treeData');
        Storage.remove('currentContent');
        Storage.remove('filePositions');
    };

    // 取消处理
    const cancelProcessing = () => {
        if (!processing) return;
        
        setProcessing(false);
        setStatusMessage('已取消');
        setTimeout(() => {
            setStatusMessage('就绪');
        }, 2000);
    };

    // 文件树选择处理
    const handleFileTreeSelect = (node) => {
        if (!node || !node.name) return;
        
        // 退出编辑模式 - 不弹窗
        if (isEditing) {
            setIsEditing(false);
            setCurrentEditingFile(null);
        }
        
        if (filePositions[node.name]) {
            // 如果在移动端，切换到编辑器视图
            if (isMobile) {
                setMobileView('editor');
            }
            
            // 滚动到文件位置
            const position = filePositions[node.name];
            const targetElement = editorScrollRef.current;
            
            if (targetElement) {
                // 计算大致的滚动位置
                const textBeforePosition = currentContent.substring(0, position);
                const linesBefore = textBeforePosition.split('\n').length;
                
                // 估算滚动位置
                const scrollPosition = linesBefore * lineHeight;
                targetElement.scrollTop = scrollPosition;
                
                // 更新状态信息
                setStatusMessage(`已跳转到: ${node.name}`);
                setTimeout(() => {
                    setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
                }, 2000);
            }
        }
    };

    // 文件删除处理
    const handleFileDelete = (node) => {
        if (!node || !node.name) return;
        
        // 如果文件正在编辑，先退出编辑
        if (isEditing && currentEditingFile === node.name) {
            setIsEditing(false);
            setCurrentEditingFile(null);
        }
        
        // 从树数据中移除
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
        
        // 从文件内容中移除
        setFilesContent(prev => prev.filter(f => f.name !== node.name));
        
        // 更新文本内容
        if (filePositions[node.name] && extractContent) {
            const beforePos = currentContent.substring(0, filePositions[node.name]);
            const afterStartIndex = currentContent.indexOf('\n\n', filePositions[node.name]);
            if (afterStartIndex !== -1) {
                const afterStart = afterStartIndex + 2;
                const afterPos = currentContent.substring(afterStart);
                
                setCurrentContent(beforePos + afterPos);
                
                // 更新文件位置
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
        
        // 更新状态信息
        setStatusMessage(`已移除: ${node.name}`);
        setTimeout(() => {
            setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
        }, 2000);
    };

    // 处理文件编辑
    const handleEditContent = (fileName, newContent, startEditing = false) => {
        // 如果是开始编辑
        if (startEditing) {
            setIsEditing(true);
            setCurrentEditingFile(fileName);
            return;
        }
        
        // 如果是取消编辑
        if (fileName === null) {
            setIsEditing(false);
            setCurrentEditingFile(null);
            return;
        }
        
        // 如果是保存编辑
        if (newContent !== null) {
            // 更新文件内容数组
            setFilesContent(prev => 
                prev.map(file => 
                    file.name === fileName 
                        ? { ...file, content: newContent } 
                        : file
                )
            );
            
            // 更新完整内容字符串
            if (filePositions[fileName]) {
                const position = filePositions[fileName];
                
                // 找到文件内容的开始和结束位置
                const start = currentContent.indexOf('-'.repeat(71) + '\n', position) + 72; // 71个'-'加换行
                const end = currentContent.indexOf('\n\n', start);
                
                if (start !== -1 && end !== -1) {
                    const oldContent = currentContent.substring(start, end);
                    const lengthDifference = newContent.length - oldContent.length;
                    
                    // 更新主内容
                    const before = currentContent.substring(0, start);
                    const after = currentContent.substring(end);
                    setCurrentContent(before + newContent + after);
                    
                    // 更新后续文件的位置
                    const updatedPositions = { ...filePositions };
                    Object.keys(updatedPositions).forEach(name => {
                        if (updatedPositions[name] > position + oldContent.length) {
                            updatedPositions[name] += lengthDifference;
                        }
                    });
                    setFilePositions(updatedPositions);
                    
                    // 退出编辑模式
                    setIsEditing(false);
                    setCurrentEditingFile(null);
                    
                    // 更新状态信息
                    setStatusMessage(`已保存修改: ${fileName}`);
                    setTimeout(() => {
                        setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
                    }, 2000);
                }
            }
        }
    };

    // 编辑特定文件
    const editFile = (fileName) => {
        if (!fileName || isEditing) return;
        
        // 查找文件内容
        const fileData = filesContent.find(f => f.name === fileName);
        if (fileData) {
            setCurrentEditingFile(fileName);
            setIsEditing(true);
        }
    };

    // 打开搜索对话框
    const openSearchDialog = () => {
        const searchText = prompt("请输入搜索内容:");
        if (searchText) {
            const position = currentContent.indexOf(searchText);
            if (position !== -1) {
                // 切换到编辑器视图（如果在移动端）
                if (isMobile) {
                    setMobileView('editor');
                }
                
                // 计算滚动位置
                const textBeforePosition = currentContent.substring(0, position);
                const linesBefore = textBeforePosition.split('\n').length;
                
                // 估算滚动位置
                const scrollPosition = linesBefore * lineHeight;
                
                // 滚动到位置
                if (editorScrollRef.current) {
                    editorScrollRef.current.scrollTop = scrollPosition;
                    
                    // 更新状态信息
                    setStatusMessage(`找到: "${searchText.substring(0, 20)}${searchText.length > 20 ? '...' : ''}"`);
                    setTimeout(() => {
                        setStatusMessage(`就绪 - 共 ${lineCount} 行, ${charCount} 字符`);
                    }, 2000);
                }
            } else {
                alert("未找到指定内容。");
            }
        }
    };

    // 设置键盘快捷键
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+F 搜索
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                openSearchDialog();
            }
            
            // Ctrl+S 保存
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveContent();
            }
            
            // Ctrl+C 复制
            if (e.ctrlKey && e.key === 'c' && !window.getSelection().toString()) {
                // 只在没有选中文本的情况下触发全局复制
                copyContent();
            }
            
            // Esc 退出编辑模式
            if (e.key === 'Escape' && isEditing) {
                e.preventDefault();
                setIsEditing(false);
                setCurrentEditingFile(null);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentContent, isEditing, processing]);

    // 同步行号与内容滚动 - 改进版本，使用 ResizeObserver
    useEffect(() => {
        const syncScroll = () => {
            if (editorScrollRef.current && lineNumbersRef.current) {
                lineNumbersRef.current.scrollTop = editorScrollRef.current.scrollTop;
            }
        };
        
        const editorElement = editorScrollRef.current;
        if (editorElement) {
            // 添加滚动事件监听器
            editorElement.addEventListener('scroll', syncScroll);
            
            // 使用 ResizeObserver 监听大小变化
            if (typeof ResizeObserver !== 'undefined') {
                const observer = new ResizeObserver(syncScroll);
                observer.observe(editorElement);
                
                // 也监听容器大小变化
                if (containerRef.current) {
                    observer.observe(containerRef.current);
                }
                
                return () => {
                    editorElement.removeEventListener('scroll', syncScroll);
                    observer.disconnect();
                };
            } else {
                // 备用方案：监听 window resize
                window.addEventListener('resize', syncScroll);
                return () => {
                    editorElement.removeEventListener('scroll', syncScroll);
                    window.removeEventListener('resize', syncScroll);
                };
            }
        }
    }, [editorScrollRef.current, lineNumbersRef.current, containerRef.current]);
    
    // 分隔线调整后强制同步滚动
    useEffect(() => {
        // 强制同步滚动
        if (editorScrollRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = editorScrollRef.current.scrollTop;
        }
    }, [leftPanelWidth]);

    // 设置拖放事件监听器
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

    // 移动端类名
    const getLeftPanelClassNames = () => {
        if (!isMobile) return '';
        return mobileView === 'editor' ? 'mobile-full' : 'mobile-hidden';
    };
    
    const getRightPanelClassNames = () => {
        if (!isMobile) return '';
        return mobileView === 'tree' ? 'mobile-full' : 'mobile-hidden';
    };

    return (
        <>
            {/* 修改后的标题栏：整合按钮到标题行 */}
            <div className="app-header">
                <div className="app-logo">
                    <img src="favicon_io/android-chrome-192x192.png" alt="Structure Insight Logo" />
                    <span>Structure Insight Web</span>
                </div>
                
                <div className="header-buttons">
                    <button 
                        className="header-button" 
                        onClick={handleLocalFolderSelect}
                        title="选择一个文件夹开始分析"
                        disabled={isEditing}
                    >
                        <i className="fas fa-folder-open"></i>
                    </button>
                    <button 
                        className="header-button" 
                        onClick={copyContent} 
                        disabled={!currentContent || isEditing}
                        title="复制全部内容到剪贴板"
                    >
                        <i className="fas fa-copy"></i>
                    </button>
                    <button 
                        className="header-button" 
                        onClick={saveContent} 
                        disabled={!currentContent || isEditing}
                        title="将内容保存为文本文件"
                    >
                        <i className="fas fa-save"></i>
                    </button>
                    <button 
                        className="header-button" 
                        onClick={resetContent} 
                        disabled={!currentContent || processing}
                        title="清空当前结果并重置"
                    >
                        <i className="fas fa-redo"></i>
                    </button>
                    <button 
                        className="header-button" 
                        onClick={cancelProcessing} 
                        disabled={!processing}
                        title="取消当前处理"
                    >
                        <i className="fas fa-stop"></i>
                    </button>
                    <button
                        className="header-button"
                        onClick={openSearchDialog}
                        disabled={!currentContent || isEditing}
                        title="搜索内容 (Ctrl+F)"
                    >
                        <i className="fas fa-search"></i>
                    </button>
                    
                    <div className="header-controls">
                        <div className="checkbox-container">
                            <input 
                                type="checkbox" 
                                className="checkbox" 
                                id="extractContent" 
                                checked={extractContent} 
                                onChange={(e) => setExtractContent(e.target.checked)}
                                disabled={processing || isEditing}
                            />
                            <label htmlFor="extractContent">提取文件内容</label>
                        </div>
                        
                        {/* 字体大小控制 */}
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
                    </div>
                    
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
            </div>
            
            <div 
                className={`container ${isDragging ? 'dragging' : ''}`} 
                ref={containerRef}
            >
                <div 
                    className={`left-panel ${getLeftPanelClassNames()}`} 
                    style={!isMobile ? { width: `${leftPanelWidth}%` } : {}}
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
                
                {/* 可拖动分隔线 */}
                {!isMobile && (
                    <Resizer 
                        onResize={handleHorizontalResize} 
                        position={leftPanelWidth}
                        isVertical={true}
                    />
                )}
                
                <div 
                    className={`right-panel ${getRightPanelClassNames()}`}
                    style={!isMobile ? { width: `${100 - leftPanelWidth}%` } : {}}
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
            </div>
            
            {/* 移动端视图切换按钮 */}
            {isMobile && (
                <button 
                    className="view-toggle"
                    onClick={toggleMobileView}
                    title={mobileView === 'editor' ? "切换到文件列表" : "切换到编辑器"}
                >
                    {mobileView === 'editor' ? 
                        <i className="fas fa-folder"></i> : 
                        <i className="fas fa-file-alt"></i>}
                </button>
            )}

            {/* 拖放提示覆盖层 */}
            {isDragging && (
                <div className="drop-overlay">
                    <div className="drop-message">
                        <i className="fas fa-upload"></i>
                        <span>释放鼠标以导入文件夹</span>
                    </div>
                </div>
            )}
            
            {/* 初始提示 */}
            {!currentContent && !processing && (
                <div className="initial-prompt">
                    <div className="prompt-content">
                        <i className="fas fa-folder-open"></i>
                        <p>拖放文件夹到此处，或点击左上角的文件夹图标</p>
                    </div>
                </div>
            )}
        </>
    );
};

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);