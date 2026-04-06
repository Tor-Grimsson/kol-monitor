// Render loop control context — exposes stepFrame/pause/resume for offline recording

import { createContext, useContext } from 'react'

const RenderControlContext = createContext(null)

export function RenderControlProvider({ children, value }) {
  return (
    <RenderControlContext.Provider value={value}>
      {children}
    </RenderControlContext.Provider>
  )
}

export function useRenderControl() {
  return useContext(RenderControlContext)
}
