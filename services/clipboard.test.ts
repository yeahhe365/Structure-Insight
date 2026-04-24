import { describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard } from './clipboard';

describe('copyTextToClipboard', () => {
    it('returns true when text is copied', async () => {
        const writeText = vi.fn(() => Promise.resolve());

        await expect(copyTextToClipboard('hello', { writeText } as unknown as Clipboard)).resolves.toBe(true);
        expect(writeText).toHaveBeenCalledWith('hello');
    });

    it('returns false when clipboard is unavailable', async () => {
        await expect(copyTextToClipboard('hello', undefined)).resolves.toBe(false);
    });

    it('returns false when clipboard permission is denied', async () => {
        const writeText = vi.fn(() => Promise.reject(new Error('denied')));

        await expect(copyTextToClipboard('hello', { writeText } as unknown as Clipboard)).resolves.toBe(false);
    });
});
