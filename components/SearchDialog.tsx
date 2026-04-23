import React from 'react';
import { SearchOptions } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';

const DIALOG_MARGIN = 16;
const DIALOG_DEFAULT_HEIGHT = 220;
const DIALOG_MAX_WIDTH = 400;

function getViewportSafePosition(
    x: number,
    y: number,
    width: number,
    height: number,
) {
    const maxX = Math.max(DIALOG_MARGIN, window.innerWidth - width - DIALOG_MARGIN);
    const maxY = Math.max(DIALOG_MARGIN, window.innerHeight - height - DIALOG_MARGIN);

    return {
        x: Math.min(Math.max(DIALOG_MARGIN, x), maxX),
        y: Math.min(Math.max(DIALOG_MARGIN, y), maxY),
    };
}

interface SearchDialogProps {
    onClose: () => void;
    onSearch: (query: string, options: SearchOptions) => void;
    onNavigate: (direction: 'next' | 'prev') => void;
    resultsCount: number;
    currentIndex: number | null;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ onClose, onSearch, onNavigate, resultsCount, currentIndex }) => {
    const [query, setQuery] = React.useState('');
    const [options, setOptions] = React.useState<SearchOptions>({ caseSensitive: false, useRegex: false, wholeWord: false });
    const [regexError, setRegexError] = React.useState<string | null>(null);
    const [history, setHistory] = usePersistentState<string[]>('searchHistory', []);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
    
    const dialogRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const clampPosition = React.useCallback((x: number, y: number) => {
        const width = dialogRef.current?.offsetWidth ?? Math.min(DIALOG_MAX_WIDTH, window.innerWidth - (DIALOG_MARGIN * 2));
        const height = dialogRef.current?.offsetHeight ?? DIALOG_DEFAULT_HEIGHT;
        return getViewportSafePosition(x, y, width, height);
    }, []);

    const [position, setPosition] = React.useState(() => clampPosition(window.innerWidth - DIALOG_MAX_WIDTH - DIALOG_MARGIN, 70));
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartPos = React.useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('input, button, .history-item')) return;
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        e.preventDefault();
    };

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setPosition(clampPosition(
            e.clientX - dragStartPos.current.x,
            e.clientY - dragStartPos.current.y,
        ));
    }, [clampPosition, isDragging]);

    const handleMouseUp = React.useCallback(() => {
        setIsDragging(false);
    }, []);

    React.useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    React.useEffect(() => {
        setPosition((current) => clampPosition(current.x, current.y));
    }, [clampPosition]);

    React.useEffect(() => {
        inputRef.current?.focus();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        const handleClickOutside = (e: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
                setIsHistoryOpen(false);
            }
        }
        const handleResize = () => {
            setPosition((current) => clampPosition(current.x, current.y));
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [clampPosition, onClose]);
    
    const updateHistory = (newQuery: string) => {
        if (!newQuery.trim()) return;
        setHistory(prev => {
            const newHistory = [newQuery, ...prev.filter(h => h !== newQuery)];
            return newHistory.slice(0, 10); // keep last 10
        });
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query, options);
        updateHistory(query);
        setIsHistoryOpen(false);
    };

    const runSearch = React.useCallback((newQuery: string, newOptions: SearchOptions) => {
         onSearch(newQuery, newOptions);
    }, [onSearch]);
    
    React.useEffect(() => {
        const debounceTimer = setTimeout(() => {
            runSearch(query, options);
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [query, options, runSearch]);

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        if (options.useRegex && val) {
            try {
                new RegExp(val);
                setRegexError(null);
            } catch (err) {
                setRegexError((err as SyntaxError).message);
            }
        } else {
            setRegexError(null);
        }
    }
    
    const toggleOption = (key: keyof SearchOptions) => {
        setOptions(prev => ({...prev, [key]: !prev[key]}));
    }

    const handleHistoryClick = (histQuery: string) => {
        setQuery(histQuery);
        setIsHistoryOpen(false);
    }

    const optionButtonClass = (isActive: boolean) => 
        `flex items-center justify-center w-8 h-8 rounded-md text-sm transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-light-border dark:hover:bg-dark-border'}`;
    const inputPaddingClass = query ? 'pr-24 sm:pr-28' : 'pr-3';


    return (
        <div
            ref={dialogRef}
            className="fixed z-30 w-[calc(100vw-2rem)] max-w-[400px] overflow-hidden rounded-lg border border-light-border bg-light-panel shadow-2xl dark:border-dark-border dark:bg-dark-panel"
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
            <div
                className="flex items-center justify-between p-2 border-b border-light-border dark:border-dark-border cursor-move"
                onMouseDown={handleMouseDown}
            >
                <h3 className="font-semibold text-sm pl-2">在文件中查找</h3>
                <button onClick={onClose} aria-label="关闭搜索" className="w-7 h-7 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center">
                    <i className="fa-solid fa-times text-xs"></i>
                </button>
            </div>
            <div className="p-4">
                <form onSubmit={handleSearch}>
                    <div className="flex space-x-2">
                        <div className="relative flex-grow">
                             <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={handleQueryChange}
                                onFocus={() => setIsHistoryOpen(true)}
                                onBlur={() => setTimeout(() => setIsHistoryOpen(false), 150)}
                                placeholder="搜索..."
                                className={`w-full pl-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${inputPaddingClass}`}
                                autoComplete="off"
                            />
                             {query && (
                                <span className="pointer-events-none absolute right-3 top-1/2 max-w-[40%] -translate-y-1/2 truncate text-right text-xs text-light-subtle-text dark:text-dark-subtle-text">
                                    {currentIndex !== null ? `${currentIndex + 1} / ${resultsCount}` : `${resultsCount} 个结果`}
                                </span>
                             )}
                              {isHistoryOpen && history.length > 0 && (
                                <div className="absolute top-full mt-1 w-full bg-light-panel dark:bg-dark-panel border border-light-border dark:border-dark-border rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                    <ul>
                                        {history.map((h, i) => (
                                            <li key={i} onMouseDown={() => handleHistoryClick(h)} className="px-3 py-2 text-sm cursor-pointer hover:bg-light-border dark:hover:bg-dark-border history-item">
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <button type="button" onClick={() => onNavigate('prev')} aria-label="上一个结果" disabled={resultsCount === 0} className="w-10 h-10 rounded-md bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border disabled:opacity-50 flex items-center justify-center hover:bg-light-border dark:hover:bg-dark-border/50"><i className="fa-solid fa-arrow-up"></i></button>
                        <button type="button" onClick={() => onNavigate('next')} aria-label="下一个结果" disabled={resultsCount === 0} className="w-10 h-10 rounded-md bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border disabled:opacity-50 flex items-center justify-center hover:bg-light-border dark:hover:bg-dark-border/50"><i className="fa-solid fa-arrow-down"></i></button>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                        <button type="button" onClick={() => toggleOption('caseSensitive')} className={optionButtonClass(options.caseSensitive)} title="区分大小写 (Alt+C)">
                           <span>Aa</span>
                        </button>
                         <button type="button" onClick={() => toggleOption('wholeWord')} className={optionButtonClass(options.wholeWord)} title="全词匹配 (Alt+W)">
                           <i className="fa-solid fa-quote-right text-xs"></i>
                        </button>
                        <button type="button" onClick={() => toggleOption('useRegex')} className={optionButtonClass(options.useRegex)} title="使用正则表达式 (Alt+R)">
                           <span>.*</span>
                        </button>
                        {regexError && (
                            <span className="text-xs text-red-500 truncate ml-2" title={regexError}>
                                <i className="fa-solid fa-exclamation-triangle mr-1"></i>无效正则
                            </span>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default React.memo(SearchDialog);
