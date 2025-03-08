/**
 * Structure Insight Web - UI Hooks
 * Hooks for UI and device-related functionality
 */

const { useState, useEffect, useRef, useCallback } = React;
const { Storage, SearchUtils, DOMUtils } = window.Utils;

//=============================================================================
// DEVICE DETECTION HOOKS MODULE
//=============================================================================

/**
 * Hook for detecting device type and managing mobile view state
 * @returns {Object} Device information and state
 */
const useDeviceDetection = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const [mobileView, setMobileView] = useState(Storage.load('mobileView', 'editor'));
    const [isTransitioning, setIsTransitioning] = useState(false);
    const mobileToggleRef = useRef(null);
    
    // Update device detection on resize
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
    
    // Toggle mobile view handler
    const toggleMobileView = useCallback(() => {
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
    }, []);
    
    return {
        isMobile, 
        isLandscape,
        mobileView,
        isTransitioning,
        mobileToggleRef,
        toggleMobileView,
        setMobileView,
        setIsTransitioning,
        isTabletLandscape: isMobile && isLandscape && window.innerWidth > 480
    };
};

//=============================================================================
// SEARCH FUNCTIONALITY HOOKS MODULE - OPTIMIZED
//=============================================================================

/**
 * Hook for search functionality with optimizations
 * @param {String} currentContent Content to search in
 * @param {Number} lineHeight Line height for scroll calculations
 * @param {Function} setStatusMessage Function to update status message
 * @returns {Object} Search state and handlers
 */
const useSearchFunctionality = (currentContent, lineHeight, setStatusMessage) => {
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMatches, setSearchMatches] = useState([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [searchOptions, setSearchOptions] = useState({
        caseSensitive: false,
        useRegex: false,
        wholeWord: false,
        fuzzySearch: false, // 新增: 模糊搜索选项
        searchInAllFiles: false, // 新增: 跨文件搜索选项
        liveSearch: true, // 新增: 实时搜索选项
    });
    const [searchHistory, setSearchHistory] = useState(Storage.load('searchHistory', [])); // 新增: 搜索历史
    const [searchInProgress, setSearchInProgress] = useState(false); // 新增: 搜索进行中状态
    const [contextLines, setContextLines] = useState(0); // 新增: 上下文行数
    const searchTimeoutRef = useRef(null); // 新增: 用于防抖的计时器引用
    const previousSearchRef = useRef(''); // 新增: 记录前一次搜索
    const highlightsContainerRef = useRef(null); // 新增: 用于管理高亮元素

    // 新增: 保存搜索历史
    useEffect(() => {
        Storage.save('searchHistory', searchHistory);
    }, [searchHistory]);
    
    // 新增: 创建虚拟高亮容器用于提高性能
    useEffect(() => {
        highlightsContainerRef.current = document.createElement('div');
        highlightsContainerRef.current.style.display = 'none';
        document.body.appendChild(highlightsContainerRef.current);
        
        return () => {
            if (highlightsContainerRef.current) {
                document.body.removeChild(highlightsContainerRef.current);
            }
        };
    }, []);

    // Clear search highlights function - 优化版本
    const clearSearchHighlights = useCallback((editorScrollRef) => {
        // Skip if not in DOM
        if (!editorScrollRef?.current) return;
        
        // 使用更高效的方式移除所有高亮
        const highlights = editorScrollRef.current.querySelectorAll('.search-highlight');
        
        if (highlights.length === 0) return;
        
        // 优化: 批量处理DOM操作
        const fragment = document.createDocumentFragment();
        const toReplace = [];
        
        highlights.forEach(el => {
            toReplace.push({
                element: el,
                text: el.textContent
            });
        });
        
        // 执行替换
        toReplace.forEach(item => {
            const parent = item.element.parentNode;
            if (parent) {
                // 替换高亮元素为文本节点
                parent.replaceChild(document.createTextNode(item.text), item.element);
                // 规范化文本节点，合并相邻节点
                parent.normalize();
            }
        });
    }, []);
    
    // Clear search state when content changes
    useEffect(() => {
        if (searchMatches.length > 0) {
            setSearchMatches([]);
            setCurrentMatchIndex(0);
        }
    }, [currentContent]);
    
    // 优化的高亮匹配函数: 使用虚拟DOM和批量处理
    const highlightMatches = useCallback((matches, currentIndex, editorScrollRef) => {
        if (!editorScrollRef?.current || !matches.length) return;
        
        // 首先清除之前的高亮
        clearSearchHighlights(editorScrollRef);
        
        // 使用DOM接口添加高亮
        const range = document.createRange();
        
        // 批量处理高亮
        const batchSize = 50; // 一次处理50个匹配项以避免阻塞UI
        let processed = 0;
        
        const processNextBatch = (startTime) => {
            const timeLimit = 16; // 每帧最多使用16ms来保持流畅的60fps
            const currentTime = performance.now();
            const timeElapsed = currentTime - startTime;
            
            if (timeElapsed > timeLimit) {
                // 如果超过时间限制，在下一帧继续处理
                requestAnimationFrame(() => processNextBatch(performance.now()));
                return;
            }
            
            const startIdx = processed;
            const endIdx = Math.min(processed + batchSize, matches.length);
            
            for (let i = startIdx; i < endIdx; i++) {
                const match = matches[i];
                
                // 将匹配位置转换为DOM节点上下文
                DOMUtils.findTextNodes(editorScrollRef.current, match.start, match.end, (textNode, startOffset, endOffset) => {
                    try {
                        range.setStart(textNode, startOffset);
                        range.setEnd(textNode, endOffset);
                        
                        // 创建高亮元素
                        const highlight = document.createElement('span');
                        highlight.className = `search-highlight ${i === currentIndex ? 'current' : ''}`;
                        highlight.dataset.matchIndex = i;
                        
                        // 使用范围包装文本并添加高亮样式
                        range.surroundContents(highlight);
                    } catch (e) {
                        // 忽略高亮错误，通常是由于DOM结构变化导致
                    }
                });
            }
            
            processed = endIdx;
            
            // 如果还有更多匹配，安排下一批处理
            if (processed < matches.length) {
                if (timeElapsed < timeLimit) {
                    // 继续处理当前帧内的批次
                    processNextBatch(startTime);
                } else {
                    // 在下一帧继续处理
                    requestAnimationFrame(() => processNextBatch(performance.now()));
                }
            } else {
                // 所有批次处理完成，确保当前匹配项可见
                setTimeout(() => {
                    const currentHighlight = editorScrollRef.current.querySelector('.search-highlight.current');
                    if (currentHighlight) {
                        scrollToMatch({ start: match.start, end: match.end }, editorScrollRef);
                    }
                }, 10);
            }
        };
        
        // 开始批量处理
        requestAnimationFrame(() => processNextBatch(performance.now()));
    }, [clearSearchHighlights]);
    
    // 优化的滚动到匹配函数
    const scrollToMatch = useCallback((match, editorScrollRef, isMobile) => {
        if (!match || !editorScrollRef?.current) return;
        
        // 计算匹配项的大致行号
        const textBeforeMatch = currentContent.substring(0, match.start);
        const linesBefore = textBeforeMatch.split('\n').length;
        
        // 估计滚动位置 - 将匹配项居中显示
        const scrollOffset = editorScrollRef.current.clientHeight / 3;
        let scrollPosition = (linesBefore * lineHeight) - scrollOffset;
        
        // 当有上下文行时，调整滚动位置以显示更多内容
        if (contextLines > 0) {
            scrollPosition = (linesBefore - contextLines) * lineHeight - scrollOffset;
        }
        
        // 滚动到计算的位置
        editorScrollRef.current.scrollTo({
            top: Math.max(0, scrollPosition),
            behavior: 'smooth'
        });
        
        // 增强视觉反馈
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
    }, [currentContent, lineHeight, contextLines]);
    
    /**
     * 高级搜索函数 - 优化版本
     * 支持模糊搜索、上下文行显示以及性能优化
     */
    const performSearchInternal = useCallback((query, options = {}, editorScrollRef, filesContent = []) => {
        // 清除之前的搜索超时
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
        
        if (!query || !currentContent) {
            setSearchMatches([]);
            setCurrentMatchIndex(0);
            clearSearchHighlights(editorScrollRef);
            setSearchInProgress(false);
            return;
        }
        
        // 保存搜索参数
        setSearchQuery(query);
        setSearchOptions(options);
        setSearchInProgress(true);
        
        // 准备搜索内容和匹配项
        const content = currentContent;
        let matches = [];
        
        try {
            // 定义用于实际执行搜索的函数
            const executeSearch = () => {
                if (options.fuzzySearch) {
                    // 模糊搜索实现
                    matches = performFuzzySearch(content, query, options);
                } else if (options.searchInAllFiles && filesContent.length > 0) {
                    // 跨文件搜索实现
                    matches = performSearchAcrossFiles(query, options, filesContent);
                } else {
                    // 使用标准工具函数查找所有匹配项
                    matches = SearchUtils.performSearch(content, query, options);
                }
                
                // 处理搜索结果
                finishSearch(matches, query);
            };
            
            // 是否启用实时搜索
            if (options.liveSearch) {
                // 使用延迟执行以提高输入响应性
                searchTimeoutRef.current = setTimeout(executeSearch, 150);
            } else {
                // 直接执行搜索
                executeSearch();
            }
        } catch (error) {
            console.error('搜索错误:', error);
            setStatusMessage(`搜索错误: ${error.message}`);
            setTimeout(() => {
                setStatusMessage(`就绪`);
            }, 2000);
            setSearchInProgress(false);
        }
        
        // 用于完成搜索并处理结果的函数
        const finishSearch = (matches, query) => {
            // 更新搜索结果
            setSearchMatches(matches);
            setSearchInProgress(false);
            
            // 如果找到匹配项，高亮并滚动到第一个匹配项
            if (matches.length > 0) {
                setCurrentMatchIndex(0);
                highlightMatches(matches, 0, editorScrollRef);
                scrollToMatch(matches[0], editorScrollRef);
                setStatusMessage(`找到 ${matches.length} 个匹配结果`);
                
                // 添加到搜索历史（只保留最近10项且不重复）
                addToSearchHistory(query);
            } else {
                setCurrentMatchIndex(-1);
                clearSearchHighlights(editorScrollRef);
                setStatusMessage(`未找到匹配项: "${query}"`);
                setTimeout(() => {
                    setStatusMessage(`就绪`);
                }, 2000);
            }
        };
    }, [currentContent, clearSearchHighlights, highlightMatches, scrollToMatch, setStatusMessage]);
    
    // 新增: 添加到搜索历史
    const addToSearchHistory = (query) => {
        // 确保不添加空查询
        if (!query.trim()) return;
        
        // 不添加重复项
        if (previousSearchRef.current === query) return;
        previousSearchRef.current = query;
        
        setSearchHistory(prev => {
            // 移除重复项
            const newHistory = prev.filter(item => item !== query);
            
            // 添加到历史记录开头
            newHistory.unshift(query);
            
            // 保持历史记录在10项以内
            return newHistory.slice(0, 10);
        });
    };
    
    // 新增: 执行模糊搜索
    const performFuzzySearch = (content, query, options) => {
        if (!query || !content) return [];
        
        const matches = [];
        const queryChars = query.toLowerCase().split('');
        
        // 将内容分成行以便处理
        const lines = content.split('\n');
        let currentPosition = 0;
        
        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const line = lines[lineIdx];
            const lineLength = line.length;
            const lineLower = options.caseSensitive ? line : line.toLowerCase();
            
            // 简单模糊匹配算法: 检查每个查询字符是否按序出现
            let charIdx = 0;
            let startIdx = -1;
            let allCharsFound = true;
            
            for (let i = 0; i < queryChars.length; i++) {
                const queryChar = queryChars[i];
                const foundIdx = lineLower.indexOf(queryChar, charIdx);
                
                if (foundIdx === -1) {
                    allCharsFound = false;
                    break;
                }
                
                if (startIdx === -1) startIdx = foundIdx;
                charIdx = foundIdx + 1;
            }
            
            if (allCharsFound && startIdx !== -1) {
                // 找到模糊匹配，创建匹配对象
                const globalPos = currentPosition + startIdx;
                const endPos = currentPosition + charIdx;
                
                matches.push({
                    start: globalPos,
                    end: endPos,
                    text: line.substring(startIdx, charIdx),
                    lineNumber: lineIdx + 1
                });
            }
            
            // 更新全局位置
            currentPosition += lineLength + 1; // +1 是为了包含换行符
        }
        
        return matches;
    };
    
    // 新增: 跨文件搜索
    const performSearchAcrossFiles = (query, options, filesContent) => {
        if (!query || !filesContent.length) return [];
        
        const allMatches = [];
        let globalOffset = 0;
        
        // 记录每个文件的起始位置
        const filePositions = {};
        let position = 0;
        
        // 找出文件结构部分的结束位置
        const structureEndIndex = currentContent.indexOf('文件内容:');
        if (structureEndIndex !== -1) {
            globalOffset = structureEndIndex;
        }
        
        // 处理每个文件
        filesContent.forEach(file => {
            if (!file.content) return;
            
            // 在文件内容中搜索
            const fileMatches = SearchUtils.performSearch(file.content, query, options);
            
            // 找到文件在主内容中的位置
            const fileMarker = `文件名: ${file.name}\n`;
            const fileIndex = currentContent.indexOf(fileMarker, globalOffset);
            
            if (fileIndex !== -1) {
                // 找到分隔线的结束位置
                const separatorEnd = currentContent.indexOf('\n', currentContent.indexOf('-'.repeat(71), fileIndex)) + 1;
                
                if (separatorEnd !== 0) {
                    filePositions[file.name] = separatorEnd;
                    
                    // 调整匹配项的位置
                    fileMatches.forEach(match => {
                        allMatches.push({
                            start: separatorEnd + match.start,
                            end: separatorEnd + match.end,
                            text: match.text,
                            fileName: file.name
                        });
                    });
                }
            }
        });
        
        // 按位置排序匹配项
        return allMatches.sort((a, b) => a.start - b.start);
    };
    
    // 导出 performSearch 与包装函数
    const performSearch = useCallback((query, options = {}, editorScrollRef, filesContent) => {
        performSearchInternal(query, options, editorScrollRef, filesContent);
    }, [performSearchInternal]);
    
    // 优化的前进/后退匹配函数
    const goToNextMatch = useCallback((editorScrollRef) => {
        const { length } = searchMatches;
        if (length === 0) return;
        
        const newIndex = (currentMatchIndex + 1) % length;
        setCurrentMatchIndex(newIndex);
        highlightMatches(searchMatches, newIndex, editorScrollRef);
        scrollToMatch(searchMatches[newIndex], editorScrollRef);
        
        // 更新状态消息
        setStatusMessage(`匹配 ${newIndex + 1}/${length}`);
    }, [searchMatches, currentMatchIndex, highlightMatches, scrollToMatch, setStatusMessage]);
    
    const goToPreviousMatch = useCallback((editorScrollRef) => {
        const { length } = searchMatches;
        if (length === 0) return;
        
        const newIndex = (currentMatchIndex - 1 + length) % length;
        setCurrentMatchIndex(newIndex);
        highlightMatches(searchMatches, newIndex, editorScrollRef);
        scrollToMatch(searchMatches[newIndex], editorScrollRef);
        
        // 更新状态消息
        setStatusMessage(`匹配 ${newIndex + 1}/${length}`);
    }, [searchMatches, currentMatchIndex, highlightMatches, scrollToMatch, setStatusMessage]);
    
    // 搜索对话框打开/关闭函数
    const openSearchDialog = useCallback((isMobile, mobileView, setIsTransitioning, setMobileView) => {
        if (!currentContent) return;
        
        // 确保在移动设备上显示编辑器视图
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
    }, [currentContent]);
    
    const closeSearchDialog = useCallback(() => {
        setIsSearchDialogOpen(false);
    }, []);
    
    // 新增: 从历史记录中选择搜索项
    const selectFromHistory = useCallback((historyItem, editorScrollRef) => {
        setSearchQuery(historyItem);
        performSearch(historyItem, searchOptions, editorScrollRef);
    }, [searchOptions, performSearch]);
    
    // 新增: 获取/设置上下文行数
    const setSearchContextLines = useCallback((lines) => {
        setContextLines(Math.max(0, Math.min(10, lines)));
    }, []);
    
    // 新增: 清除搜索历史
    const clearSearchHistory = useCallback(() => {
        setSearchHistory([]);
        Storage.save('searchHistory', []);
    }, []);
    
    return {
        isSearchDialogOpen,
        searchQuery,
        searchMatches,
        currentMatchIndex,
        searchOptions,
        searchHistory, // 新增: 搜索历史
        searchInProgress, // 新增: 搜索进行中状态
        contextLines, // 新增: 上下文行数
        setIsSearchDialogOpen,
        performSearch,
        goToNextMatch,
        goToPreviousMatch,
        openSearchDialog,
        closeSearchDialog,
        clearSearchHighlights,
        highlightMatches,
        selectFromHistory, // 新增: 从历史记录中选择
        setSearchContextLines, // 新增: 设置上下文行数
        clearSearchHistory, // 新增: 清除搜索历史
        setSearchOptions // 新增: 公开设置搜索选项
    };
};

//=============================================================================
// UI INTERACTIONS HOOKS MODULE
//=============================================================================

/**
 * Hook for UI interactions and scroll syncing
 * @returns {Object} UI interaction handlers and state
 */
const useUIInteractions = () => {
    const [leftPanelWidth, setLeftPanelWidth] = useState(Storage.load('leftPanelWidth', 75));
    const [scrollToTopVisible, setScrollToTopVisible] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    
    const containerRef = useRef(null);
    const editorScrollRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const appRef = useRef(null);
    
    // Save left panel width
    useEffect(() => {
        Storage.save('leftPanelWidth', leftPanelWidth);
    }, [leftPanelWidth]);
    
    // Handle panel resize update
    const handleResizeUpdate = useCallback((newPercentage) => {
        setLeftPanelWidth(newPercentage);
    }, []);
    
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
    
    // Mobile scroll event handling
    const handleMobileScroll = useCallback(() => {
        if (!editorScrollRef.current) return;
        
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
    }, [scrollToTopVisible, isScrolling]);
    
    // Scroll to top function
    const scrollToTop = useCallback(() => {
        if (editorScrollRef.current) {
            editorScrollRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, []);
    
    return {
        leftPanelWidth,
        scrollToTopVisible,
        containerRef,
        editorScrollRef,
        lineNumbersRef,
        appRef,
        handleResizeUpdate,
        handleMobileScroll,
        scrollToTop
    };
};

// Export hooks
window.Hooks = window.Hooks || {};
window.Hooks.useDeviceDetection = useDeviceDetection;
window.Hooks.useSearchFunctionality = useSearchFunctionality;
window.Hooks.useUIInteractions = useUIInteractions;