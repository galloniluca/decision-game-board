import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import Topbar from '../components/Topbar'

const COLLEZIONI = ['tavoli', 'opzioni', 'sessione', 'scelte']

function Home() {
  const [risultati, setRisultati] = useState(null)
  const [errore, setErrore] = useState(null)
  const [tavoli, setTavoli] = useState([])

  useEffect(() => {
    async function verificaConnessione() {
      try {
        const conteggi = {}
        for (const nome of COLLEZIONI) {
          const snap = await getDocs(collection(db, nome))
          conteggi[nome] = snap.size
          if (nome === 'tavoli') {
            setTavoli(
              snap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => Number(a.id) - Number(b.id))
            )
          }
        }
        setRisultati(conteggi)
      } catch (err) {
        setErrore(err.message)
      }
    }

    verificaConnessione()
  }, [])

  return (
    <div className="page">
      <Topbar
        right={
          <span className="nav-links">
            <Link to="/config">Config</Link>
            <Link to="/regia">Regia</Link>
            <Link to="/dashboard">Dashboard TV</Link>
          </span>
        }
      />
      <div className="page-inner">
        <h1>Setup</h1>
        <p className="status-muted">Verifica di connessione a Firebase/Firestore.</p>

        <div className="card">
          {errore && (
            <p className="status-error">
              ❌ {errore}
              <br />
              Controlla il file <code>.env.local</code> e le regole di sicurezza Firestore.
            </p>
          )}

          {!errore && !risultati && <p className="status-muted">Connessione in corso...</p>}

          {risultati && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {COLLEZIONI.map((nome) => (
                <span key={nome} className="badge-pill aperto">
                  ✓ {nome}: {risultati[nome]}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Tavoli (test rapido)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {tavoli.map((tavolo) => (
              <Link key={tavolo.id} to={`/tavolo/${tavolo.id}`} className="btn btn-sm">
                {tavolo.nome} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
