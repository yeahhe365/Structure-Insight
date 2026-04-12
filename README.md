# Structure Insight App

Browser-first codebase analysis and export tooling for sharing repository context with AI systems.

## What This App Does

- Imports folders and `.zip` archives entirely in the browser
- Builds a navigable tree view and code viewer
- Lets you edit files in-app and export the current state
- Supports layered `.gitignore` and `.ignore` filtering
- Estimates token usage for loaded files
- Flags likely sensitive content before you copy or save exports
- Shows a dedicated security findings dialog for reviewing warning details
- Can split large exports into multiple files during save
- Registers as a PWA and caches the app shell for offline reuse after the first online load
- Uses local build-time assets instead of runtime CDN dependencies for core UI styling, icons, and syntax highlighting
- Splits heavier views like the file tree and code viewer into separate chunks to keep the initial app shell lighter

## Development

Run all commands from this directory:

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run typecheck
npm test -- --run
npm run build
npm run check
```

## Repository Notes

- The repository root contains the public project README.
- CI runs from the repository root but uses this directory as the working directory.
- Cloudflare Pages or similar platforms should point their root/build directory to `structure-insight/`.

## Export Semantics

- `Edited Changes` represents differences between the imported file contents and your in-app edits.
- It does **not** read the local git working tree or staged diff.
- Token counts are estimates intended for planning and comparison, not exact model-token guarantees.

## Offline Notes

- The app shell no longer depends on external CDN resources in `index.html`.
- Core styling is compiled locally with Tailwind.
- Icons and syntax-highlighting resources are bundled or served from local project assets.
- Font Awesome is reduced to the local solid subset with `woff2` output only.
- First-load network access is still needed for the initial installation, but repeat visits can rely on cached local assets.
