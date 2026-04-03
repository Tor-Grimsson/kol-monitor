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

// Rail height in px — defines the dead zone at top/bottom of each module
export const RAIL_HEIGHT = 14

// Module content padding (inside the rail dead zone)
export const MODULE_PADDING = 12  // ~p-3

// HP to pixels
export function hpToPx(hp) {
  return hp * HP_PX
}
