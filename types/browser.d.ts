// Type augmentations for browser APIs not in standard lib.dom

interface HTMLInputElement {
    /** Non-standard: Opens directory picker instead of file picker */
    webkitdirectory?: boolean;
}

interface File {
    /** Non-standard: Relative path of the file within the dropped directory */
    readonly webkitRelativePath: string;
}

interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
}

interface FileSystemHandle {
    queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly name: string;
    values(): AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemFileHandle extends FileSystemHandle {
    getFile(): Promise<File>;
}

interface Window {
    showDirectoryPicker?: (options?: {
        id?: string;
        mode?: 'read' | 'readwrite';
    }) => Promise<FileSystemDirectoryHandle>;
}
