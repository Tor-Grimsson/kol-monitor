import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import VideoModulo from './VideoModulo.jsx'

const ModuleDesign = lazy(() => import('./pages/ModuleDesign.jsx'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<VideoModulo />} />
          <Route path="/design" element={<ModuleDesign />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
