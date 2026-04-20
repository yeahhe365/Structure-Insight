import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('index.css cursor rules', () => {
  it('does not force a help cursor on every title attribute', () => {
    const css = fs.readFileSync(path.resolve(__dirname, 'index.css'), 'utf8');

    expect(css).not.toMatch(/\[title\]\s*\{\s*cursor:\s*help;\s*\}/);
  });
});
