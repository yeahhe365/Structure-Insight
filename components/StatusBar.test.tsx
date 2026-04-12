import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StatusBar from './StatusBar';

describe('StatusBar', () => {
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
