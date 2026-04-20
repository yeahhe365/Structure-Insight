# Worker Offload Design

## Goal

Move the heaviest remaining compute off the main thread without changing visible app behavior:

1. Global search
2. File analysis during repository import

## Chosen Approach

Introduce thin client wrappers that use dedicated Web Workers when available and fall back to the existing in-thread services when Worker support is unavailable or under test.

## Design

### Search

- Add a `searchWorker.ts` module that runs one search request and posts back results.
- Add a `searchClient.ts` helper that spawns a worker per request, exposes `{ promise, cancel }`, and falls back to `searchProjectFiles(...)` locally when Workers are unavailable.
- Update `useSearch` to depend on the client instead of directly invoking the search service.

### File Analysis

- Add a `fileProcessingWorker.ts` module that runs `processFiles(...)` and streams progress events back to the main thread.
- Add a `fileProcessingClient.ts` helper that exposes `{ promise, cancel }`, maps worker progress messages to the existing callback, and falls back to local `processFiles(...)` when needed.
- Update `useFileProcessing` to manage a generic abort handle instead of a main-thread-only `AbortController`.

## Constraints

- Keep `processDroppedItems(...)` on the main thread because it depends on drag-and-drop entry APIs.
- Keep export behavior unchanged.
- Preserve existing progress text, cancel behavior, and result shapes.

## Testing

- Add client-level tests for search worker requests and cancellation.
- Add client-level tests for file-processing worker progress, result delivery, and cancellation.
- Keep existing hook and service tests green to verify behavior remains stable.
