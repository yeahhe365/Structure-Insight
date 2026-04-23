import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StatusBar from './StatusBar';

afterEach(() => {
    cleanup();
});

describe('StatusBar', () => {
    it('keeps status content reachable on narrow screens with horizontal scrolling', () => {
        const { container } = render(
            <StatusBar
                fileCount={8}
                totalLines={120}
                totalChars={2400}
                selectedFileName="very-long-file-name.ts"
                processedData={{
                    fileContents: [
                        {
                            path: 'src/very-long-file-name.ts',
                            excluded: false,
                            stats: { lines: 120, chars: 2400, estimatedTokens: 600 },
                        },
                    ],
                    analysisSummary: {
                        totalEstimatedTokens: 600,
                        securityFindingCount: 1,
                        scannedFileCount: 1,
                    },
                }}
            />
        );

        const footer = container.querySelector('footer') as HTMLElement | null;
        expect(footer).not.toBeNull();
        expect(footer?.className).toContain('overflow-x-auto');
        expect(footer?.className).toContain('whitespace-nowrap');
    });

    it('shows estimated token and security warning metrics from processed data', () => {
        const onShowSecurityFindings = vi.fn();
        render(
            <StatusBar
                fileCount={2}
                totalLines={12}
                totalChars={120}
                selectedFileName="app.ts"
                onShowSecurityFindings={onShowSecurityFindings}
                processedData={{
                    fileContents: [
                        {
                            path: 'src/app.ts',
                            excluded: false,
                            stats: { lines: 6, chars: 60, estimatedTokens: 15 },
                        },
                        {
                            path: 'src/.env',
                            excluded: false,
                            stats: { lines: 6, chars: 60, estimatedTokens: 18 },
                        },
                    ],
                    analysisSummary: {
                        totalEstimatedTokens: 33,
                        securityFindingCount: 2,
                        scannedFileCount: 2,
                    },
                }}
            />
        );

        expect(screen.getByTitle('预计 Token').textContent).toContain('33');
        expect(screen.getByTitle('敏感信息提示').textContent).toContain('2');
        fireEvent.click(screen.getByTitle('敏感信息提示'));
        expect(onShowSecurityFindings).toHaveBeenCalledTimes(1);
    });
});
