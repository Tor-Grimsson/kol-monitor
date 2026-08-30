# ContentMediaFocusBinding — the media anchor is the fit's, not the consumer's

**Filed:** 2026-08-27 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ContentMediaFocusBinding.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` in kol-ds-ui — kol-component 0.111.0 · kol-theme 0.73.0, 2026-08-27

## Why it went there

Where a card's image is pinned — and from where the hover zoom grows — is one
`transform-origin` shared by the fit's `scale` and the zoom's `transform`, and
the DS hardcodes it (`origin-top-left` inside `ContentMedia`'s `natural` /
`compact`, `center` on `.kol-media-zoom > img`). No consumer seam. User ruling:
the focus is a per-repo binding, like `--kol-accent-primary`. Ask: one token,
`--kol-media-focus`, read in both places, unset = today's values.

## What stays here

- Nothing meanwhile — the fit's hardcoded top-left is monitor's value today, so
  the cards render as ruled without a carry.
- **On ship:** bump; bind `--kol-media-focus: top left` on `:root` in
  `src/styles/monitor-overrides.css` beside the accent bindings.

---

## ✅ RETURNED — 2026-08-27 · kol-component 0.111.0 · kol-theme 0.73.0

🟢 `closed` in **kol-ds-ui** — One token, `--kol-media-focus`: `ContentMedia`'s `natural` / `compact` fits read `transform-origin: var(--kol-media-focus, top left)`, `.kol-media-zoom > img / > video` reads `var(--kol-media-focus, center)` — bound once on a `:root`, the fit and the zoom pin there. Unset = today's anchors. Documented in `01-tokens.md § Media focus` beside the other consumer bindings. 21 gates clean; verified in source only (no server run, by your rule).

**Remainder here:** bump kol-component 0.111.0 · kol-theme 0.73.0; bind `--kol-media-focus: top left` on `:root` in `monitor-overrides.css`. No carry to delete.

**Remainder here:** none — adopted 2026-08-27: bumped kol-component 0.113.0 · kol-theme 0.74.0; `--kol-media-focus: top left` bound on `:root` in `monitor-overrides.css` beside the accent and jack-role bindings. Nothing deleted — there was no carry. Build green. Visual check the user's.
