import { useEffect, useState } from 'react'
import { collection, doc, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { DURATA_ROUND_MINUTI_DEFAULT, formattaMMSS, secondiRimanenti } from '../lib/tempo'
import { ROUND_NOMI } from '../lib/matriceUfficiale'
import TavoloScheda from '../components/TavoloScheda'

function Dashboard() {
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState(null)
  const [sessione, setSessione] = useState(null)
  const [tavoli, setTavoli] = useState([])
  const [opzioniMap, setOpzioniMap] = useState({})
  const [scelteTutte, setScelteTutte] = useState([])
  const [, forceTick] = useState(0)

  // Tavoli e matrice opzioni: caricati una volta (non cambiano durante l'evento).
  useEffect(() => {
    getDocs(collection(db, 'tavoli'))
      .then((snap) => {
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => Number(a.id) - Number(b.id))
        setTavoli(lista)
      })
      .catch((err) => setErrore(err.message))

    getDocs(collection(db, 'opzioni'))
      .then((snap) => {
        const mappa = {}
        snap.forEach((d) => {
          mappa[d.id] = d.data()
        })
        setOpzioniMap(mappa)
      })
      .catch((err) => setErrore(err.message))
  }, [])

  // Sessione e scelte agganciate in tempo reale.
  useEffect(() => {
    const unsubSessione = onSnapshot(
      doc(db, 'sessione', 'corrente'),
      (snap) => {
        setSessione(snap.data({ serverTimestamps: 'estimate' }))
        setCaricamento(false)
      },
      (err) => setErrore(err.message)
    )
    const unsubScelte = onSnapshot(
      collection(db, 'scelte'),
      (snap) => setScelteTutte(snap.docs.map((d) => d.data())),
      (err) => setErrore(err.message)
    )
    return () => {
      unsubSessione()
      unsubScelte()
    }
  }, [])

  // Tick ogni secondo solo per aggiornare il countdown testuale in alto.
  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  if (caricamento) {
    return (
      <div className="dashboard-tv">
        <p className="status-muted">Caricamento...</p>
      </div>
    )
  }

  const round = sessione.round_attivo
  const aperto = sessione.stato === 'aperto'
  const mostraRisultati = Boolean(sessione.mostra_risultati)
  const durataSecondi = (sessione.durata_round_minuti ?? DURATA_ROUND_MINUTI_DEFAULT) * 60
  const rimanenti = aperto ? secondiRimanenti(sessione.timer_avvio, durataSecondi) : null

  const inviatiPerTavolo = {}
  scelteTutte
    .filter((s) => s.round === round)
    .forEach((s) => {
      inviatiPerTavolo[s.tavolo_id] = true
    })
  const numInviati = Object.keys(inviatiPerTavolo).length

  const colonne = tavoli.length <= 4 ? 2 : 3
  const righe = Math.ceil(tavoli.length / colonne) || 1

  return (
    <div className="dashboard-tv">
      <div className="dashboard-tv__header">
        <span className="brand">
          <span className="brand-mark" />
          Lean Trade-off Game
        </span>
        <span className="dashboard-tv__status">
          Round {round}: {ROUND_NOMI[round]} — {aperto ? 'Aperto' : 'Chiuso'}
        </span>
      </div>

      {errore && <p className="status-error">❌ {errore}</p>}

      {mostraRisultati ? (
        <div
          className="dashboard-tv__grid"
          style={{
            gridTemplateColumns: `repeat(${colonne}, 1fr)`,
            gridTemplateRows: `repeat(${righe}, 1fr)`,
          }}
        >
          {tavoli.map((tavolo) => (
            <TavoloScheda
              key={tavolo.id}
              tavolo={tavolo}
              scelteTavolo={scelteTutte.filter((s) => s.tavolo_id === Number(tavolo.id))}
              opzioniMap={opzioniMap}
            />
          ))}
        </div>
      ) : aperto ? (
        <div className="dashboard-live">
          {rimanenti !== null && (
            <p className={`dashboard-live__timer${rimanenti <= 0 ? ' expired' : ''}`}>
              {rimanenti <= 0 ? 'Tempo scaduto' : formattaMMSS(rimanenti)}
            </p>
          )}
          <p className="dashboard-live__contatore">
            {numInviati}/{tavoli.length} tavoli hanno inviato
          </p>
          <div className="dashboard-live__tavoli">
            {tavoli.map((tavolo) => (
              <span
                key={tavolo.id}
                className={`dashboard-tile${inviatiPerTavolo[tavolo.id] ? ' inviato' : ''}`}
              >
                {inviatiPerTavolo[tavolo.id] ? '✓ ' : ''}
                {tavolo.nome}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="dashboard-live">
          <p className="dashboard-live__attesa">In attesa che la regia apra il round...</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard
