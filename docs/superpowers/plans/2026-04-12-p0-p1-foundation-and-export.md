# P0/P1 Foundation And Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize `Structure-Insight` for release use and add higher-value browser-side packing capabilities.

**Architecture:** Keep the existing browser-only React app, add small focused services for PWA registration, token estimation, and sensitive-content scanning, then thread the new metadata through processing, export, and status UI.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, browser Service Worker APIs, `ignore`, `minimatch`

---

### Task 1: Documentation and quality gates

**Files:**
- Modify: `README.md`
- Modify: `structure-insight/README.md`
- Modify: `structure-insight/package.json`
- Create: `.github/workflows/ci.yml`

- [ ] Add root and app README guidance that reflects the nested app directory and current scripts.
- [ ] Add `typecheck` and `check` scripts in `structure-insight/package.json`.
- [ ] Add a GitHub Actions workflow that runs `npm ci`, `npm run typecheck`, `npm test -- --run`, and `npm run build` inside `structure-insight/`.

### Task 2: PWA and offline shell

**Files:**
- Modify: `structure-insight/index.tsx`
- Modify: `structure-insight/index.html`
- Modify: `structure-insight/public/manifest.json`
- Create: `structure-insight/public/icon.svg`
- Create: `structure-insight/public/sw.js`
- Create: `structure-insight/services/pwa.ts`
- Test: `structure-insight/services/pwa.test.ts`

- [ ] Write failing tests for service worker registration behavior.
- [ ] Implement a small PWA registration helper.
- [ ] Add a service worker with app-shell and runtime caching.
- [ ] Fix broken manifest/icon references and wire registration into app startup.

### Task 3: Token estimation and security scanning

**Files:**
- Create: `structure-insight/services/tokenEstimate.ts`
- Create: `structure-insight/services/tokenEstimate.test.ts`
- Create: `structure-insight/services/securityScan.ts`
- Create: `structure-insight/services/securityScan.test.ts`
- Modify: `structure-insight/types.ts`

- [ ] Write failing tests for deterministic token estimates and basic sensitive-content findings.
- [ ] Implement the new services.
- [ ] Extend app types to carry per-file and aggregate analysis metadata.

### Task 4: File processing and ignore enhancements

**Files:**
- Modify: `structure-insight/services/fileProcessor.ts`
- Modify: `structure-insight/services/fileProcessor.test.ts`

- [ ] Write failing tests for layered `.gitignore` and `.ignore` behavior plus aggregated analysis metadata.
- [ ] Update file processing to compute estimated tokens, security findings, and layered ignore decisions.
- [ ] Preserve current manual export filter behavior.

### Task 5: Export semantics and UI surfacing

**Files:**
- Modify: `structure-insight/services/exportBuilder.ts`
- Modify: `structure-insight/services/exportBuilder.test.ts`
- Modify: `structure-insight/services/repomixPlainOutput.ts`
- Modify: `structure-insight/services/repomixPlainOutput.test.ts`
- Modify: `structure-insight/components/SettingsDialog.tsx`
- Modify: `structure-insight/components/StatusBar.tsx`
- Create: `structure-insight/components/StatusBar.test.tsx`
- Modify: `structure-insight/App.tsx`
- Modify: `structure-insight/hooks/useAppLogic.ts`
- Modify: `structure-insight/hooks/useAppLogic.test.tsx`

- [ ] Write failing tests for edited-change labeling, export security summary, and status-bar metrics.
- [ ] Rename user-facing "Git Diffs" copy to "Edited Changes".
- [ ] Surface estimated token counts and security warnings in exports and status UI.
- [ ] Keep save/copy flows working with the richer analysis metadata.

### Task 6: Verification

**Files:**
- Modify: `structure-insight/CHANGELOG.md`

- [ ] Update the changelog with the delivered P0/P1 work.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test -- --run`.
- [ ] Run `npm run build`.
