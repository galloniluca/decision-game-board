import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Config from './pages/Config'
import Tavolo from './pages/Tavolo'
import Regia from './pages/Regia'
import { assicuraDatiIniziali } from './lib/seed'

function App() {
  const [seedErrore, setSeedErrore] = useState(null)
  const [seedPronto, setSeedPronto] = useState(false)

  useEffect(() => {
    assicuraDatiIniziali()
      .then(() => setSeedPronto(true))
      .catch((err) => setSeedErrore(err.message))
  }, [])

  if (seedErrore) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: '2rem', color: 'crimson' }}>
        ❌ Errore inizializzazione dati: {seedErrore}
        <br />
        Controlla la configurazione Firebase (.env.local) e le regole di sicurezza Firestore.
      </div>
    )
  }

  if (!seedPronto) {
    return <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>Inizializzazione...</div>
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/config" element={<Config />} />
      <Route path="/tavolo/:id" element={<Tavolo />} />
      <Route path="/regia" element={<Regia />} />
    </Routes>
  )
}

export default App
