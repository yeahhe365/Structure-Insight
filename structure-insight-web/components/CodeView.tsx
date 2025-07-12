import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileContent } from '../types';

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
  onShowToast: (message: string) => void;
  fontSize: number;
}

const FileCard: React.FC<FileCardProps> = ({ file, isEditing, onStartEdit, onSaveEdit, onCancelEdit, isMarkdown, isMarkdownPreview, onToggleMarkdownPreview, onShowToast, fontSize }) => {
  const [editText, setEditText] = React.useState(file.content);
  const codeRef = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    setEditText(file.content);
  }, [file.content]);

  React.useEffect(() => {
    if (codeRef.current && !isEditing && !isMarkdownPreview) {
      codeRef.current.textContent = file.content;
      hljs.highlightElement(codeRef.current);
    }
  }, [file.content, isEditing, isMarkdownPreview]);


  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast('已复制到剪贴板！');
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
          <span>{file.stats.lines} 行</span>
          <span>{file.stats.chars} 字符</span>
          {isMarkdown && (
             <button onClick={() => onToggleMarkdownPreview(file.path)} className="text-sm text-primary hover:text-primary-hover disabled:opacity-50" title={isMarkdownPreview ? "显示原文" : "预览 Markdown"} disabled={isEditing}>
                <i className={`fa-regular ${isMarkdownPreview ? 'fa-file-code' : 'fa-eye'} mr-1`}></i> {isMarkdownPreview ? "原文" : "预览"}
            </button>
          )}
          <button onClick={() => onStartEdit(file.path)} className="text-sm text-primary hover:text-primary-hover disabled:opacity-50" title="编辑内容" disabled={isEditing}>
            <i className="fa-regular fa-pen-to-square mr-1"></i> 编辑
          </button>
          <button onClick={() => handleCopy(file.content)} className="text-sm text-primary hover:text-primary-hover disabled:opacity-50" title="复制内容" disabled={isEditing}>
            <i className="fa-regular fa-copy mr-1"></i> 复制
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
                <button onClick={onCancelEdit} className="px-3 py-1 rounded-md text-sm bg-gray-200 dark:bg-dark-border hover:bg-gray-300 dark:hover:bg-gray-600">取消</button>
                <button onClick={() => onSaveEdit(file.path, editText)} className="px-3 py-1 rounded-md text-sm bg-primary text-white hover:bg-primary-hover">保存</button>
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
  const { structureString, fileContents, editingPath, onStartEdit, onSaveEdit, onCancelEdit, markdownPreviewPaths, onToggleMarkdownPreview, onShowToast, fontSize } = props;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast('已复制到剪贴板！');
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
              <h2 className="text-xl font-semibold">文件结构</h2>
              <button
                onClick={() => handleCopy(structureString)}
                className="text-sm text-primary hover:text-primary-hover"
                title="复制结构"
              >
                <i className="fa-regular fa-copy mr-1"></i> 复制
              </button>
            </div>
            <pre className="bg-light-panel dark:bg-dark-panel p-4 rounded-lg text-sm overflow-x-auto" style={{fontSize: `${fontSize}px`}}><code>{structureString}</code></pre>
          </motion.div>
        )}
      </AnimatePresence>

      {fileContents && fileContents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">文件内容</h2>
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
            <p className="font-semibold">未提取文件内容。</p>
            <p className="text-sm">要查看内容，请在“设置”中启用“提取内容”并重新处理文件夹。</p>
        </div>
      )}
    </div>
  );
};

export default CodeView;
export { Toast };