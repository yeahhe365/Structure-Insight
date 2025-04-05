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
				// Note: Accessing isMobile and setMobileView directly here might be problematic if they change.
				// It's better to handle this logic where these props/state are available.
				// For now, keeping the logic as is based on the provided code.
				if (window.innerWidth <= 768) { // Assuming direct access is okay for this example
				  // Need a way to call setMobileView here, which isn't directly available
				  // This indicates a potential architectural improvement needed.
				}
			}
		});


		// Add to document and save ref
		document.body.appendChild(input);
		fileInputRef.current = input;

		// Clean up on unmount
		return () => {
			if (input.parentElement) {
				document.body.removeChild(input);
			}
		};
	}, []); // Removed handleReceivedFiles, isMobile, setMobileView from deps as they cause issues here

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

	// 提取文件名，忽略路径
	const getFileName = (filePath) => {
		if (!filePath) return '';
		const parts = filePath.split('/');
		return parts[parts.length - 1];
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
			const fileNameLower = file.name.toLowerCase();
			// 修复: 使用简单文件名作为键，确保ZIP内的文件能够正确匹配
			const simpleFileName = getFileName(file.name);

			if (file.type.startsWith('text/') ||
				fileNameLower.endsWith('.js') ||
				fileNameLower.endsWith('.jsx') ||
				fileNameLower.endsWith('.ts') ||
				fileNameLower.endsWith('.tsx') ||
				fileNameLower.endsWith('.json') ||
				fileNameLower.endsWith('.md') ||
				fileNameLower.endsWith('.py') ||
				fileNameLower.endsWith('.html') ||
				fileNameLower.endsWith('.css') ||
				fileNameLower.endsWith('.scss') ||
				fileNameLower.endsWith('.less') ||
				fileNameLower.endsWith('.xml') ||
				fileNameLower.endsWith('.yml') ||
				fileNameLower.endsWith('.yaml') ||
				fileNameLower.endsWith('.java') ||
				fileNameLower.endsWith('.c') ||
				fileNameLower.endsWith('.cpp') ||
				fileNameLower.endsWith('.h') ||
				fileNameLower.endsWith('.cs') ||
				fileNameLower.endsWith('.php') ||
				fileNameLower.endsWith('.sql') ||
				fileNameLower.endsWith('.sh') ||
				fileNameLower.endsWith('.rb') ||
				fileNameLower.endsWith('.go') ||
				fileNameLower.endsWith('.config') ||
				fileNameLower.endsWith('.properties') ||
				fileNameLower.endsWith('.txt') ||
				fileNameLower.endsWith('.ini') ||
				fileNameLower.endsWith('.env') ||
				fileNameLower.endsWith('.gitignore') ||
				fileNameLower.endsWith('.htaccess') ||
				fileNameLower.endsWith('.vue') ||
				fileNameLower.endsWith('.svelte') ||
				// 检测无扩展名的常见配置文件
				fileNameLower === 'dockerfile' ||
				fileNameLower === 'makefile' ||
				fileNameLower === 'readme' ||
				fileNameLower === 'license' ||
				fileNameLower === 'changelog') {

				try {
					// Read file content
					const content = await FileUtils.readFileContent(file);

					// 始终将文件内容添加到filesContent数组以备后用
					fileContents.push({ name: file.webkitRelativePath || file.name, content }); // Use relative path as name

					// 仅当extractContentRef.current为true时添加到主内容
					if (extractContentRef.current) {
						const separator = `${'='.repeat(40)}\n文件名: ${file.webkitRelativePath || file.name}\n${'-'.repeat(71)}\n`; // Use relative path in separator

						// 修复: 同时存储完整路径和简单文件名的位置
						positions[file.webkitRelativePath || file.name] = currentPosition; // Use relative path as key
						// If simple name is different, store it too? Maybe not necessary if selection uses relative path.
						// positions[simpleFileName] = currentPosition; // Let's stick to relative path for consistency

						currentPosition += separator.length + content.length + 2; // Add separator, content, and newlines

						// 附加到本地字符串而不是更新状态
						accumulatedContent += separator + content + "\n\n";
					}
				} catch (error) {
					console.error(`Error reading file ${file.name}:`, error);
					fileContents.push({ name: file.webkitRelativePath || file.name, error: true });
					updateTreeNodeStatus(file.webkitRelativePath || file.name, 'error'); // Use relative path
				}
			} else {
				// Skip non-text files
				updateTreeNodeStatus(file.webkitRelativePath || file.name, 'skipped'); // Use relative path
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


	// Update tree node status (using file path as identifier)
	const updateTreeNodeStatus = (filePath, status) => {
		setTreeData(prevTree => {
			if (!prevTree || !Array.isArray(prevTree)) {
				return prevTree;
			}

			const updateNode = (nodes) => {
				return nodes.map(node => {
					if (!node) return node;

					// Check path instead of just name
					if (!node.isDirectory && node.path === filePath) {
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
			setReceivedFiles(files); // This might store a FileList, needs consistent handling

			try {
				// Save basic info to lastOpenedFiles
				// Converting FileList to array might be needed if `files` isn't already an array
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
	const handleLocalFolderSelect = (isMobile, setMobileView) => { // Pass needed state/setters
		// 先重置当前file input
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
			fileInputRef.current.click();
		}
		// Logic to switch view on mobile needs to be here or triggered after files are received
		// Maybe call setMobileView inside the 'change' listener of the input?
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

		// Clear cache related to content
		Storage.remove('fileStructure');
		Storage.remove('filesContent');
		Storage.remove('treeData');
		Storage.remove('currentContent');
		Storage.remove('filePositions');
		Storage.remove('lastOpenedFiles'); // Also clear last opened if resetting
	};

	// Clear all cache data - 清除缓存功能
	const clearCache = useCallback(() => {
		// 先重置内容
		resetContent(); // Resets state and removes specific storage items

		// 重置文件输入框
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}

		// 清除所有本地存储 (might be too broad, resetContent is safer)
		// Storage.clear(); // Use with caution - clears EVERYTHING

		// 更新状态消息
		setStatusMessage('已清除所有缓存数据');
		setTimeout(() => {
			setStatusMessage('就绪');
		}, 2000);
	}, []); // Add dependencies if necessary, though `resetContent` captures most

	// Cancel file processing
	const cancelProcessing = () => {
		if (!processing) return; // Check if actually processing

		setProcessing(false); // Should ideally use AbortController to stop async tasks
		setStatusMessage('已取消');
		setTimeout(() => {
			// Restore previous status or set to 'Ready'
			const status = currentContent ? `就绪 - 共 ${lineCount} 行, ${charCount} 字符` : '就绪';
			setStatusMessage(status);
		}, 2000);
	};


	// Copy content to clipboard
	const copyContent = () => {
		if (!currentContent) return;

		navigator.clipboard.writeText(currentContent)
			.then(() => {
				setStatusMessage("内容已复制到剪贴板");
				setTimeout(() => {
					const status = currentContent ? `就绪 - 共 ${lineCount} 行, ${charCount} 字符` : '就绪';
					setStatusMessage(status);
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

		const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' }); // Specify charset
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
		// Use node.path which should be the unique webkitRelativePath
		if (!node || !node.path) return;
		const filePath = node.path;

		// Exit edit mode without dialog
		if (isEditing) {
			setIsEditing(false);
			setCurrentEditingFile(null);
		}

		// Use the unique file path to find the position
		const position = filePositions[filePath];

		// 只有在extractContentRef.current为true且文件位置存在时才跳转到文件位置
		if (extractContentRef.current && typeof position === 'number') {
			// Switch to editor view on mobile
			if (isMobile) {
				setIsTransitioning(true);
				setTimeout(() => {
					setMobileView('editor');
					setTimeout(() => setIsTransitioning(false), 300);
				}, 50);
			}

			// Use the file path for the ID
			const fileId = `file-${encodeURIComponent(filePath)}`;
			let fileElement = document.getElementById(fileId);

			if (fileElement) {
				fileElement.scrollIntoView({
					behavior: isMobile ? 'smooth' : 'auto',
					block: 'start'
				});

				setTimeout(() => {
					if (editorScrollRef.current) {
						editorScrollRef.current.scrollTop -= 60; // Adjust based on header size
					}
				}, isMobile ? 50 : 0);

				setTimeout(() => {
					const elementToHighlight = document.getElementById(fileId); // Re-query
					if (elementToHighlight) {
						elementToHighlight.classList.add('highlight-file');
						setTimeout(() => {
							if (elementToHighlight) { // Check again before removing class
							  elementToHighlight.classList.remove('highlight-file');
							}
						}, 1500);
					}
				}, isMobile ? 300 : 100);

			} else {
				// Fallback if element ID not found (should be rare if IDs match paths)
				const targetElement = editorScrollRef.current;
				if (targetElement) {
					const textBeforePosition = currentContent.substring(0, position);
					const linesBefore = textBeforePosition.split('\n').length;
					const scrollPosition = linesBefore * lineHeight - 60; // Estimate and offset

					targetElement.scrollTo({
						top: Math.max(0, scrollPosition),
						behavior: isMobile ? 'smooth' : 'auto'
					});
				}
				console.warn(`Element with ID ${fileId} not found for scrolling.`);
			}

			// Update status message using the display name (node.name)
			setStatusMessage(`已跳转到: ${node.name}`);
			setTimeout(() => {
				const status = currentContent ? `就绪 - 共 ${lineCount} 行, ${charCount} 字符` : '就绪';
				setStatusMessage(status);
			}, 2000);

		} else if (!extractContentRef.current) {
			// If content is not extracted
			if (isMobile) {
				setIsTransitioning(true);
				setTimeout(() => {
					setMobileView('editor');
					setTimeout(() => setIsTransitioning(false), 300);
				}, 50);
			}

			setStatusMessage(`未提取文件内容，无法跳转到: ${node.name}`);
			setTimeout(() => {
				const status = currentContent ? `就绪 - 共 ${lineCount} 行, ${charCount} 字符` : '就绪';
				setStatusMessage(status);
			}, 2000);

			// Optionally display the single file content if needed
			// const fileData = filesContent.find(f => f.name === filePath); // Find by path
			// if (fileData && fileData.content) {
			//   // Maybe set currentContent to just this file's content temporarily?
			// }

		} else {
			// Position doesn't exist
			console.warn(`找不到文件位置: ${filePath}`);
			setStatusMessage(`无法跳转到: ${node.name} (找不到文件位置)`);
			setTimeout(() => {
				const status = currentContent ? `就绪 - 共 ${lineCount} 行, ${charCount} 字符` : '就绪';
				setStatusMessage(status);
			}, 2000);
		}
	};


	// File deletion handler - Needs careful review of offset logic
	const handleFileDelete = (node) => {
		// Use node.path as the unique identifier
		if (!node || !node.path) return;
		const filePath = node.path;

		// If file is being edited, exit edit mode
		if (isEditing && currentEditingFile === filePath) {
			setIsEditing(false);
			setCurrentEditingFile(null);
		}

		// Remove from tree data
		setTreeData(prevTree => {
			if (!prevTree || !Array.isArray(prevTree)) return prevTree;
			const removeNode = (nodes) => {
				return nodes.filter(n => {
					if (!n) return false;
					if (!n.isDirectory && n.path === filePath) return false; // Check path
					if (n.children && Array.isArray(n.children)) {
						n.children = removeNode(n.children);
					}
					return true;
				});
			};
			return removeNode(prevTree);
		});

		// Remove from file contents (using path)
		setFilesContent(prev => prev.filter(f => f.name !== filePath));

		// Update text content - Only if content was extracted
		if (extractContentRef.current && typeof filePositions[filePath] === 'number') { // <--- 问题点：偏移量更新逻辑复杂且易错
			const pos = filePositions[filePath];
			const beforePosContent = currentContent.substring(0, pos);

			// Find the end of the file's section (next separator or end of string)
			const nextSeparatorPattern = '\n' + '='.repeat(40) + '\n文件名:';
			let endOfSection = currentContent.indexOf(nextSeparatorPattern, pos);
			let afterPosContent = '';
			let removedLength = 0;

			if (endOfSection !== -1) {
				// Found the next separator, content is between pos and endOfSection
				afterPosContent = currentContent.substring(endOfSection); // Keep the next separator
				removedLength = endOfSection - pos;
			} else {
				// This was the last file, remove everything from pos onwards
				removedLength = currentContent.length - pos;
			}

			const newCurrentContent = beforePosContent + afterPosContent;
			setCurrentContent(newCurrentContent);

			// Update file positions
			const newPositions = {};
			Object.entries(filePositions).forEach(([path, position]) => {
				if (path !== filePath) { // Exclude the deleted file
					if (position > pos) {
						newPositions[path] = position - removedLength;
					} else {
						newPositions[path] = position;
					}
				}
			});
			setFilePositions(newPositions);
		}

		// Update status info
		setStatusMessage(`已移除: ${node.name}`);
		setTimeout(() => {
			const status = currentContent ? `就绪 - 共 ${lineCount} 行, ${charCount} 字符` : '就绪';
			setStatusMessage(status);
		}, 2000);
	};


	// Handle file content editing - Needs careful review of offset logic
	const handleEditContent = (filePath, newContent, startEditing = false) => {
		// If starting edit mode
		if (startEditing) {
			setIsEditing(true);
			setCurrentEditingFile(filePath); // Store the unique path
			// Find the actual content to edit
			const fileData = filesContent.find(f => f.name === filePath);
			setEditedContent(fileData ? fileData.content : ''); // Set initial edit content
			return;
		}

		// If canceling edit
		if (filePath === null) {
			setIsEditing(false);
			setCurrentEditingFile(null);
			setEditedContent(''); // Clear temp edit content
			return;
		}

		// If saving edit (filePath is the identifier, newContent has the data)
		if (newContent !== null && currentEditingFile) {
			const targetFilePath = currentEditingFile;

			// Update file content array (using path)
			let oldContentLength = 0;
			setFilesContent(prev =>
				prev.map(file => {
					if (file.name === targetFilePath) {
						oldContentLength = file.content.length;
						return { ...file, content: newContent };
					}
					return file;
				})
			);


			// Update complete content string - Only if content was extracted
			if (extractContentRef.current && typeof filePositions[targetFilePath] === 'number') { // <--- 问题点：偏移量更新逻辑复杂且易错
				const position = filePositions[targetFilePath];
				const separatorPattern = `\n文件名: ${targetFilePath}\n${'-'.repeat(71)}\n`;
				const startOfContent = position + separatorPattern.length;

				// Calculate length difference using the stored old length
				const lengthDifference = newContent.length - oldContentLength;

				// Construct the new content string
				const before = currentContent.substring(0, startOfContent);
				const afterStart = startOfContent + oldContentLength;
				const after = currentContent.substring(afterStart);

				const newCurrentContent = before + newContent + after;
				setCurrentContent(newCurrentContent);

				// Update positions of subsequent files
				const updatedPositions = { ...filePositions };
				Object.keys(updatedPositions).forEach(path => {
					// Use '> position' to only update files listed *after* the edited one
					if (updatedPositions[path] > position) {
						updatedPositions[path] += lengthDifference;
					}
				});
				setFilePositions(updatedPositions);
			}

			// Exit edit mode
			setIsEditing(false);
			setCurrentEditingFile(null);
			setEditedContent(''); // Clear temp edit content

			// Update status info
			const displayName = getFileName(targetFilePath);
			setStatusMessage(`已保存修改: ${displayName}`);
			setTimeout(() => {
				const status = currentContent ? `就绪 - 共 ${lineCount} 行, ${charCount} 字符` : '就绪';
				setStatusMessage(status);
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

			// Only show overlay if not editing and drag counter is positive
			if (!isEditing && dragCounter.current > 0) {
				setIsDragging(true);
			}
		},

		handleDragOver: (e) => {
			e.preventDefault();
			e.stopPropagation();
			// Set drop effect
			if (!isEditing) {
			  e.dataTransfer.dropEffect = 'copy';
			} else {
			  e.dataTransfer.dropEffect = 'none';
			}
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

		handleDrop: async (e, setMobileView, isMobile) => { // Pass setters
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

			// Check for folder items using DataTransferItemList and webkitGetAsEntry
			if (items && items.length > 0 && items[0].webkitGetAsEntry) {
				try {
					const entries = [];
					for (let i = 0; i < items.length; i++) {
						entries.push(items[i].webkitGetAsEntry());
					}

					// Helper function to recursively read entries
					const readEntriesRecursively = async (entry) => {
						return new Promise((resolve, reject) => {
							if (!entry) {
								resolve([]);
								return;
							}
							if (entry.isFile) {
								entry.file(
									(file) => {
										// Add webkitRelativePath manually
										Object.defineProperty(file, 'webkitRelativePath', {
											value: entry.fullPath.startsWith('/') ? entry.fullPath.substring(1) : entry.fullPath,
											writable: true,
										});
										resolve([file]);
									},
									(err) => {
										console.error("Error reading file entry:", err);
										resolve([]); // Resolve empty on error
									}
								);
							} else if (entry.isDirectory) {
								const dirReader = entry.createReader();
								let allDirFiles = [];
								const readBatch = () => {
									dirReader.readEntries(
										async (batchEntries) => {
											if (batchEntries.length === 0) {
												resolve(allDirFiles); // Finished reading directory
											} else {
												const batchPromises = batchEntries.map(readEntriesRecursively);
												const filesArray = await Promise.all(batchPromises);
												allDirFiles = allDirFiles.concat(...filesArray); // Flatten results
												readBatch(); // Read next batch
											}
										},
										(err) => {
											console.error("Error reading directory entries:", err);
											resolve(allDirFiles); // Resolve with what was read so far
										}
									);
								};
								readBatch();
							} else {
								resolve([]); // Ignore other types
							}
						});
					};


					// Process all top-level entries
					const promises = entries.map(entry => entry ? readEntriesRecursively(entry) : Promise.resolve([]));
					const filesArrays = await Promise.all(promises);
					allFiles = filesArrays.flat(); // Flatten the array of arrays

				} catch (error) {
					console.error('Error processing dropped items:', error);
					// Fallback to using droppedFiles if entry processing fails
					if (droppedFiles.length > 0) {
						allFiles = Array.from(droppedFiles);
						// Attempt to add relative path if missing (won't work for folders this way)
						allFiles = allFiles.map(file => {
							if (!file.webkitRelativePath) {
								Object.defineProperty(file, 'webkitRelativePath', { value: file.name, writable: true });
							}
							return file;
						});
					}
				}
			} else if (droppedFiles.length > 0) {
				// Fallback for browsers not supporting webkitGetAsEntry or if only files dropped
				allFiles = Array.from(droppedFiles);
				// Add relative path if missing
				allFiles = allFiles.map(file => {
					if (!file.webkitRelativePath) {
						Object.defineProperty(file, 'webkitRelativePath', { value: file.name, writable: true });
					}
					return file;
				});
			}


			// Process all collected files
			if (allFiles.length > 0) {
				handleReceivedFiles(allFiles);

				// Automatically switch to editor view on mobile
				if (isMobile && setMobileView) { // Check if setMobileView is passed
					setMobileView('editor');
				}
			} else {
				setStatusMessage('未找到有效文件或文件夹');
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
	}, [extractContentProp]); // Depend only on the prop

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
		currentEditingFile: currentEditingFile, // Return the path
		editedContent: editedContent, // Return the temporary edit content
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