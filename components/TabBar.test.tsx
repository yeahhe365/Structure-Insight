import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TabBar from './TabBar';

describe('TabBar', () => {
  it('keeps the close affordance visible without hover-only styling in touch layouts', () => {
    render(
      <TabBar
        openFiles={['src/app.ts']}
        selectedFilePath="src/app.ts"
        onTabSelect={vi.fn()}
        onCloseTab={vi.fn()}
      />
    );

    const closeButton = screen.getByRole('button', { name: '关闭 src/app.ts' });
    expect(closeButton.className).toContain('opacity-100');
    expect(closeButton.className).toContain('md:opacity-0');
  });
});
