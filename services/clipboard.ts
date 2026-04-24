export async function copyTextToClipboard(text: string, clipboard: Clipboard | undefined = navigator.clipboard): Promise<boolean> {
    if (!clipboard?.writeText) {
        return false;
    }

    try {
        await clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}
