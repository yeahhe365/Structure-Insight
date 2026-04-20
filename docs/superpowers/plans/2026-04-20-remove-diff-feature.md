# Remove Diff Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely remove the in-app diff / Edited Changes feature from Structure Insight.

**Architecture:** Remove the diff capability end-to-end instead of hiding it. This means deleting the UI toggle, persistent state, export options, export output branches, implementation helper, and user-facing docs so the app only exports the current visible file contents.

**Tech Stack:** React 19, TypeScript, Vite, Vitest

---

### Task 1: Lock in the Removed Public Surface with Tests

**Files:**
- Modify: `structure-insight/hooks/useAppLogic.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
expect('includeGitDiffs' in result.current.state).toBe(false);

expect(buildExportOutputMock).toHaveBeenCalledWith(expect.objectContaining({
  exportOptions: expect.not.objectContaining({
    includeGitDiffs: expect.anything(),
  }),
}));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- hooks/useAppLogic.test.tsx`
Expected: FAIL because `includeGitDiffs` still exists in state and export options.

- [ ] **Step 3: Write minimal implementation**

```ts
// Remove includeGitDiffs state, settings wiring, and export option forwarding.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- hooks/useAppLogic.test.tsx`
Expected: PASS

### Task 2: Remove Diff Output from Export Builders

**Files:**
- Modify: `structure-insight/services/exportBuilder.ts`
- Modify: `structure-insight/services/exportBuilder.test.ts`
- Modify: `structure-insight/services/repomixPlainOutput.ts`
- Modify: `structure-insight/services/repomixPlainOutput.test.ts`
- Delete: `structure-insight/services/editedChanges.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(json).not.toContain('"editedChanges"');
expect(markdown).not.toContain('Edited Changes');
expect(xml).not.toContain('<edited_changes>');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- services/exportBuilder.test.ts services/repomixPlainOutput.test.ts`
Expected: FAIL because export code still emits the diff sections when enabled and still accepts the flag.

- [ ] **Step 3: Write minimal implementation**

```ts
// Remove buildEditedChanges imports, the includeGitDiffs export option,
// and all editedChanges / Edited Changes output branches.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- services/exportBuilder.test.ts services/repomixPlainOutput.test.ts`
Expected: PASS

### Task 3: Remove Remaining UI, Docs, and Dependency References

**Files:**
- Modify: `structure-insight/App.tsx`
- Modify: `structure-insight/components/SettingsDialog.tsx`
- Modify: `structure-insight/README.md`
- Modify: `structure-insight/CHANGELOG.md`
- Modify: `structure-insight/package.json`
- Modify: `structure-insight/package-lock.json`

- [ ] **Step 1: Write the failing test**

```tsx
expect(result.current.state).not.toHaveProperty('includeGitDiffs');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- hooks/useAppLogic.test.tsx`
Expected: FAIL until all prop/state references are removed from the app shell.

- [ ] **Step 3: Write minimal implementation**

```tsx
// Remove SettingsDialog props and App wiring for the diff toggle.
```

```md
Remove README and CHANGELOG text that describes Edited Changes.
```

```json
Remove the "diff" dependency.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- hooks/useAppLogic.test.tsx`
Expected: PASS

### Task 4: Verify the Full Change Set

**Files:**
- Modify: `structure-insight/hooks/useAppLogic.test.tsx`
- Modify: `structure-insight/services/exportBuilder.test.ts`
- Modify: `structure-insight/services/repomixPlainOutput.test.ts`

- [ ] **Step 1: Run focused verification**

Run: `npm test -- hooks/useAppLogic.test.tsx services/exportBuilder.test.ts services/repomixPlainOutput.test.ts`
Expected: PASS

- [ ] **Step 2: Run broader project verification**

Run: `npm run check`
Expected: PASS
