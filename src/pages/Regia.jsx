import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, getDocs, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { calcolaKpiTavolo } from '../lib/kpi'
import Timer from '../components/Timer'
import BoardKpi from '../components/BoardKpi'

function Regia() {
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState(null)
  const [azioneInCorso, setAzioneInCorso] = useState(false)
  const [sessione, setSessione] = useState(null)
  const [tavoli, setTavoli] = useState([])
  const [opzioniMap, setOpzioniMap] = useState({})
  const [scelteTutte, setScelteTutte] = useState([])

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

  // Sessione agganciata in tempo reale.
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'sessione', 'corrente'),
      (snap) => {
        setSessione(snap.data({ serverTimestamps: 'estimate' }))
        setCaricamento(false)
      },
      (err) => setErrore(err.message)
    )
    return () => unsub()
  }, [])

  // Tutte le scelte agganciate in tempo reale (servono sia per gli invii del round attivo
  // sia per la board KPI cumulativa di tutti i tavoli).
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'scelte'),
      (snap) => setScelteTutte(snap.docs.map((d) => d.data())),
      (err) => setErrore(err.message)
    )
    return () => unsub()
  }, [])

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

  const round = sessione.round_attivo
  const aperto = sessione.stato === 'aperto'

  const inviatiPerTavolo = {}
  scelteTutte
    .filter((s) => s.round === round)
    .forEach((s) => {
      inviatiPerTavolo[s.tavolo_id] = true
    })
  const numInviati = Object.keys(inviatiPerTavolo).length

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
      {aperto && <Timer timerAvvio={sessione.timer_avvio} />}

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

      {!aperto && round === 4 && <p>Round 4 chiuso: fine partita. Ecco la board finale per il debrief.</p>}

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

      <h3>Board KPI</h3>
      <table cellPadding="8" style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {tavoli.map((tavolo) => {
            const scelteTavolo = scelteTutte.filter((s) => s.tavolo_id === Number(tavolo.id))
            const totali = calcolaKpiTavolo(scelteTavolo, opzioniMap)
            return (
              <tr key={tavolo.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ paddingRight: '1rem', whiteSpace: 'nowrap' }}>{tavolo.nome}</td>
                <td>
                  <BoardKpi totali={totali} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <p style={{ color: '#666' }}>Aggiornamento in tempo reale: non serve ricaricare la pagina.</p>
    </div>
  )
}

export default Regia
