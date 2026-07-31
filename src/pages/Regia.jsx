import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebaseClient'

function Regia() {
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState(null)
  const [azioneInCorso, setAzioneInCorso] = useState(false)
  const [sessione, setSessione] = useState(null)
  const [tavoli, setTavoli] = useState([])
  const [inviatiPerTavolo, setInviatiPerTavolo] = useState({})

  // Tavoli: caricati una volta (i nomi non cambiano durante l'evento).
  useEffect(() => {
    getDocs(collection(db, 'tavoli'))
      .then((snap) => {
        const lista = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => Number(a.id) - Number(b.id))
        setTavoli(lista)
      })
      .catch((err) => setErrore(err.message))
  }, [])

  // Sessione agganciata in tempo reale.
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'sessione', 'corrente'),
      (snap) => {
        setSessione(snap.data())
        setCaricamento(false)
      },
      (err) => setErrore(err.message)
    )
    return () => unsub()
  }, [])

  // Scelte del round attivo agganciate in tempo reale.
  useEffect(() => {
    if (!sessione) return
    const q = query(collection(db, 'scelte'), where('round', '==', sessione.round_attivo))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const inviati = {}
        snap.forEach((d) => {
          inviati[d.data().tavolo_id] = true
        })
        setInviatiPerTavolo(inviati)
      },
      (err) => setErrore(err.message)
    )
    return () => unsub()
  }, [sessione?.round_attivo])

  async function apriRound() {
    setAzioneInCorso(true)
    try {
      await updateDoc(doc(db, 'sessione', 'corrente'), {
        stato: 'aperto',
        timer_avvio: serverTimestamp(),
      })
    } catch (err) {
      setErrore(err.message)
    }
    setAzioneInCorso(false)
  }

  async function chiudiRound() {
    setAzioneInCorso(true)
    try {
      await updateDoc(doc(db, 'sessione', 'corrente'), { stato: 'chiuso' })
    } catch (err) {
      setErrore(err.message)
    }
    setAzioneInCorso(false)
  }

  async function avanzaRound() {
    setAzioneInCorso(true)
    try {
      await updateDoc(doc(db, 'sessione', 'corrente'), {
        round_attivo: sessione.round_attivo + 1,
        stato: 'chiuso',
      })
    } catch (err) {
      setErrore(err.message)
    }
    setAzioneInCorso(false)
  }

  if (caricamento) return <p style={{ padding: '2rem' }}>Caricamento...</p>

  const numInviati = Object.keys(inviatiPerTavolo).length
  const round = sessione.round_attivo
  const aperto = sessione.stato === 'aperto'

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <p>
        <Link to="/">← Home</Link>
      </p>
      <h1>Regia</h1>

      {errore && <p style={{ color: 'crimson' }}>❌ {errore}</p>}

      <h2>
        Round {round} — {aperto ? 'Aperto' : 'Chiuso'}
      </h2>

      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', flexWrap: 'wrap' }}>
        {!aperto && (
          <button type="button" onClick={apriRound} disabled={azioneInCorso}>
            Apri Round {round}
          </button>
        )}
        {aperto && (
          <button type="button" onClick={chiudiRound} disabled={azioneInCorso}>
            Chiudi Round {round}
          </button>
        )}
        {!aperto && round < 4 && (
          <button type="button" onClick={avanzaRound} disabled={azioneInCorso}>
            Avanza al Round {round + 1}
          </button>
        )}
      </div>

      {!aperto && round === 4 && (
        <p>Round 4 chiuso: fine partita. La board KPI completa per il debrief arriverà allo Step 7.</p>
      )}

      <h3>
        Scelte inviate: {numInviati} su {tavoli.length}
      </h3>
      <ul>
        {tavoli.map((tavolo) => (
          <li key={tavolo.id}>
            {inviatiPerTavolo[tavolo.id] ? '✅' : '⬜'} {tavolo.nome}
          </li>
        ))}
      </ul>

      <p style={{ color: '#666' }}>
        Aggiornamento in tempo reale: non serve ricaricare la pagina.
      </p>
    </div>
  )
}

export default Regia
