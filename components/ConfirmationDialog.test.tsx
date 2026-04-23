import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConfirmationDialog from './ConfirmationDialog';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

afterEach(() => {
  cleanup();
});

describe('ConfirmationDialog', () => {
  it('waits for async confirmation handlers before closing the dialog', async () => {
    let resolveConfirm: () => void = () => {};
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => {
      resolveConfirm = resolve;
    }));
    const onClose = vi.fn();

    render(
      <ConfirmationDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="确认操作"
        message="继续吗？"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '确认' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    resolveConfirm();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('cannot be dismissed by Escape or backdrop clicks while async confirmation is running', async () => {
    let resolveConfirm: () => void = () => {};
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => {
      resolveConfirm = resolve;
    }));
    const onClose = vi.fn();

    const { container } = render(
      <ConfirmationDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="确认操作"
        message="继续吗？"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(container.firstElementChild as HTMLElement);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    resolveConfirm();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
