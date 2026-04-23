import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('KeyboardShortcutsDialog', () => {
  it('uses the macOS command symbol on Mac platforms', () => {
    vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue('MacIntel');

    render(<KeyboardShortcutsDialog isOpen onClose={vi.fn()} />);

    expect(screen.getAllByText('⌘').length).toBeGreaterThan(0);
    expect(screen.queryByText('Ctrl')).toBeNull();
  });
});
