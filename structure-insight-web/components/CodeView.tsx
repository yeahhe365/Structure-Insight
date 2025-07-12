import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileContent, SearchResult } from '../types';
import { useLocalization } from '../hooks/useLocalization';

declare const hljs: any;
declare const marked: any;
declare const DOMPurify: any;

interface ToastProps {
  message: string;
  onDone: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onDone }) => {
  React.useEffect(() => {
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg z-50"
    >
      {message}
    </motion.div>
  );
};

interface FileCardProps {
  file: FileContent;
  isEditing: boolean;
  onStartEdit: (path: string) => void;
  onSaveEdit: (path: string, newContent: string) => void;
  onCancelEdit: () => void;
  isMarkdown: boolean;
  isMarkdownPreview: boolean;
  onToggleMarkdownPreview: (path: string) => void;
  searchResults: SearchResult[];
  currentResultIndex: number | null;
  onShowToast: (message: string) => void;
  fontSize: number;
}

const FileCard: React.FC<FileCardProps> = ({ file, isEditing, onStartEdit, onSaveEdit, onCancelEdit, isMarkdown, isMarkdownPreview, onToggleMarkdownPreview, searchResults, currentResultIndex, onShowToast, fontSize }) => {
  const [editText, setEditText] = React.useState(file.content);
  const codeRef = React.useRef<HTMLElement>(null);
  const { t } = useLocalization();
  
  const searchResultsForFile = React.useMemo(() => 
    searchResults.filter(r => r.path === file.path), 
  [searchResults, file.path]);
  
  const currentResultIndexInFile = React.useMemo(() => {
    if (currentResultIndex === null) return -1;
    const currentResult = searchResults[currentResultIndex];
    if (currentResult.path !== file.path) return -1;
    return searchResults.slice(0, currentResultIndex + 1).filter(r => r.path === file.path).length - 1;
  }, [currentResultIndex, searchResults, file.path]);


  React.useEffect(() => {
    setEditText(file.content);
  }, [file.content]);

  const escapeHtml = (str: string) => {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  const getHighlightedContent = React.useCallback(() => {
    if (searchResultsForFile.length === 0) {
        return escapeHtml(file.content);
    }
    let lastIndex = 0;
    let output = '';
    let resultIndexInFile = 0;
    
    searchResultsForFile.forEach((result) => {
        output += escapeHtml(file.content.substring(lastIndex, result.start));
        const isCurrent = resultIndexInFile === currentResultIndexInFile;
        const markClass = isCurrent ? 'bg-amber-400 dark:bg-yellow-500' : 'bg-yellow-200 dark:bg-yellow-700';
        output += `<mark class="${markClass} rounded px-0.5" id="search-result-${file.path}-${resultIndexInFile}">${escapeHtml(result.matchText)}</mark>`;
        lastIndex = result.end;
        resultIndexInFile++;
    });
    output += escapeHtml(file.content.substring(lastIndex));
    return output;
  }, [file.content, file.path, searchResultsForFile, currentResultIndexInFile]);


  React.useEffect(() => {
    if (codeRef.current && !isEditing && !isMarkdownPreview) {
        const highlighted = getHighlightedContent();
        if (codeRef.current.innerHTML !== highlighted) {
            codeRef.current.innerHTML = highlighted;
        }
        hljs.highlightElement(codeRef.current);
    }
  }, [isEditing, isMarkdownPreview, getHighlightedContent]);

  // Effect for blinking the current search result
  React.useEffect(() => {
    if (currentResultIndexInFile !== -1) {
      const resultElId = `search-result-${file.path}-${currentResultIndexInFile}`;
      const resultEl = document.getElementById(resultElId);
      if (resultEl) {
        // Blink animation
        resultEl.classList.add('blink-me');
        setTimeout(() => {
          resultEl.classList.remove('blink-me');
        }, 600); // Animation duration
      }
    }
  }, [currentResultIndexInFile, file.path]); // Reruns when the current result inside this file changes


  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast(t('copied_to_clipboard'));
  };

  const lineNumbers = Array.from({ length: file.stats.lines }, (_, i) => i + 1).join('\n');
  const codeStyle = { fontSize: `${fontSize}px`, lineHeight: `${Math.round(fontSize * 1.5)}px` };
  
  const sanitizedMarkdown = React.useMemo(() => {
    if (isMarkdown && isMarkdownPreview) {
        const rawHtml = marked.parse(file.content);
        return DOMPurify.sanitize(rawHtml);
    }
    return '';
  }, [file.content, isMarkdown, isMarkdownPreview]);


  return (
    <div className="bg-light-panel dark:bg-dark-panel rounded-lg overflow-hidden border border-light-border dark:border-dark-border transition-colors duration-300">
      <div className="flex justify-between items-center p-3 bg-light-header/80 dark:bg-dark-header/80 border-b border-light-border dark:border-dark-border sticky top-0 z-[1] backdrop-blur-sm">
        <div className="font-mono text-sm text-light-text dark:text-dark-text truncate" title={file.path}>
          <i className="fa-regular fa-file-lines mr-2"></i>{file.path}
        </div>
        <div className="flex items-center space-x-4 text-xs text-light-subtle-text dark:text-dark-subtle-text">
          <span>{file.stats.lines} {t('lines')}</span>
          <span>{file.stats.chars} {t('characters')}</span>
          {isMarkdown && (
             <button onClick={() => onToggleMarkdownPreview(file.path)} className="text-sm text-primary hover:text-primary-hover disabled:opacity-50" title={isMarkdownPreview ? t("show_raw") : t("preview_markdown")} disabled={isEditing}>
                <i className={`fa-regular ${isMarkdownPreview ? 'fa-file-code' : 'fa-eye'} mr-1`}></i> {isMarkdownPreview ? t("raw") : t("preview")}
            </button>
          )}
          <button onClick={() => onStartEdit(file.path)} className="text-sm text-primary hover:text-primary-hover disabled:opacity-50" title={t("edit_content")} disabled={isEditing}>
            <i className="fa-regular fa-pen-to-square mr-1"></i> {t('edit')}
          </button>
          <button onClick={() => handleCopy(file.content)} className="text-sm text-primary hover:text-primary-hover disabled:opacity-50" title={t("copy_content")} disabled={isEditing}>
            <i className="fa-regular fa-copy mr-1"></i> {t('copy')}
          </button>
        </div>
      </div>
      {isEditing ? (
        <div className="p-2">
            <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-64 font-mono text-sm bg-light-bg dark:bg-gray-900 border border-primary rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                style={codeStyle}
            />
            <div className="flex justify-end space-x-2 mt-2">
                <button onClick={onCancelEdit} className="px-3 py-1 rounded-md text-sm bg-gray-200 dark:bg-dark-border hover:bg-gray-300 dark:hover:bg-gray-600">{t('cancel')}</button>
                <button onClick={() => onSaveEdit(file.path, editText)} className="px-3 py-1 rounded-md text-sm bg-primary text-white hover:bg-primary-hover">{t('save')}</button>
            </div>
        </div>
      ) : isMarkdown && isMarkdownPreview ? (
        <div className="prose dark:prose-invert max-w-none p-4" style={{fontSize: `${fontSize}px`}} dangerouslySetInnerHTML={{ __html: sanitizedMarkdown }} />
      ) : (
        <div className="flex bg-light-bg dark:bg-dark-bg" style={codeStyle}>
            <pre className="line-numbers text-right pr-4 pl-2 py-3 select-none text-light-subtle-text/50 dark:text-dark-subtle-text/50 bg-light-panel dark:bg-dark-panel">
                {lineNumbers}
            </pre>
            <div className="relative flex-1">
                <pre className="py-3 pr-3 whitespace-pre-wrap break-words"><code 
                    ref={codeRef}
                    className={`language-${file.language} hljs`} 
                    dangerouslySetInnerHTML={{ __html: getHighlightedContent() }}
                /></pre>
            </div>
        </div>
      )}
    </div>
  );
};


interface CodeViewProps {
  structureString: string | null;
  fileContents: FileContent[] | null;
  // Search
  searchResults: SearchResult[];
  currentResultIndex: number | null;
  // Edit
  editingPath: string | null;
  onStartEdit: (path: string) => void;
  onSaveEdit: (path: string, newContent: string) => void;
  onCancelEdit: () => void;
  // Markdown
  markdownPreviewPaths: Set<string>;
  onToggleMarkdownPreview: (path: string) => void;
  onShowToast: (message: string) => void;
  fontSize: number;
}

const CodeView: React.FC<CodeViewProps> = (props) => {
  const { structureString, fileContents, searchResults, currentResultIndex, editingPath, onStartEdit, onSaveEdit, onCancelEdit, markdownPreviewPaths, onToggleMarkdownPreview, onShowToast, fontSize } = props;
  const { t } = useLocalization();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast(t('copied_to_clipboard'));
  };
  
  return (
    <div className="h-full p-4 md:p-6 bg-light-bg dark:bg-dark-bg">
      <AnimatePresence>
        {structureString && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">{t('file_structure')}</h2>
              <button
                onClick={() => handleCopy(structureString)}
                className="text-sm text-primary hover:text-primary-hover"
                title={t('copy_structure')}
              >
                <i className="fa-regular fa-copy mr-1"></i> {t('copy')}
              </button>
            </div>
            <pre className="bg-light-panel dark:bg-dark-panel p-4 rounded-lg text-sm overflow-x-auto" style={{fontSize: `${fontSize}px`}}><code>{structureString}</code></pre>
          </motion.div>
        )}
      </AnimatePresence>

      {fileContents && fileContents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">{t('file_contents')}</h2>
          <div className="space-y-6">
            <AnimatePresence>
              {fileContents.map((file) => (
                <motion.div
                  key={file.path}
                  id={`file-path-${file.path}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  layout
                >
                  <FileCard
                    file={file}
                    isEditing={editingPath === file.path}
                    onStartEdit={onStartEdit}
                    onSaveEdit={onSaveEdit}
                    onCancelEdit={onCancelEdit}
                    isMarkdown={file.language === 'markdown'}
                    isMarkdownPreview={markdownPreviewPaths.has(file.path)}
                    onToggleMarkdownPreview={onToggleMarkdownPreview}
                    searchResults={searchResults}
                    currentResultIndex={currentResultIndex}
                    onShowToast={onShowToast}
                    fontSize={fontSize}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      
      {structureString && fileContents && fileContents.length === 0 && (
        <div className="text-center p-8 mt-8 text-light-subtle-text dark:text-dark-subtle-text bg-light-panel dark:bg-dark-panel rounded-lg">
            <i className="fa-solid fa-info-circle text-2xl mb-2 text-primary"></i>
            <p className="font-semibold">{t('content_not_extracted')}</p>
            <p className="text-sm">{t('content_not_extracted_prompt')}</p>
        </div>
      )}
    </div>
  );
};

export default CodeView;
export { Toast };