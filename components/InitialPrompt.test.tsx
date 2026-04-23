import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InitialPrompt from './InitialPrompt';

describe('InitialPrompt recent projects', () => {
  it('renders a richer product landing state with core capabilities', () => {
    const { container } = render(
      <InitialPrompt
        onOpenFolder={vi.fn()}
      />
    );

    expect(screen.getByText('将代码库整理为 AI 友好格式')).not.toBeNull();
    expect(screen.getByText('浏览器本地处理')).not.toBeNull();
    expect(screen.getByText('文件夹与 ZIP')).not.toBeNull();
    expect(screen.getByText('多格式导出')).not.toBeNull();
    expect(screen.getByRole('button', { name: /选择项目文件夹/i })).not.toBeNull();
    expect(container.querySelector('.fa-layer-group')).not.toBeNull();
  });

  it('allows the enriched landing page to scroll on shorter viewports', () => {
    const { container } = render(
      <InitialPrompt
        onOpenFolder={vi.fn()}
        recentProjects={[
          { id: 'recent-1', name: 'project-one', openedAt: Date.now() },
          { id: 'recent-2', name: 'project-two', openedAt: Date.now() },
        ]}
      />
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('overflow-y-auto');
    expect(root.className).not.toContain('overflow-hidden');
    expect(root.querySelector('[data-landing-footer]')).not.toBeNull();
    expect(root.querySelector('[data-landing-footer]')?.className).not.toContain('absolute');
  });

  it('opens a recent project when its card is clicked', () => {
    const onOpenRecentProject = vi.fn();
    const project = {
      id: 'recent-1',
      name: 'demo-project',
      openedAt: Date.now(),
    };

    render(
      <InitialPrompt
        onOpenFolder={vi.fn()}
        recentProjects={[project]}
        onOpenRecentProject={onOpenRecentProject}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /demo-project/i }));

    expect(onOpenRecentProject).toHaveBeenCalledWith(project);
  });
});
