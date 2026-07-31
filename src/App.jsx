import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Config from './pages/Config'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/config" element={<Config />} />
    </Routes>
  )
}

export default App
