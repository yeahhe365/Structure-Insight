# ZIP And Tab State Fixes Design

## Goal

Close two correctness gaps in the browser app:

1. Preserve empty directories discovered inside imported `.zip` archives.
2. Keep open tabs and current selection consistent after a file is deleted from the in-app tree.

## Scope

- Keep the existing browser-first architecture.
- Avoid refactoring unrelated export or tree-rendering code.
- Surface ZIP extraction failures to the existing error-handling path instead of silently logging and continuing.

## Design

### ZIP Import Path

- Change the ZIP extraction helper to return both extracted files and empty-directory paths.
- Merge ZIP-derived empty directories with the existing `emptyDirectoryPaths` collected from drag-and-drop folder traversal.
- Keep filtering behavior unchanged by sending the merged list through the existing ignore/include filtering pipeline.
- When ZIP extraction fails, stop processing and raise a descriptive error so the existing UI toast path can notify the user.

### Delete-State Synchronization

- Extend the interaction hook with a deletion-confirmed callback that fires only after the file has actually been removed.
- Let `useAppLogic` own tab cleanup, because it already owns `openFiles` and view-selection state.
- On confirmed deletion, remove the deleted path from `openFiles`.
- If the deleted file was selected, leave the selection cleared and return the view to `structure`, matching the current empty-state behavior.

## Testing

- Add unit coverage for ZIP-derived empty directories being retained in processed output.
- Add unit coverage for ZIP extraction errors becoming thrown processing errors.
- Add hook coverage for deleting an open file removing it from `openFiles` and clearing the active selection/view.
