// Eurorack grid constants
// 1HP = 16px base unit, everything derives from this

export const HP_PX = 16
export const TOTAL_HP = 104
export const ROW_WIDTH = TOTAL_HP * HP_PX  // 1664px
export const MIN_HP = 2

// Row aspect ratios (width : height)
export const ASPECT = {
  '1u': '12 / 1',
  '3u': '4 / 1',
}
// Row heights in px — the aspect resolved AGAINST ROW_WIDTH, so a row is a definite
// height everywhere. WebKit does not treat an `aspect-ratio` box as a definite height
// for its percentage-height children: on iOS a 3U module sized `height: 100%` fell
// back to its content height and ran past the rails (user, 2026-09-02).
export const ROW_HEIGHT = {
  '1u': ROW_WIDTH / 12,  // 138.67
  '3u': ROW_WIDTH / 4,   // 416
}

// Rail height in px — defines the dead zone at top/bottom of each module
export const RAIL_HEIGHT = 14

// Module content padding (inside the rail dead zone)
export const MODULE_PADDING = 12  // ~p-3

// HP to pixels
export function hpToPx(hp) {
  return hp * HP_PX
}
