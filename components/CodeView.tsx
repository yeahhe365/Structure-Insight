
import React from 'react';
import hljs from 'highlight.js/lib/common';
import { FileContent, SearchOptions } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { buildSearchRegex } from '../services/searchRegex';

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
  wordWrap?: boolean;
}

const IconButton: React.FC<{icon: string, title: string, onClick: () => void, disabled?: boolean, text?: string}> = ({icon, title, onClick, disabled, text}) => (
    <button onClick={onClick} className="flex items-center space-x-1.5 text-sm text-light-subtle-text dark:text-dark-subtle-text hover:text-light-text dark:hover:text-dark-text disabled:opacity-50 transition-colors" title={title} disabled={disabled}>
        <i className={`fa-solid ${icon}`}></i>
        {text && <span className="hidden sm:inline">{text}</span>}
    </button>
);

const FileCard: React.FC<FileCardProps> = ({
    file, isEditing, onStartEdit, onSaveEdit, onCancelEdit,
    isMarkdown, isMarkdownPreview, onToggleMarkdownPreview, onShowToast, fontSize,
    searchQuery, searchOptions, activeMatchIndexInFile, onCopyPath, wordWrap
}) => {
  const [editText, setEditText] = React.useState(file.content);
  const codeRef = React.useRef<HTMLElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const highlightTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHighlightKey = React.useRef('');

  const syncTextareaHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  React.useEffect(() => {
    setEditText(file.content);
  }, [file.content]);

  React.useLayoutEffect(() => {
    if (!isEditing) return;
    syncTextareaHeight();
  }, [editText, fontSize, isEditing, syncTextareaHeight]);

  // Cleanup highlight timer on unmount
  React.useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // Handle syntax highlighting and debounced search highlighting
  React.useEffect(() => {
    if (!codeRef.current || isEditing || isMarkdownPreview || file.excluded) return;

    // Skip if the highlight inputs haven't actually changed
    const highlightKey = `${file.path}:${file.content}:${searchQuery}:${searchOptions.caseSensitive}:${searchOptions.useRegex}:${searchOptions.wholeWord}:${activeMatchIndexInFile}`;
    if (highlightKey === lastHighlightKey.current) return;
    lastHighlightKey.current = highlightKey;

    // 1. Set content and syntax highlight
    codeRef.current.textContent = file.content;
    hljs.highlightElement(codeRef.current);

    // 2. Debounce search highlighting
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);

    if (!searchQuery.trim()) return;

    const regex = buildSearchRegex(searchQuery, searchOptions);
    if (!regex) return;

    highlightTimerRef.current = setTimeout(() => {
      if (!codeRef.current) return;

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
          if (match.index! > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index!)));
          }

          const mark = document.createElement('mark');
          mark.className = 'search-highlight';
          if (globalMatchIndex === activeMatchIndexInFile) {
            mark.classList.add('search-highlight-active');
            setTimeout(() => mark.scrollIntoView({ behavior: 'auto', block: 'center' }), 0);
          }
          mark.textContent = match[0];
          fragment.appendChild(mark);

          globalMatchIndex++;
          lastIndex = match.index! + match[0].length;
        });

        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        textNode.parentNode?.replaceChild(fragment, textNode);
      });
    }, 150);
  }, [file, isEditing, isMarkdownPreview, searchQuery, searchOptions, activeMatchIndexInFile]);


  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => onShowToast('已复制到剪贴板！'),
      () => onShowToast('复制失败，请检查剪贴板权限')
    );
  };

  const lineNumbers = React.useMemo(
    () => Array.from({ length: file.stats.lines }, (_, i) => i + 1).join('\n'),
    [file.stats.lines]
  );
  const codeStyle = { fontSize: `${fontSize}px`, lineHeight: `${Math.round(fontSize * 1.5)}px` };
  
  const sanitizedMarkdown = React.useMemo(() => {
    if (isMarkdown && isMarkdownPreview && !file.excluded) {
        const rawHtml = marked(file.content, { async: false });
        return DOMPurify.sanitize(rawHtml);
    }
    return '';
  }, [file.content, isMarkdown, isMarkdownPreview, file.excluded]);

  const pathSegments = file.path.split('/');
  const fileName = pathSegments.pop() || file.path;
  const directoryPath = pathSegments.join('/') || '根目录';

  return (
    <div className={`bg-light-panel dark:bg-dark-panel rounded-lg overflow-hidden border border-light-border dark:border-dark-border focus-within:ring-2 focus-within:ring-primary ${file.excluded ? 'opacity-75' : ''}`}>
      <div className="flex flex-col gap-3 p-3 bg-light-header/80 dark:bg-dark-header/80 border-b border-light-border dark:border-dark-border sticky top-0 z-[1] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex items-center gap-3" title={file.path}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-disabled">
            <i className="fa-solid fa-file-lines"></i>
          </div>
          <div className="min-w-0">
            <div className={`truncate font-mono text-sm font-semibold text-light-text dark:text-dark-text ${file.excluded ? 'line-through text-light-subtle-text dark:text-dark-subtle-text italic' : ''}`}>
              {fileName} {file.excluded && "(已排除)"}
            </div>
            <div data-file-path-display="full" className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-light-subtle-text dark:text-dark-subtle-text">
              <i className="fa-solid fa-folder text-[10px]"></i>
              <span className="truncate">{directoryPath}</span>
            </div>
          </div>
           <button onClick={() => onCopyPath(file.path)} className="text-light-subtle-text hover:text-primary transition-colors flex items-center justify-center p-1.5 rounded-lg hover:bg-light-border dark:hover:bg-dark-border/50" title="复制完整路径" aria-label="复制完整路径">
              <i className="fa-solid fa-copy text-xs"></i>
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-light-subtle-text dark:text-dark-subtle-text shrink-0 sm:ml-2">
          <span className="hidden rounded-full border border-light-border px-2 py-1 dark:border-dark-border sm:inline">{file.stats.lines} 行</span>
          <span className="hidden rounded-full border border-light-border px-2 py-1 dark:border-dark-border sm:inline">{file.stats.chars} 字符</span>
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
                className="w-full font-mono text-sm bg-light-bg dark:bg-gray-900 border border-primary/50 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-hidden"
                style={codeStyle}
                autoFocus
                rows={1}
                ref={textareaRef}
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
            <pre className="line-numbers text-right pr-4 pl-2 py-3 select-none text-light-subtle-text dark:text-dark-subtle-text bg-light-bg/70 dark:bg-dark-bg/70">
                {lineNumbers}
            </pre>
            <div className="relative flex-1">
                <pre className={`py-3 pr-3 bg-light-bg dark:bg-dark-bg ${wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'}`}><code 
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
  wordWrap?: boolean;
}

const CodeView: React.FC<CodeViewProps> = (props) => {
  const { 
    selectedFile, editingPath, onStartEdit, onSaveEdit, onCancelEdit, 
    markdownPreviewPaths, onToggleMarkdownPreview, onShowToast, fontSize,
    searchQuery, searchOptions, activeMatchIndexInFile, onCopyPath, wordWrap
  } = props;

  if (!selectedFile) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 text-light-subtle-text dark:text-dark-subtle-text">
            <i className="fa-solid fa-file-code text-5xl mb-4"></i>
            <p className="font-semibold">选择一个文件</p>
            <p className="text-sm">从左侧资源管理器中选择一个文件以查看其内容。</p>
        </div>
    );
  }
  
  return (
    <div className="h-full p-4 md:p-6 bg-light-bg dark:bg-dark-bg">
        <div key={selectedFile.path}>
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
              wordWrap={wordWrap}
            />
        </div>
    </div>
  );
};

export default React.memo(CodeView);
