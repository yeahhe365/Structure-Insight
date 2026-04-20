# Lazy ZIP Offload Design

## Goal

Reduce the default execution graph for `fileProcessingWorker` so ordinary folder analysis no longer eagerly includes ZIP handling costs.

## Problem

- `fileProcessingWorker` still includes ZIP processing code on its default path.
- Build inspection shows `JSZip` code is present in the worker entry graph, so non-ZIP analysis still pays for ZIP support.

## Design

- Move ZIP-specific extraction into `services/zipProcessor.ts`.
- Replace the in-module ZIP handler in `fileProcessor.ts` with a dynamic `import('./zipProcessor')` that runs only when `.zip` files are actually present.
- Keep the existing `processFiles(...)` API and ZIP behavior unchanged.

## Expected Impact

- Ordinary repository imports avoid loading ZIP processing code until needed.
- `fileProcessingWorker` should keep ZIP support, but the default path should no longer eagerly pull `JSZip` into the non-ZIP execution graph.

## Testing

- Add a focused test that confirms non-ZIP processing does not invoke the ZIP module.
- Keep existing ZIP behavior tests green.
- Rebuild and compare worker/main bundle outputs after the split.
