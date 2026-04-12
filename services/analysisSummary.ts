import type { AnalysisSummary, FileContent, SecurityFinding } from '../types';

export function summarizeAnalysis(fileContents: FileContent[]): {
    analysisSummary: AnalysisSummary;
    securityFindings: SecurityFinding[];
} {
    const activeFiles = fileContents.filter(file => !file.excluded);
    const securityFindings = activeFiles.flatMap(file => file.securityFindings ?? []);

    return {
        analysisSummary: {
            totalEstimatedTokens: activeFiles.reduce((sum, file) => sum + file.stats.estimatedTokens, 0),
            securityFindingCount: securityFindings.length,
            scannedFileCount: activeFiles.length,
        },
        securityFindings,
    };
}
