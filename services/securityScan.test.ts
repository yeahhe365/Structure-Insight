import { describe, expect, it } from 'vitest';
import { scanSensitiveContent } from './securityScan';

describe('scanSensitiveContent', () => {
    it('detects openai-style keys and private keys', () => {
        const findings = scanSensitiveContent(
            'src/.env',
            [
                'OPENAI_API_KEY="sk-proj-abcdefghijklmnopqrstuvwxyz123456"',
                '-----BEGIN PRIVATE KEY-----',
            ].join('\n')
        );

        expect(findings.map(finding => finding.ruleId)).toEqual([
            'openai-api-key',
            'private-key',
        ]);
    });

    it('detects risky inline password assignments', () => {
        const findings = scanSensitiveContent(
            'src/config.ts',
            'const enabled = true;\nconst password = "super-secret-password";\n'
        );

        expect(findings).toHaveLength(1);
        expect(findings[0].ruleId).toBe('inline-secret');
        expect(findings[0].severity).toBe('medium');
        expect(findings[0].line).toBe(2);
        expect(findings[0].column).toBe(7);
    });

    it('returns an empty list for normal source content', () => {
        expect(scanSensitiveContent('src/app.ts', 'export const answer = 42;\n')).toEqual([]);
    });
});
