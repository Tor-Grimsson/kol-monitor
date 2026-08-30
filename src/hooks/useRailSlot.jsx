// RailSlotContext — the seam between the rail and the page inside it.
//
// The rail renders inside `AppShell`, which sits OUTSIDE `RackProvider` in the
// router — so the rail cannot read rack state, and the rack cannot render into
// the rail. This passes the slot's DOM node the other way instead: the rack
// keeps rendering inside its own providers and portals the result in.
//
// Hoisting `RackProvider` above `AppLayout` would have worked too, and would
// have mounted the module registry, the patch routing and the case power on
// Home, Library and Settings as well. Not worth it for a panel.
//
// Provider goes ABOVE `AppShell` (in `AppLayout`) so both the rail and the
// `<Outlet/>` see it. Consumed by `src/rack/RackRail.jsx` (publishes) and
// `src/rack/VideoModulo.jsx` (portals in).

import { createContext, useContext, useMemo, useState } from 'react'

const RailSlotContext = createContext(null)

export function useRailSlot() {
  return useContext(RailSlotContext)
}

export function RailSlotProvider({ children }) {
  const [slot, setSlot] = useState(null)
  const [railOpen, setRailOpen] = useState(false)
  const value = useMemo(() => ({ slot, setSlot, railOpen, setRailOpen }), [slot, railOpen])
  return <RailSlotContext.Provider value={value}>{children}</RailSlotContext.Provider>
}
