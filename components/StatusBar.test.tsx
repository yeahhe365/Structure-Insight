import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import StatusBar from './StatusBar';

afterEach(() => {
    cleanup();
});

describe('StatusBar', () => {
    it('groups status content into readable labeled chips with visible overflow', () => {
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
        expect(footer?.className).not.toContain('no-scrollbar');
        expect(screen.getByText('文件')).toBeTruthy();
        expect(screen.getByText('行数')).toBeTruthy();
        expect(screen.getByText('字符')).toBeTruthy();
        expect(screen.getByTitle('当前文件').className).toContain('rounded-full');
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

    it('uses consistent file type labels for extensions, dotfiles, and extensionless files', () => {
        render(
            <StatusBar
                fileCount={3}
                totalLines={9}
                totalChars={90}
                processedData={{
                    fileContents: [
                        {
                            path: 'src/app.ts',
                            excluded: false,
                            stats: { lines: 3, chars: 30, estimatedTokens: 9 },
                        },
                        {
                            path: 'src/.env',
                            excluded: false,
                            stats: { lines: 3, chars: 30, estimatedTokens: 9 },
                        },
                        {
                            path: 'Dockerfile',
                            excluded: false,
                            stats: { lines: 3, chars: 30, estimatedTokens: 9 },
                        },
                    ],
                    analysisSummary: {
                        totalEstimatedTokens: 27,
                        securityFindingCount: 0,
                        scannedFileCount: 3,
                    },
                }}
            />
        );

        const typeSummary = screen.getByTitle('文件类型分布').textContent ?? '';
        expect(typeSummary).toContain('.ts: 1');
        expect(typeSummary).toContain('.env: 1');
        expect(typeSummary).toContain('无扩展名: 1');
    });
});
