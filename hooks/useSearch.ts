
import React from 'react';
import { SearchOptions, SearchResultItem, ProcessedFiles } from '../types';

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

    const handleSearch = React.useCallback((query: string, options: SearchOptions) => {
        setSearchQuery(query);
        setSearchOptions(options);

        if (!query.trim() || !processedData) {
            setSearchResults([]);
            setActiveResultIndex(null);
            return;
        }

        const flags = options.caseSensitive ? 'g' : 'gi';
        let pattern = options.useRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (options.wholeWord && !options.useRegex) {
            pattern = `\\b${pattern}\\b`;
        }

        let regex: RegExp;
        try {
            regex = new RegExp(pattern, flags);
        } catch (_e) {
            setSearchResults([]);
            setActiveResultIndex(null);
            return;
        }

        const results: SearchResultItem[] = [];
        const activeFiles = processedData.fileContents.filter(f => !f.excluded);

        activeFiles.forEach(file => {
            const matches = [...file.content.matchAll(regex)];
            matches.forEach((match, indexInFile) => {
                if (match.index !== undefined) {
                    const contentUpToMatch = file.content.substring(0, match.index);
                    const lineNumber = contentUpToMatch.split('\n').length;

                    results.push({
                        filePath: file.path,
                        startIndex: match.index,
                        length: match[0].length,
                        content: match[0],
                        line: lineNumber,
                        indexInFile,
                    });
                }
            });
        });

        setSearchResults(results);
        if (results.length > 0) {
            setActiveResultIndex(0);
            openFile(results[0].filePath);
        } else {
            setActiveResultIndex(null);
        }
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
        setIsSearchOpen(false);
        setSearchResults([]);
        setActiveResultIndex(null);
        setSearchQuery('');
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
