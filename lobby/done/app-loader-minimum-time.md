# The app loader shows too briefly — should it have a minimum time?

**Staged:** 2026-10-20 · from a kol-ds-ui session
**Change:** one option, or a delay in monitor's call — decide in review

---

## The problem, in one case
The user, 2026-10-20: *"monitor and app loader timer? very short? should have minimum ms?"*. Monitor's boot loader (kol-framework `loaderApp` in `vite.config.js`, `hideLoaderApp()` in `src/main.jsx`) flashes and is gone.

That is how `hideLoaderApp` is built today (kol-framework `src/loaderApp.js`): it marks the loader done two animation frames after it is called, and removes it 300 ms later. There is no minimum. On a fast load the mark is on screen for a blink.

## The fix
Decide whether the loader needs a minimum time on screen, and how long. If it does, it belongs in kol-framework as an option on `hideLoaderApp` (or `loaderApp`), so every app that uses the loader gets the same behaviour. File that part to kol-ds-ui. Monitor waiting before it calls `hideLoaderApp` would be a local copy of the same rule.

## Rejected alternative
A `setTimeout` around the call in monitor's `main.jsx`: it fixes one app and the other loader users stay as they are.

## Definition of done
- [x] A decision on a minimum time, with the number
- [x] If yes: the DS ask filed to kol-ds-ui, and monitor on the version that ships it, checked on a fast load

## Resolution — 2026-10-22

600 ms, ruled. kol-framework 0.53.0 ships `hideLoaderApp({ minMs = 600 })`; `src/main.jsx` imports it from the package entry and calls it with the default. kol-ds-ui measured the fast load: called at 11 ms → done at 616 ms.
