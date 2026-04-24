import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = '/Users/jones/Documents/Code/Structure-Insight';

function readSource(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8');
}

describe('performance budget', () => {
  it('keeps framer-motion out of the main application interaction path', () => {
    const files = [
      'App.tsx',
      'components/MainContent.tsx',
      'components/InitialPrompt.tsx',
      'components/CodeView.tsx',
      'components/StructureView.tsx',
      'components/Toast.tsx',
      'components/ConfirmationDialog.tsx',
      'components/KeyboardShortcutsDialog.tsx',
      'components/SecurityFindingsDialog.tsx',
      'components/FileRankDialog.tsx',
      'components/ScrollToTopButton.tsx',
      'components/ScrollSlider.tsx',
      'components/SettingsDialog.tsx',
    ];

    for (const file of files) {
      expect(readSource(file), `${file} should not import framer-motion`).not.toContain('framer-motion');
    }
  });

  it('avoids heavy animation classes in high-frequency UI surfaces', () => {
    const files = [
      'App.tsx',
      'components/Header.tsx',
      'components/MainContent.tsx',
      'components/InitialPrompt.tsx',
      'components/CodeView.tsx',
      'components/StructureView.tsx',
      'components/ScrollSlider.tsx',
      'components/SettingsDialog.tsx',
      'components/FileRankDialog.tsx',
    ];

    for (const file of files) {
      const source = readSource(file);
      expect(source, `${file} should avoid transition-all on the main path`).not.toContain('transition-all');
      expect(source, `${file} should avoid backdrop-blur on the main path`).not.toContain('backdrop-blur');
    }

    expect(readSource('components/MainContent.tsx')).not.toContain('animate-bounce');
  });
});
