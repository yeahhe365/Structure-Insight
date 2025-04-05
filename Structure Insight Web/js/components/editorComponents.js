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
const CopyFeedback = ({ isVisible, onAnimationEnd, style }) => {
	return (
		<div
			className={`copy-feedback ${isVisible ? 'visible' : ''}`}
			onAnimationEnd={onAnimationEnd}
			style={style}
		>
			已复制到剪贴板
		</div>
	);
};

/**
 * Component for syntax-highlighted content display with editing capabilities
 * @param {Object} props Component props
 * @param {string} props.content Text content to display
 * @param {string} props.language Language for syntax highlighting (Note: language prop isn't actually used here, detectLanguage is used inside)
 * @param {number} props.fontSize Font size in pixels
 * @param {number} props.lineHeight Line height in pixels
 * @param {boolean} props.isEditing Whether in editing mode
 * @param {string} props.currentEditingFile Current file being edited (should be the full path)
 * @param {Function} props.onEditContent Callback for edit operations (receives path, newContent, startEditing flag)
 */
const HighlightedContent = ({ content, fontSize, lineHeight, isEditing, currentEditingFile, onEditContent }) => {
	const containerRef = useRef(null);
	const [processedContent, setProcessedContent] = useState('');
	const [editingContent, setEditingContent] = useState(''); // Holds content *while* editing
	const [showCopyFeedback, setShowCopyFeedback] = useState(false);
	const [copyFeedbackPosition, setCopyFeedbackPosition] = useState({ top: 0, left: 0 });
	const [fileStats, setFileStats] = useState({});
	const fileParts = useRef([]);
	const [activeButtons, setActiveButtons] = useState({}); // 跟踪活动状态的按钮
	const [hasFileContent, setHasFileContent] = useState(false); // 是否含有文件内容部分
	const [markdownPreviews, setMarkdownPreviews] = useState({}); // 新增: 保存每个Markdown文件的预览状态

	// 新增：检查文件是否为Markdown
	const isMarkdownFile = (filePath) => { // Check based on path
		if (!filePath) return false;
		const lowerPath = filePath.toLowerCase();
		return lowerPath.endsWith('.md') || lowerPath.endsWith('.markdown');
	};

	// 新增: 渲染Markdown内容
	const renderMarkdown = (markdownContent) => {
		if (!window.marked) return markdownContent;
		try {
			// Configure marked (optional, e.g., enable GitHub Flavored Markdown)
			window.marked.setOptions({
			  gfm: true,
			  breaks: false, // Keep false for standard GFM behavior
			  // Add other options as needed
			});
			return window.marked.parse(markdownContent);
		} catch (error) {
			console.error('Markdown解析错误:', error);
			return `<p style="color: red;">Markdown解析错误: ${error.message}</p><pre><code>${markdownContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;
		}
	};


	// Process content for display
	useEffect(() => {
		if (!content) {
			setProcessedContent('');
			setHasFileContent(false);
			return;
		}

		// Set processed content
		setProcessedContent(content);

		// 检查是否含有文件内容部分
		setHasFileContent(content.includes("文件内容:"));

		// Apply syntax highlighting in next render cycle
		const timer = setTimeout(() => { // <--- 问题点：潜在竞争条件
			if (containerRef.current && typeof hljs !== 'undefined') {
				try {
					const codeBlocks = containerRef.current.querySelectorAll('pre code');
					codeBlocks.forEach(block => {
						// Check if already highlighted
						if (!block.classList.contains('hljs') && !block.closest('.markdown-preview')) { // Avoid re-highlighting and highlighting inside markdown preview
							hljs.highlightElement(block);
						}
					});
				} catch (error) {
					console.error("Highlight.js error:", error);
				}
			}
		}, 50); // Increased timeout slightly

		return () => clearTimeout(timer);
	}, [content]); // Rerun whenever the main content string changes

	// Re-process file parts and stats when content changes
	useEffect(() => {
		if (!processedContent || !processedContent.includes("文件内容:")) {
			fileParts.current = [];
			setFileStats({});
			return;
		}

		// Extract file parts and calculate statistics
		let contentSection = '';
		const contentIndex = processedContent.indexOf('文件内容:');
		if (contentIndex !== -1) {
			contentSection = processedContent.substring(contentIndex);
		} else {
			// Should not happen if hasFileContent is true, but good safety check
			fileParts.current = [];
			setFileStats({});
			return;
		}

		// Use file separator to find all file parts
		const separatorPattern = '\n' + '='.repeat(40) + '\n文件名:';
		const parts = [];
		let currentIdx = contentSection.indexOf(separatorPattern); // Find first separator *after* "文件内容:"

		if (currentIdx === -1 && contentSection.length > "文件内容:\n".length) {
		   // Handle case where there might be only structure, or content extraction was off
		   // Maybe log a warning or handle based on expectation
		   console.log("No file separators found after '文件内容:'.");
		   fileParts.current = [];
		   setFileStats({});
		   return;
		}


		while (currentIdx !== -1) {
			const nextIdx = contentSection.indexOf(separatorPattern, currentIdx + 1);
			const start = currentIdx + 1; // Start after the newline
			const end = nextIdx !== -1 ? nextIdx : contentSection.length;
			const filePart = contentSection.substring(start, end);
			parts.push(filePart);
			currentIdx = nextIdx;
		}

		fileParts.current = parts;

		// Calculate statistics for each file
		const stats = {};
		parts.forEach(part => {
			const headerMatch = part.match(/^={40}\n文件名: (.+)\n-{71}\n/);
			if (headerMatch && headerMatch[1]) {
				const filePath = headerMatch[1].trim(); // Get the full path
				const fileContent = part.substring(headerMatch[0].length).trimEnd(); // Get content after header, trim trailing whitespace
				const lineCount = fileContent.split('\n').length;
				const charCount = fileContent.length;
				stats[filePath] = { lineCount, charCount };
			} else {
				console.warn("Could not parse file header in part:", part.substring(0, 100));
			}
		});
		setFileStats(stats);

	}, [processedContent]); // Depend only on processedContent

	// Handle content editing in textarea
	const handleContentChange = (e) => {
		setEditingContent(e.target.value);
	};

	// Save the edited content
	const handleSaveEdit = () => {
		if (onEditContent && currentEditingFile) {
			onEditContent(currentEditingFile, editingContent); // Pass path and new content
		}
		// State reset (isEditing=false, etc.) is handled by the onEditContent callback in the hook
	};

	// Cancel editing
	const handleCancelEdit = () => {
		if (onEditContent) {
			onEditContent(null); // Signal cancellation
		}
	};

	// 新增：处理Markdown预览切换
	const toggleMarkdownPreview = (filePath) => { // Use file path
		setMarkdownPreviews(prev => ({
			...prev,
			[filePath]: !prev[filePath]
		}));
		// 添加按钮点击动画效果
		handleButtonClick(`preview-${filePath}`);
	};


	// 处理按钮点击的动画效果
	const handleButtonClick = (buttonId) => {
		// 设置按钮为活动状态
		setActiveButtons(prev => ({ ...prev, [buttonId]: true }));
		// 一段时间后恢复正常状态
		setTimeout(() => {
			setActiveButtons(prev => ({ ...prev, [buttonId]: false }));
		}, 300);
	};

	// Copy content handlers - 修改以添加按钮动画
	const copyToClipboard = (text, buttonElement, buttonId) => {
		// 添加按钮点击动画
		handleButtonClick(buttonId);

		navigator.clipboard.writeText(text)
			.then(() => {
				// Get position for feedback
				if (buttonElement) {
					const rect = buttonElement.getBoundingClientRect();
					setCopyFeedbackPosition({
						// Position feedback above the button
						top: rect.top - 40, // Adjust as needed
						left: rect.left + (rect.width / 2), // Center horizontally
						transform: 'translateX(-50%)' // Ensure centering
					});
				}

				// Show feedback
				setShowCopyFeedback(true);

				// Hide feedback after animation completes (use timer matching animation)
				setTimeout(() => {
					setShowCopyFeedback(false);
				}, 1500); // Duration includes fade-in and display time
			})
			.catch(err => {
				console.error('复制失败:', err);
				alert("复制失败，请手动选择内容复制");
			});
	};

	// Reset feedback position when animation ends and it's hidden
	const handleCopyFeedbackAnimationEnd = () => {
		if (!showCopyFeedback) {
			setCopyFeedbackPosition({ top: 0, left: 0, transform: 'translateX(-50%)' });
		}
	};


	// Get simple file name for display
	const getDisplayFileName = (filePath) => {
		if (!filePath) return '';
		return filePath.split('/').pop();
	};


	// Render the structure part
	const renderStructure = () => {
		let structureContent = '';
		if (processedContent && processedContent.includes('文件结构:')) {
			const contentIndex = processedContent.indexOf('文件内容:');
			const structurePart = contentIndex !== -1 ? processedContent.substring(0, contentIndex) : processedContent;
			const lines = structurePart.split('\n');
			if (lines.length > 1 && lines[0].includes('文件结构:')) {
				structureContent = lines.slice(1).join('\n').trim(); // Get all lines after header
			}
		}

		if (!structureContent) return null;

		return (
			<div>
				<div className="section-header">
					<h3>文件结构:</h3>
					<button
						className={`copy-button ${activeButtons['structure'] ? 'button-active' : ''}`}
						onClick={(e) => copyToClipboard(structureContent, e.currentTarget, 'structure')}
						title="复制文件结构"
					>
						<i className="fas fa-copy"></i>
					</button>
				</div>
				<pre className="file-structure-content"><code>{structureContent}</code></pre>
			</div>
		);
	};

	// Render individual file part
	const renderFilePart = (part, index) => {
		// Extract filePath and content more robustly
		const headerMatch = part.match(/^={40}\n文件名: (.+)\n-{71}\n/);
		if (!headerMatch || !headerMatch[1]) {
			console.warn("Could not parse file header in part:", part.substring(0, 100));
			return <div key={`error-${index}`} style={{ color: 'red' }}>无法解析文件部分 {index + 1}</div>;
		}

		const filePath = headerMatch[1].trim();
		const displayFileName = getDisplayFileName(filePath);
		const fileContent = part.substring(headerMatch[0].length).trimEnd(); // Use trimEnd

		const fileLanguage = detectLanguage(filePath); // Use path for detection
		const isCurrentEditingFile = isEditing && currentEditingFile === filePath; // Compare paths
		const isMarkdown = isMarkdownFile(filePath);
		const showMarkdownPreview = isMarkdown && markdownPreviews[filePath];
		const stats = fileStats[filePath] || { lineCount: 0, charCount: 0 };
		const copyButtonId = `copy-${filePath}`; // Use path in ID
		const editButtonId = `edit-${filePath}`; // Use path in ID
		const previewButtonId = `preview-${filePath}`; // Use path in ID

		return (
			<div
				key={filePath} // Use path as key
				id={`file-${encodeURIComponent(filePath)}`} // Use path in ID
				className="file-content-container"
			>
				<div className="file-separator">
					<div className="file-info" title={filePath}> {/* Show full path on hover */}
						<i className="fas fa-file-alt"></i> {displayFileName}
						<span className="file-stats">
							<i className="fas fa-code"></i> {stats.lineCount} 行
							<i className="fas fa-text-width"></i> {stats.charCount} 字符
						</span>
						{showMarkdownPreview && (
							<span className="preview-mode-indicator">预览模式</span>
						)}
					</div>
					<div className="file-actions">
						{/* Markdown预览切换按钮 - 仅对Markdown文件显示 */}
						{isMarkdown && !isCurrentEditingFile && (
							<button
								className={`preview-toggle-button ${showMarkdownPreview ? 'active' : ''} ${activeButtons[previewButtonId] ? 'button-active' : ''}`}
								onClick={() => toggleMarkdownPreview(filePath)}
								title={showMarkdownPreview ? "查看源码" : "预览Markdown"}
							>
								<i className={showMarkdownPreview ? "fas fa-code" : "fas fa-eye"}></i>
								{showMarkdownPreview ? "源码" : "预览"}
							</button>
						)}

						{/* Copy button */}
						<button
							className={`copy-button ${activeButtons[copyButtonId] ? 'button-active' : ''}`}
							onClick={(e) => copyToClipboard(fileContent, e.currentTarget, copyButtonId)}
							title="复制文件内容"
							disabled={isCurrentEditingFile} // Disable copy when editing this file
						>
							<i className="fas fa-copy"></i>
						</button>

						{/* Edit button */}
						<button
							className={`edit-button ${activeButtons[editButtonId] ? 'button-active' : ''}`}
							onClick={() => {
								handleButtonClick(editButtonId);
								// setEditingContent(fileContent); // Set temp content in hook instead
								onEditContent(filePath, null, true); // Signal start editing with path
							}}
							disabled={isEditing} // Disable if *any* file is being edited
							title="编辑文件内容"
						>
							<i className="fas fa-edit"></i> 编辑
						</button>
					</div>
				</div>

				{isCurrentEditingFile ? (
					<div className="editor-container">
						<textarea
							className="editor-textarea"
							value={editingContent} // Use the specific state for editing
							onChange={handleContentChange}
							style={{
								fontSize: `${fontSize}px`,
								lineHeight: `${lineHeight}px`
							}}
							aria-label={`编辑 ${displayFileName}`}
						/>
						<div className="editor-buttons">
							<button
								className="button"
								onClick={() => {
									handleButtonClick('save');
									handleSaveEdit();
								}}
							>
								<i className="fas fa-save"></i> 保存
							</button>
							<button
								className="button"
								onClick={() => {
									handleButtonClick('cancel');
									handleCancelEdit();
								}}
							>
								<i className="fas fa-times"></i> 取消
							</button>
						</div>
					</div>
				) : (
					fileContent.length > 0 ? ( // Check if content is not empty
						showMarkdownPreview ? (
							<div
								className="markdown-preview"
								dangerouslySetInnerHTML={{ __html: renderMarkdown(fileContent) }}
							></div>
						) : (
							<pre><code className={fileLanguage ? `language-${fileLanguage}` : ''}>
								{fileContent}
							</code></pre>
						)
					) : (
						<p style={{ padding: '10px', fontStyle: 'italic', opacity: 0.7 }}>（文件为空或未提取内容）</p>
					)
				)}
			</div>
		);
	};

	return (
		<div
			className="highlighted-content"
			ref={containerRef}
			// Style is applied by parent div in app.js
		>
			{/* Copy feedback overlay */}
			<CopyFeedback
				isVisible={showCopyFeedback}
				onAnimationEnd={handleCopyFeedbackAnimationEnd}
				style={copyFeedbackPosition}
			/>

			{/* Structure section */}
			{renderStructure()}

			{/* Content section header */}
			{hasFileContent && fileParts.current.length > 0 && <h3 style={{ margin: '20px 0 10px' }}>文件内容:</h3>}

			{/* Render file parts */}
			{hasFileContent && fileParts.current.map(renderFilePart)}

			{/* Message when content extraction is off */}
			{!hasFileContent && processedContent && processedContent.includes('文件结构:') && (
				<div className="no-content-message">
					<p className="info-message">未提取文件内容。如需查看文件内容，请在设置中开启"自动提取文件内容"选项，然后重新加载文件。</p>
				</div>
			)}

		   {/* Message when there are no files at all (or only structure) */}
		   { !hasFileContent && !(processedContent && processedContent.includes('文件结构:')) && processedContent && (
			  <div className="no-content-message">
				 <p className="info-message">未找到可显示的文件内容。</p>
			  </div>
		   )}

		</div>
	);
};


// Export components
window.Components = window.Components || {};
window.Components.LineNumbers = LineNumbers;
window.Components.HighlightedContent = HighlightedContent;