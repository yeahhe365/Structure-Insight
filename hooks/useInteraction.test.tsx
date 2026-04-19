import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useInteraction } from './useInteraction';
import type { ConfirmationState, ProcessedFiles } from '../types';

const INITIAL_DATA: ProcessedFiles = {
    rootName: 'demo',
    structureString: 'demo\n└── app.ts (3 字符)\n',
    treeData: [
        {
            name: 'app.ts',
            path: 'app.ts',
            isDirectory: false,
            children: [],
            status: 'processed',
            lines: 1,
            chars: 3,
        },
    ],
    fileContents: [
        {
            path: 'app.ts',
            content: 'abc',
            language: 'typescript',
            stats: { lines: 1, chars: 3, estimatedTokens: 1 },
        },
    ],
    analysisSummary: {
        totalEstimatedTokens: 1,
        securityFindingCount: 0,
        scannedFileCount: 1,
    },
    securityFindings: [],
};

describe('useInteraction', () => {
    it('keeps tree stats, token estimates, and security findings in sync after editing a file', () => {
        const setConfirmation = vi.fn() as unknown as React.Dispatch<React.SetStateAction<ConfirmationState>>;

        const { result } = renderHook(() => {
            const [processedData, setProcessedData] = React.useState<ProcessedFiles | null>(INITIAL_DATA);
            const interaction = useInteraction({
                processedData,
                setProcessedData,
                handleShowToast: vi.fn(),
                isMobile: false,
                setMobileView: vi.fn(),
                setConfirmation,
                selectedFilePath: 'app.ts',
                setSelectedFilePath: vi.fn(),
                setActiveView: vi.fn(),
                showCharCount: true,
            });

            return { processedData, ...interaction };
        });

        act(() => {
            result.current.handleSaveEdit('app.ts', 'const password = "super-secret-password";\nline two');
        });

        const updatedData = result.current.processedData;
        expect(updatedData).not.toBeNull();
        expect(updatedData!.fileContents[0].stats).toEqual({ lines: 2, chars: 50, estimatedTokens: 13 });
        expect(updatedData!.treeData[0].lines).toBe(2);
        expect(updatedData!.treeData[0].chars).toBe(50);
        expect(updatedData!.structureString).toContain('app.ts (50 字符)');
        expect(updatedData!.analysisSummary).toEqual({
            totalEstimatedTokens: 13,
            securityFindingCount: 1,
            scannedFileCount: 1,
        });
        expect(updatedData!.securityFindings?.[0].ruleId).toBe('inline-secret');
    });

    it('records removed paths when deleting a file so exports can keep it removed', () => {
        const setConfirmationMock = vi.fn();
        const setConfirmation = setConfirmationMock as unknown as React.Dispatch<React.SetStateAction<ConfirmationState>>;

        const { result } = renderHook(() => {
            const [processedData, setProcessedData] = React.useState<ProcessedFiles | null>({
                ...INITIAL_DATA,
                removedPaths: [],
            });

            const interaction = useInteraction({
                processedData,
                setProcessedData,
                handleShowToast: vi.fn(),
                isMobile: false,
                setMobileView: vi.fn(),
                setConfirmation,
                selectedFilePath: 'app.ts',
                setSelectedFilePath: vi.fn(),
                setActiveView: vi.fn(),
                showCharCount: true,
            });

            return { processedData, ...interaction };
        });

        act(() => {
            result.current.handleDeleteFile('app.ts');
        });

        expect(setConfirmationMock).toHaveBeenCalledTimes(1);
        const confirmationUpdate = setConfirmationMock.mock.calls[0][0] as ConfirmationState;

        act(() => {
            confirmationUpdate.onConfirm();
        });

        expect(result.current.processedData).not.toBeNull();
        expect(result.current.processedData!.fileContents).toHaveLength(0);
        expect(result.current.processedData!.removedPaths).toEqual(['app.ts']);
    });
});
