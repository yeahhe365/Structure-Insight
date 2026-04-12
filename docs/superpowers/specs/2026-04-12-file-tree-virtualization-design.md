# File Tree Virtualization Design

## Context

`components/FileTree.tsx` currently renders the full expanded tree recursively. For large repositories this creates thousands of mounted DOM nodes, repeated descendant counting, and expensive re-renders for expand/collapse, keyboard navigation, and selection changes. The first performance milestone is to virtualize only the file tree without changing parsing, search, or export behavior.

## Goals

- Keep the existing tree data model (`FileNode[]`) and `ProcessedFiles` shape unchanged.
- Reduce mounted tree row count to a viewport-sized window instead of the full expanded tree.
- Preserve current interactions:
  - expand/collapse
  - keyboard navigation
  - file selection
  - directory double click
  - file actions (copy path, exclude/include, delete)
  - selected and focused row styling
- Keep the mobile and desktop layouts working with the current `MainContent.tsx` split-panel structure.

## Non-Goals

- No Web Worker work in this milestone.
- No ZIP parsing changes in this milestone.
- No search algorithm changes in this milestone.
- No changes to `ProcessedFiles.fileContents`, `treeData`, or `structureString` synchronization rules.

## Chosen Approach

Use a virtualized flat list for the visible tree rows while keeping the source tree nested.

### Why this approach

- It isolates the change to the rendering layer.
- It avoids risky changes to the repository data model.
- It works with the current expand/collapse state by deriving a flat visible-row list from `nodes` and `expandedPaths`.
- It gives an immediate DOM-count reduction even before any Worker work lands.

### Library choice

Prefer `react-virtuoso`.

Reasoning:

- The current tree rows can expand in height when hover actions appear, so a variable-height-friendly list is safer than a fixed-row abstraction.
- It supports container-based virtualization cleanly for the existing scrollable panel.
- It reduces the amount of manual measuring code we would need to maintain.

## Architecture

### 1. Flatten visible rows

Add a small tree-flattening helper inside `components/FileTree.tsx` or a nearby helper module.

Each flat row will contain:

- `node: FileNode`
- `level: number`
- `isOpen: boolean`
- `isSelected: boolean`
- `isFocused: boolean`

The flat list is recalculated from:

- `nodes`
- `expandedPaths`
- `selectedFilePath`
- `focusedPath`

Only directory descendants under expanded paths are included.

### 2. Replace recursive render with row renderer

Split the current recursive `FileTreeNode` rendering into:

- a reusable row component that renders one node row
- a virtualized list wrapper that renders the visible flat rows

Directory expansion state remains in `expandedPaths`.

### 3. Preserve keyboard navigation semantics

Keyboard navigation continues to operate on the visible path order, but the visible path list will now come from the flattened rows instead of a separate recursive walk.

On focus movement, the virtualized list should scroll the focused row into view.

### 4. Preserve action behavior

Row actions continue to call the existing callbacks:

- `onFileSelect`
- `onDeleteFile`
- `onCopyPath`
- `onToggleExclude`
- `onDirDoubleClick`

No business logic changes are required in `useInteraction.ts` or `useAppLogic.ts`.

## Files Expected To Change

- Modify `components/FileTree.tsx`
- Modify `package.json`
- Modify `package-lock.json`
- Add `components/FileTree.test.tsx`

## Risks And Mitigations

### Risk: flattening breaks expand/collapse or selection behavior

Mitigation:

- keep the original `expandedPaths` state shape
- derive rows from existing `FileNode.path`
- cover expand/collapse and selection behavior with component tests

### Risk: keyboard navigation loses parity

Mitigation:

- derive visible order from the flattened rows
- add tests for arrow navigation and Enter behavior

### Risk: variable-height rows produce jitter

Mitigation:

- use a virtualization library that supports dynamic row sizing
- keep row structure close to the current DOM and CSS

## Testing Strategy

Add component tests focused on behavior instead of implementation details:

1. renders only a bounded number of visible rows for a large expanded tree
2. collapses a directory and removes descendants from the visible row set
3. supports keyboard navigation across visible rows and Enter activation
4. preserves file action buttons for processed files

Manual verification:

- load a generated tree with thousands of files
- confirm tree scrolling stays responsive
- confirm DOM row count stays near viewport scale rather than total node count
- confirm mobile and desktop tree panels still render and scroll correctly

## Rollout Notes

This milestone intentionally stops at render virtualization. If it lands cleanly, the next stage can address main-thread parsing and search with Workers without mixing concerns in one refactor.
