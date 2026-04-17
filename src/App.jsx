import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { RackProvider } from './hooks/useRackContext.jsx'
import VideoModulo from './rack/VideoModulo.jsx'
import HomePage from './pages/HomePage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import ModuleDetailPage from './pages/ModuleDetailPage.jsx'
import PatchDetailPage from './pages/PatchDetailPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import CreatePage from './pages/CreatePage.jsx'
import DevCapturePage from './pages/dev/DevCapturePage.jsx'

const ModuleDesign = lazy(() => import('./pages/dev/ModuleDesignPage.jsx'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route element={<RackProvider />}>
              <Route path="/rack" element={<VideoModulo />} />
              <Route path="/rack/preset/:presetName" element={<VideoModulo />} />
              <Route path="/rack/patch/:presetName" element={<VideoModulo />} />
              <Route path="/create" element={<CreatePage />} />
            </Route>
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/:moduleType" element={<ModuleDetailPage />} />
            <Route path="/library/patch/:patchName" element={<PatchDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="/design" element={<ModuleDesign />} />
          <Route path="/dev/capture" element={<DevCapturePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
