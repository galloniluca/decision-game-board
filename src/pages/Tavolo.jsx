import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { LETTERE, idOpzione, idScelta } from '../lib/costanti'

function Tavolo() {
  const { id } = useParams()

  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState(null)
  const [tavolo, setTavolo] = useState(null)
  const [sessione, setSessione] = useState(null)
  const [opzioniRound, setOpzioniRound] = useState([])
  const [selezionata, setSelezionata] = useState(null)
  const [inviata, setInviata] = useState(null)
  const [invioStato, setInvioStato] = useState('inattivo')

  // Nome tavolo: caricato una volta. Sessione: agganciata in tempo reale.
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

    const unsubSessione = onSnapshot(
      doc(db, 'sessione', 'corrente'),
      (snap) => {
        setSessione(snap.data())
        setCaricamento(false)
      },
      (err) => setErrore(err.message)
    )

    return () => {
      annullato = true
      unsubSessione()
    }
  }, [id])

  // Quando cambia il round attivo: opzioni caricate una volta, propria scelta agganciata in tempo reale.
  useEffect(() => {
    if (!sessione) return
    const round = sessione.round_attivo

    Promise.all(LETTERE.map((lettera) => getDoc(doc(db, 'opzioni', idOpzione(round, lettera)))))
      .then((snaps) => setOpzioniRound(snaps.map((s) => s.data())))
      .catch((err) => setErrore(err.message))

    const unsubScelta = onSnapshot(
      doc(db, 'scelte', idScelta(id, round)),
      (snap) => {
        if (snap.exists()) {
          setInviata(snap.data().opzione)
          setSelezionata(snap.data().opzione)
        } else {
          setInviata(null)
          setSelezionata(null)
        }
        setInvioStato('inattivo')
      },
      (err) => setErrore(err.message)
    )

    return () => unsubScelta()
  }, [id, sessione?.round_attivo])

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

  const roundChiuso = sessione?.stato !== 'aperto'

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 480, margin: '0 auto' }}>
      <h1>{tavolo.nome}</h1>

      {errore && <p style={{ color: 'crimson' }}>❌ {errore}</p>}

      {roundChiuso ? (
        <p>In attesa che la regia apra il Round {sessione?.round_attivo}...</p>
      ) : (
        <>
          <h2>Round {sessione.round_attivo}</h2>

          {inviata && (
            <p>
              Hai già inviato: <strong>Opzione {inviata}</strong>. Puoi cambiare scelta e inviare di
              nuovo finché il round resta aperto.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0' }}>
            {LETTERE.map((lettera, i) => {
              const opzione = opzioniRound[i]
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
