import { createContext, useContext, useState } from 'react'
import { Outlet } from 'react-router-dom'
import NavSidebar from './NavSidebar'

const NavHiddenContext = createContext(null)
export const useNavHidden = () => useContext(NavHiddenContext)

export default function AppLayout() {
  const [navHidden, setNavHidden] = useState(false)

  return (
    <NavHiddenContext.Provider value={{ navHidden, setNavHidden }}>
      <NavSidebar hidden={navHidden} />
      <div style={{ marginLeft: navHidden ? 0 : 48 }}>
        <Outlet />
      </div>
    </NavHiddenContext.Provider>
  )
}
