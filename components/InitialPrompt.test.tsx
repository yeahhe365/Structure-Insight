import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InitialPrompt from './InitialPrompt';

describe('InitialPrompt recent projects', () => {
  it('renders the AI-friendly repository subtitle on the homepage', () => {
    const { container } = render(
      <InitialPrompt
        onOpenFolder={vi.fn()}
      />
    );

    expect(screen.getByText('将代码库整理为 AI 友好 格式')).not.toBeNull();
    expect(container.querySelector('.fa-layer-group')).toBeNull();
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
