import { BrowserRouter, Routes, Route } from 'react-router-dom'
import VideoModulo from './VideoModulo.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VideoModulo />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
