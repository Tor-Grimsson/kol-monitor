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
import StagePage from './pages/StagePage.jsx'
import DevCapturePage from './pages/dev/DevCapturePage.jsx'

const ModuleDesign = lazy(() => import('./pages/dev/ModuleDesignPage.jsx'))
const ColorPickerReview = lazy(() => import('./pages/dev/ColorPickerPage.jsx'))

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
            {/* the stage gets its OWN RackProvider — sharing the rack's would
                mean loading a stage silently replaces whatever is in the rack */}
            <Route element={<RackProvider />}>
              <Route path="/stage" element={<StagePage />} />
              <Route path="/stage/:stageName" element={<StagePage />} />
            </Route>
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/:moduleType" element={<ModuleDetailPage />} />
            <Route path="/library/patch/:patchName" element={<PatchDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="/design" element={<ModuleDesign />} />
          <Route path="/dev/capture" element={<DevCapturePage />} />
          <Route path="/dev/color-picker" element={<ColorPickerReview />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
