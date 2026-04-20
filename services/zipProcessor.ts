import JSZip from 'jszip';

export interface ZipExtractionResult {
    files: File[];
    emptyDirectoryPaths: string[];
}

function getFilePath(file: File): string {
    return (file.webkitRelativePath || file.name).replace(/\\/g, '/');
}

export async function processZipFile(zipFile: File): Promise<ZipExtractionResult> {
    const zip = await JSZip.loadAsync(zipFile);
    const files: File[] = [];
    const zipRoot = zipFile.name.replace(/\.zip$/i, '');
    const directoryCandidates = new Set<string>();

    const promises = Object.values(zip.files).map(async (entry: any) => {
        if (entry.dir) {
            const normalized = entry.name.replace(/\/$/, '');
            if (normalized) {
                directoryCandidates.add(`${zipRoot}/${normalized}`);
            }
            return;
        }

        const blob = await entry.async('blob');
        const file = new File([blob], entry.name, { type: blob.type, lastModified: entry.date.getTime() });
        Object.defineProperty(file, 'webkitRelativePath', {
            value: `${zipRoot}/${entry.name}`,
            writable: true,
        });
        files.push(file);
    });

    await Promise.all(promises);

    const filePathSet = new Set(files.map(file => getFilePath(file)));
    const emptyDirectoryPaths = [...directoryCandidates].filter(dirPath => {
        const prefix = `${dirPath}/`;
        return ![...filePathSet].some(filePath => filePath.startsWith(prefix));
    });

    return {
        files,
        emptyDirectoryPaths,
    };
}
