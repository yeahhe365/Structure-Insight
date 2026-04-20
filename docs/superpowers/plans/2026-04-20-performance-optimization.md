# Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce UI jank during large-project import and global search without changing the app's external behavior.

**Architecture:** Add a shared text-metrics service, move search work into a cancellable chunked service, and make file processing yield cooperatively on time slices. Keep the existing React and export architecture intact.

**Tech Stack:** React 19, TypeScript, Vitest, Vite, browser timers, existing hook/service modules.

---

### Task 1: Add Shared Text Metrics Helpers

**Files:**
- Create: `services/textMetrics.ts`
- Create: `services/textMetrics.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Add tests that assert:

```ts
expect(countLines('alpha')).toBe(1);
expect(countLines('alpha\nbeta\n')).toBe(3);

const lineStarts = buildLineStartIndices('one\ntwo\nthree');
expect(lineStarts).toEqual([0, 4, 8]);
expect(findLineNumber(lineStarts, 0)).toBe(1);
expect(findLineNumber(lineStarts, 6)).toBe(2);
expect(findLineNumber(lineStarts, 10)).toBe(3);
```

- [ ] **Step 2: Run the helper test file and verify RED**

Run: `npm test -- services/textMetrics.test.ts`
Expected: FAIL because the helper module does not exist yet.

- [ ] **Step 3: Write the minimal helper implementation**

Implement:

```ts
export function countLines(content: string): number { ... }
export function buildLineStartIndices(content: string): number[] { ... }
export function findLineNumber(lineStarts: number[], index: number): number { ... }
```

- [ ] **Step 4: Run the helper test file and verify GREEN**

Run: `npm test -- services/textMetrics.test.ts`
Expected: PASS

### Task 2: Add Chunked Search Service

**Files:**
- Create: `services/searchEngine.ts`
- Create: `services/searchEngine.test.ts`
- Modify: `hooks/useSearch.ts`
- Modify: `hooks/useSearch.test.tsx`

- [ ] **Step 1: Write the failing search-service tests**

Add tests that assert:

```ts
await expect(searchProjectFiles({ files, query: 'needle', options })).resolves.toEqual([
  expect.objectContaining({ filePath: 'src/a.ts', line: 2 }),
]);

await expect(searchProjectFiles({ files, query: 'needle', options, signal })).rejects.toThrow('Search aborted');
```

- [ ] **Step 2: Run the focused test files and verify RED**

Run: `npm test -- services/searchEngine.test.ts hooks/useSearch.test.tsx`
Expected: FAIL because the service does not exist and the hook is still synchronous.

- [ ] **Step 3: Implement the chunked search path**

Build a service that:

```ts
export async function searchProjectFiles(params: SearchProjectFilesParams): Promise<SearchResultItem[]> { ... }
```

Then update `useSearch` to:

- cancel stale requests
- run the latest search asynchronously
- open the first result only after the latest search completes

- [ ] **Step 4: Run the focused test files and verify GREEN**

Run: `npm test -- services/searchEngine.test.ts hooks/useSearch.test.tsx`
Expected: PASS

### Task 3: Optimize File Processing Scheduling

**Files:**
- Modify: `services/fileProcessor.ts`
- Modify: `services/fileProcessor.test.ts`
- Modify: `services/constants.ts`

- [ ] **Step 1: Add a focused regression test for processed output staying stable**

Use existing file-processing coverage to protect:

```ts
expect(result.fileContents[0].stats.lines).toBe(2);
expect(result.treeData[0]?.children?.[0]).toMatchObject({ status: 'processed' });
```

This guards the refactor while the scheduling strategy changes.

- [ ] **Step 2: Run the file-processing test file and verify RED if needed**

Run: `npm test -- services/fileProcessor.test.ts`
Expected: existing tests cover the refactor target; add a failing assertion only if new helper integration changes behavior.

- [ ] **Step 3: Implement cooperative yielding and low-allocation line counting**

Replace repeated `split('\n')` calls with `countLines(...)`, and yield processing based on elapsed time in addition to fixed batching.

- [ ] **Step 4: Run the file-processing test file and verify GREEN**

Run: `npm test -- services/fileProcessor.test.ts`
Expected: PASS

### Task 4: Full Verification

**Files:**
- Modify: `services/textMetrics.ts`
- Modify: `services/textMetrics.test.ts`
- Modify: `services/searchEngine.ts`
- Modify: `services/searchEngine.test.ts`
- Modify: `hooks/useSearch.ts`
- Modify: `hooks/useSearch.test.tsx`
- Modify: `services/fileProcessor.ts`
- Modify: `services/fileProcessor.test.ts`

- [ ] **Step 1: Run the touched test files together**

Run: `npm test -- services/textMetrics.test.ts services/searchEngine.test.ts hooks/useSearch.test.tsx services/fileProcessor.test.ts`
Expected: PASS

- [ ] **Step 2: Run the full project verification**

Run: `npm run check`
Expected: typecheck, tests, and production build all pass.
