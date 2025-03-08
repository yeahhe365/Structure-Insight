/**
 * Structure Insight Web - File Components
 * Components for file tree and related UI elements
 */

const { useState, useEffect, useRef, useCallback } = React;

//=============================================================================
// FILE TREE COMPONENTS
//=============================================================================

/**
 * File tree container component
 * @param {Object} props Component props
 * @param {Array} props.nodes Tree data nodes
 * @param {Function} props.onFileSelect Callback when file is selected
 * @param {Function} props.onFileDelete Callback when file is deleted
 */
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

/**
 * Individual file tree node component - Optimized for mobile
 * @param {Object} props Component props
 * @param {Object} props.node Node data
 * @param {Function} props.onFileSelect Callback when file is selected
 * @param {Function} props.onFileDelete Callback when file is deleted
 * @param {number} props.level Nesting level
 */
const FileTreeNode = ({ node, onFileSelect, onFileDelete, level }) => {
    const [expanded, setExpanded] = useState(true);
    const isMobile = window.innerWidth <= 768;

    // Handle null/undefined nodes
    if (!node) {
        return null;
    }

    // Enhanced toggle handler with better touch support
    const toggleExpand = (e) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    // Handler for item selection
    const handleSelect = (e) => {
        if (node.isDirectory) {
            // For directories, toggle expansion when clicked on mobile
            // This makes the entire row a toggleable area
            if (isMobile) {
                toggleExpand(e);
            }
        } else if (onFileSelect) {
            // For files, trigger selection
            onFileSelect(node);
        }
    };

    // Handler for the toggle icon specifically
    const handleToggleClick = (e) => {
        // Always toggle on icon click
        toggleExpand(e);
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
            {/* Make the entire directory row clickable on mobile */}
            <div 
                className={`file-tree-item ${isSkipped ? 'file-tree-skipped' : ''} ${node.isDirectory ? 'directory-item' : 'file-item'} ${expanded ? 'expanded' : 'collapsed'}`}
                onClick={handleSelect}
            >
                {/* Increase the touch target area for the toggle button */}
                <span 
                    className="file-tree-toggle" 
                    onClick={node.isDirectory ? handleToggleClick : null}
                    style={node.isDirectory ? { cursor: 'pointer' } : {}}
                >
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

// Export components
window.Components = window.Components || {};
window.Components.FileTree = FileTree;
window.Components.FileTreeNode = FileTreeNode;