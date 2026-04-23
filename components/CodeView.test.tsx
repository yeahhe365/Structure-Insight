import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CodeView from './CodeView';
import type { FileContent } from '../types';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('highlight.js/lib/common', () => ({
  default: {
    highlightElement: vi.fn(),
  },
}));

const FILE: FileContent = {
  path: 'src/demo.ts',
  content: 'const demo = 1;',
  originalContent: 'const demo = 1;',
  language: 'typescript',
  stats: {
    lines: 1,
    chars: 15,
    estimatedTokens: 4,
  },
};

describe('CodeView', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        const lineHeight = Number.parseFloat(this.style.lineHeight || '24');
        return this.value.split('\n').length * lineHeight;
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('grows the editor textarea as the user adds more lines', () => {
    render(
      <CodeView
        selectedFile={FILE}
        editingPath={FILE.path}
        onStartEdit={vi.fn()}
        onSaveEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        markdownPreviewPaths={new Set<string>()}
        onToggleMarkdownPreview={vi.fn()}
        onShowToast={vi.fn()}
        fontSize={14}
        searchQuery=""
        searchOptions={{ caseSensitive: false, useRegex: false, wholeWord: false }}
        activeMatchIndexInFile={null}
        onCopyPath={vi.fn()}
        wordWrap={false}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.style.height).toBe('21px');

    fireEvent.change(textarea, {
      target: {
        value: 'line 1\nline 2\nline 3',
      },
    });

    expect(textarea.style.height).toBe('63px');
  });

  it('recomputes the editor textarea height when the font size changes mid-edit', () => {
    const multiLineFile: FileContent = {
      ...FILE,
      content: 'line 1\nline 2',
      originalContent: 'line 1\nline 2',
      stats: {
        lines: 2,
        chars: 13,
        estimatedTokens: 4,
      },
    };

    const { rerender, container } = render(
      <CodeView
        selectedFile={multiLineFile}
        editingPath={multiLineFile.path}
        onStartEdit={vi.fn()}
        onSaveEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        markdownPreviewPaths={new Set<string>()}
        onToggleMarkdownPreview={vi.fn()}
        onShowToast={vi.fn()}
        fontSize={14}
        searchQuery=""
        searchOptions={{ caseSensitive: false, useRegex: false, wholeWord: false }}
        activeMatchIndexInFile={null}
        onCopyPath={vi.fn()}
        wordWrap={false}
      />
    );

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.style.height).toBe('42px');

    rerender(
      <CodeView
        selectedFile={multiLineFile}
        editingPath={multiLineFile.path}
        onStartEdit={vi.fn()}
        onSaveEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        markdownPreviewPaths={new Set<string>()}
        onToggleMarkdownPreview={vi.fn()}
        onShowToast={vi.fn()}
        fontSize={20}
        searchQuery=""
        searchOptions={{ caseSensitive: false, useRegex: false, wholeWord: false }}
        activeMatchIndexInFile={null}
        onCopyPath={vi.fn()}
        wordWrap={false}
      />
    );

    expect(textarea.style.height).toBe('60px');
  });

  it('refreshes the visible code when file content changes but keeps the same length', async () => {
    const { container, rerender } = render(
      <CodeView
        selectedFile={{ ...FILE, content: 'foo', originalContent: 'foo', stats: { ...FILE.stats, chars: 3 } }}
        editingPath={null}
        onStartEdit={vi.fn()}
        onSaveEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        markdownPreviewPaths={new Set<string>()}
        onToggleMarkdownPreview={vi.fn()}
        onShowToast={vi.fn()}
        fontSize={14}
        searchQuery=""
        searchOptions={{ caseSensitive: false, useRegex: false, wholeWord: false }}
        activeMatchIndexInFile={null}
        onCopyPath={vi.fn()}
        wordWrap={false}
      />
    );

    await waitFor(() => {
      expect(container.querySelector('code')?.textContent).toBe('foo');
    });

    rerender(
      <CodeView
        selectedFile={{ ...FILE, content: 'bar', originalContent: 'bar', stats: { ...FILE.stats, chars: 3 } }}
        editingPath={null}
        onStartEdit={vi.fn()}
        onSaveEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        markdownPreviewPaths={new Set<string>()}
        onToggleMarkdownPreview={vi.fn()}
        onShowToast={vi.fn()}
        fontSize={14}
        searchQuery=""
        searchOptions={{ caseSensitive: false, useRegex: false, wholeWord: false }}
        activeMatchIndexInFile={null}
        onCopyPath={vi.fn()}
        wordWrap={false}
      />
    );

    await waitFor(() => {
      expect(container.querySelector('code')?.textContent).toBe('bar');
    });
  });

  it('uses a compact file header without duplicating the full path as a breadcrumb row', () => {
    const { container } = render(
      <CodeView
        selectedFile={FILE}
        editingPath={null}
        onStartEdit={vi.fn()}
        onSaveEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        markdownPreviewPaths={new Set<string>()}
        onToggleMarkdownPreview={vi.fn()}
        onShowToast={vi.fn()}
        fontSize={14}
        searchQuery=""
        searchOptions={{ caseSensitive: false, useRegex: false, wholeWord: false }}
        activeMatchIndexInFile={null}
        onCopyPath={vi.fn()}
        wordWrap={false}
      />
    );

    expect(screen.getByText('demo.ts')).toBeTruthy();
    expect(screen.getByText('src')).toBeTruthy();
    expect(container.querySelector('.fa-folder-tree')).toBeNull();
    expect(container.querySelectorAll('[data-file-path-display="full"]')).toHaveLength(1);
  });
});
