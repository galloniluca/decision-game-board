import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

const COLLEZIONI = ['tavoli', 'opzioni', 'sessione', 'scelte']

function Home() {
  const [risultati, setRisultati] = useState(null)
  const [errore, setErrore] = useState(null)

  useEffect(() => {
    async function verificaConnessione() {
      try {
        const conteggi = {}
        for (const nome of COLLEZIONI) {
          const snap = await getDocs(collection(db, nome))
          conteggi[nome] = snap.size
        }
        setRisultati(conteggi)
      } catch (err) {
        setErrore(err.message)
      }
    }

    verificaConnessione()
  }, [])

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 480 }}>
      <h1>Lean Trade-off Game — Setup</h1>
      <p>Verifica di connessione a Firebase/Firestore.</p>

      {errore && (
        <p style={{ color: 'crimson' }}>
          ❌ {errore}
          <br />
          Controlla il file <code>.env.local</code> e le regole di sicurezza Firestore.
        </p>
      )}

      {!errore && !risultati && <p>Connessione in corso...</p>}

      {risultati && (
        <ul>
          {COLLEZIONI.map((nome) => (
            <li key={nome}>
              ✅ <code>{nome}</code>: {risultati[nome]} documenti
            </li>
          ))}
        </ul>
      )}

      <p>
        <Link to="/config">Vai alla Config →</Link>
      </p>
    </div>
  )
}

export default Home
