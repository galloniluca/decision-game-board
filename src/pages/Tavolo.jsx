import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { LETTERE, idOpzione, idScelta } from '../lib/costanti'
import { calcolaKpiTavolo } from '../lib/kpi'
import { DURATA_ROUND_MINUTI_DEFAULT } from '../lib/tempo'
import Timer from '../components/Timer'
import BoardKpi from '../components/BoardKpi'
import Topbar from '../components/Topbar'

function Tavolo() {
  const { id } = useParams()

  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState(null)
  const [tavolo, setTavolo] = useState(null)
  const [sessione, setSessione] = useState(null)
  const [opzioniMap, setOpzioniMap] = useState({})
  const [scelteTavolo, setScelteTavolo] = useState([])
  const [selezionata, setSelezionata] = useState(null)
  const [invioStato, setInvioStato] = useState('inattivo')

  useEffect(() => {
    let annullato = false
    setCaricamento(true)
    setErrore(null)

    getDoc(doc(db, 'tavoli', id))
      .then((snap) => {
        if (annullato) return
        if (!snap.exists()) {
          setErrore(`Tavolo "${id}" non trovato.`)
          setCaricamento(false)
          return
        }
        setTavolo(snap.data())
      })
      .catch((err) => !annullato && setErrore(err.message))

    getDocs(collection(db, 'opzioni'))
      .then((snap) => {
        if (annullato) return
        const mappa = {}
        snap.forEach((d) => {
          mappa[d.id] = d.data()
        })
        setOpzioniMap(mappa)
      })
      .catch((err) => !annullato && setErrore(err.message))

    const unsubSessione = onSnapshot(
      doc(db, 'sessione', 'corrente'),
      (snap) => {
        setSessione(snap.data({ serverTimestamps: 'estimate' }))
        setCaricamento(false)
      },
      (err) => setErrore(err.message)
    )

    const unsubScelte = onSnapshot(
      query(collection(db, 'scelte'), where('tavolo_id', '==', Number(id))),
      (snap) => {
        setScelteTavolo(snap.docs.map((d) => d.data()))
      },
      (err) => setErrore(err.message)
    )

    return () => {
      annullato = true
      unsubSessione()
      unsubScelte()
    }
  }, [id])

  // Quando cambia il round attivo (o arrivano nuove scelte), riparte dalla propria scelta per quel round.
  useEffect(() => {
    if (!sessione) return
    const sceltaRound = scelteTavolo.find((s) => s.round === sessione.round_attivo)
    setSelezionata(sceltaRound ? sceltaRound.opzione : null)
    setInvioStato('inattivo')
  }, [sessione?.round_attivo, scelteTavolo])

  async function inviaScelta() {
    if (!selezionata || !sessione) return
    setInvioStato('invio')
    setErrore(null)

    try {
      await setDoc(doc(db, 'scelte', idScelta(id, sessione.round_attivo)), {
        tavolo_id: Number(id),
        round: sessione.round_attivo,
        opzione: selezionata,
        inviato_at: serverTimestamp(),
      })
    } catch (err) {
      setErrore(err.message)
      setInvioStato('errore')
    }
  }

  if (caricamento) {
    return (
      <div className="page">
        <Topbar />
        <div className="page-inner">
          <p className="status-muted">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (errore && !tavolo) {
    return (
      <div className="page">
        <Topbar />
        <div className="page-inner">
          <p className="status-error">❌ {errore}</p>
        </div>
      </div>
    )
  }

  const round = sessione.round_attivo
  const roundChiuso = sessione.stato !== 'aperto'
  const inviataPerRoundAttivo = scelteTavolo.find((s) => s.round === round)?.opzione ?? null
  const totaliKpi = calcolaKpiTavolo(scelteTavolo, opzioniMap)

  return (
    <div className="page">
      <Topbar />
      <div className="page-inner">
        <h1>{tavolo.nome}</h1>

        {errore && <p className="status-error">❌ {errore}</p>}

        <div className="card">
          <h3>I tuoi KPI</h3>
          <BoardKpi totali={totaliKpi} />
        </div>

        {roundChiuso ? (
          <div className="card">
            <span className="badge-pill chiuso">Round {round} · Chiuso</span>
            <p className="status-muted" style={{ marginTop: '0.75rem' }}>
              In attesa che la regia apra il round...
            </p>
          </div>
        ) : (
          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.25rem',
              }}
            >
              <h2 style={{ margin: 0 }}>Round {round}</h2>
              <span className="badge-pill aperto">Aperto</span>
            </div>

            <Timer
              timerAvvio={sessione.timer_avvio}
              durataSecondi={(sessione.durata_round_minuti ?? DURATA_ROUND_MINUTI_DEFAULT) * 60}
            />

            {inviataPerRoundAttivo && (
              <p className="status-muted">
                Hai già inviato: <strong>Opzione {inviataPerRoundAttivo}</strong>. Puoi cambiare
                scelta e inviare di nuovo finché il round resta aperto.
              </p>
            )}

            <div className="option-list">
              {LETTERE.map((lettera) => {
                const opzione = opzioniMap[idOpzione(round, lettera)]
                const selezionataAttiva = selezionata === lettera
                return (
                  <button
                    key={lettera}
                    type="button"
                    onClick={() => setSelezionata(lettera)}
                    className={`option-btn${selezionataAttiva ? ' selected' : ''}`}
                  >
                    <span className="option-letter">{lettera}</span>
                    <span>{opzione?.nome || `Opzione ${lettera}`}</span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={inviaScelta}
              disabled={!selezionata || invioStato === 'invio'}
              style={{ width: '100%' }}
            >
              {invioStato === 'invio' ? 'Invio in corso...' : 'Invia scelta'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Tavolo
