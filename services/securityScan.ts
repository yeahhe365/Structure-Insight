import type { SecurityFinding, SecurityFindingSeverity } from '../types';

interface SecurityRule {
    ruleId: string;
    severity: SecurityFindingSeverity;
    message: string;
    pattern: RegExp;
}

const SECURITY_RULES: SecurityRule[] = [
    {
        ruleId: 'openai-api-key',
        severity: 'high',
        message: 'Potential OpenAI API key detected.',
        pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
    },
    {
        ruleId: 'private-key',
        severity: 'high',
        message: 'Potential private key block detected.',
        pattern: /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/g,
    },
    {
        ruleId: 'aws-access-key',
        severity: 'high',
        message: 'Potential AWS access key detected.',
        pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    },
    {
        ruleId: 'inline-secret',
        severity: 'medium',
        message: 'Potential inline secret assignment detected.',
        pattern: /\b(?:api[_-]?key|secret|password|token)\b\s*[:=]\s*['"][^'"\n]{8,}['"]/gi,
    },
];

const MAX_FINDINGS_PER_FILE = 20;

function buildPreview(match: string): string {
    return match.length > 80 ? `${match.slice(0, 77)}...` : match;
}

export function scanSensitiveContent(filePath: string, content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const rule of SECURITY_RULES) {
        for (const match of content.matchAll(rule.pattern)) {
            findings.push({
                filePath,
                ruleId: rule.ruleId,
                severity: rule.severity,
                message: rule.message,
                preview: buildPreview(match[0]),
            });

            if (findings.length >= MAX_FINDINGS_PER_FILE) {
                return findings;
            }
        }
    }

    return findings;
}
