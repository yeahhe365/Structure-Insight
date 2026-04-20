# Performance Optimization Design

## Goal

Improve perceived responsiveness for two high-cost browser workflows:

1. Importing and analyzing large repositories
2. Running global search across loaded files

## Problem Summary

- `processFiles` performs file reads, token estimation, security scanning, tree updates, and line counting on the main thread with coarse batch yielding.
- `useSearch` scans all active files synchronously and computes each match line number by slicing and splitting content repeatedly.
- File tree rendering has already been virtualized, so the next meaningful wins are parsing and search.

## Chosen Approach

Use cooperative main-thread scheduling instead of a full Worker migration in this milestone.

### Why This Approach

- It preserves the current browser-first architecture and existing hook/component boundaries.
- It removes the biggest long-task hotspots with lower implementation risk than introducing Worker orchestration.
- It creates reusable primitives for a later Worker milestone if one is still needed.

## Design

### 1. Shared Text Metrics Helpers

Create a small text-metrics service for:

- line counting without `split('\n')`
- building line-start indexes once per content snapshot
- resolving a character offset to a 1-based line number with binary search

This helper will be used by both file processing and search so the app stops recomputing line information with high allocation cost.

### 2. Chunked Search Service

Move search work out of `useSearch` into a dedicated service that:

- builds the search regex once
- scans files incrementally
- yields back to the main thread on a time slice
- supports cancellation so stale searches do not overwrite newer queries
- uses cached line-start indexes to compute line numbers efficiently

`useSearch` will manage request invalidation and only commit the latest completed search.

### 3. Cooperative File Processing

Keep `processFiles` on the main thread for now, but reduce long tasks by:

- replacing `split('\n')` line counting with the shared helper
- yielding based on elapsed time instead of only every fixed number of files
- reusing the same scheduling helper across the processing loop

This should make imports feel smoother without changing export semantics or file-processing output.

## Non-Goals

- No Web Worker migration in this milestone
- No export format changes
- No file-tree architecture changes

## Testing

- Add unit tests for the new text-metrics helper
- Add unit tests for the chunked search service, including cancellation
- Update hook tests so async search still opens the first matching file through the shared flow
- Run the full project verification after integration
