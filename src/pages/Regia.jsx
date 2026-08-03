import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, doc, getDocs, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { calcolaKpiTavolo } from '../lib/kpi'
import { DURATA_ROUND_MINUTI_DEFAULT, formattaOrario } from '../lib/tempo'
import { ROUND_NOMI } from '../lib/matriceUfficiale'
import Timer from '../components/Timer'
import BoardKpi from '../components/BoardKpi'
import Topbar from '../components/Topbar'

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

  async function toggleRisultati() {
    setAzioneInCorso(true)
    try {
      await updateDoc(doc(db, 'sessione', 'corrente'), {
        mostra_risultati: !sessione.mostra_risultati,
      })
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

  if (caricamento) {
    return (
      <div className="page">
        <Topbar />
        <div className="page-inner page-inner--wide">
          <p className="status-muted">Caricamento...</p>
        </div>
      </div>
    )
  }

  const round = sessione.round_attivo
  const aperto = sessione.stato === 'aperto'

  const inviatiPerTavolo = {}
  scelteTutte
    .filter((s) => s.round === round)
    .forEach((s) => {
      inviatiPerTavolo[s.tavolo_id] = s
    })
  const numInviati = Object.keys(inviatiPerTavolo).length

  return (
    <div className="page">
      <Topbar
        right={
          <span className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/config">Config</Link>
            <Link to="/dashboard">Dashboard TV</Link>
          </span>
        }
      />
      <div className="page-inner page-inner--wide">
        <h1>Regia</h1>

        {errore && <p className="status-error">❌ {errore}</p>}

        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.4rem',
              marginBottom: '0.25rem',
            }}
          >
            <h2 style={{ margin: 0 }}>
              Round {round} — {ROUND_NOMI[round]}
            </h2>
            <span className={`badge-pill ${aperto ? 'aperto' : 'chiuso'}`}>
              {aperto ? 'Aperto' : 'Chiuso'}
            </span>
          </div>

          {aperto && (
            <Timer
              timerAvvio={sessione.timer_avvio}
              durataSecondi={(sessione.durata_round_minuti ?? DURATA_ROUND_MINUTI_DEFAULT) * 60}
            />
          )}

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {!aperto && (
              <button type="button" className="btn btn-primary" onClick={apriRound} disabled={azioneInCorso}>
                Apri Round {round}
              </button>
            )}
            {aperto && (
              <button type="button" className="btn btn-primary" onClick={chiudiRound} disabled={azioneInCorso}>
                Chiudi Round {round}
              </button>
            )}
            {!aperto && round < 4 && (
              <button type="button" className="btn" onClick={avanzaRound} disabled={azioneInCorso}>
                Avanza al Round {round + 1}
              </button>
            )}
          </div>

          {!aperto && round === 4 && (
            <p className="status-muted" style={{ marginTop: '0.75rem' }}>
              Round 4 chiuso: fine partita. Ecco la board finale per il debrief.
            </p>
          )}
        </div>

        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <h3 style={{ margin: 0 }}>
              Dashboard TV — pagina da proiettare, aggiornata in tempo reale
            </h3>
            <button type="button" className="btn btn-sm" onClick={toggleRisultati} disabled={azioneInCorso}>
              {sessione.mostra_risultati ? 'Nascondi risultati sulla dashboard' : 'Mostra risultati sulla dashboard'}
            </button>
          </div>
          <p className="status-muted" style={{ marginTop: '0.5rem' }}>
            Lo stato di invio dei tavoli è sempre visibile sulla dashboard. I risultati (scelte fatte
            e board KPI) compaiono solo quando attivi il pulsante qui sopra — utile per un momento di
            reveal a fine round.
          </p>
        </div>

        <div className="card">
          <h3>
            Scelte inviate — {numInviati} su {tavoli.length}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {tavoli.map((tavolo) => {
              const scelta = inviatiPerTavolo[tavolo.id]
              return (
                <span key={tavolo.id} className={`badge-pill ${scelta ? 'aperto' : 'chiuso'}`}>
                  {scelta ? `✓ ${tavolo.nome} · ${formattaOrario(scelta.inviato_at) ?? '...'}` : `· ${tavolo.nome}`}
                </span>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h3>Board KPI</h3>
          <table className="table">
            <tbody>
              {tavoli.map((tavolo) => {
                const scelteTavolo = scelteTutte.filter((s) => s.tavolo_id === Number(tavolo.id))
                const totali = calcolaKpiTavolo(scelteTavolo, opzioniMap)
                return (
                  <tr key={tavolo.id}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{tavolo.nome}</td>
                    <td>
                      <BoardKpi totali={totali} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p className="status-muted">Aggiornamento in tempo reale: non serve ricaricare la pagina.</p>
      </div>
    </div>
  )
}

export default Regia
