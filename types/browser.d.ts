// Type augmentations for browser APIs not in standard lib.dom

interface HTMLInputElement {
    /** Non-standard: Opens directory picker instead of file picker */
    webkitdirectory?: boolean;
}

interface File {
    /** Non-standard: Relative path of the file within the dropped directory */
    readonly webkitRelativePath: string;
}
