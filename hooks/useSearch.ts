
import React from 'react';
import { SearchOptions, SearchResultItem, ProcessedFiles } from '../types';
import { createSearchTask } from '../services/searchClient';

interface UseSearchParams {
    processedData: ProcessedFiles | null;
    openFile: (path: string) => void;
}

export const useSearch = ({
    processedData,
    openFile,
}: UseSearchParams) => {
    const [isSearchOpen, setIsSearchOpen] = React.useState(false);
    const [searchResults, setSearchResults] = React.useState<SearchResultItem[]>([]);
    const [activeResultIndex, setActiveResultIndex] = React.useState<number | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchOptions, setSearchOptions] = React.useState<SearchOptions>({
        caseSensitive: false,
        useRegex: false,
        wholeWord: false,
    });
    const requestIdRef = React.useRef(0);
    const activeSearchTaskRef = React.useRef<{ cancel: () => void } | null>(null);

    const handleSearch = React.useCallback((query: string, options: SearchOptions) => {
        setSearchQuery(query);
        setSearchOptions(options);
        requestIdRef.current += 1;

        activeSearchTaskRef.current?.cancel();
        const currentRequestId = requestIdRef.current;

        if (!query.trim() || !processedData) {
            React.startTransition(() => {
                setSearchResults([]);
                setActiveResultIndex(null);
            });
            return;
        }

        React.startTransition(() => {
            setSearchResults([]);
            setActiveResultIndex(null);
        });

        const task = createSearchTask({
            files: processedData.fileContents.filter(file => !file.excluded),
            query,
            options,
        });
        activeSearchTaskRef.current = task;

        void task.promise.then(results => {
            if (currentRequestId !== requestIdRef.current) {
                return;
            }

            if (activeSearchTaskRef.current?.cancel === task.cancel) {
                activeSearchTaskRef.current = null;
            }

            React.startTransition(() => {
                setSearchResults(results);
                setActiveResultIndex(results.length > 0 ? 0 : null);
            });

            if (results.length > 0) {
                openFile(results[0].filePath);
            }
        }).catch(error => {
            if (currentRequestId !== requestIdRef.current) {
                return;
            }

            if (activeSearchTaskRef.current?.cancel === task.cancel) {
                activeSearchTaskRef.current = null;
            }

            if (error instanceof Error && error.message === 'Search aborted') {
                return;
            }

            React.startTransition(() => {
                setSearchResults([]);
                setActiveResultIndex(null);
            });
        });
    }, [processedData, openFile]);

    const handleNavigate = React.useCallback((direction: 'next' | 'prev') => {
        if (searchResults.length === 0 || activeResultIndex === null) return;

        const newIndex = direction === 'next'
            ? (activeResultIndex + 1) % searchResults.length
            : (activeResultIndex - 1 + searchResults.length) % searchResults.length;

        setActiveResultIndex(newIndex);

        const result = searchResults[newIndex];
        if (result) {
            openFile(result.filePath);
        }
    }, [searchResults, activeResultIndex, openFile]);

    const resetSearch = React.useCallback(() => {
        requestIdRef.current += 1;
        activeSearchTaskRef.current?.cancel();
        setIsSearchOpen(false);
        setSearchResults([]);
        setActiveResultIndex(null);
        setSearchQuery('');
    }, []);

    React.useEffect(() => {
        return () => {
            activeSearchTaskRef.current?.cancel();
        };
    }, []);

    return {
        isSearchOpen,
        setIsSearchOpen,
        searchResults,
        activeResultIndex,
        searchQuery,
        searchOptions,
        handleSearch,
        handleNavigate,
        resetSearch,
    };
};
