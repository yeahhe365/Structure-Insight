import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';

afterEach(() => {
    cleanup();
});

function renderHeader() {
    return render(
        <Header
            onOpenFolder={vi.fn()}
            onCopyAll={vi.fn()}
            onSave={vi.fn()}
            onReset={vi.fn()}
            onCancel={vi.fn()}
            onSettings={vi.fn()}
            onToggleShortcuts={vi.fn()}
            onToggleSearch={vi.fn()}
            onToggleFileRank={vi.fn()}
            onShowCode={vi.fn()}
            onShowStructure={vi.fn()}
            hasContent
            busyState={null}
            activeView="structure"
        />
    );
}

describe('Header', () => {
    it('presents a clear primary open action and grouped secondary actions', () => {
        const { container } = renderHeader();

        expect(screen.getByRole('button', { name: '打开项目' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '代码视图' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '查找' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '文件排行' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '结构视图' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '复制全部' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '保存' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '重置' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '快捷键' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '设置' })).toBeTruthy();
        expect(screen.getByRole('toolbar', { name: '工具栏' }).className).toContain('flex-nowrap');
        expect(screen.getByRole('toolbar', { name: '工具栏' }).className).toContain('overflow-x-auto');
        expect(container.querySelector('header')?.className).toContain('h-12');
        expect(container.querySelector('header')?.className).toContain('px-2');
        expect(container.querySelector('header')?.className).toContain('overflow-hidden');
        expect(container.querySelector('[data-toolbar-group="view"]')).toBeTruthy();
        expect(container.querySelector('[data-toolbar-group="analysis"]')).toBeTruthy();
        expect(container.querySelector('[data-toolbar-group="export"]')).toBeTruthy();
    });

    it('keeps settings reachable before a project is loaded', () => {
        render(
            <Header
                onOpenFolder={vi.fn()}
                onCopyAll={vi.fn()}
                onSave={vi.fn()}
                onReset={vi.fn()}
                onCancel={vi.fn()}
                onSettings={vi.fn()}
                onToggleShortcuts={vi.fn()}
                onToggleSearch={vi.fn()}
                onToggleFileRank={vi.fn()}
                onShowCode={vi.fn()}
                onShowStructure={vi.fn()}
                hasContent={false}
                busyState={null}
                activeView="structure"
            />
        );

        expect(screen.getByRole('button', { name: '打开项目' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '快捷键' })).toBeTruthy();
        expect(screen.getByRole('button', { name: '设置' })).toBeTruthy();
    });

    it('distinguishes exporting from loading so export feedback does not look cancelable', () => {
        render(
            <Header
                onOpenFolder={vi.fn()}
                onCopyAll={vi.fn()}
                onSave={vi.fn()}
                onReset={vi.fn()}
                onCancel={vi.fn()}
                onSettings={vi.fn()}
                onToggleShortcuts={vi.fn()}
                onToggleSearch={vi.fn()}
                onToggleFileRank={vi.fn()}
                onShowCode={vi.fn()}
                onShowStructure={vi.fn()}
                hasContent
                busyState="exporting"
                activeView="structure"
            />
        );

        expect(screen.getByText('正在导出')).toBeTruthy();
        expect(screen.queryByRole('button', { name: '取消' })).toBeNull();
    });
});
