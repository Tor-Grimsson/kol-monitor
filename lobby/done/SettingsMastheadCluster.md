# SettingsMastheadCluster — the settings masthead row is the scaffold's now

**Staged:** 2026-08-30 · from **kol-ds-ui**
**Nature:** new props on `SettingsScaffold`, shipped in **kol-shell 0.27.0**. Adopt to get the consistent row.

## Why

The user, on three settings pages side by side: *"Im trying to ship a
universally consistent settings page, visually and functionally, but I keep
hitting the same issues over and over again."*

The masthead's control row was a raw `header.actions` slot. kol-fxr and
kol-r2b2 each hand-built the same shape into it; **kol-mirror and kol-monitor
passed nothing at all** — the string `actions` does not appear in either
SettingsPage. So the three pages did not differ by drift or version skew. Two of
them were simply never handed the row.

## What shipped

`SettingsScaffold` owns the arrangement — order, gap and tone — and the gear:

```jsx
<SettingsScaffold
  picker={<Dropdown className="w-40" tone="sunken" options={…} />}   // yours, optional
  themeToggle={<ThemeToggle fill="none" tone="sunken" label={false} size="sm" />}
  onOpenSettings={() => setDrawerOpen(true)}                        // the gear; DS draws it
/>
```

Renders **picker · theme toggle · gear** on the subtitle's baseline, right
aligned, above the rule. `IconFrame settings-01`, `tone` inherited from the
scaffold, `size="sm"`.

- **`themeToggle` is a node**, not drawn by the scaffold — it lives in
  kol-framework and shell dropped that peer in 0.16.0.
- Pass none of the three and no cluster renders. Nothing moves until you opt in.
- An explicit `header.actions` still wins, so nothing existing breaks.

## Also in this wave — the `sunken` tone was raised

**kol-theme 0.106.0.** `tone="sunken"` had no token of its own and borrowed
`--kol-oq-inverse-96`, which lands at luminance 23.7 on an 18.2 dark page: every
control wearing it rendered as its own PALE box. Measured on fxr's /settings.

Now `--kol-surface-sunken` → `oq-ab-96`, and the `ab` ladders flip toward the
ground, so the well is below the page on both themes. The state ladder is three
rungs — rest / `+fg-04` hover / `+fg-08` selected, ~9.5 apart either theme.

**Bump theme to 0.106.0 or the row still looks wrong**, whatever you pass.

## Remainder here — 📌 YES

1. Bump kol-shell **0.27.0** and kol-theme **0.106.0**.
2. Pass `themeToggle` and `onOpenSettings` at minimum — that alone makes this
   page match the other two.
3. `picker` only if this app has something to pick (fxr opens a chrome, r2b2 a
   bucket). Omit it and the row is toggle + gear.
4. If you have a settings drawer, wire `onOpenSettings` to it. If not, the gear
   is the place it goes when you build one.

⚠️ **Nothing here is screen-verified** — no repo renders the cluster yet. The
first to adopt is the check.

---

## 🟠 ADDRESSED — 2026-09-01 · kol-shell 0.31.0 · kol-theme 0.116.0

Adopted, on a bigger bump than the ticket asked for: the set had moved well past
0.27.0 / 0.106.0 by the time this was read. **kol-shell 0.26.0 → 0.31.0 ·
kol-theme 0.100.0 → 0.116.0 · kol-component 0.136.0 → 0.149.0 · kol-framework
0.35.0 → 0.36.0**, each tarball-diffed against the installed version first.
Theme is additive (the only names that vanish are the `NN` placeholders in a
doc comment); component drops one export, `MediaBrowser`, which this repo never
imported.

**What was passed** — `themeToggle` only:

```jsx
themeToggle={<ThemeToggle fill="none" tone="sunken" label={false} size="sm" />}
```

- **No `picker`.** This app has nothing to pick — no chromes, no buckets.
- **No `onOpenSettings`.** Monitor has no settings drawer, and a gear that opens
  nothing is worse than no gear. It goes in when the drawer does.

**The toggle MOVED, it was not added.** It already lived in the page body, in
`Display → Theme` on a `SettingsRow`. Passing it to the cluster as well would
have put two of the same control on one page — which is the exact inconsistency
this ticket exists to remove, so the body row is gone and `Display` now holds
its `Zoom defaults` line alone. kol-fxr's approved render has no body toggle
either; that is the reference this followed.

⚠️ **Not screen-verified.** Never opened here — this repo does not start a
server. The `sunken` re-grounding in kol-theme 0.106.0 is what makes the row
sit below the page rather than above it, and that is the thing to look at:
whether the toggle reads as a well on both themes, and whether it lands on the
subtitle's baseline right of the tab row.

---

## ✅ CLOSED — 2026-09-01 · browser-verified

The ⚠️ above is discharged. The first real browser pass in this repo (user
override of the no-server law; preview on 4317, PID killed after) rendered
`/settings` at **1440** and **390**:
`_tmp/2026-09-01-mobile-qa/qa-settings-1440.png` · `qa-settings-390.png`.

The cluster renders in the masthead, the toggle appears **exactly once** on the
page (the body's `Display → Theme` row is gone as intended), and it lands right
of the tab row on the subtitle's line. Both themes read. Nothing owed.
