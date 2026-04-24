import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('offline shell', () => {
    it('does not depend on external CDN assets in index.html', () => {
        const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

        expect(html).not.toContain('https://fonts.googleapis.com');
        expect(html).not.toContain('https://fonts.gstatic.com');
        expect(html).not.toContain('https://cdn.tailwindcss.com');
        expect(html).not.toContain('https://cdnjs.cloudflare.com');
        expect(html).not.toContain('https://aistudiocdn.com');
        expect(html).not.toContain('href="/manifest.json"');
        expect(html).not.toContain('href="/icon.svg"');
        expect(html).not.toContain('href="/hljs-light.css"');
        expect(html).not.toContain('href="/hljs-dark.css"');
    });
});
