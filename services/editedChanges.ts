import { structuredPatch } from 'diff';
import type { FileContent } from '../types';

export function buildEditedChanges(files: FileContent[]): string | null {
    const patches = files
        .filter(file => file.originalContent !== undefined && file.originalContent !== file.content)
        .map(file => {
            const patch = structuredPatch(
                file.path,
                file.path,
                file.originalContent ?? '',
                file.content,
                '',
                '',
                { context: 3 }
            );

            const lines = [
                `diff --git a/${file.path} b/${file.path}`,
                `--- a/${file.path}`,
                `+++ b/${file.path}`,
            ];

            for (const hunk of patch.hunks) {
                lines.push(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`);
                lines.push(...hunk.lines);
            }

            return lines.join('\n');
        })
        .filter(Boolean);

    if (patches.length === 0) {
        return null;
    }

    return patches.join('\n\n');
}
