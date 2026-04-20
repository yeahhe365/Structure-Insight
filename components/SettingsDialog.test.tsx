import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsDialog from './SettingsDialog';

afterEach(() => {
    cleanup();
});

beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        json: async () => ({ stargazers_count: 128 }),
    } as Response);
});

describe('SettingsDialog', () => {
    it('uses section navigation to switch between workspace, export, and about content', () => {
        render(
            <SettingsDialog
                isOpen
                onClose={vi.fn()}
                isDarkTheme={false}
                onToggleTheme={vi.fn()}
                extractContent
                onToggleExtractContent={vi.fn()}
                fontSize={14}
                onSetFontSize={vi.fn()}
                onClearCache={vi.fn()}
                showCharCount={false}
                onToggleShowCharCount={vi.fn()}
                maxCharsThreshold={0}
                onSetMaxCharsThreshold={vi.fn()}
                wordWrap={false}
                onToggleWordWrap={vi.fn()}
                includeFileSummary
                onToggleIncludeFileSummary={vi.fn()}
                includeDirectoryStructure
                onToggleIncludeDirectoryStructure={vi.fn()}
                exportFormat="plain"
                onSetExportFormat={vi.fn()}
                includePatterns=""
                onSetIncludePatterns={vi.fn()}
                ignorePatterns=""
                onSetIgnorePatterns={vi.fn()}
                useDefaultPatterns
                onToggleUseDefaultPatterns={vi.fn()}
                useGitignore
                onToggleUseGitignore={vi.fn()}
                includeEmptyDirectories={false}
                onToggleIncludeEmptyDirectories={vi.fn()}
                showLineNumbers={false}
                onToggleShowLineNumbers={vi.fn()}
                removeEmptyLines={false}
                onToggleRemoveEmptyLines={vi.fn()}
                truncateBase64={false}
                onToggleTruncateBase64={vi.fn()}
                exportSplitMaxChars={0}
                onSetExportSplitMaxChars={vi.fn()}
                exportHeaderText=""
                onSetExportHeaderText={vi.fn()}
                exportInstructionText=""
                onSetExportInstructionText={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: '工作区' }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('heading', { level: 2, name: '工作区设置' })).toBeTruthy();
        expect(screen.queryByText('导出设置')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: '导出' }));

        expect(screen.getByRole('button', { name: '导出' }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('heading', { level: 2, name: '导出设置' })).toBeTruthy();
        expect(screen.queryByText('工作区设置')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: '关于' }));

        expect(screen.getByRole('button', { name: '关于' }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('heading', { level: 2, name: '项目与版本' })).toBeTruthy();
        expect(screen.queryByText('导出设置')).toBeNull();
    });
});
