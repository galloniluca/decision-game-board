import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const TABELLE = ['tavoli', 'opzioni', 'sessione', 'scelte']

function Home() {
  const [risultati, setRisultati] = useState(null)
  const [errore, setErrore] = useState(null)

  useEffect(() => {
    async function verificaConnessione() {
      const conteggi = {}
      for (const tabella of TABELLE) {
        const { count, error } = await supabase
          .from(tabella)
          .select('*', { count: 'exact', head: true })

        if (error) {
          setErrore(`Errore su tabella "${tabella}": ${error.message}`)
          return
        }
        conteggi[tabella] = count
      }
      setRisultati(conteggi)
    }

    verificaConnessione()
  }, [])

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 480 }}>
      <h1>Lean Trade-off Game — Setup</h1>
      <p>Verifica di connessione a Supabase.</p>

      {errore && (
        <p style={{ color: 'crimson' }}>
          ❌ {errore}
          <br />
          Controlla il file <code>.env.local</code> e che lo schema SQL sia stato eseguito.
        </p>
      )}

      {!errore && !risultati && <p>Connessione in corso...</p>}

      {risultati && (
        <ul>
          {TABELLE.map((tabella) => (
            <li key={tabella}>
              ✅ <code>{tabella}</code>: {risultati[tabella]} righe
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
