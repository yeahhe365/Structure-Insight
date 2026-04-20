# Settings All-Model-Chat Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Structure Insight's settings dialog so it visually and structurally tracks All-Model-Chat's settings modal as closely as the current codebase allows.

**Architecture:** Split the current monolithic `SettingsDialog` into a shell with a left sidebar, a right content pane, and shared section primitives. Keep Structure Insight's existing settings behavior and section count, but align modal proportions, navigation layout, headers, cards, action rows, and about-page presentation with All-Model-Chat's settings system.

**Tech Stack:** React 19, TypeScript, Tailwind utility classes, Vitest, Testing Library, Framer Motion

---

### Task 1: Lock the new modal shell with tests

**Files:**
- Modify: `/Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.test.tsx`
- Test: `/Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('renders an app-style settings shell with sidebar navigation and a wide modal surface', () => {
  renderDialog();

  expect(screen.queryByText('菜单')).toBeNull();
  expect(screen.getByRole('button', { name: '关闭设置' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 2, name: '工作区设置' })).toBeTruthy();

  const dialogSurface = screen.getByRole('tablist', { name: '设置导航' }).closest('div[class*="max-w-6xl"]');
  expect(dialogSurface?.className).toContain('sm:w-[90vw]');
  expect(dialogSurface?.className).toContain('sm:h-[85vh]');
  expect(dialogSurface?.className).toContain('md:flex-row');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/SettingsDialog.test.tsx`
Expected: FAIL because the current dialog still renders the old header/menu shell and does not expose the new modal sizing classes.

- [ ] **Step 3: Write minimal implementation**

```tsx
<motion.div className="w-full h-[100dvh] sm:h-[85vh] sm:w-[90vw] max-w-6xl ... md:flex-row">
  <aside ...>
    <button aria-label="关闭设置">...</button>
  </aside>
  <main ...>
    <header className="hidden md:flex ...">
      <h2>...</h2>
    </header>
  </main>
</motion.div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/SettingsDialog.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.test.tsx /Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.tsx
git commit -m "refactor: rebuild settings dialog shell"
```

### Task 2: Refactor settings content into sidebar/content primitives

**Files:**
- Modify: `/Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.tsx`
- Test: `/Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('switches sections inside the refactored settings content shell', () => {
  renderDialog();

  fireEvent.click(screen.getByRole('tab', { name: '导出' }));
  expect(screen.getByRole('heading', { level: 2, name: '导出设置' })).toBeTruthy();

  fireEvent.click(screen.getByRole('tab', { name: '关于' }));
  expect(screen.getByRole('heading', { level: 2, name: '项目与版本' })).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/SettingsDialog.test.tsx`
Expected: FAIL if the shell extraction breaks tab switching or header synchronization.

- [ ] **Step 3: Write minimal implementation**

```tsx
const SettingsSidebar = (...) => <aside>...</aside>;
const SettingsContent = (...) => <main><header>...</header>{renderSectionContent()}</main>;
const SettingsSectionCard = (...) => <section>...</section>;
const SettingsActionRow = (...) => <div>...</div>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/SettingsDialog.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.tsx /Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.test.tsx
git commit -m "refactor: split settings dialog into shell primitives"
```

### Task 3: High-fidelity restyle the section cards and control rows

**Files:**
- Modify: `/Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.tsx`
- Test: `/Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('renders settings content with compact app-style cards and an emphasized danger section', () => {
  renderDialog();
  fireEvent.click(screen.getByRole('tab', { name: '工作区' }));

  expect(screen.getByText('显示')).toBeTruthy();
  expect(screen.getByText('工作区')).toBeTruthy();
  expect(screen.getByRole('button', { name: '清除缓存' }).className).toContain('bg-red-600');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/SettingsDialog.test.tsx`
Expected: FAIL because the current destructive action is still a small outlined pill and not the new danger block treatment.

- [ ] **Step 3: Write minimal implementation**

```tsx
<section className="rounded-2xl border ...">
  ...
</section>

<section className="rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white ...">
  ...
</section>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/SettingsDialog.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.tsx /Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.test.tsx
git commit -m "style: align settings cards with app shell"
```

### Task 4: Rebuild the about section to match the reference modal

**Files:**
- Modify: `/Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.tsx`
- Test: `/Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('renders the about tab as a centered product showcase instead of a plain list', () => {
  renderDialog();
  fireEvent.click(screen.getByRole('tab', { name: '关于' }));

  expect(screen.getByText('Structure Insight')).toBeTruthy();
  expect(screen.getByText('v5.4.0')).toBeTruthy();
  expect(screen.getByRole('link', { name: '查看 GitHub' })).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- components/SettingsDialog.test.tsx`
Expected: FAIL because the current about tab is still a list of rows.

- [ ] **Step 3: Write minimal implementation**

```tsx
<div className="flex min-h-full flex-col items-center text-center ...">
  <div className="...">Structure Insight</div>
  <div className="...">v5.4.0</div>
  <a ...>查看 GitHub</a>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- components/SettingsDialog.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add /Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.tsx /Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.test.tsx
git commit -m "style: rebuild settings about view"
```

### Task 5: Run focused and full verification

**Files:**
- Modify: `/Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.tsx`
- Modify: `/Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.test.tsx`

- [ ] **Step 1: Run focused settings tests**

Run: `npm test -- components/SettingsDialog.test.tsx`
Expected: PASS

- [ ] **Step 2: Run related UI regression tests**

Run: `npm test -- components/MainContent.test.tsx components/FileTree.test.tsx components/FileTree.integration.test.tsx`
Expected: PASS

- [ ] **Step 3: Run full project verification**

Run: `npm run check`
Expected: `typecheck`, all tests, and `vite build` PASS

- [ ] **Step 4: Commit**

```bash
git add /Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.tsx /Users/jones/Documents/Code/Structure-Insight/components/SettingsDialog.test.tsx
git commit -m "style: align settings dialog with all-model-chat"
```
