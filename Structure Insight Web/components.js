const { useState, useEffect, useRef, useCallback } = React;

// 组件用于行号显示 - 使用 forwardRef 以便直接传递 ref
const LineNumbers = React.forwardRef(({ content, lineHeight, fontSize }, ref) => {
    const [lineNumbers, setLineNumbers] = useState([]);
    
    // 更新行号
    useEffect(() => {
        if (!content) {
            setLineNumbers([]);
            return;
        }
        
        // 正确计算行数
        const lines = content.split('\n');
        
        // 生成行号数组
        setLineNumbers(Array.from({ length: lines.length }, (_, i) => i + 1));
    }, [content]);
    
    return (
        <div 
            ref={ref}
            className="line-numbers" 
            style={{ 
                fontSize: `${fontSize}px`,
                lineHeight: `${lineHeight}px`
            }}
        >
            {lineNumbers.map(num => (
                <div key={num} style={{ height: `${lineHeight}px` }}>{num}</div>
            ))}
        </div>
    );
});

// 使用高亮显示代码的组件 - 增加编辑功能
const HighlightedContent = ({ content, language, fontSize, lineHeight, isEditing, currentEditingFile, onEditContent }) => {
    const containerRef = useRef(null);
    const [processedContent, setProcessedContent] = useState('');
    const [editingContent, setEditingContent] = useState('');
    
    // 处理内容
    useEffect(() => {
        if (!content) {
            setProcessedContent('');
            return;
        }
        
        // 确保内容已处理后再设置
        setProcessedContent(content);
        
        // 在下一个渲染周期后处理高亮
        const timer = setTimeout(() => {
            if (containerRef.current) {
                const codeBlocks = containerRef.current.querySelectorAll('pre code');
                codeBlocks.forEach(block => {
                    hljs.highlightElement(block);
                });
            }
        }, 10);
        
        return () => clearTimeout(timer);
    }, [content]);
    
    if (!processedContent) return <div className="highlighted-content"></div>;
    
    // 分离文件结构和文件内容 - 修复中文注释问题
    let structurePart = '';
    let contentPart = '';
    
    // 改进：使用更精确的方式分割内容，避免中文注释问题
    if (processedContent.includes('文件结构:') && processedContent.includes('文件内容:')) {
        const contentIndex = processedContent.indexOf('文件内容:');
        structurePart = processedContent.substring(0, contentIndex);
        contentPart = processedContent.substring(contentIndex);
    } else {
        structurePart = processedContent;
    }
    
    // 处理文件结构部分 - 避免使用正则表达式以防中文问题
    const structureLines = structurePart.split('\n');
    let structureContent = '';
    
    if (structureLines.length > 1 && structureLines[0].includes('文件结构:')) {
        // 找到第一个空行之前的内容作为结构
        let endLine = structureLines.findIndex((line, index) => index > 0 && line.trim() === '');
        if (endLine === -1) endLine = structureLines.length;
        
        structureContent = structureLines.slice(1, endLine).join('\n');
    }
    
    // 将文件内容分割成多个部分 - 修复中文注释问题
    const fileParts = [];
    
    if (contentPart) {
        // 使用文件分隔符找到所有文件部分
        const separatorPattern = '='.repeat(40) + '\n文件名:';
        
        // 从内容部分的第一行（"文件内容:"）之后开始查找文件
        const startIndex = contentPart.indexOf('\n') + 1;
        const filePartsContent = contentPart.substring(startIndex);
        
        // 查找所有分隔符位置
        const separatorPositions = [];
        let pos = 0;
        
        while ((pos = filePartsContent.indexOf(separatorPattern, pos)) !== -1) {
            separatorPositions.push(pos);
            pos += separatorPattern.length;
        }
        
        // 处理找到的每个文件部分
        for (let i = 0; i < separatorPositions.length; i++) {
            const start = separatorPositions[i];
            const end = i < separatorPositions.length - 1 
                ? separatorPositions[i + 1] 
                : filePartsContent.length;
                
            const filePart = filePartsContent.substring(start, end);
            fileParts.push(filePart);
        }
    }
    
    // 处理文件编辑
    const handleContentChange = (e) => {
        setEditingContent(e.target.value);
    };
    
    const handleSaveEdit = () => {
        if (onEditContent && currentEditingFile) {
            onEditContent(currentEditingFile, editingContent);
        }
    };
    
    return (
        <div 
            className="highlighted-content" 
            ref={containerRef}
            style={{ 
                fontSize: `${fontSize}px`,
                lineHeight: `${lineHeight}px` 
            }}
        >
            {/* 文件结构部分 */}
            {structurePart && (
                <div>
                    <h3 style={{marginBottom: '10px'}}>文件结构:</h3>
                    <div className="file-structure-content">
                        {structureContent}
                    </div>
                </div>
            )}
            
            {/* 文件内容部分 */}
            {contentPart && <h3 style={{margin: '20px 0 10px'}}>文件内容:</h3>}
            
            {fileParts.map((part, index) => {
                // 提取文件名和内容 - 避免使用正则表达式，手动解析
                const fileNameIndex = part.indexOf('文件名:') + 4;
                const fileNameEndIndex = part.indexOf('\n', fileNameIndex);
                
                if (fileNameIndex > 4 && fileNameEndIndex !== -1) {
                    const fileName = part.substring(fileNameIndex, fileNameEndIndex).trim();
                    
                    // 找到分隔符所在行的结束位置
                    const separatorEnd = part.indexOf('\n', part.indexOf('-'.repeat(71))) + 1;
                    
                    if (separatorEnd !== 0) {
                        // 提取文件内容
                        let fileContent = part.substring(separatorEnd).trim();
                        const fileLanguage = window.Utils.detectLanguage(fileName);
                        const isCurrentEditingFile = isEditing && currentEditingFile === fileName;
                        
                        // 初始化编辑内容
                        if (isCurrentEditingFile && editingContent === '') {
                            setEditingContent(fileContent);
                        }
                        
                        return (
                            <div key={index} className="file-content-container">
                                <div className="file-separator">
                                    <div className="file-info">
                                        <i className="fas fa-file-alt"></i> {fileName}
                                    </div>
                                    {/* 编辑按钮始终显示，不只在编辑模式下 */}
                                    <button 
                                        className="edit-button" 
                                        onClick={() => {
                                            setEditingContent(fileContent);
                                            onEditContent(fileName, null, true); // 标记为正在编辑
                                        }}
                                        disabled={isEditing}
                                    >
                                        <i className="fas fa-edit"></i> 编辑
                                    </button>
                                </div>
                                
                                {isCurrentEditingFile ? (
                                    <div className="editor-container">
                                        <textarea 
                                            className="editor-textarea"
                                            value={editingContent}
                                            onChange={handleContentChange}
                                            style={{ 
                                                fontSize: `${fontSize}px`,
                                                lineHeight: `${lineHeight}px` 
                                            }}
                                        />
                                        <div className="editor-buttons">
                                            <button className="button" onClick={handleSaveEdit}>
                                                <i className="fas fa-save"></i> 保存
                                            </button>
                                            <button className="button" onClick={() => onEditContent(null)}>
                                                <i className="fas fa-times"></i> 取消
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    fileContent.trim() ? (
                                        <pre><code className={fileLanguage ? `language-${fileLanguage}` : ''}>
                                            {fileContent}
                                        </code></pre>
                                    ) : (
                                        <p>（未提取内容）</p>
                                    )
                                )}
                            </div>
                        );
                    }
                }
                return null;
            })}
        </div>
    );
};

// 文件树组件
const FileTree = ({ nodes, onFileSelect, onFileDelete }) => {
    const renderTree = (nodes, level = 0) => {
        if (!Array.isArray(nodes)) {
            return null;
        }
        
        return (
            <ul className="file-tree" style={{ paddingLeft: level === 0 ? 0 : 20 }}>
                {nodes.map((node, index) => (
                    <FileTreeNode 
                        key={`${node.path || 'node'}-${index}`} 
                        node={node} 
                        onFileSelect={onFileSelect}
                        onFileDelete={onFileDelete}
                        level={level}
                    />
                ))}
            </ul>
        );
    };

    return (
        <div className="tree-container">
            <div className="tree-label">文件列表：</div>
            {nodes && nodes.length > 0 ? renderTree(nodes) : <div>无文件</div>}
        </div>
    );
};

// 文件树节点组件
const FileTreeNode = ({ node, onFileSelect, onFileDelete, level }) => {
    const [expanded, setExpanded] = useState(true);

    // 防止undefined节点
    if (!node) {
        return null;
    }

    const toggleExpand = (e) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    const handleSelect = () => {
        if (!node.isDirectory && onFileSelect) {
            onFileSelect(node);
        }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (!node.isDirectory && onFileDelete) {
            onFileDelete(node);
        }
    };

    const isSkipped = node.status === 'skipped' || node.status === 'error';

    return (
        <li>
            <div 
                className={`file-tree-item ${isSkipped ? 'file-tree-skipped' : ''}`}
                onClick={handleSelect}
            >
                <span className="file-tree-toggle" onClick={node.isDirectory ? toggleExpand : null}>
                    {node.isDirectory ? (
                        expanded ? 
                        <i className="fas fa-chevron-down"></i> : 
                        <i className="fas fa-chevron-right"></i>
                    ) : ''}
                </span>
                <span className="folder-icon">
                    {node.isDirectory ? 
                        <i className="fas fa-folder"></i> : 
                        <i className="fas fa-file-alt"></i>}
                </span>
                <span className="file-tree-label" title={node.name}>
                    {node.status === 'skipped' ? `跳过: ${node.name}` : 
                     node.status === 'error' ? `错误: ${node.name}` : node.name}
                </span>
                {!node.isDirectory && (
                    <button 
                        className="button" 
                        style={{ padding: '2px 5px', marginLeft: '5px' }}
                        onClick={handleDelete}
                        title="从结果中删除"
                    >
                        <i className="fas fa-trash-alt"></i>
                    </button>
                )}
            </div>
            {node.isDirectory && node.children && expanded && (
                <ul className="file-tree">
                    {node.children.map((childNode, index) => (
                        childNode ? (
                            <FileTreeNode 
                                key={`${childNode.path || 'child'}-${index}`} 
                                node={childNode} 
                                onFileSelect={onFileSelect}
                                onFileDelete={onFileDelete}
                                level={level + 1}
                            />
                        ) : null
                    ))}
                </ul>
            )}
        </li>
    );
};

// 可拖动分隔线组件 - 修复版本
const Resizer = ({ onResize, position, isVertical = true }) => {
    const [isDragging, setIsDragging] = useState(false);
    const resizerRef = useRef(null);
    
    // 开始拖动
    const startResize = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    
    // 鼠标拖动
    const handleMouseMove = useCallback((e) => {
        if (isDragging) {
            onResize(isVertical ? e.clientX : e.clientY);
        }
    }, [isDragging, onResize, isVertical]);
    
    // 触摸拖动
    const handleTouchMove = useCallback((e) => {
        if (isDragging && e.touches.length) {
            e.preventDefault();
            const touch = e.touches[0];
            onResize(isVertical ? touch.clientX : touch.clientY);
        }
    }, [isDragging, onResize, isVertical]);
    
    // 停止拖动
    const stopResize = useCallback(() => {
        setIsDragging(false);
    }, []);
    
    // 添加和移除事件监听器
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', stopResize);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', stopResize);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', stopResize);
        }
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', stopResize);
        };
    }, [isDragging, handleMouseMove, stopResize, handleTouchMove]);
    
    const style = isVertical
        ? { left: `${position}%`, transform: 'translateX(-50%)' }
        : { top: `${position}%`, transform: 'translateY(-50%)' };
    
    return (
        <div 
            ref={resizerRef}
            className={`resizer ${isDragging ? 'active' : ''}`}
            style={style}
            onMouseDown={startResize}
            onTouchStart={startResize}
        ></div>
    );
};

// 导出组件供其他模块使用
window.Components = {
    LineNumbers,
    HighlightedContent,
    FileTree,
    FileTreeNode,
    Resizer
};