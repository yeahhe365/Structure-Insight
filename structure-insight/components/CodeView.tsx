
import React from 'react';
import { motion } from 'framer-motion';
import { FileContent, SearchOptions } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// hljs is loaded globally via index.html script tag
declare const hljs: any;

interface FileCardProps {
  file: FileContent;
  isEditing: boolean;
  onStartEdit: (path: string) => void;
  onSaveEdit: (path: string, newContent: string) => void;
  onCancelEdit: () => void;
  isMarkdown: boolean;
  isMarkdownPreview: boolean;
  onToggleMarkdownPreview: (path: string) => void;
  onShowToast: (message: string) => void;
  fontSize: number;
  searchQuery: string;
  searchOptions: SearchOptions;
  activeMatchIndexInFile: number | null;
  onCopyPath: (path: string) => void;
}

const IconButton: React.FC<{icon: string, title: string, onClick: () => void, disabled?: boolean, text?: string}> = ({icon, title, onClick, disabled, text}) => (
    <button onClick={onClick} className="flex items-center space-x-1.5 text-sm text-light-subtle-text dark:text-dark-subtle-text hover:text-light-text dark:hover:text-dark-text disabled:opacity-50 transition-colors" title={title} disabled={disabled}>
        <i className={`fa-regular ${icon}`}></i>
        {text && <span className="hidden sm:inline">{text}</span>}
    </button>
);


const FileCard: React.FC<FileCardProps> = ({ 
    file, isEditing, onStartEdit, onSaveEdit, onCancelEdit, 
    isMarkdown, isMarkdownPreview, onToggleMarkdownPreview, onShowToast, fontSize,
    searchQuery, searchOptions, activeMatchIndexInFile, onCopyPath
}) => {
  const [editText, setEditText] = React.useState(file.content);
  const codeRef = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    setEditText(file.content);
  }, [file.content]);

  // Handle syntax highlighting and search highlighting
  React.useEffect(() => {
    if (codeRef.current && !isEditing && !isMarkdownPreview && !file.excluded) {
      // 1. Set content and syntax highlight
      codeRef.current.textContent = file.content;
      hljs.highlightElement(codeRef.current);

      // 2. Apply search highlighting if query exists
      if (searchQuery.trim()) {
         try {
            const flags = searchOptions.caseSensitive ? 'g' : 'gi';
            let pattern = searchOptions.useRegex ? searchQuery : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (searchOptions.wholeWord && !searchOptions.useRegex) {
                pattern = `\\b${pattern}\\b`;
            }
            const regex = new RegExp(pattern, flags);

            // Use TreeWalker to find text nodes to replace with highlights
            const walker = document.createTreeWalker(codeRef.current, NodeFilter.SHOW_TEXT, null);
            const textNodes: Text[] = [];
            let node: Node | null;
            while ((node = walker.nextNode())) {
                textNodes.push(node as Text);
            }

            let globalMatchIndex = 0;

            textNodes.forEach(textNode => {
                const text = textNode.nodeValue;
                if (!text) return;
                
                const matches = [...text.matchAll(regex)];
                if (matches.length === 0) return;
                
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                
                matches.forEach(match => {
                    // Text before match
                    if (match.index! > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index!)));
                    }
                    
                    // The Match
                    const mark = document.createElement('mark');
                    mark.className = 'search-highlight'; // Base class
                    // Apply active class if this is the currently selected match
                    if (globalMatchIndex === activeMatchIndexInFile) {
                        mark.classList.add('search-highlight-active');
                        // Scroll active match into view
                        setTimeout(() => mark.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
                    }
                    mark.textContent = match[0];
                    fragment.appendChild(mark);
                    
                    globalMatchIndex++;
                    lastIndex = match.index! + match[0].length;
                });
                
                // Text after last match
                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                }
                
                textNode.parentNode?.replaceChild(fragment, textNode);
            });

         } catch (e) {
             console.debug("Search highlight error (regex likely invalid yet):", e);
         }
      }
    }
  }, [file, isEditing, isMarkdownPreview, searchQuery, searchOptions, activeMatchIndexInFile]);


  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast('已复制到剪贴板！');
  };

  const lineNumbers = Array.from({ length: file.stats.lines }, (_, i) => i + 1).join('\n');
  const codeStyle = { fontSize: `${fontSize}px`, lineHeight: `${Math.round(fontSize * 1.5)}px` };
  
  const sanitizedMarkdown = React.useMemo(() => {
    if (isMarkdown && isMarkdownPreview && !file.excluded) {
        const rawHtml = marked.parse(file.content);
        return DOMPurify.sanitize(rawHtml);
    }
    return '';
  }, [file.content, isMarkdown, isMarkdownPreview, file.excluded]);


  return (
    <div className={`bg-light-panel dark:bg-dark-panel rounded-lg overflow-hidden border border-light-border dark:border-dark-border transition-colors duration-300 focus-within:ring-2 focus-within:ring-primary ${file.excluded ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-center p-3 bg-light-header/80 dark:bg-dark-header/80 border-b border-light-border dark:border-dark-border sticky top-0 z-[1] backdrop-blur-sm">
        <div className="font-mono text-sm text-light-text dark:text-dark-text truncate flex items-center" title={file.path}>
          <i className="fa-regular fa-file-lines mr-2 text-light-subtle-text dark:text-dark-subtle-text"></i>
          <span className={`truncate ${file.excluded ? 'line-through text-light-subtle-text dark:text-dark-subtle-text italic' : ''}`}>{file.path} {file.excluded && "(已排除)"}</span>
           <button onClick={() => onCopyPath(file.path)} className="ml-2 text-light-subtle-text hover:text-primary transition-colors flex items-center justify-center p-1 rounded hover:bg-light-border dark:hover:bg-dark-border/50" title="复制路径">
              <i className="fa-regular fa-copy text-xs"></i>
          </button>
        </div>
        <div className="flex items-center space-x-4 text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0 ml-2">
          <span className="hidden sm:inline">{file.stats.lines} 行</span>
          <span className="hidden sm:inline">{file.stats.chars} 字符</span>
          {isMarkdown && !file.excluded && (
             <IconButton onClick={() => onToggleMarkdownPreview(file.path)} title={isMarkdownPreview ? "显示原文" : "预览 Markdown"} disabled={isEditing} icon={isMarkdownPreview ? 'fa-file-code' : 'fa-eye'} />
          )}
          {!file.excluded && (
            <>
                <IconButton onClick={() => onStartEdit(file.path)} title="编辑内容" disabled={isEditing} icon="fa-pen-to-square" />
                <IconButton onClick={() => handleCopy(file.content)} title="复制内容" disabled={isEditing} icon="fa-copy" />
            </>
          )}
        </div>
      </div>
      
      {file.excluded ? (
           <div className="flex flex-col items-center justify-center p-12 text-center text-light-subtle-text dark:text-dark-subtle-text">
                <i className="fa-solid fa-eye-slash text-4xl mb-3 opacity-50"></i>
                <p>此文件已从分析和导出中排除。</p>
                <p className="text-xs mt-1">在文件树中点击眼睛图标以恢复包含。</p>
           </div>
      ) : isEditing ? (
        <div className="p-4">
            <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-64 font-mono text-sm bg-light-bg dark:bg-gray-900 border border-primary/50 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                style={codeStyle}
                autoFocus
            />
            <div className="flex justify-end space-x-2 mt-2">
                <button onClick={onCancelEdit} className="px-3 py-1 rounded-md text-sm bg-gray-200 dark:bg-dark-border hover:bg-gray-300 dark:hover:bg-gray-600">取消</button>
                <button onClick={() => onSaveEdit(file.path, editText)} className="px-3 py-1 rounded-md text-sm bg-primary text-white hover:bg-primary-hover">保存</button>
            </div>
        </div>
      ) : isMarkdown && isMarkdownPreview ? (
        <div className="prose dark:prose-invert max-w-none p-4" style={{fontSize: `${fontSize}px`}} dangerouslySetInnerHTML={{ __html: sanitizedMarkdown }} />
      ) : (
        <div className="flex" style={codeStyle}>
            <pre className="line-numbers text-right pr-4 pl-2 py-3 select-none text-light-subtle-text/50 dark:text-dark-subtle-text/50 bg-light-bg/50 dark:bg-dark-bg/50">
                {lineNumbers}
            </pre>
            <div className="relative flex-1">
                <pre className="py-3 pr-3 whitespace-pre-wrap break-words bg-light-bg dark:bg-dark-bg"><code 
                    ref={codeRef}
                    className={`language-${file.language} hljs`} 
                /></pre>
            </div>
        </div>
      )}
    </div>
  );
};
const MemoizedFileCard = React.memo(FileCard);

interface CodeViewProps {
  selectedFile: FileContent | null;
  editingPath: string | null;
  onStartEdit: (path: string) => void;
  onSaveEdit: (path: string, newContent: string) => void;
  onCancelEdit: () => void;
  markdownPreviewPaths: Set<string>;
  onToggleMarkdownPreview: (path: string) => void;
  onShowToast: (message: string) => void;
  fontSize: number;
  searchQuery: string;
  searchOptions: SearchOptions;
  activeMatchIndexInFile: number | null;
  onCopyPath: (path: string) => void;
}

const CodeView: React.FC<CodeViewProps> = (props) => {
  const { 
    selectedFile, editingPath, onStartEdit, onSaveEdit, onCancelEdit, 
    markdownPreviewPaths, onToggleMarkdownPreview, onShowToast, fontSize,
    searchQuery, searchOptions, activeMatchIndexInFile, onCopyPath
  } = props;

  if (!selectedFile) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 text-light-subtle-text dark:text-dark-subtle-text">
            <i className="fa-regular fa-file-code text-5xl mb-4"></i>
            <p className="font-semibold">选择一个文件</p>
            <p className="text-sm">从左侧资源管理器中选择一个文件以查看其内容。</p>
        </div>
    );
  }
  
  return (
    <div className="h-full p-4 md:p-6 bg-light-bg dark:bg-dark-bg">
        <motion.div
            key={selectedFile.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <MemoizedFileCard
              file={selectedFile}
              isEditing={editingPath === selectedFile.path}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              isMarkdown={selectedFile.language === 'markdown'}
              isMarkdownPreview={markdownPreviewPaths.has(selectedFile.path)}
              onToggleMarkdownPreview={onToggleMarkdownPreview}
              onShowToast={onShowToast}
              fontSize={fontSize}
              searchQuery={searchQuery}
              searchOptions={searchOptions}
              activeMatchIndexInFile={activeMatchIndexInFile}
              onCopyPath={onCopyPath}
            />
        </motion.div>
    </div>
  );
};

export default React.memo(CodeView);