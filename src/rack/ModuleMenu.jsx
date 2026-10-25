// ModuleMenu — the right-click menu on a module (plan 16 W2): Open module page · Park (Return when the module is
// parked) · Delete. One kol-component `ContextMenu` per list; `openAt(e, { mod, parked })` from any row that shows a
// module — the rack's slots, the bottom Rail's parked shelf and its Rack rows. The menu closes on any item.
import { useNavigate } from 'react-router-dom'
import ContextMenu, { useContextMenu } from '@kolkrabbi/kol-component/molecules/ContextMenu'
import { MenuDropdownItem } from '@kolkrabbi/kol-component/molecules/MenuItem'

export function useModuleMenu({ onPark, onReturn, onDelete }) {
  const menu = useContextMenu()
  const navigate = useNavigate()
  const element = (
    <ContextMenu menu={menu}>
      {(p) => p && (
        <>
          <MenuDropdownItem onClick={() => navigate(`/library/module/${p.mod.type}`)}>Open module page</MenuDropdownItem>
          {p.parked
            ? (onReturn && <MenuDropdownItem onClick={() => onReturn(p.mod.id)}>Return</MenuDropdownItem>)
            : (onPark && <MenuDropdownItem onClick={() => onPark(p.mod.id)}>Park</MenuDropdownItem>)}
          {onDelete && <MenuDropdownItem onClick={() => onDelete(p.mod.id)}>Delete</MenuDropdownItem>}
        </>
      )}
    </ContextMenu>
  )
  return { openAt: menu.openAt, element }
}
