# Worker Offload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move search and file-analysis work into dedicated Web Workers while preserving the existing user-facing behavior.

**Architecture:** Add worker entry modules plus small client wrappers that expose cancellable tasks and gracefully fall back to the existing main-thread services when Workers are unavailable.

**Tech Stack:** React 19, TypeScript, Vite Workers, Vitest, existing search and file-processing services.

---

### Task 1: Add Search Worker Client Coverage

**Files:**
- Create: `services/searchClient.ts`
- Create: `services/searchWorker.ts`
- Create: `services/searchClient.test.ts`
- Modify: `hooks/useSearch.ts`

- [ ] **Step 1: Write the failing search-client tests**

Add tests that assert:

```ts
const task = createSearchTask({ files, query: 'needle', options });
await expect(task.promise).resolves.toEqual([expect.objectContaining({ filePath: 'src/a.ts' })]);

const cancelled = createSearchTask({ files, query: 'needle', options });
cancelled.cancel();
await expect(cancelled.promise).rejects.toThrow('Search aborted');
```

- [ ] **Step 2: Run the focused test file and verify RED**

Run: `npm test -- services/searchClient.test.ts`
Expected: FAIL because the client and worker do not exist yet.

- [ ] **Step 3: Implement the search worker path**

Create a cancellable worker-backed client and switch `useSearch` to use it.

- [ ] **Step 4: Run the focused test file and verify GREEN**

Run: `npm test -- services/searchClient.test.ts hooks/useSearch.test.tsx`
Expected: PASS

### Task 2: Add File-Processing Worker Client Coverage

**Files:**
- Create: `services/fileProcessingClient.ts`
- Create: `services/fileProcessingWorker.ts`
- Create: `services/fileProcessingClient.test.ts`
- Modify: `hooks/useFileProcessing.ts`

- [ ] **Step 1: Write the failing file-processing client tests**

Add tests that assert:

```ts
const task = createFileProcessingTask({ files, extractContent: true, maxCharsThreshold: 0, options, onProgress });
await expect(task.promise).resolves.toMatchObject({ fileContents: [expect.any(Object)] });
expect(onProgress).toHaveBeenCalledWith('processing...');
```

- [ ] **Step 2: Run the focused test file and verify RED**

Run: `npm test -- services/fileProcessingClient.test.ts`
Expected: FAIL because the client and worker do not exist yet.

- [ ] **Step 3: Implement the file-processing worker path**

Create the worker-backed client, update `useFileProcessing` to use a generic abort handle, and preserve progress/cancel semantics.

- [ ] **Step 4: Run the focused test file and verify GREEN**

Run: `npm test -- services/fileProcessingClient.test.ts`
Expected: PASS

### Task 3: Full Verification

**Files:**
- Modify: `services/searchClient.ts`
- Modify: `services/searchWorker.ts`
- Modify: `services/fileProcessingClient.ts`
- Modify: `services/fileProcessingWorker.ts`
- Modify: `hooks/useSearch.ts`
- Modify: `hooks/useFileProcessing.ts`

- [ ] **Step 1: Run the touched test files together**

Run: `npm test -- services/searchClient.test.ts services/fileProcessingClient.test.ts hooks/useSearch.test.tsx services/searchEngine.test.ts services/fileProcessor.test.ts`
Expected: PASS

- [ ] **Step 2: Run the full project verification**

Run: `npm run check`
Expected: typecheck, tests, and production build all pass.
