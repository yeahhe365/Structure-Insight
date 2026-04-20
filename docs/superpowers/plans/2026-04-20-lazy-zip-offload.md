# Lazy ZIP Offload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop ordinary file analysis from eagerly paying ZIP support costs by lazily loading ZIP extraction only when `.zip` files are present.

**Architecture:** Extract ZIP handling into its own module and dynamically import it from `processFiles(...)` only on the ZIP branch. Preserve the existing file-processing API and ZIP behavior.

**Tech Stack:** TypeScript, Vitest, Vite dynamic imports, JSZip.

---

### Task 1: Lock Behavior With Tests

**Files:**
- Modify: `services/fileProcessor.test.ts`
- Create: `services/zipProcessor.ts`
- Modify: `services/fileProcessor.ts`

- [ ] **Step 1: Write the failing tests**

Add a test like:

```ts
expect(processZipFileMock).not.toHaveBeenCalled();
```

after processing a normal non-ZIP file, while preserving the existing ZIP behavior tests.

- [ ] **Step 2: Run the focused file-processing test file and verify RED**

Run: `npm test -- services/fileProcessor.test.ts`
Expected: FAIL because the ZIP module split does not exist yet.

- [ ] **Step 3: Implement the minimal ZIP split**

Create:

```ts
export async function processZipFile(zipFile: File): Promise<ZipExtractionResult> { ... }
```

Then dynamically import it in the ZIP branch of `processFiles(...)`.

- [ ] **Step 4: Run the focused file-processing test file and verify GREEN**

Run: `npm test -- services/fileProcessor.test.ts`
Expected: PASS

### Task 2: Verify Bundle Impact

**Files:**
- Modify: `services/zipProcessor.ts`
- Modify: `services/fileProcessor.ts`

- [ ] **Step 1: Run a production build with manifest**

Run: `npm run build -- --manifest`
Expected: Build succeeds and the worker/main graph reflects the ZIP split.

- [ ] **Step 2: Inspect build output**

Compare the generated `fileProcessingWorker` and main `index` outputs against the previous baseline and confirm whether the default path got smaller or cleaner.

### Task 3: Full Verification

**Files:**
- Modify: `services/fileProcessor.test.ts`
- Create: `services/zipProcessor.ts`
- Modify: `services/fileProcessor.ts`

- [ ] **Step 1: Run the full project verification**

Run: `npm run check`
Expected: typecheck, tests, and production build all pass.
