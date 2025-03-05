/**
 * Structure Insight Web - UI Components
 * Contains all React components organized by functionality
 */

const { useState, useEffect, useRef, useCallback } = React;
const { DOMUtils, SearchUtils } = window.Utils;

//=============================================================================
// CODE EDITOR COMPONENTS
//=============================================================================

// Component for line numbers display - using forwardRef for ref access
const LineNumbers = React.forwardRef(({ content, lineHeight, fontSize }, ref) => {
    const [lineNumbers, setLineNumbers] = useState([]);
    
    // Update line numbers when content changes
    useEffect(() => {
        if (!content) {
            setLineNumbers([]);
            return;
        }
        
        // Calculate line count
        const lines = content.split('\n');
        
        // Generate line number array
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

// Component for syntax-highlighted content display with editing capabilities
const HighlightedContent = ({ content, language, fontSize, lineHeight, isEditing, currentEditingFile, onEditContent }) => {
    const containerRef = useRef(null);
    const [processedContent, setProcessedContent] = useState('');
    const [editingContent, setEditingContent] = useState('');
    
    // Process content for display
    useEffect(() => {
        if (!content) {
            setProcessedContent('');
            return;
        }
        
        // Set processed content
        setProcessedContent(content);
        
        // Apply syntax highlighting in next render cycle
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
    
    // Separate structure and content sections
    let structurePart = '';
    let contentPart = '';
    
    // Split content more precisely to avoid issues with Chinese characters
    if (processedContent.includes('文件结构:') && processedContent.includes('文件内容:')) {
        const contentIndex = processedContent.indexOf('文件内容:');
        structurePart = processedContent.substring(0, contentIndex);
        contentPart = processedContent.substring(contentIndex);
    } else {
        structurePart = processedContent;
    }
    
    // Process structure section
    const structureLines = structurePart.split('\n');
    let structureContent = '';
    
    if (structureLines.length > 1 && structureLines[0].includes('文件结构:')) {
        // Find content until first empty line
        let endLine = structureLines.findIndex((line, index) => index > 0 && line.trim() === '');
        if (endLine === -1) endLine = structureLines.length;
        
        structureContent = structureLines.slice(1, endLine).join('\n');
    }
    
    // Split file content into parts
    const fileParts = [];
    
    if (contentPart) {
        // Use file separator to find all file parts
        const separatorPattern = '='.repeat(40) + '\n文件名:';
        
        // Start after the content header line
        const startIndex = contentPart.indexOf('\n') + 1;
        const filePartsContent = contentPart.substring(startIndex);
        
        // Find all separator positions
        const separatorPositions = [];
        let pos = 0;
        
        while ((pos = filePartsContent.indexOf(separatorPattern, pos)) !== -1) {
            separatorPositions.push(pos);
            pos += separatorPattern.length;
        }
        
        // Process each file part
        for (let i = 0; i < separatorPositions.length; i++) {
            const start = separatorPositions[i];
            const end = i < separatorPositions.length - 1 
                ? separatorPositions[i + 1] 
                : filePartsContent.length;
                
            const filePart = filePartsContent.substring(start, end);
            fileParts.push(filePart);
        }
    }
    
    // Handle content editing
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
            {/* Structure section */}
            {structurePart && (
                <div>
                    <h3 style={{marginBottom: '10px'}}>文件结构:</h3>
                    <div className="file-structure-content">
                        {structureContent}
                    </div>
                </div>
            )}
            
            {/* Content section */}
            {contentPart && <h3 style={{margin: '20px 0 10px'}}>文件内容:</h3>}
            
            {fileParts.map((part, index) => {
                // Extract filename and content manually
                const fileNameIndex = part.indexOf('文件名:') + 4;
                const fileNameEndIndex = part.indexOf('\n', fileNameIndex);
                
                if (fileNameIndex > 4 && fileNameEndIndex !== -1) {
                    const fileName = part.substring(fileNameIndex, fileNameEndIndex).trim();
                    
                    // Find separator end
                    const separatorEnd = part.indexOf('\n', part.indexOf('-'.repeat(71))) + 1;
                    
                    if (separatorEnd !== 0) {
                        // Extract file content
                        let fileContent = part.substring(separatorEnd).trim();
                        const fileLanguage = window.Utils.detectLanguage(fileName);
                        const isCurrentEditingFile = isEditing && currentEditingFile === fileName;
                        
                        // Initialize editing content
                        if (isCurrentEditingFile && editingContent === '') {
                            setEditingContent(fileContent);
                        }
                        
                        return (
                            <div key={index} className="file-content-container">
                                <div className="file-separator">
                                    <div className="file-info">
                                        <i className="fas fa-file-alt"></i> {fileName}
                                    </div>
                                    {/* Edit button */}
                                    <button 
                                        className="edit-button" 
                                        onClick={() => {
                                            setEditingContent(fileContent);
                                            onEditContent(fileName, null, true); // Mark as editing
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

//=============================================================================
// FILE TREE COMPONENTS
//=============================================================================

// File tree container component
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

// Individual file tree node component
const FileTreeNode = ({ node, onFileSelect, onFileDelete, level }) => {
    const [expanded, setExpanded] = useState(true);

    // Handle null/undefined nodes
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

//=============================================================================
// UI UTILITY COMPONENTS
//=============================================================================

// Resizable panel divider component
const Resizer = ({ onResize, position, isVertical = true }) => {
    const [isDragging, setIsDragging] = useState(false);
    const resizerRef = useRef(null);
    const leftPanelRef = useRef(null);
    const rightPanelRef = useRef(null);
    const initialPositionRef = useRef(0);
    const initialLeftWidthRef = useRef(0);
    const initialRightWidthRef = useRef(0);
    
    // Get references to panels
    useEffect(() => {
        const container = resizerRef.current?.parentElement;
        if (container) {
            leftPanelRef.current = container.querySelector('.left-panel');
            rightPanelRef.current = container.querySelector('.right-panel');
        }
    }, []);
    
    // Start resizing
    const startResize = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsDragging(true);
        
        // Get initial position
        const clientPosition = e.touches ? e.touches[0][isVertical ? 'clientX' : 'clientY'] : e[isVertical ? 'clientX' : 'clientY'];
        initialPositionRef.current = clientPosition;
        
        // Get initial widths
        if (leftPanelRef.current && rightPanelRef.current) {
            initialLeftWidthRef.current = leftPanelRef.current.getBoundingClientRect()[isVertical ? 'width' : 'height'];
            initialRightWidthRef.current = rightPanelRef.current.getBoundingClientRect()[isVertical ? 'width' : 'height'];
        }
        
        // Add global resizing style
        document.body.classList.add('resizing');
        document.body.classList.add(isVertical ? 'vertical' : 'horizontal');
    };
    
    // Handle mouse movement during resize
    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !leftPanelRef.current || !rightPanelRef.current) return;
        
        // Calculate delta
        const clientPosition = e.touches ? e.touches[0][isVertical ? 'clientX' : 'clientY'] : e[isVertical ? 'clientX' : 'clientY'];
        const delta = clientPosition - initialPositionRef.current;
        
        // Get container size
        const containerSize = leftPanelRef.current.parentElement.getBoundingClientRect()[isVertical ? 'width' : 'height'];
        
        // Calculate new left size
        let newLeftSize = initialLeftWidthRef.current + delta;
        
        // Calculate percentage
        const leftPercent = Math.max(20, Math.min(85, (newLeftSize / containerSize) * 100));
        const rightPercent = 100 - leftPercent;
        
        // Set DOM element styles directly
        leftPanelRef.current.style[isVertical ? 'width' : 'height'] = `${leftPercent}%`;
        rightPanelRef.current.style[isVertical ? 'width' : 'height'] = `${rightPercent}%`;
        
        // Update resizer position
        if (resizerRef.current) {
            resizerRef.current.style[isVertical ? 'left' : 'top'] = `${leftPercent}%`;
        }
        
        // Sync scroll positions
        const editorScroll = document.querySelector('.highlighted-content');
        const lineNumbers = document.querySelector('.line-numbers');
        if (editorScroll && lineNumbers) {
            lineNumbers.scrollTop = editorScroll.scrollTop;
        }
    }, [isDragging, isVertical]);
    
    // Use same handler for touch events
    const handleTouchMove = handleMouseMove;
    
    // End resizing
    const stopResize = useCallback(() => {
        if (!isDragging) return;
        
        // Remove resizing state
        setIsDragging(false);
        document.body.classList.remove('resizing');
        document.body.classList.remove('vertical');
        document.body.classList.remove('horizontal');
        
        // Trigger React state update to save current position
        if (leftPanelRef.current) {
            const containerSize = leftPanelRef.current.parentElement.getBoundingClientRect()[isVertical ? 'width' : 'height'];
            const leftSize = leftPanelRef.current.getBoundingClientRect()[isVertical ? 'width' : 'height'];
            const leftPercent = (leftSize / containerSize) * 100;
            
            // Call callback to update React state
            onResize(leftPercent);
        }
    }, [isDragging, onResize, isVertical]);
    
    // Add and remove event listeners
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove, { passive: false });
            document.addEventListener('mouseup', stopResize);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', stopResize);
            document.addEventListener('touchcancel', stopResize);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', stopResize);
            document.removeEventListener('touchcancel', stopResize);
        }
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', stopResize);
            document.removeEventListener('touchcancel', stopResize);
            document.body.classList.remove('resizing');
            document.body.classList.remove('vertical');
            document.body.classList.remove('horizontal');
        };
    }, [isDragging, handleMouseMove, stopResize, handleTouchMove]);
    
    return (
        <div 
            ref={resizerRef}
            className={`resizer ${isDragging ? 'active' : ''} ${isVertical ? 'vertical' : 'horizontal'}`}
            style={{ [isVertical ? 'left' : 'top']: `${position}%` }}
            onMouseDown={startResize}
            onTouchStart={startResize}
            title={isVertical ? "拖动调整宽度" : "拖动调整高度"}
        >
            <div className="resizer-handle"></div>
        </div>
    );
};

// Scroll to top button component
const ScrollToTop = ({ targetRef }) => {
    const [isVisible, setIsVisible] = useState(false);
    const buttonRef = useRef(null);

    // Check scroll position to show/hide button
    useEffect(() => {
        const handleScroll = () => {
            if (!targetRef.current) return;
            
            const scrollY = targetRef.current.scrollTop;
            setIsVisible(scrollY > 300);
        };
        
        const scrollableElement = targetRef.current;
        if (scrollableElement) {
            scrollableElement.addEventListener('scroll', handleScroll);
            
            // Initial check
            handleScroll();
            
            return () => scrollableElement.removeEventListener('scroll', handleScroll);
        }
    }, [targetRef]);
    
    // Handle scroll to top action
    const scrollToTop = () => {
        if (!targetRef.current) return;
        
        // Smooth scroll to top
        targetRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Add click animation
        if (buttonRef.current) {
            buttonRef.current.classList.add('clicked');
            setTimeout(() => {
                if (buttonRef.current) {
                    buttonRef.current.classList.remove('clicked');
                }
            }, 300);
        }
    };
    
    return (
        <button 
            ref={buttonRef}
            className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
            onClick={scrollToTop}
            aria-label="回到顶部"
            title="回到顶部"
        >
            <i className="fas fa-arrow-up"></i>
        </button>
    );
};

//=============================================================================
// SEARCH COMPONENTS
//=============================================================================

// Search dialog component
const SearchDialog = ({ 
    isOpen, 
    onClose, 
    onSearch, 
    onNext, 
    onPrevious,
    resultCount,
    currentMatchIndex,
    initialQuery = ''
}) => {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [useRegex, setUseRegex] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const inputRef = useRef(null);
    const dialogRef = useRef(null);
    const [position, setPosition] = useState({ right: 16, bottom: 80 });
    const positionRef = useRef({ right: 16, bottom: 80 }); // 添加位置引用
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef(null);
    
    // 当位置状态改变时更新位置引用
    useEffect(() => {
        positionRef.current = position;
    }, [position]);
    
    // Initialize with default position
    useEffect(() => {
        console.log('Search dialog initialized with position:', position);
    }, []);
    
    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current.focus();
                inputRef.current.select();
            }, 100);
        }
    }, [isOpen]);
    
    // Handle keyboard shortcuts
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                onPrevious(); // Shift+Enter to find previous
            } else {
                onSearch(searchQuery, { caseSensitive, useRegex, wholeWord }); // Enter to search
            }
        } else if (e.key === 'Escape') {
            onClose(); // Esc to close dialog
        } else if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
            e.preventDefault();
            if (e.shiftKey) {
                onPrevious(); // Shift+F3 to find previous
            } else {
                onNext(); // F3 to find next
            }
        }
    };
    
    // Execute search
    const doSearch = () => {
        onSearch(searchQuery, { caseSensitive, useRegex, wholeWord });
    };
    
    // Start drag
    const handleDragStart = (e) => {
        e.preventDefault();
        setIsDragging(true);
        
        // 添加拖动时的全局类样式
        document.body.classList.add('search-dragging');
        
        // Record initial position
        if (e.type === 'touchstart') {
            dragStartRef.current = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY,
                position: { ...positionRef.current } // 使用positionRef而不是未定义的引用
            };
        } else {
            dragStartRef.current = { 
                x: e.clientX, 
                y: e.clientY,
                position: { ...positionRef.current } // 使用positionRef而不是未定义的引用
            };
        }
        
        // Add global event listeners
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
    };
    
    // Handle drag movement
    const handleDragMove = (e) => {
        if (!isDragging || !dragStartRef.current) return;
        
        e.preventDefault();
        
        // Calculate movement
        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const deltaX = clientX - dragStartRef.current.x;
        const deltaY = clientY - dragStartRef.current.y;
        
        // Update position (calculate right/bottom inversely)
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        const newRight = Math.max(0, Math.min(viewportWidth - 60, dragStartRef.current.position.right - deltaX));
        const newBottom = Math.max(0, Math.min(viewportHeight - 60, dragStartRef.current.position.bottom - deltaY));
        
        setPosition({
            right: newRight,
            bottom: newBottom
        });
    };
    
    // End drag
    const handleDragEnd = () => {
        setIsDragging(false);
        
        // 移除拖动时的全局类样式
        document.body.classList.remove('search-dragging');
        
        // Remove global event listeners
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
    };
    
    // 组件卸载时清理
    useEffect(() => {
        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
            document.body.classList.remove('search-dragging');
        };
    }, []);
    
    // Toggle options panel
    const toggleOptions = () => {
        setShowOptions(!showOptions);
    };
    
    if (!isOpen) return null;
    
    return (
        <div 
            className={`floating-search-dialog ${isDragging ? 'dragging' : ''}`}
            ref={dialogRef}
            style={{ 
                right: `${position.right}px`, 
                bottom: `${position.bottom}px`,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
        >
            <div 
                className="search-dialog-header" 
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
            >
                <div className="drag-handle">
                    <i className="fas fa-grip-lines"></i>
                </div>
                <button 
                    className="search-option-toggle" 
                    onClick={toggleOptions}
                    title={showOptions ? "隐藏选项" : "显示选项"}
                >
                    <i className={`fas fa-cog ${showOptions ? 'active' : ''}`}></i>
                </button>
                <button 
                    className="search-dialog-close" 
                    onClick={onClose}
                    title="关闭 (Esc)"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>
            
            <div className="search-dialog-content">
                <div className="search-input-group">
                    <input 
                        ref={inputRef}
                        type="text" 
                        className="search-input" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        onKeyDown={handleKeyDown}
                        placeholder="输入搜索文本..." 
                    />
                    <button 
                        className="search-button" 
                        onClick={doSearch}
                        title="查找 (Enter)"
                        disabled={!searchQuery.trim()}
                    >
                        <i className="fas fa-search"></i>
                    </button>
                </div>
                
                {showOptions && (
                    <div className="search-options">
                        <label className="search-option">
                            <input 
                                type="checkbox" 
                                checked={caseSensitive} 
                                onChange={() => setCaseSensitive(!caseSensitive)}
                            />
                            <span>区分大小写</span>
                        </label>
                        
                        <label className="search-option">
                            <input 
                                type="checkbox" 
                                checked={useRegex} 
                                onChange={() => setUseRegex(!useRegex)}
                            />
                            <span>正则表达式</span>
                        </label>
                        
                        <label className="search-option">
                            <input 
                                type="checkbox" 
                                checked={wholeWord} 
                                onChange={() => setWholeWord(!wholeWord)}
                                disabled={useRegex}
                            />
                            <span>全词匹配</span>
                        </label>
                    </div>
                )}
                
                <div className="search-results">
                    {resultCount !== null && (
                        <div className="search-result-count">
                            {resultCount > 0 ? (
                                <span>{currentMatchIndex + 1}/{resultCount}</span>
                            ) : searchQuery.trim() ? (
                                <span className="no-results">无匹配</span>
                            ) : null}
                        </div>
                    )}
                    
                    <div className="search-navigation">
                        <button 
                            className="search-nav-button" 
                            onClick={onPrevious}
                            disabled={resultCount === 0}
                            title="上一个匹配项 (Shift+Enter 或 Shift+F3)"
                        >
                            <i className="fas fa-chevron-up"></i>
                        </button>
                        <button 
                            className="search-nav-button" 
                            onClick={onNext}
                            disabled={resultCount === 0}
                            title="下一个匹配项 (F3)"
                        >
                            <i className="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export components to global scope
window.Components = {
    // Editor components
    LineNumbers,
    HighlightedContent,
    
    // File tree components
    FileTree,
    FileTreeNode,
    
    // UI utility components
    Resizer,
    ScrollToTop,
    
    // Search components
    SearchDialog
};