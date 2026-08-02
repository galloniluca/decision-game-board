import { useEffect, useState } from 'react'
import { collection, doc, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { idOpzione } from '../lib/costanti'
import { calcolaKpiTavolo } from '../lib/kpi'
import { DURATA_ROUND_MINUTI_DEFAULT } from '../lib/tempo'
import Timer from '../components/Timer'
import BoardKpi from '../components/BoardKpi'
import Topbar from '../components/Topbar'

function Dashboard() {
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState(null)
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

  if (caricamento) {
    return (
      <div className="page dashboard-page">
        <Topbar />
        <div className="page-inner">
          <p className="status-muted">Caricamento...</p>
        </div>
      </div>
    )
  }

  const round = sessione.round_attivo
  const aperto = sessione.stato === 'aperto'
  const mostraRisultati = Boolean(sessione.mostra_risultati)

  const inviatiPerTavolo = {}
  scelteTutte
    .filter((s) => s.round === round)
    .forEach((s) => {
      inviatiPerTavolo[s.tavolo_id] = s
    })
  const numInviati = Object.keys(inviatiPerTavolo).length

  return (
    <div className="page dashboard-page">
      <Topbar />
      <div className="page-inner">
        {errore && <p className="status-error">❌ {errore}</p>}

        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.25rem',
            }}
          >
            <h1 style={{ margin: 0 }}>Round {round}</h1>
            <span className={`badge-pill ${aperto ? 'aperto' : 'chiuso'}`}>
              {aperto ? 'Aperto' : 'Chiuso'}
            </span>
          </div>

          {aperto && (
            <Timer
              timerAvvio={sessione.timer_avvio}
              durataSecondi={(sessione.durata_round_minuti ?? DURATA_ROUND_MINUTI_DEFAULT) * 60}
              large
            />
          )}

          <h3>
            Scelte inviate — {numInviati} su {tavoli.length}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.5rem' }}>
            {tavoli.map((tavolo) => (
              <span
                key={tavolo.id}
                className={`badge-pill ${inviatiPerTavolo[tavolo.id] ? 'aperto' : 'chiuso'}`}
              >
                {inviatiPerTavolo[tavolo.id] ? '✓' : '·'} {tavolo.nome}
              </span>
            ))}
          </div>
        </div>

        {mostraRisultati && (
          <div className="card">
            <h3>Risultati Round {round}</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Tavolo</th>
                  <th>Scelta</th>
                </tr>
              </thead>
              <tbody>
                {tavoli.map((tavolo) => {
                  const scelta = inviatiPerTavolo[tavolo.id]
                  const opzione = scelta ? opzioniMap[idOpzione(round, scelta.opzione)] : null
                  return (
                    <tr key={tavolo.id}>
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{tavolo.nome}</td>
                      <td>
                        {scelta ? (
                          <>
                            <strong>{scelta.opzione}</strong>
                            {opzione?.nome ? ` — ${opzione.nome}` : ''}
                          </>
                        ) : (
                          <span className="status-muted">Nessuna scelta inviata</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <h3 style={{ marginTop: '1.5rem' }}>Board KPI</h3>
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
        )}
      </div>
    </div>
  )
}

export default Dashboard
