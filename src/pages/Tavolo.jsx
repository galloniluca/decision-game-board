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
import { LETTERE, ROUNDS, idOpzione, idScelta } from '../lib/costanti'
import { KPI_BASE_DEFAULT, calcolaKpiTavolo } from '../lib/kpi'
import { DURATA_ROUND_MINUTI_DEFAULT } from '../lib/tempo'
import { ROUND_NOMI } from '../lib/matriceUfficiale'
import Timer from '../components/Timer'
import IstogrammaRound from '../components/IstogrammaRound'
import Topbar from '../components/Topbar'

function Tavolo() {
  const { id } = useParams()

  const [errore, setErrore] = useState(null)
  const [tavolo, setTavolo] = useState(null)
  const [tavoloPronto, setTavoloPronto] = useState(false)
  const [sessione, setSessione] = useState(null)
  const [sessionePronta, setSessionePronta] = useState(false)
  const [opzioniMap, setOpzioniMap] = useState({})
  const [scelteTavolo, setScelteTavolo] = useState([])
  const [selezionata, setSelezionata] = useState(null)
  const [invioStato, setInvioStato] = useState('inattivo')

  useEffect(() => {
    let annullato = false
    setErrore(null)
    setTavolo(null)
    setTavoloPronto(false)
    setSessione(null)
    setSessionePronta(false)

    getDoc(doc(db, 'tavoli', id))
      .then((snap) => {
        if (annullato) return
        if (!snap.exists()) {
          setErrore(`Tavolo "${id}" non trovato.`)
        } else {
          setTavolo(snap.data())
        }
      })
      .catch((err) => !annullato && setErrore(err.message))
      .finally(() => !annullato && setTavoloPronto(true))

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
        setSessionePronta(true)
      },
      (err) => {
        setErrore(err.message)
        setSessionePronta(true)
      }
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

  // Scrive la selezione corrente come bozza in tempo reale (visibile a Regia/Dashboard come
  // "in corso"), separata dalla scelta confermata che si scrive solo con "Invia scelta".
  async function selezionaOpzione(lettera) {
    setSelezionata(lettera)
    if (!sessione) return
    try {
      await setDoc(
        doc(db, 'scelte', idScelta(id, sessione.round_attivo)),
        {
          tavolo_id: Number(id),
          round: sessione.round_attivo,
          opzione_bozza: lettera,
        },
        { merge: true }
      )
    } catch {
      // bozza non critica: nessun errore mostrato all'utente
    }
  }

  async function inviaScelta() {
    if (!selezionata || !sessione) return
    setInvioStato('invio')
    setErrore(null)

    try {
      await setDoc(doc(db, 'scelte', idScelta(id, sessione.round_attivo)), {
        tavolo_id: Number(id),
        round: sessione.round_attivo,
        opzione: selezionata,
        opzione_bozza: selezionata,
        inviato_at: serverTimestamp(),
      })
    } catch (err) {
      setErrore(err.message)
      setInvioStato('errore')
    }
  }

  if (!tavoloPronto || !sessionePronta) {
    return (
      <div className="page">
        <Topbar />
        <div className="page-inner">
          <p className="status-muted">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!tavolo || !sessione) {
    return (
      <div className="page">
        <Topbar />
        <div className="page-inner">
          <p className="status-error">
            ❌ {errore ?? (!tavolo ? `Tavolo "${id}" non trovato.` : 'Sessione non disponibile.')}
          </p>
        </div>
      </div>
    )
  }

  const round = sessione.round_attivo
  const roundAperto = sessione.stato === 'aperto'
  const inviataPerRoundAttivo = scelteTavolo.find((s) => s.round === round)?.opzione ?? null
  const kpiBaseline = sessione.kpi_baseline ?? KPI_BASE_DEFAULT
  // I KPI di un round si vedono solo dopo che la regia lo ha chiuso, non appena inviata la scelta.
  const ultimoRoundRivelato = roundAperto ? round - 1 : round
  const roundPrecedenti = ROUNDS.filter((r) => r < ultimoRoundRivelato)
  const corrispondeAllInviata = selezionata !== null && selezionata === inviataPerRoundAttivo
  const testoBottone = invioStato === 'invio'
    ? 'Invio in corso...'
    : corrispondeAllInviata
      ? '✓ Scelta inviata'
      : inviataPerRoundAttivo
        ? 'Aggiorna scelta'
        : 'Invia scelta'

  return (
    <div className="page">
      <Topbar />
      <div className="page-inner">
        <h1>{tavolo.nome}</h1>

        {errore && <p className="status-error">❌ {errore}</p>}

        {roundAperto && (
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
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {inviataPerRoundAttivo && <span className="badge-pill aperto">✓ Inviata</span>}
                <span className="badge-pill aperto">Aperto</span>
              </div>
            </div>

            <Timer
              timerAvvio={sessione.timer_avvio}
              durataSecondi={(sessione.durata_round_minuti ?? DURATA_ROUND_MINUTI_DEFAULT) * 60}
            />

            {inviataPerRoundAttivo && (
              <p className="status-muted">
                Hai inviato: <strong>Opzione {inviataPerRoundAttivo}</strong>. Puoi cambiare scelta e
                inviare di nuovo finché il round resta aperto.
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
                    onClick={() => selezionaOpzione(lettera)}
                    className={`option-btn${selezionataAttiva ? ' selected' : ''}`}
                  >
                    <span className="option-letter">{lettera}</span>
                    <span style={{ flex: 1 }}>{opzione?.nome || `Opzione ${lettera}`}</span>
                    {lettera === inviataPerRoundAttivo && <span aria-hidden="true">✓</span>}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={inviaScelta}
              disabled={!selezionata || invioStato === 'invio' || corrispondeAllInviata}
              style={{ width: '100%' }}
            >
              {testoBottone}
            </button>
          </div>
        )}

        <div className="card">
          <h3>I tuoi KPI per round</h3>
          {ultimoRoundRivelato < 1 ? (
            <p className="status-muted" style={{ margin: 0 }}>
              I box con i KPI di ogni round compaiono man mano che la regia li chiude.
            </p>
          ) : (
            <>
              {roundPrecedenti.length > 0 && (
                <div className="istogrammi-fila">
                  {roundPrecedenti.map((r) => (
                    <IstogrammaRound
                      key={r}
                      etichetta={`R${r}`}
                      totali={calcolaKpiTavolo(
                        scelteTavolo.filter((s) => s.round <= r),
                        opzioniMap,
                        kpiBaseline
                      )}
                    />
                  ))}
                </div>
              )}
              <div className="istogramma-attuale">
                <IstogrammaRound
                  etichetta={`Situazione attuale · R${ultimoRoundRivelato}`}
                  totali={calcolaKpiTavolo(
                    scelteTavolo.filter((s) => s.round <= ultimoRoundRivelato),
                    opzioniMap,
                    kpiBaseline
                  )}
                  grande
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Tavolo
