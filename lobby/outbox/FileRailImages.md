# FileRailImages

**Filed:** 2026-10-24 → **kol-ds-ui** · kol-component 0.298.0 · kol-shell 0.78.1
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/FileRailImages.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · 2026-10-24 · 📌 remainder here

## What stays here

Plan 16 W8: a save holds `images[]` (output frame + rack shot, uploads), `cover` and `back` are picks from it; browser store signed out, the API's D1 signed in. On return: bump, pass `images` / `onImages` / `onCover(id)` / `onBack(id)` from `shipped.jsx` `card` and Home's file data; `setThumb` becomes the pick.

## ✅ RETURNED — 2026-10-24

🟢 `closed` in **kol-ds-ui** — **kol-component 0.299.0 · kol-shell 0.79.0** (registry live). The File Rail's Files section: an item with `images` `[{ id, src, label? }]` (on `toCard`, on a Hub file) shows them as thumbnails between the fields and Details; a click opens them in `MediaInspector` (apps/media's quicklook). Edit mode adds × on each and an Upload tile, both writing **`onImages(next)`** — the whole list, the rail naming a new image's id (the rail's item is a snapshot, so add/remove by id would close over a stale file). Cover and Back are picked per image: **`onCover(src)` · `onBack(src)` receive the picked image's src, not an id** — one argument type, the one `onCover` always took — and `null` when the image that was it is removed. With `images` the Cover row's Upload image goes; without, the rail is as it was. The pencil leads the foot row beside download, duplicate and delete; the header keeps the ×. Twin: `apps/rack-hub` (`shipped.jsx` · `HomePage.jsx`).

**Remainder here:** 📌 bump; `images` + `onImages` on `shipped.jsx` `card` and Home's file data; `onCover` / `onBack` store the src they receive as the file's `cover` / `back` (`null` clears); `setThumb` becomes the pick.

## Adopted here — 2026-10-24

kol-component 0.299.0 · kol-shell 0.79.0. `images` + `onImages` + `onCover(src)` + `onBack(src)` on `shipped.jsx` `card` and Home's file data; saves store `images` / `cover` / `back` (`editSaved`), `setThumb` retired into them. Remainder discharged.
