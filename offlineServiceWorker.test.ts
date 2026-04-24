import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('service worker source', () => {
    const source = fs.readFileSync(path.resolve(__dirname, 'public/sw.js'), 'utf8');

    it('uses network-first for same-origin built assets to avoid stale deployments', () => {
        expect(source).toContain("if (url.origin === self.location.origin)");
        expect(source).toContain('event.respondWith(networkFirst(request));');
    });

    it('uses relative app shell paths for subdirectory deployments', () => {
        expect(source).toContain("const APP_SHELL = ['./', './index.html', './manifest.json', './icon.svg'];");
        expect(source).not.toContain("'/index.html'");
    });

    it('does not cache opaque CDN responses indefinitely', () => {
        expect(source).not.toContain('response.type === \'opaque\'');
    });
});
