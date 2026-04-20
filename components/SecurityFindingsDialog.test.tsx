import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SecurityFindingsDialog from './SecurityFindingsDialog';

afterEach(() => {
    cleanup();
});

describe('SecurityFindingsDialog', () => {
    it('renders findings grouped as actionable warnings', () => {
        render(
            <SecurityFindingsDialog
                isOpen
                onClose={vi.fn()}
                findings={[
                    {
                        filePath: 'src/.env',
                        ruleId: 'openai-api-key',
                        severity: 'high',
                        message: 'Potential OpenAI API key detected.',
                        preview: 'sk-proj-abc123',
                        line: 1,
                        column: 17,
                    },
                    {
                        filePath: 'src/config.ts',
                        ruleId: 'inline-secret',
                        severity: 'medium',
                        message: 'Potential inline secret assignment detected.',
                        preview: 'password = "secret"',
                        line: 12,
                        column: 7,
                    },
                ]}
            />
        );

        expect(screen.getByText('安全提示')).toBeTruthy();
        expect(screen.getByText('src/.env')).toBeTruthy();
        expect(screen.getByText('Potential OpenAI API key detected.')).toBeTruthy();
        expect(screen.getByText('password = "secret"')).toBeTruthy();
        expect(screen.getByText('L12:C7')).toBeTruthy();
    });

    it('closes when the close button is pressed', () => {
        const onClose = vi.fn();
        render(
            <SecurityFindingsDialog
                isOpen
                onClose={onClose}
                findings={[]}
            />
        );

        fireEvent.click(screen.getAllByTitle('关闭安全提示')[0]);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
