# Structure Insight P0/P1 Foundation And Export Design

## Goal

Bring `Structure-Insight` to a more reliable release baseline while improving the highest-value repo-packing capabilities that fit the browser-only product direction.

## Scope

This design intentionally stays inside the browser application:

- P0 foundation
- Repository docs and onboarding clarity
- CI quality gate for install, typecheck, test, and build
- Real PWA registration plus offline caching after first successful online load
- Fix inaccurate or broken app-shell metadata/assets

- P1 product capability
- Clarify "Git Diffs" as in-app edited changes, not real repository git state
- Expand ignore support from root-only `.gitignore` to layered `.gitignore` and `.ignore`
- Add estimated token metrics without introducing a new heavy tokenizer dependency
- Add browser-side sensitive-content scanning and surface results in exported output and the UI

## Non-Goals

- No CLI package
- No MCP integration
- No remote repository fetching
- No direct integration with the local git binary
- No server-side processing

## Design

### 1. Keep the browser-only architecture

The current React + service-layer split is good enough for this iteration. New behavior stays in focused services and flows upward into hooks/components:

- `services/tokenEstimate.ts` for deterministic token estimation
- `services/securityScan.ts` for browser-safe regex-based secret detection
- `services/pwa.ts` for service worker registration
- `services/fileProcessor.ts` for layered ignore loading, metrics, and security scan aggregation
- `services/exportBuilder.ts` and `services/repomixPlainOutput.ts` for more accurate export semantics

### 2. Improve export semantics without a large rename churn

Internal state can keep the existing `includeGitDiffs` flag to minimize churn in in-progress code, but user-facing labels and output sections should say "Edited Changes" to reflect the real behavior.

### 3. Use estimated tokens, not exact model tokens

This product is still browser-first and dependency-light. We add `estimatedTokens` with a clear label rather than pretending to offer exact tokenizer parity with `repomix`.

### 4. Use layered ignore files

Ignore handling should support:

- built-in default ignore directories
- layered `.gitignore`
- layered `.ignore`
- include and ignore pattern overrides from settings

The implementation only needs to be consistent and useful for browser-imported projects; it does not need to perfectly reproduce every corner of git's filesystem traversal behavior.

### 5. Surface security warnings without blocking workflow

Sensitive-content scanning should be advisory:

- findings are shown in app metrics
- exports include a warning summary
- copy/save is still allowed

## Testing Strategy

- Add focused unit tests for token estimation, security scan, and service worker registration
- Extend `fileProcessor` tests for layered ignore behavior and aggregated analysis metadata
- Extend export tests for edited-change labeling and security summary output
- Add a UI-level status bar test for token and warning indicators
- Keep the full existing vitest suite green
