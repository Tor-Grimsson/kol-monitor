# ShellHomeSystemAdoption — the shared app tier shipped; adopt it like kol-fxr did

**Staged:** 2026-08-27 → from **kol-fxr** (the reference adoption, same day)
**Source:** kol-fxr `src/pages/HomePage.jsx` · `LibraryPage.jsx` · `SettingsPage.jsx` · `src/AppLayout.jsx` · `vite.config.js` · `index.html`
**DS:** kol-ds-ui `lobby/done/ShellHomeSystem.md` · `PageHeaderMonoTitle.md` · `ContentFiltersFirstGroupHugs.md`

## What happened

Home · Library · Settings under the `AppShell` rail was one system written by
hand in fxr, mirror and monitor. On 2026-08-27 kol-fxr was rebuilt to match
monitor page by page, then everything generic was filed to the DS and shipped
the same day: **kol-shell 0.8.0 · kol-component 0.104.3 · kol-theme 0.71.0 ·
kol-framework 0.28.0 · kol-icons 0.20.0 · kol-brand 0.1.3**. fxr adopted all
of it; this repo carries the hand-rolled originals. Same round-trip here.

## Do

1. **Bump** to the versions above (`npm view <pkg> dist-tags`, not `pnpm outdated` — it lies).
2. **Home → `CatalogPage`** (kol-shell): `header={{ title, subtitle, size: 'sm', voice: 'mono' }}`,
   `items`, `filtersTitle`, `views` (RECENT/SAVED), `toCard(item, { view, layout })`,
   `walkthrough={{ open, steps }}`, `actions`. Stop importing `GridCard` / `TabStrip`
   (deprecated) — the DS retires them once no one imports them.
3. **Settings**: `<SettingsScaffold header={{ size: 'sm', voice: 'mono' }}>`;
   `SettingsShortcuts sections comboLabel` for the shortcut list; `SettingsLinks links`
   for the Repo tab; `SettingsColophon` for the foot line. Section `h2`s are the DS's now.
4. **AppLayout**: `<AppShell railToggleKey={'\\'} touch="overlay" appName="…">` — the key
   hides the rail (never while typing; back on every route change), `touch` owns the
   coarse-pointer policy (`'overlay'` mounts the promoted `TouchDeviceOverlay`;
   `'bare'` = no shell). Rail icons `nav-library · nav-rack · nav-create · nav-settings ·
   nav-home` are in kol-icons 0.20.0 — drop the local set and `iconComponent`.
   Logomark: `import logomarkUrl from '@kolkrabbi/kol-brand/svg/favicon-01.svg?url'`.
5. **Theme boot**: `THEME_BOOT_SCRIPT` from `@kolkrabbi/kol-framework/src/theme.js`,
   inlined by a `transformIndexHtml` plugin replacing an `<!-- kol-theme-boot -->`
   comment in `index.html`; delete the hand-written snippet.
6. **Laws re-affirmed today** (all in the DS now, none to fake locally): icons paint
   opaque `oq-*`, never alpha `fg-*` (strokes multiply); `ContentFilters` — the FIRST
   group hugs its chips, every group after it flows, category labels are `kol-eyebrow`;
   section/category labels everywhere are `kol-eyebrow`; catalog cards zoom + step
   their frame on hover and truncate `detail` by default.
7. `"dev": "vite --force"` — a DS bump served the old package from Vite's dep cache
   twice today; forcing re-optimisation on start ends that.

## Monitor-specific

- `src/styles/kol-typography-mono.css` still defines the retired `.kol-heading-sm` in
  JetBrains Mono — that is the ONLY reason the deployed title is mono. Retire the
  sheet; `voice="mono"` is the real seam.
- `src/icons/svg/00-rack/nav-*.svg` + `iconComponent={Icon}` on AppShell → kol-icons.
- `src/overlays/TouchDeviceOverlay.jsx` → `touch="overlay"` on AppShell (it was promoted).
- `HomePage.jsx` `GridCard` + `previewFit="compact"` → `CatalogPage` `toCard` with `media`.
- The rack hiding the rail through `useNavHidden` stays; `railToggleKey` is additive.

## Reference

Read kol-fxr's four files above as the target render — they are ~80 lines each now.

## ✅ RESOLUTION — 2026-08-27

Adopted on kol-fxr's wiring; `pnpm build` green (main chunk 1.11MB), `dist/index.html` carries the boot script.

1. **Bumped** — component 0.105.0 · shell 0.8.0 · theme 0.71.0 · framework 0.28.0 · icons 0.20.0 · brand 0.1.3 (release-age excludes updated; `npm view` was the truth, `pnpm outdated` showed nothing).
2. **Home → `CatalogPage`** (`src/pages/HomePage.jsx`) — mono `sm` header; RECENT = the empty case, SAVED = every preset, through the controlled view; `toCard` with `media`; walkthrough + action row. No `GridCard` / `TabStrip` import left in the repo (Library + Create on `ContentCard` / `ContentRow catalog` directly — see below).
3. **Settings** — `header={{ size: 'sm', voice: 'mono' }}`; `SettingsShortcuts` on `SHORTCUT_SECTIONS` (`src/data/shortcuts.js`, sectioned for the 6×2 grid — the section names are new copy); `SettingsLinks`; `SettingsColophon`. The overlay reads the same array mapped `combo → keys` (the two DS pieces disagree on the field name — filed).
4. **AppLayout** — `railToggleKey={'\\'}` · `touch="overlay"` · `appName="Monitor"`; `iconComponent` dropped; local `nav-*.svg` retired, ModuloSidebar's mini-rail on kol-icons too; logomark from kol-brand in both rails.
5. **Theme boot** — `themeBoot` plugin in `vite.config.js` over the `<!-- kol-theme-boot -->` comment; main.jsx's post-load re-stamp deleted.
6. Nothing faked locally.
7. `"dev": "vite --force"`.

**Monitor-specific:** the t-shirt stops retired from `kol-typography-mono.css` (the JetBrains `@font-face`, `--kol-font-family-mono` and the below-floor `kol-helper-xxxxs` stay — fonts are per-app); the nine consumers moved to `kol-mono-heading-03` / `kol-mono-14`; `TouchDeviceOverlay.jsx` retired. Everything retired sits in `_tmp/2026-08-27-shell-home-adoption/`.

**Second pass (same day, on the user's challenge):** the inline `<body style="background:#0a0a0a">` no-flash guard deleted from `index.html` (the boot script + AppShell's tertiary own it); the 258-line local `atoms/Logomark.jsx` retired for kol-shell's in ModuloSidebar; dead `atoms/PatchCard.jsx` retired; the two not-found pages on `PageShell` + the mono `PageHeader`. Not touched: the rack-chrome atoms under `src/components/atoms/` (Tag · ToggleSwitch · Divider · Input …) duplicate DS atoms across 31 module files — a separate arc, not the shell tier.

**Not done, filed back:** Library and Create cannot sit on `CatalogPage` yet — no `mutuallyExclusiveFilters` pass-through and no `expanded` / `expandedContent` in the `toCard` contract → `ShellHomeSystemMonitorGaps` in kol-ds-ui. Visual check is the user's.
