import React from 'react';
import { SearchOptions } from '../types';
import { usePersistentState } from '../hooks/usePersistentState';

interface SearchDialogProps {
    onClose: () => void;
    onSearch: (query: string, options: SearchOptions) => void;
    onNavigate: (direction: 'next' | 'prev') => void;
    resultsCount: number;
    currentIndex: number | null;
}

const SearchDialog: React.FC<SearchDialogProps> = ({ onClose, onSearch, onNavigate, resultsCount, currentIndex }) => {
    const [query, setQuery] = React.useState('');
    const [options, setOptions] = React.useState<SearchOptions>({ caseSensitive: false, useRegex: false, wholeWord: false, fuzzySearch: false });
    const [history, setHistory] = usePersistentState<string[]>('searchHistory', []);
    const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
    
    const dialogRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const [position, setPosition] = React.useState({ x: window.innerWidth - 420, y: 70 });
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
        setPosition({
            x: e.clientX - dragStartPos.current.x,
            y: e.clientY - dragStartPos.current.y,
        });
    }, [isDragging]);

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
        inputRef.current?.focus();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        const handleClickOutside = (e: MouseEvent) => {
            if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
                setIsHistoryOpen(false);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    
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
        setQuery(e.target.value);
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


    return (
        <div
            ref={dialogRef}
            className="fixed z-30 bg-light-panel dark:bg-dark-panel rounded-lg shadow-2xl border border-light-border dark:border-dark-border w-[400px]"
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
            <div
                className="flex items-center justify-between p-2 border-b border-light-border dark:border-dark-border cursor-move"
                onMouseDown={handleMouseDown}
            >
                <h3 className="font-semibold text-sm pl-2">在文件中查找</h3>
                <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-light-border dark:hover:bg-dark-border flex items-center justify-center">
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
                                className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                autoComplete="off"
                            />
                             {query && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-light-subtle-text dark:text-dark-subtle-text">
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
                        <button type="button" onClick={() => onNavigate('prev')} disabled={resultsCount === 0} className="w-10 h-10 rounded-md bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border disabled:opacity-50 flex items-center justify-center hover:bg-light-border dark:hover:bg-dark-border/50"><i className="fa-solid fa-arrow-up"></i></button>
                        <button type="button" onClick={() => onNavigate('next')} disabled={resultsCount === 0} className="w-10 h-10 rounded-md bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border disabled:opacity-50 flex items-center justify-center hover:bg-light-border dark:hover:bg-dark-border/50"><i className="fa-solid fa-arrow-down"></i></button>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                        <button type="button" onClick={() => toggleOption('caseSensitive')} className={optionButtonClass(options.caseSensitive)} title="区分大小写">
                           <span>Aa</span>
                        </button>
                         <button type="button" onClick={() => toggleOption('wholeWord')} className={optionButtonClass(options.wholeWord)} title="全词匹配">
                           <i className="fa-solid fa-quote-right text-xs"></i>
                        </button>
                        <button type="button" onClick={() => toggleOption('useRegex')} className={optionButtonClass(options.useRegex)} title="使用正则表达式">
                           <span>.*</span>
                        </button>
                        <button type="button" onClick={() => toggleOption('fuzzySearch')} className={optionButtonClass(options.fuzzySearch)} title="模糊搜索">
                           <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default React.memo(SearchDialog);