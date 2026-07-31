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
import Timer from '../components/Timer'
import BoardKpi from '../components/BoardKpi'

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

  if (caricamento) return <p style={{ padding: '2rem' }}>Caricamento...</p>

  if (errore && !tavolo) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
        <p style={{ color: 'crimson' }}>❌ {errore}</p>
      </div>
    )
  }

  const round = sessione.round_attivo
  const roundChiuso = sessione.stato !== 'aperto'
  const inviataPerRoundAttivo = scelteTavolo.find((s) => s.round === round)?.opzione ?? null
  const totaliKpi = calcolaKpiTavolo(scelteTavolo, opzioniMap)

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 480, margin: '0 auto' }}>
      <h1>{tavolo.nome}</h1>

      {errore && <p style={{ color: 'crimson' }}>❌ {errore}</p>}

      <h3>I tuoi KPI</h3>
      <BoardKpi totali={totaliKpi} />

      {roundChiuso ? (
        <p style={{ marginTop: '1.5rem' }}>In attesa che la regia apra il Round {round}...</p>
      ) : (
        <>
          <h2 style={{ marginTop: '1.5rem' }}>Round {round}</h2>
          <Timer timerAvvio={sessione.timer_avvio} />

          {inviataPerRoundAttivo && (
            <p>
              Hai già inviato: <strong>Opzione {inviataPerRoundAttivo}</strong>. Puoi cambiare scelta e
              inviare di nuovo finché il round resta aperto.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0' }}>
            {LETTERE.map((lettera) => {
              const opzione = opzioniMap[idOpzione(round, lettera)]
              const selezionataAttiva = selezionata === lettera
              return (
                <button
                  key={lettera}
                  type="button"
                  onClick={() => setSelezionata(lettera)}
                  style={{
                    padding: '1rem',
                    textAlign: 'left',
                    borderRadius: 6,
                    border: selezionataAttiva ? '2px solid #aa3bff' : '1px solid #888',
                    background: selezionataAttiva ? '#aa3bff' : 'transparent',
                    color: selezionataAttiva ? '#fff' : 'inherit',
                    fontWeight: selezionataAttiva ? 'bold' : 'normal',
                    cursor: 'pointer',
                  }}
                >
                  <strong>{lettera}</strong>
                  {opzione?.nome ? ` — ${opzione.nome}` : ''}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={inviaScelta}
            disabled={!selezionata || invioStato === 'invio'}
          >
            {invioStato === 'invio' ? 'Invio in corso...' : 'Invia scelta'}
          </button>
        </>
      )}
    </div>
  )
}

export default Tavolo
