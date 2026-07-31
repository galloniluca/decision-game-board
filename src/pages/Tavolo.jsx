import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
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

  useEffect(() => {
    caricaDati()
  }, [id])

  async function caricaDati() {
    setCaricamento(true)
    setErrore(null)

    try {
      const tavoloSnap = await getDoc(doc(db, 'tavoli', id))
      if (!tavoloSnap.exists()) {
        setErrore(`Tavolo "${id}" non trovato.`)
        setCaricamento(false)
        return
      }
      setTavolo(tavoloSnap.data())

      const sessioneSnap = await getDoc(doc(db, 'sessione', 'corrente'))
      const sessioneData = sessioneSnap.data()
      setSessione(sessioneData)

      const round = sessioneData.round_attivo
      const opzioniSnap = await Promise.all(
        LETTERE.map((lettera) => getDoc(doc(db, 'opzioni', idOpzione(round, lettera))))
      )
      setOpzioniRound(opzioniSnap.map((s) => s.data()))

      const sceltaSnap = await getDoc(doc(db, 'scelte', idScelta(id, round)))
      if (sceltaSnap.exists()) {
        setInviata(sceltaSnap.data().opzione)
        setSelezionata(sceltaSnap.data().opzione)
      } else {
        setInviata(null)
        setSelezionata(null)
      }
      setInvioStato('inattivo')
    } catch (err) {
      setErrore(err.message)
    }

    setCaricamento(false)
  }

  async function inviaScelta() {
    if (!selezionata) return
    setInvioStato('invio')
    setErrore(null)

    try {
      await setDoc(doc(db, 'scelte', idScelta(id, sessione.round_attivo)), {
        tavolo_id: Number(id),
        round: sessione.round_attivo,
        opzione: selezionata,
        inviato_at: serverTimestamp(),
      })
      setInviata(selezionata)
      setInvioStato('inviato')
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

          {invioStato === 'inviato' && <p>✅ Scelta inviata.</p>}

          <p>
            <button type="button" onClick={caricaDati}>
              Ricarica
            </button>
          </p>
        </>
      )}
    </div>
  )
}

export default Tavolo
