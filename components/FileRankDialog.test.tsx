import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FileRankDialog from './FileRankDialog';
import type { FileContent } from '../types';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

const FILES: FileContent[] = [
  {
    path: 'src/app.ts',
    content: 'console.log("app");',
    originalContent: 'console.log("app");',
    language: 'typescript',
    stats: {
      lines: 1,
      chars: 19,
      estimatedTokens: 5,
    },
  },
];

describe('FileRankDialog', () => {
  it('keeps row actions reachable without hover-only styling on touch layouts', () => {
    render(
      <FileRankDialog
        isOpen
        onClose={vi.fn()}
        files={FILES}
        onSelectFile={vi.fn()}
        onCopyPath={vi.fn()}
        onDeleteFile={vi.fn()}
        onToggleExclude={vi.fn()}
      />
    );

    const pathButton = screen.getByRole('button', { name: '复制 src/app.ts 路径' });
    const actions = pathButton.parentElement?.parentElement as HTMLElement;

    expect(actions.className).toContain('opacity-100');
    expect(actions.className).toContain('md:opacity-0');
    expect(actions.className).toContain('md:group-hover:opacity-100');
  });
});
