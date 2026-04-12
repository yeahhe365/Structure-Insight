export function splitOutputText(output: string, maxChars: number): string[] {
    if (maxChars <= 0 || output.length <= maxChars) {
        return [output];
    }

    const parts: string[] = [];
    const lines = output.match(/.*(?:\n|$)/g)?.filter(line => line.length > 0) ?? [];
    let current = '';

    const pushCurrent = () => {
        if (current.length > 0) {
            parts.push(current);
            current = '';
        }
    };

    for (const line of lines) {
        if (line.length > maxChars) {
            pushCurrent();

            let remaining = line;
            while (remaining.length > maxChars) {
                parts.push(remaining.slice(0, maxChars));
                remaining = remaining.slice(maxChars);
            }

            if (remaining.length > 0) {
                current = remaining;
            }
            continue;
        }

        if (current.length > 0 && current.length + line.length > maxChars) {
            pushCurrent();
        }

        current += line;
    }

    pushCurrent();
    return parts;
}
