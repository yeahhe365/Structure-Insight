import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname);

function read(filePath: string) {
    return fs.readFileSync(path.join(ROOT, filePath), 'utf8');
}

describe('icon slimming', () => {
    it('does not import the full fontawesome css bundle', () => {
        expect(read('index.tsx')).not.toContain('@fortawesome/fontawesome-free/css/all.min.css');
    });

    it('does not rely on regular or brand fontawesome classes in app source', () => {
        const files = [
            'App.tsx',
            'components',
            'hooks',
        ];

        const contents = files
            .flatMap((entry) => {
                const resolved = path.join(ROOT, entry);
                const stat = fs.statSync(resolved);
                if (stat.isDirectory()) {
                    return fs.readdirSync(resolved)
                        .filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'))
                        .map((name) => read(path.join(entry, name)));
                }
                return [read(entry)];
            })
            .join('\n');

        expect(contents).not.toContain('fa-brands');
        expect(contents).not.toContain('fa-regular');
    });
});

describe('favicon layout', () => {
    it('keeps the cube cluster inside the canvas and horizontally centered', () => {
        const svg = read('public/icon.svg');
        const viewBox = svg.match(/viewBox="([^"]+)"/);
        const cubeUses = [...svg.matchAll(/<use[^>]*href="#cube"[^>]*x="([^"]+)"[^>]*y="([^"]+)"/g)];

        expect(viewBox).not.toBeNull();
        expect(cubeUses.length).toBeGreaterThan(0);

        const [, , , width] = viewBox![1].split(/\s+/).map(Number);
        const cubeWidth = 60;
        const minX = Math.min(...cubeUses.map(([, x]) => Number(x)));
        const maxX = Math.max(...cubeUses.map(([, x]) => Number(x) + cubeWidth));

        expect(minX).toBeGreaterThanOrEqual(0);
        expect(maxX).toBeLessThanOrEqual(width);
        expect((minX + maxX) / 2).toBeCloseTo(width / 2, 0);
    });
});
