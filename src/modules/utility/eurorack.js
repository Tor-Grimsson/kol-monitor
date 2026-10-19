// Eurorack dimensions — monitor's own (plan 14 8.4, user 2026-10-17: "monitor should own everything that is
// considered its content … why would you share 1u 3u noone else uses it"). Back from kol-hardware, unchanged;
// they were lifted out of this file on 2026-10-01.

export const HP_PX = 16
export const TOTAL_HP = 104
export const MIN_HP = 2

// Row heights in px, by rack unit. Monitor resolves its row aspect (1U 12:1, 3U 4:1) against the
// 104hp row width, so a row is a definite height everywhere — WebKit does not treat an
// `aspect-ratio` box as a definite height for its percentage-height children (2026-09-02).
export const ROW_HEIGHT = {
  '1u': (TOTAL_HP * HP_PX) / 12, // 138.67
  '3u': (TOTAL_HP * HP_PX) / 4,  // 416
}

// Rail height in px — the dead zone at the top and bottom of each module
export const RAIL_HEIGHT = 14

export const hpToPx = (hp) => hp * HP_PX

export const ROW_WIDTH = TOTAL_HP * HP_PX  // 1664px
export const MODULE_PADDING = 12  // ~p-3

// Row aspect ratios (width : height) — read by the /design dev page only
export const ASPECT = {
  '1u': '12 / 1',
  '3u': '4 / 1',
}
