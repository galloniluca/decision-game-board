import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { idScelta } from '../lib/costanti'

function Regia() {
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState(null)
  const [azioneInCorso, setAzioneInCorso] = useState(false)
  const [sessione, setSessione] = useState(null)
  const [tavoli, setTavoli] = useState([])
  const [inviatiPerTavolo, setInviatiPerTavolo] = useState({})

  useEffect(() => {
    caricaDati()
  }, [])

  async function caricaDati() {
    setCaricamento(true)
    setErrore(null)

    try {
      const sessioneSnap = await getDoc(doc(db, 'sessione', 'corrente'))
      const sessioneData = sessioneSnap.data()
      setSessione(sessioneData)

      const tavoliSnap = await getDocs(collection(db, 'tavoli'))
      const listaTavoli = tavoliSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => Number(a.id) - Number(b.id))
      setTavoli(listaTavoli)

      const round = sessioneData.round_attivo
      const inviati = {}
      await Promise.all(
        listaTavoli.map(async (tavolo) => {
          const sceltaSnap = await getDoc(doc(db, 'scelte', idScelta(tavolo.id, round)))
          inviati[tavolo.id] = sceltaSnap.exists()
        })
      )
      setInviatiPerTavolo(inviati)
    } catch (err) {
      setErrore(err.message)
    }

    setCaricamento(false)
  }

  async function apriRound() {
    setAzioneInCorso(true)
    try {
      await updateDoc(doc(db, 'sessione', 'corrente'), {
        stato: 'aperto',
        timer_avvio: serverTimestamp(),
      })
      await caricaDati()
    } catch (err) {
      setErrore(err.message)
    }
    setAzioneInCorso(false)
  }

  async function chiudiRound() {
    setAzioneInCorso(true)
    try {
      await updateDoc(doc(db, 'sessione', 'corrente'), { stato: 'chiuso' })
      await caricaDati()
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
      await caricaDati()
    } catch (err) {
      setErrore(err.message)
    }
    setAzioneInCorso(false)
  }

  if (caricamento) return <p style={{ padding: '2rem' }}>Caricamento...</p>

  const numInviati = Object.values(inviatiPerTavolo).filter(Boolean).length
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
        <button type="button" onClick={caricaDati} disabled={azioneInCorso}>
          Aggiorna
        </button>
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
        Nessun aggiornamento automatico ancora: premi "Aggiorna" per vedere gli invii più recenti
        (il realtime arriva allo Step 5).
      </p>
    </div>
  )
}

export default Regia
