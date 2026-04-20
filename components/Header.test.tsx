import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Header from './Header';

function renderHeader() {
    return render(
        <Header
            onOpenFolder={vi.fn()}
            onCopyAll={vi.fn()}
            onSave={vi.fn()}
            onReset={vi.fn()}
            onCancel={vi.fn()}
            onSettings={vi.fn()}
            onToggleSearch={vi.fn()}
            onToggleFileRank={vi.fn()}
            onShowStructure={vi.fn()}
            hasContent
            isLoading={false}
            activeView="structure"
        />
    );
}

describe('Header', () => {
    it('labels icon-only controls and allows the toolbar to wrap on narrow screens', () => {
        const { container } = renderHeader();

        expect(screen.getByRole('button', { name: '打开文件夹' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '在文件中查找' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '文件大小排行' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '查看项目结构' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '全部复制' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '保存为文本文件' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '重置' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '设置' })).toBeTruthy();
        expect(screen.getByRole('toolbar', { name: '工具栏' }).className).toContain('flex-wrap');
        expect(container.querySelector('header')?.className).toContain('min-h-[52px]');
        expect(container.querySelector('header')?.className).toContain('py-1.5');
    });
});
