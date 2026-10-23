# MonitorLibraryOnAppPreset — Library onto the DS `app` card, with a Dev tab to review it

**Staged:** 2026-10-23 · from a kol-ds-ui session
**Change:** bump kol-component 0.291.0 · kol-shell 0.75.0; a hub Dev tab previewing the `app` card on monitor’s patches; then `LibraryPage.jsx` on `preset="app"`

---

## What shipped

kol-component **0.291.0** · kol-shell **0.75.0** (CatalogAppVariant, filed by kol-fxr, closed 2026-10-23):

- `ContentCard` / `ContentRow` **`variant="app"`** — the `file` card and row with an app library's parts slotted: download on the cover, a cog over a trash in the plate, Rename · Duplicate · Delete on the cog and on right-click. Rename prompts and Delete confirms through `useModal` (the shell's `ModalProvider`). A verb you do not pass is not drawn.
- **`CatalogPage preset="app"`** — `app` card + row, 3 list columns, and the page's ONE menu mounted for you (`AppItemMenuProvider`). No `useContextMenu`, no menu element in the page.
- `toCard` returns, besides `key` · `title` · `onClick`:

| key | type | what it does |
|---|---|---|
| `verbs` | `{ rename?(name), duplicate?(), remove?() }` | raw writes — the DS asks the dialog first |
| `download` | `() => void` | the cover's download control |
| `menuItems` | node | extra menu rows after the three (`MenuDropdownItem`s) |
| `date` | ms or string | ms → ISO day `YYYY-MM-DD` |
| `size` | bytes or string | bytes → `formatSize` |
| `media` | src or node | src → a cover image; none → the image placeholder |
| `tone` | string | default `secondary` |

Reference: kol-ds-ui `apps/catalog` (Variants → Preset **App**) and the showcase CatalogPage `app` variant.

## The change here

1. **Bump first** — monitor is behind: `@kolkrabbi/kol-component` ^0.283.0 → 0.291.0, `@kolkrabbi/kol-shell` 0.73.0 → 0.75.0. Read both CHANGELOGs in between (0.284–0.291 · 0.74–0.75).
2. **A Dev tab, through the rail's dev option** — kol-shell's `dev={{ tabs }}` (AppHub / AppStudio) is what puts the `code` row on the rail and the `/dev` page on a dev localhost server only; monitor already passes it (`src/App.jsx:235`, `dev={DEV_TABS ? { tabs: DEV_TABS } : undefined}`). Add one entry to `DEV_TABS` in `src/pages/devTabs.jsx` — same `tab(value, label, load)` shape as the four there — that renders `CatalogPage preset="app"` over monitor's real saved patches and modules, so the card is reviewed in monitor before Library switches. Production never bundles it.
3. Then `LibraryPage.jsx` (`patchCard` / `moduleCard`, L154) onto `preset="app"`: `verbs` from monitor's library writes, `download` if a patch exports, `date` · `size` · `media`.

## Definition of done
- [x] Bumped; the Dev page has the `app` card tab on monitor's own data
- [x] Library draws the `app` card and row; the verbs monitor has all act

## ✅ RESOLVED — 2026-10-23

kol-component 0.291.0 · kol-shell 0.75.0. `src/pages/dev/AppCardPage.jsx` is the **App card** Dev tab: SAVED (your library — rename · duplicate · delete · download, date, size) and MODULES. `LibraryPage.jsx` is on `preset="app"`: modules and presets are read-only, so no verbs; a preset carries `download` (the Export file, `downloadPatch` in `usePatchFile.js`) and its size. `renameInLibrary` added to `useLibraryStore.js`. Walked on a task-scoped vite: duplicate → `init copy`, rename → `renamed`, download → `monitor-renamed-2026-10-23.json`, delete confirmed and gone; Library grid and list draw the `app` card and row, 0 console errors. Build green.

The `app` card has no `meta` line, so Library's HP/category and module/cable counts don't show — cards pass `meta` already; filed as `AppCardMeta` to kol-ds-ui.
