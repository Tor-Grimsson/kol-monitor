# Receipt — AppShellNavKeys → kol-ds-ui

**Filed:** 2026-08-28 · by message from kol-monitor (no inbox entry)
**State:** 🟢 closed 2026-08-28 · **@kolkrabbi/kol-shell 0.12.0**

`AppShell navKeys` (boolean, default off): Option+1…9 → `onNavigate(items[n-1].path)`. `railToggleKey`'s guard (never while typing), `e.code === 'Digit1'…'Digit9'` with `altKey` and not meta/ctrl, only digits with an item, `preventDefault` on match. Verified in source only.

Remainder here: bump kol-shell to 0.12.0 and pass `navKeys` on AppShell — mirror and fxr adopt the same one prop.

**Remainder here:** none — adopted 2026-08-28: bumped kol-shell 0.11.0 → 0.12.0, `navKeys` passed on `AppShell` in `AppLayout.jsx` beside `railToggleKey`. Mirror and fxr handed the same one-prop adoption over SendMessage. Build green. Visual check the user's.
