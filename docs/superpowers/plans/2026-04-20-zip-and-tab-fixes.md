# ZIP And Tab State Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve ZIP empty directories, surface ZIP import failures, and keep tab state consistent after deletions.

**Architecture:** Extend the ZIP processing helper to return structured archive results instead of files only, then merge those results into the existing processing pipeline. Add a deletion-confirmed callback from `useInteraction` back into `useAppLogic` so tab ownership stays centralized.

**Tech Stack:** React 19, TypeScript, Vitest, JSZip, existing hook-based app state.

---

### Task 1: Lock ZIP Behavior With Tests

**Files:**
- Modify: `services/fileProcessor.test.ts`
- Modify: `services/fileProcessor.ts`

- [ ] **Step 1: Write the failing ZIP tests**

Add tests that assert:

```ts
await expect(
  processFiles([zipFile], vi.fn(), true, 100_000, new AbortController().signal, {
    includeEmptyDirectories: true,
  })
).resolves.toMatchObject({
  emptyDirectoryPaths: ['demo/empty'],
});

await expect(
  processFiles([brokenZip], vi.fn(), true, 100_000, new AbortController().signal)
).rejects.toThrow('Failed to unzip broken.zip');
```

- [ ] **Step 2: Run the focused test file and verify RED**

Run: `npm test -- services/fileProcessor.test.ts`
Expected: FAIL because ZIP empty directories are not returned and ZIP failures are swallowed.

- [ ] **Step 3: Implement the minimal ZIP processing fix**

Update the ZIP helper to return:

```ts
interface ZipExtractionResult {
  files: File[];
  emptyDirectoryPaths: string[];
}
```

Then merge archive-derived empty directories into the final filtered directory list and throw a descriptive error when extraction fails.

- [ ] **Step 4: Run the focused test file and verify GREEN**

Run: `npm test -- services/fileProcessor.test.ts`
Expected: PASS

### Task 2: Lock Deletion And Tab State With Tests

**Files:**
- Modify: `hooks/useAppLogic.test.tsx`
- Modify: `hooks/useInteraction.ts`
- Modify: `hooks/useAppLogic.ts`

- [ ] **Step 1: Write the failing hook test**

Add a hook test that opens a file tab and then deletes that file:

```ts
act(() => {
  result.current.handlers.handleFileTreeSelect('src/app.ts');
});

act(() => {
  result.current.handlers.handleDeleteFile('src/app.ts');
});

expect(result.current.state.openFiles).toEqual([]);
expect(result.current.state.selectedFilePath).toBeNull();
expect(result.current.state.activeView).toBe('structure');
```

- [ ] **Step 2: Run the focused hook test and verify RED**

Run: `npm test -- hooks/useAppLogic.test.tsx`
Expected: FAIL because deletion does not clean `openFiles`.

- [ ] **Step 3: Implement the minimal state-sync fix**

Add an optional callback to `useInteraction`:

```ts
onDeleteConfirmed?: (path: string) => void;
```

Invoke it only inside the confirmed deletion path, and let `useAppLogic` remove the deleted path from `openFiles` and restore the structure view when the deleted file was selected.

- [ ] **Step 4: Run the focused hook test and verify GREEN**

Run: `npm test -- hooks/useAppLogic.test.tsx`
Expected: PASS

### Task 3: Full Verification

**Files:**
- Modify: `services/fileProcessor.test.ts`
- Modify: `hooks/useAppLogic.test.tsx`
- Modify: `services/fileProcessor.ts`
- Modify: `hooks/useInteraction.ts`
- Modify: `hooks/useAppLogic.ts`

- [ ] **Step 1: Run the touched test files together**

Run: `npm test -- services/fileProcessor.test.ts hooks/useAppLogic.test.tsx`
Expected: PASS

- [ ] **Step 2: Run the full project verification**

Run: `npm run check`
Expected: typecheck, tests, and production build all pass.
