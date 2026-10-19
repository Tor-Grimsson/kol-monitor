// Module wrapper — monitor's own ModuleFrame (back from kol-hardware 2026-10-17, plan 14 8.4) fed the
// rack's own state: the edit context and the case's power arrive as props.
import { createContext, useContext } from 'react'
import ModuleFrame from './ModuleFrame.jsx'
import { useCasePower } from '../../hooks/useCasePower.jsx'

export const ModuleEditContext = createContext(null)

export default function Module(props) {
  const editCtx = useContext(ModuleEditContext)
  const { power } = useCasePower()
  return <ModuleFrame powered={power} editMode={editCtx?.editMode} onRemove={editCtx?.onRemove} {...props} />
}
