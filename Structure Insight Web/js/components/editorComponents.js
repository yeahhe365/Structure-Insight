/**
 * Structure Insight Web - Editor Components
 * Components for displaying and editing code
 */

const { useState, useEffect, useRef, useCallback } = React;
const { detectLanguage } = window.Utils;

//=============================================================================
// CODE EDITOR COMPONENTS
//=============================================================================

/**
 * Component for line numbers display - using forwardRef for ref access
 * @param {Object} props Component props
 * @param {string} props.content Text content to generate line numbers for
 * @param {number} props.lineHeight Line height in pixels
 * @param {number} props.fontSize Font size in pixels
 * @param {Object} ref Forwarded ref for DOM access
 */
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

/**
 * Copy feedback component with animation
 * @param {Object} props Component props
 * @param {boolean} props.isVisible Whether feedback is visible
 * @param {Function} props.onAnimationEnd Callback when animation ends
 */
const CopyFeedback = ({ isVisible, onAnimationEnd }) => {
    return (
        <div 
            className={`copy-feedback ${isVisible ? 'visible' : ''}`}
            onAnimationEnd={onAnimationEnd}
        >
            已复制到剪贴板
        </div>
    );
};

/**
 * Component for syntax-highlighted content display with editing capabilities
 * @param {Object} props Component props
 * @param {string} props.content Text content to display
 * @param {string} props.language Language for syntax highlighting
 * @param {number} props.fontSize Font size in pixels
 * @param {number} props.lineHeight Line height in pixels
 * @param {boolean} props.isEditing Whether in editing mode
 * @param {string} props.currentEditingFile Current file being edited
 * @param {Function} props.onEditContent Callback for edit operations
 */
const HighlightedContent = ({ content, language, fontSize, lineHeight, isEditing, currentEditingFile, onEditContent }) => {
    const containerRef = useRef(null);
    const [processedContent, setProcessedContent] = useState('');
    const [editingContent, setEditingContent] = useState('');
    const [showCopyFeedback, setShowCopyFeedback] = useState(false);
    const [copyFeedbackPosition, setCopyFeedbackPosition] = useState({ top: 0, left: 0 });
    const [fileStats, setFileStats] = useState({});
    const fileParts = useRef([]);
    
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
    
    // Calculate file statistics when content changes
    useEffect(() => {
        if (!processedContent) return;
        
        // Extract file parts and calculate statistics
        let contentPart = '';
        if (processedContent.includes('文件结构:') && processedContent.includes('文件内容:')) {
            const contentIndex = processedContent.indexOf('文件内容:');
            contentPart = processedContent.substring(contentIndex);
        } else {
            return;
        }
        
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
        const parts = [];
        for (let i = 0; i < separatorPositions.length; i++) {
            const start = separatorPositions[i];
            const end = i < separatorPositions.length - 1 
                ? separatorPositions[i + 1] 
                : filePartsContent.length;
                
            const filePart = filePartsContent.substring(start, end);
            parts.push(filePart);
        }
        
        fileParts.current = parts;
        
        // Calculate statistics for each file
        const stats = {};
        
        parts.forEach(part => {
            const fileNameIndex = part.indexOf('文件名:') + 4;
            const fileNameEndIndex = part.indexOf('\n', fileNameIndex);
            
            if (fileNameIndex > 4 && fileNameEndIndex !== -1) {
                const fileName = part.substring(fileNameIndex, fileNameEndIndex).trim();
                
                // Find separator end
                const separatorEnd = part.indexOf('\n', part.indexOf('-'.repeat(71))) + 1;
                
                if (separatorEnd !== 0) {
                    // Extract file content
                    const fileContent = part.substring(separatorEnd).trim();
                    const lineCount = fileContent.split('\n').length;
                    const charCount = fileContent.length;
                    
                    stats[fileName] = { lineCount, charCount };
                }
            }
        });
        
        setFileStats(stats);
    }, [processedContent]);
    
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
    
    // Handle content editing
    const handleContentChange = (e) => {
        setEditingContent(e.target.value);
    };
    
    const handleSaveEdit = () => {
        if (onEditContent && currentEditingFile) {
            onEditContent(currentEditingFile, editingContent);
        }
    };
    
    // Copy content handlers
    const copyToClipboard = (text, buttonElement) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                // Get position for feedback
                if (buttonElement) {
                    const rect = buttonElement.getBoundingClientRect();
                    setCopyFeedbackPosition({
                        top: rect.top - 40,
                        left: rect.left + (rect.width / 2)
                    });
                }
                
                // Show feedback
                setShowCopyFeedback(true);
                
                // Hide feedback after animation completes
                setTimeout(() => {
                    setShowCopyFeedback(false);
                }, 1500);
            })
            .catch(err => {
                console.error('复制失败:', err);
                alert("复制失败，请手动选择内容复制");
            });
    };
    
    const handleCopyFeedbackAnimationEnd = () => {
        if (!showCopyFeedback) {
            setCopyFeedbackPosition({ top: 0, left: 0 });
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
            {/* Copy feedback overlay */}
            <CopyFeedback 
                isVisible={showCopyFeedback} 
                onAnimationEnd={handleCopyFeedbackAnimationEnd} 
                style={copyFeedbackPosition}
            />
            
            {/* Structure section */}
            {structurePart && (
                <div>
                    <div className="section-header">
                        <h3>文件结构:</h3>
                        <button 
                            className="copy-button" 
                            onClick={(e) => copyToClipboard(structureContent, e.currentTarget)}
                            title="复制文件结构"
                        >
                            <i className="fas fa-copy"></i>
                        </button>
                    </div>
                    <div className="file-structure-content">
                        {structureContent}
                    </div>
                </div>
            )}
            
            {/* Content section */}
            {contentPart && <h3 style={{margin: '20px 0 10px'}}>文件内容:</h3>}
            
            {fileParts.current.map((part, index) => {
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
                        const fileLanguage = detectLanguage(fileName);
                        const isCurrentEditingFile = isEditing && currentEditingFile === fileName;
                        
                        // Initialize editing content
                        if (isCurrentEditingFile && editingContent === '') {
                            setEditingContent(fileContent);
                        }
                        
                        // Get file stats
                        const stats = fileStats[fileName] || { lineCount: 0, charCount: 0 };
                        
                        return (
                            <div 
                                key={index}
                                id={`file-${encodeURIComponent(fileName)}`} 
                                className="file-content-container"
                            >
                                <div className="file-separator">
                                    <div className="file-info">
                                        <i className="fas fa-file-alt"></i> {fileName}
                                        <span className="file-stats">
                                            <i className="fas fa-code"></i> {stats.lineCount} 行
                                            <i className="fas fa-text-width"></i> {stats.charCount} 字符
                                        </span>
                                    </div>
                                    <div className="file-actions">
                                        {/* Copy button */}
                                        <button 
                                            className="copy-button" 
                                            onClick={(e) => copyToClipboard(fileContent, e.currentTarget)}
                                            title="复制文件内容"
                                        >
                                            <i className="fas fa-copy"></i>
                                        </button>
                                        
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

// Export components
window.Components = window.Components || {};
window.Components.LineNumbers = LineNumbers;
window.Components.HighlightedContent = HighlightedContent;