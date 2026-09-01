# ShellSettingsPairRetired — kol-shell's `SettingsSection` / `LabelRow` are gone

**Staged:** 2026-08-30 · from **kol-ds-ui**
**Nature:** breaking change already shipped. Your settings page needs a two-import swap on the next bump.

## What happened

User ruling 2026-08-30: *"dont ship duplicate components"*. kol-shell was
shipping its own `SettingsSection` + `LabelRow`, a second implementation of
kol-component's `LabeledControlSection` + `SettingsRow` — same job, two
versions. **kol-component's are the survivors** (`LabeledControlSection` is the
user's chosen name). Shell's pair is retired to
`kol-ds-ui/_tmp/2026-08-30-shell-settings-duplicates/`, not deleted.

Shipped in **kol-shell 0.21.0**. `SettingsScaffold` itself is unchanged and
still exported — only the two body blocks left.

## The swap — `src/pages/SettingsPage.jsx`

You are the only two repos that imported them (kol-fxr already moved off).

```diff
- import { SettingsScaffold, SettingsSection, LabelRow, SettingsShortcuts, SettingsLinks, SettingsColophon } from '@kolkrabbi/kol-shell'
+ import { SettingsScaffold, SettingsShortcuts, SettingsLinks, SettingsColophon } from '@kolkrabbi/kol-shell'
+ import { LabeledControlSection, SettingsRow } from '@kolkrabbi/kol-component'
```

Then, in the body:

| was | now | note |
|---|---|---|
| `<SettingsSection title="…">` | `<LabeledControlSection label="…">` | prop is `label`, not `title` |
| `<LabelRow label="…">` | `<SettingsRow label="…">` | same 160px column |

**Two renders change, deliberately:**

1. **The section header becomes an EYEBROW.** Shell's was an `h2`
   (`kol-helper-14 text-fg-96`); `LabeledControlSection` uses
   `kol-eyebrow text-fg-80`. The KOL law is that a section label is an eyebrow —
   this is the fix, not a regression. kol-fxr's `/settings` is the approved
   reference render.
2. **`SettingsRow` UPPERCASES its label** and right-aligns the value by
   default. Pass `align="fill"` for a left-aligned value cell (that is what
   `LabelRow`'s baseline row did).

`LabeledControlSection` also takes `divided` (a hairline above) and
`rowGap` (1 for switch rows, 2 for dropdown rows) — shell's had neither.

## Not urgent

Nothing breaks until you bump kol-shell past 0.20.0. But there is no alias and
no deprecation window: the exports are simply gone, so the bump and the swap
are one move.

---

## ✅ RESOLVED — 2026-09-01 · already done when the ticket landed

🟢 `closed`. The swap had already shipped **2026-08-30 (session 69)**, forced by
the bump itself: kol-shell 0.24.0 dropped both exports with no alias, so the
build broke on `SettingsPage.jsx` and the migration was the only way past it.

`src/pages/SettingsPage.jsx:1-2` is the diff this ticket asks for, verbatim —
`SettingsScaffold` · `SettingsShortcuts` · `SettingsLinks` · `SettingsColophon`
off kol-shell, `LabeledControlSection` · `SettingsRow` off kol-component. Both
prop renames are in the body (`label=` on eight sections, `align="fill"` on the
two prose rows), and the docblock at `:13-24` records the mapping and the two
deliberate render changes.

Both stated deltas landed as described: the section heading is an eyebrow, and
`SettingsRow` uppercases its label and does not style a string child — the two
prose rows carry their own `text-fg-32 kol-helper-12` span for that reason.

Confirmed green on **kol-shell 0.31.0** (this sitting), five releases past the
0.20.0 boundary the ticket names. Nothing was owed.
