import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchDialog from './SearchDialog';

vi.mock('../hooks/usePersistentState', () => ({
    usePersistentState: <T,>(_: string, initialValue: T) => React.useState(initialValue),
}));

const originalInnerWidth = window.innerWidth;
const originalInnerHeight = window.innerHeight;

beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: 320,
        writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: 568,
        writable: true,
    });
});

afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalInnerWidth,
        writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: originalInnerHeight,
        writable: true,
    });
    cleanup();
});

describe('SearchDialog', () => {
    it('uses viewport-safe sizing on narrow screens and labels dialog controls', () => {
        const { container } = render(
            <SearchDialog
                onClose={vi.fn()}
                onSearch={vi.fn()}
                onNavigate={vi.fn()}
                resultsCount={0}
                currentIndex={null}
            />
        );

        expect(screen.getByRole('button', { name: '关闭搜索' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '上一个结果' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '下一个结果' })).toBeTruthy();

        const dialogSurface = container.firstElementChild as HTMLDivElement | null;
        expect(dialogSurface).not.toBeNull();
        expect(dialogSurface?.className).toContain('w-[calc(100vw-2rem)]');
        expect(dialogSurface?.className).toContain('max-w-[400px]');
    });
});
