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
    
    const [fileStructure, setFileStructure] = useState('');
    const [filesContent, setFilesContent] = useState([]);
    const [treeData, setTreeData] = useState([]);
    const [currentContent, setCurrentContent] = useState('');
    const [filePositions, setFilePositions] = useState({});
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [maxProgress, setMaxProgress] = useState(100);
    const [statusMessage, setStatusMessage] = useState('就绪');
    const [lineCount, setLineCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [lineHeight, setLineHeight] = useState(Math.round(fontSize * 1.5));
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    const fileInputRef = useRef(null);
    const containerRef = useRef(null);
    const editorScrollRef = useRef(null);
    const lineNumbersRef = useRef(null);

    // 检测设备大小
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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

    // 打开文件夹
    const openFolder = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // 处理文件选择
    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFiles(files);
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
                        const fileContent = `${separator}${content}\n\n`;
                        
                        positions[file.name] = currentPosition;
                        currentPosition += fileContent.length;
                        
                        setCurrentContent(prev => prev + fileContent);
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

    // 构建文件结构
    const buildFileStructure = (files) => {
        if (!files || files.length === 0) {
            return "无文件";
        }
        
        const structure = [];
        const folderPaths = new Set();
        
        // 获取所有文件夹路径
        files.forEach(file => {
            const path = file.webkitRelativePath || file.name;
            const parts = path.split('/');
            
            // 添加所有父文件夹路径
            let currentPath = '';
            for (let i = 0; i < parts.length - 1; i++) {
                currentPath += (i > 0 ? '/' : '') + parts[i];
                folderPaths.add(currentPath);
            }
        });
        
        // 转换为字符串表示
        const rootFolder = files[0]?.webkitRelativePath?.split('/')[0] || 'Files';
        structure.push(rootFolder);
        
        // 按路径排序文件
        const sortedFiles = [...files].sort((a, b) => {
            const pathA = a.webkitRelativePath || a.name;
            const pathB = b.webkitRelativePath || b.name;
            return pathA.localeCompare(pathB);
        });
        
        // 构建结构字符串
        const formatStructure = (prefix, fileName, isLast) => {
            return `${prefix}${isLast ? '└── ' : '├── '}${fileName}`;
        };
        
        sortedFiles.forEach((file, index) => {
            const path = file.webkitRelativePath || file.name;
            const parts = path.split('/');
            const fileName = parts[parts.length - 1];
            const isLast = index === sortedFiles.length - 1;
            
            if (parts.length === 1) {
                // 根目录下的文件
                structure.push(formatStructure('', fileName, isLast));
            } else {
                // 文件夹中的文件
                const prefix = '    '.repeat(parts.length - 1);
                structure.push(formatStructure(prefix, fileName, isLast));
            }
        });
        
        return structure.join('\n');
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
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentContent]);

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
            <div className="button-toolbar">
                <button 
                    className="button" 
                    onClick={openFolder}
                    title="选择一个文件夹开始分析"
                >
                    <i className="fas fa-folder-open"></i>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="file-input" 
                    onChange={handleFileSelect}
                    webkitdirectory="true"
                    directory="true"
                    multiple
                    accept="*/*"
                />
                <button 
                    className="button" 
                    onClick={copyContent} 
                    disabled={!currentContent}
                    title="复制全部内容到剪贴板"
                >
                    <i className="fas fa-copy"></i>
                </button>
                <button 
                    className="button" 
                    onClick={saveContent} 
                    disabled={!currentContent}
                    title="将内容保存为文本文件"
                >
                    <i className="fas fa-save"></i>
                </button>
                <button 
                    className="button" 
                    onClick={resetContent} 
                    disabled={!currentContent}
                    title="清空当前结果并重置"
                >
                    <i className="fas fa-redo"></i>
                </button>
                <button 
                    className="button" 
                    onClick={cancelProcessing} 
                    disabled={!processing}
                    title="取消当前处理"
                >
                    <i className="fas fa-stop"></i>
                </button>
                <button
                    className="button"
                    onClick={openSearchDialog}
                    disabled={!currentContent}
                    title="搜索内容 (Ctrl+F)"
                >
                    <i className="fas fa-search"></i>
                </button>
                <div className="checkbox-container">
                    <input 
                        type="checkbox" 
                        className="checkbox" 
                        id="extractContent" 
                        checked={extractContent} 
                        onChange={(e) => setExtractContent(e.target.checked)}
                        disabled={processing}
                    />
                    <label htmlFor="extractContent">提取文件内容</label>
                </div>
                
                {/* 字体大小控制 */}
                <div className="font-size-controls">
                    <button 
                        className="button" 
                        onClick={decreaseFontSize}
                        title="减小字体"
                    >
                        <i className="fas fa-minus"></i>
                    </button>
                    <span className="font-size-display">{fontSize}px</span>
                    <button 
                        className="button" 
                        onClick={increaseFontSize}
                        title="增大字体"
                    >
                        <i className="fas fa-plus"></i>
                    </button>
                </div>
                
                <button 
                    className="button" 
                    onClick={toggleTheme}
                    title="在深色和浅色主题之间切换"
                    style={{ marginLeft: 'auto' }}
                >
                    {isDarkTheme ? 
                        <i className="fas fa-sun"></i> : 
                        <i className="fas fa-moon"></i>}
                </button>
            </div>
            
            <div className="container" ref={containerRef}>
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
        </>
    );
};

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);